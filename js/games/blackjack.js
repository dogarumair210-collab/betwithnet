// ============================================================
// Bet With Net - Authentic Casino Blackjack VIP Engine
// Standard 6-Deck Shoe, Vegas Rules, Side Bets (21+3, Pairs), Split, Insurance
// ============================================================

class BlackjackEngine {
    constructor() {
        this.deck = [];
        this.dealerCards = [];
        this.playerHands = [{ cards: [], bet: 0, status: 'playing', score: 0, isSplit: false }];
        this.activeHandIndex = 0;

        // Betting spots
        this.selectedChip = 100;
        this.bets = {
            main: 0,
            perfectPairs: 0,
            twentyOneThree: 0
        };
        this.lastBets = { main: 0, perfectPairs: 0, twentyOneThree: 0 };

        // Game State: 'BETTING', 'DEALING', 'PLAYER_TURN', 'DEALER_TURN', 'ROUND_OVER'
        this.gameState = 'BETTING';

        // Sound system
        this.soundEnabled = true;
        this.audio = {};
        this.bgMusic = null;

        // Active Theme
        this.currentTheme = 'theme-emerald';

        // Currency
        this.currency = 'PKR';
        this.exchangeRate = 280;

        // Seated Bots
        this.bots = [
            { name: 'Tariq_Boss', vip: 'VIP 12', icon: '👑', bet: 2500 },
            { name: 'Malik_King', vip: 'VIP 8', icon: '💎', bet: 1000 },
            { name: 'Raja_786', vip: 'VIP 10', icon: '🦅', bet: 5000 },
            { name: 'LuckyBilal', vip: 'VIP 7', icon: '🎲', bet: 500 }
        ];

        this.insuranceBet = 0;
        this.hasInsured = false;
    }

    init() {
        this.loadAudio();
        this.bindEvents();
        this.syncWallet();
        this.buildDeck();
        this.updateButtons();
        this.renderBots();
        this.setupConfetti();

        // Listen for wallet events
        if (window.wallet && window.wallet.on) {
            window.wallet.on('balanceChanged', () => this.syncWallet());
        }

        // Auto prompt sounds on first interaction
        const startAudioOnTouch = () => {
            if (this.soundEnabled && this.bgMusic && this.bgMusic.paused) {
                this.bgMusic.play().catch(() => {});
            }
            window.removeEventListener('pointerdown', startAudioOnTouch);
        };
        window.addEventListener('pointerdown', startAudioOnTouch, { once: true });
    }

    loadAudio() {
        try {
            const savedMute = localStorage.getItem('bwn_blackjack_muted');
            if (savedMute !== null) this.soundEnabled = savedMute !== '1';
        } catch (e) {}

        const makeAudio = (src, vol = 0.8) => {
            const a = new Audio(src);
            a.volume = vol;
            a.preload = 'auto';
            return a;
        };

        this.audio = {
            deal: makeAudio('../assets/audio/card/card_deal.mp3', 0.85),
            flip: makeAudio('../assets/audio/card/card_flip.mp3', 0.85),
            chip: makeAudio('../assets/audio/card/chip_bet.mp3', 0.75),
            chipClean: makeAudio('../assets/audio/card/chip_clean.mp3', 0.75),
            winFly: makeAudio('../assets/audio/card/chip_win_fly.mp3', 0.9),
            winFanfare: makeAudio('../assets/audio/card/win.mp3', 0.9)
        };

        this.bgMusic = new Audio('../assets/audio/table_jazz.wav');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.25;

        this.updateSoundIcon();
    }

    playAudio(name) {
        if (!this.soundEnabled || !this.audio[name]) return;
        try {
            const a = this.audio[name].cloneNode();
            a.volume = this.audio[name].volume;
            a.play().catch(() => {});
        } catch (e) {}
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        try {
            localStorage.setItem('bwn_blackjack_muted', this.soundEnabled ? '0' : '1');
        } catch (e) {}

        if (this.bgMusic) {
            if (this.soundEnabled) this.bgMusic.play().catch(() => {});
            else this.bgMusic.pause();
        }

        this.updateSoundIcon();
    }

    updateSoundIcon() {
        const btn = document.getElementById('bj-sound-btn');
        if (btn) {
            btn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            btn.classList.toggle('active', this.soundEnabled);
        }
    }

    buildDeck() {
        const suits = ['club', 'diamond', 'heart', 'spade'];
        const ranks = [
            { rank: '2', val: 2 },
            { rank: '3', val: 3 },
            { rank: '4', val: 4 },
            { rank: '5', val: 5 },
            { rank: '6', val: 6 },
            { rank: '7', val: 7 },
            { rank: '8', val: 8 },
            { rank: '9', val: 9 },
            { rank: '10', val: 10 },
            { rank: 'J', val: 10 },
            { rank: 'Q', val: 10 },
            { rank: 'K', val: 10 },
            { rank: 'A', val: 11 }
        ];

        // 6-deck shoe standard casino rules
        this.deck = [];
        for (let d = 0; d < 6; d++) {
            for (let suit of suits) {
                for (let r of ranks) {
                    this.deck.push({
                        suit: suit,
                        rank: r.rank,
                        val: r.val,
                        file: `${suit}_${r.rank}.svg`
                    });
                }
            }
        }
        this.shuffleDeck();
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        if (this.deck.length < 20) this.buildDeck();
        return this.deck.pop();
    }

    // Hand Score Calculation with Soft Ace logic
    calcHandScore(cards) {
        let total = 0;
        let aces = 0;

        for (let c of cards) {
            total += c.val;
            if (c.rank === 'A') aces++;
        }

        while (total > 21 && aces > 0) {
            total -= 10;
            aces--;
        }

        const isSoft = aces > 0 && total <= 21;
        return { total, isSoft };
    }

    formatHandDisplay(cards) {
        if (!cards || cards.length === 0) return '0';
        let total = 0;
        let aces = 0;
        for (let c of cards) {
            total += c.val;
            if (c.rank === 'A') aces++;
        }

        if (total > 21) {
            while (total > 21 && aces > 0) {
                total -= 10;
                aces--;
            }
        }

        if (aces > 0 && total <= 21 && total - 10 > 0 && total !== 21) {
            return `${total - 10} / ${total}`;
        }
        return `${total}`;
    }

    // ============================================================
    // BETTING INTERACTIONS
    // ============================================================
    selectChip(val) {
        this.selectedChip = val;
        this.playAudio('chip');
        document.querySelectorAll('.bj-chip-item').forEach(el => {
            el.classList.toggle('active', parseInt(el.dataset.val) === val);
        });
    }

    placeBet(spot) {
        if (this.gameState !== 'BETTING') return;

        const walletBal = this.getWalletBalance();
        const chip = this.selectedChip;

        if (walletBal < chip) {
            this.showToast('Insufficient wallet balance!');
            return;
        }

        this.bets[spot] = (this.bets[spot] || 0) + chip;
        this.playAudio('chip');
        this.renderBetSpots();
        this.updateButtons();
    }

    clearBets() {
        if (this.gameState !== 'BETTING') return;
        this.bets = { main: 0, perfectPairs: 0, twentyOneThree: 0 };
        this.playAudio('chipClean');
        this.renderBetSpots();
        this.updateButtons();
    }

    doubleBets() {
        if (this.gameState !== 'BETTING') return;
        const totalNeeded = (this.bets.main + this.bets.perfectPairs + this.bets.twentyOneThree);
        if (this.getWalletBalance() < totalNeeded) {
            this.showToast('Insufficient balance to double bet!');
            return;
        }
        this.bets.main *= 2;
        this.bets.perfectPairs *= 2;
        this.bets.twentyOneThree *= 2;
        this.playAudio('chip');
        this.renderBetSpots();
        this.updateButtons();
    }

    rebet() {
        if (this.gameState !== 'BETTING') return;
        if (!this.lastBets.main && !this.lastBets.perfectPairs && !this.lastBets.twentyOneThree) return;

        const needed = this.lastBets.main + this.lastBets.perfectPairs + this.lastBets.twentyOneThree;
        if (this.getWalletBalance() < needed) {
            this.showToast('Insufficient balance to rebet!');
            return;
        }

        this.bets = { ...this.lastBets };
        this.playAudio('chip');
        this.renderBetSpots();
        this.updateButtons();
    }

    renderBetSpots() {
        ['main', 'perfectPairs', 'twentyOneThree'].forEach(spot => {
            const container = document.getElementById(`bj-spot-chips-${spot}`);
            if (!container) return;

            const amt = this.bets[spot] || 0;
            if (amt > 0) {
                const chipSvg = this.getClosestChipSvg(amt);
                container.innerHTML = `
                    <div class="bj-chip-badge">
                        <img src="../assets/games/card/chips/${chipSvg}" alt="chip">
                        <div class="bj-chip-badge-amt">${this.formatCurrency(amt)}</div>
                    </div>
                `;
            } else {
                container.innerHTML = '';
            }
        });
    }

    getClosestChipSvg(amt) {
        if (amt >= 5000) return 'chip_5000.svg';
        if (amt >= 1000) return 'chip_1000.svg';
        if (amt >= 500) return 'chip_500.svg';
        if (amt >= 100) return 'chip_100.svg';
        if (amt >= 50) return 'chip_50.svg';
        if (amt >= 20) return 'chip_20.svg';
        return 'chip_10.svg';
    }

    // ============================================================
    // ROUND LIFECYCLE & DEALING ANIMATION
    // ============================================================
    async startRound(betAmt) {
        if (this.gameState !== 'BETTING') return;
        if (betAmt && typeof betAmt === 'number') {
            this.bets.main = betAmt;
        } else if (this.bets.main <= 0) {
            const inputEl = document.getElementById('bj-bet-input');
            if (inputEl) {
                this.bets.main = parseFloat(inputEl.value) || 100;
            }
        }

        if (this.bets.main <= 0) {
            this.showToast('Please place a bet on MAIN spot to play!');
            return;
        }

        const totalWager = this.bets.main + this.bets.perfectPairs + this.bets.twentyOneThree;
        if (!this.deductFunds(totalWager, 'Blackjack 21 Bet')) {
            this.showToast('Insufficient funds in wallet!');
            return;
        }

        this.lastBets = { ...this.bets };
        this.gameState = 'DEALING';
        this.updateButtons();
        this.hideBanner();

        // Reset hands
        this.dealerCards = [];
        this.playerHands = [{ cards: [], bet: this.bets.main, status: 'playing', score: 0, isSplit: false }];
        this.activeHandIndex = 0;
        this.insuranceBet = 0;
        this.hasInsured = false;

        this.renderHands();

        // Deal 4 initial cards with authentic casino rhythm: P1 -> D1 -> P2 -> D2 (hole card)
        // 1. Player Card 1
        await this.dealCardToPlayer(0, false);
        await this.delay(350);

        // 2. Dealer Card 1 (Face Up)
        await this.dealCardToDealer(false);
        await this.delay(350);

        // 3. Player Card 2
        await this.dealCardToPlayer(0, false);
        await this.delay(350);

        // 4. Dealer Card 2 (Hole Card - Face Down)
        await this.dealCardToDealer(true);
        await this.delay(400);

        // Evaluate Side Bets Immediately!
        this.evaluateSideBets();

        // Check for Naturals
        const pScore = this.calcHandScore(this.playerHands[0].cards).total;
        const dScore = this.calcHandScore(this.dealerCards).total;
        const pHasBJ = (pScore === 21 && this.playerHands[0].cards.length === 2);
        const dShowsAce = (this.dealerCards[0].rank === 'A');

        if (dShowsAce && !pHasBJ) {
            // Offer Insurance!
            this.showInsuranceModal();
            return;
        }

        if (pHasBJ) {
            await this.handlePlayerNaturalBlackjack();
            return;
        }

        // Regular player turn begins
        this.gameState = 'PLAYER_TURN';
        this.updateButtons();
        this.renderHands();
    }

    async dealCardToPlayer(handIndex, faceDown = false) {
        const card = this.drawCard();
        card.faceDown = faceDown;
        this.playerHands[handIndex].cards.push(card);
        this.playAudio('deal');
        this.renderHands();
    }

    async dealCardToDealer(faceDown = false) {
        const card = this.drawCard();
        card.faceDown = faceDown;
        this.dealerCards.push(card);
        this.playAudio('deal');
        this.renderHands();
    }

    // ============================================================
    // SIDE BET EVALUATION (PERFECT PAIRS & 21+3)
    // ============================================================
    evaluateSideBets() {
        const p1 = this.playerHands[0].cards[0];
        const p2 = this.playerHands[0].cards[1];
        const d1 = this.dealerCards[0];

        // 1. Perfect Pairs
        if (this.bets.perfectPairs > 0) {
            let pairWinMult = 0;
            let pairType = '';
            if (p1.rank === p2.rank) {
                if (p1.suit === p2.suit) {
                    pairWinMult = 25; // Perfect Pair
                    pairType = 'PERFECT PAIR (25:1)';
                } else if (this.isSameColor(p1.suit, p2.suit)) {
                    pairWinMult = 12; // Coloured Pair
                    pairType = 'COLOURED PAIR (12:1)';
                } else {
                    pairWinMult = 6; // Mixed Pair
                    pairType = 'MIXED PAIR (6:1)';
                }
            }

            if (pairWinMult > 0) {
                const payout = this.bets.perfectPairs * (pairWinMult + 1);
                this.payoutWin(payout, `Blackjack Pairs: ${pairType}`);
                this.playAudio('winFly');
                this.showToast(`🔥 ${pairType} +${this.formatCurrency(payout)}!`);
            }
        }

        // 2. 21+3 (3-Card Poker hand using Player 2 cards + Dealer Upcard)
        if (this.bets.twentyOneThree > 0) {
            const threeCards = [p1, p2, d1];
            const result = this.evalTwentyOneThree(threeCards);
            if (result.mult > 0) {
                const payout = this.bets.twentyOneThree * (result.mult + 1);
                this.payoutWin(payout, `Blackjack 21+3: ${result.name}`);
                this.playAudio('winFanfare');
                this.showToast(`🌟 21+3 ${result.name} +${this.formatCurrency(payout)}!`);
            }
        }
    }

    isSameColor(suitA, suitB) {
        const red = ['heart', 'diamond'];
        const isRedA = red.includes(suitA);
        const isRedB = red.includes(suitB);
        return isRedA === isRedB;
    }

    evalTwentyOneThree(cards) {
        const ranks = cards.map(c => this.rankToNumber(c.rank)).sort((a, b) => a - b);
        const suits = cards.map(c => c.suit);

        const isFlush = suits[0] === suits[1] && suits[1] === suits[2];
        const isStraight = (ranks[0] + 1 === ranks[1] && ranks[1] + 1 === ranks[2]) ||
                           (ranks[0] === 2 && ranks[1] === 3 && ranks[2] === 14); // A-2-3
        const isThreeOfAKind = ranks[0] === ranks[1] && ranks[1] === ranks[2];
        const isSuitedTrips = isThreeOfAKind && isFlush;
        const isStraightFlush = isStraight && isFlush;

        if (isSuitedTrips) return { mult: 100, name: 'SUITED TRIPS (100:1)' };
        if (isStraightFlush) return { mult: 40, name: 'STRAIGHT FLUSH (40:1)' };
        if (isThreeOfAKind) return { mult: 30, name: 'THREE OF A KIND (30:1)' };
        if (isStraight) return { mult: 10, name: 'STRAIGHT (10:1)' };
        if (isFlush) return { mult: 5, name: 'FLUSH (5:1)' };

        return { mult: 0, name: '' };
    }

    rankToNumber(r) {
        if (r === 'A') return 14;
        if (r === 'K') return 13;
        if (r === 'Q') return 12;
        if (r === 'J') return 11;
        return parseInt(r, 10);
    }

    // ============================================================
    // PLAYER ACTIONS: HIT, STAND, DOUBLE, SPLIT, SURRENDER
    // ============================================================
    async hit() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const currentHand = this.playerHands[this.activeHandIndex];
        if (currentHand.status !== 'playing') return;

        await this.dealCardToPlayer(this.activeHandIndex, false);
        const score = this.calcHandScore(currentHand.cards).total;

        if (score > 21) {
            // Bust
            currentHand.status = 'bust';
            this.renderHands();
            this.advanceToNextHandOrDealer();
        } else if (score === 21) {
            // 21 reached, auto-stand
            currentHand.status = 'standing';
            this.renderHands();
            this.advanceToNextHandOrDealer();
        } else {
            this.updateButtons();
        }
    }

    async stand() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const currentHand = this.playerHands[this.activeHandIndex];
        currentHand.status = 'standing';
        this.renderHands();
        this.advanceToNextHandOrDealer();
    }

    async doubleDown() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const currentHand = this.playerHands[this.activeHandIndex];
        if (currentHand.cards.length !== 2) return;

        if (this.getWalletBalance() < currentHand.bet) {
            this.showToast('Insufficient balance to double down!');
            return;
        }

        if (!this.deductFunds(currentHand.bet, 'Blackjack Double Down')) {
            return;
        }

        currentHand.bet *= 2;
        this.playAudio('chip');
        await this.dealCardToPlayer(this.activeHandIndex, false);

        const score = this.calcHandScore(currentHand.cards).total;
        if (score > 21) currentHand.status = 'bust';
        else currentHand.status = 'standing';

        this.renderHands();
        this.advanceToNextHandOrDealer();
    }

    async split() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const currentHand = this.playerHands[this.activeHandIndex];
        if (currentHand.cards.length !== 2) return;
        if (this.playerHands.length > 1) return; // Only 1 split allowed

        const c1 = currentHand.cards[0];
        const c2 = currentHand.cards[1];
        if (c1.val !== c2.val) return;

        if (this.getWalletBalance() < currentHand.bet) {
            this.showToast('Insufficient balance to split!');
            return;
        }

        if (!this.deductFunds(currentHand.bet, 'Blackjack Split')) {
            return;
        }

        this.playAudio('chip');

        // Split into 2 hands
        const splitCard = currentHand.cards.pop();
        const hand2 = {
            cards: [splitCard],
            bet: currentHand.bet,
            status: 'playing',
            score: 0,
            isSplit: true
        };
        currentHand.isSplit = true;
        this.playerHands.push(hand2);

        this.renderHands();
        await this.delay(300);

        // Deal 1 card to Hand 1
        await this.dealCardToPlayer(0, false);
        // Deal 1 card to Hand 2
        await this.dealCardToPlayer(1, false);

        this.renderHands();
        this.updateButtons();
    }

    async surrender() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const currentHand = this.playerHands[this.activeHandIndex];
        if (currentHand.cards.length !== 2 || currentHand.isSplit) return;

        currentHand.status = 'surrendered';
        const refund = currentHand.bet / 2;
        this.payoutWin(refund, 'Blackjack Surrender Refund');
        this.showToast(`🏳️ Surrendered: ${this.formatCurrency(refund)} returned.`);

        this.gameState = 'ROUND_OVER';
        this.revealDealerHoleCard();
        this.updateButtons();
    }

    advanceToNextHandOrDealer() {
        if (this.playerHands.length > 1 && this.activeHandIndex === 0) {
            this.activeHandIndex = 1;
            this.updateButtons();
            this.renderHands();
            return;
        }

        // All player hands finished -> Dealer Turn
        this.runDealerTurn();
    }

    // ============================================================
    // DEALER AI TURN & ROUND SETTLEMENT
    // ============================================================
    async runDealerTurn() {
        this.gameState = 'DEALER_TURN';
        this.updateButtons();

        // 1. Reveal Hole Card
        await this.revealDealerHoleCard();
        await this.delay(500);

        // Check if all player hands busted
        const allBusted = this.playerHands.every(h => h.status === 'bust' || h.status === 'surrendered');
        if (allBusted) {
            this.settleRound();
            return;
        }

        // Dealer must hit on 16 and stand on all 17s
        let dScore = this.calcHandScore(this.dealerCards).total;
        while (dScore < 17) {
            await this.dealCardToDealer(false);
            await this.delay(650);
            dScore = this.calcHandScore(this.dealerCards).total;
        }

        this.settleRound();
    }

    async revealDealerHoleCard() {
        if (this.dealerCards.length >= 2 && this.dealerCards[1].faceDown) {
            this.dealerCards[1].faceDown = false;
            this.playAudio('flip');
            this.renderHands();
        }
    }

    async handlePlayerNaturalBlackjack() {
        this.gameState = 'ROUND_OVER';
        await this.revealDealerHoleCard();

        const dScore = this.calcHandScore(this.dealerCards).total;
        const dHasBJ = (dScore === 21 && this.dealerCards.length === 2);

        if (dHasBJ) {
            // Push
            this.payoutWin(this.bets.main, 'Blackjack Push');
            this.showBanner('push', 'PUSH - 21 TIE', this.bets.main);
        } else {
            // Natural Blackjack Pays 3:2
            const winAmt = this.bets.main + (this.bets.main * 1.5);
            this.payoutWin(winAmt, 'Natural 21 Blackjack Win');
            this.playAudio('winFanfare');
            this.triggerConfetti();
            this.showBanner('blackjack', '★ BLACKJACK 21 ★', winAmt);
        }

        this.updateButtons();
    }

    settleRound() {
        this.gameState = 'ROUND_OVER';
        const dScore = this.calcHandScore(this.dealerCards).total;
        const dBust = dScore > 21;

        let totalWon = 0;
        let bestOutcome = 'lose';

        this.playerHands.forEach(hand => {
            if (hand.status === 'surrendered') return;

            const pScore = this.calcHandScore(hand.cards).total;
            if (hand.status === 'bust') {
                // Hand lost
                return;
            }

            if (dBust) {
                // Player wins 1:1
                const win = hand.bet * 2;
                totalWon += win;
                this.payoutWin(win, 'Blackjack Win (Dealer Bust)');
                bestOutcome = 'win';
            } else if (pScore > dScore) {
                // Player wins 1:1
                const win = hand.bet * 2;
                totalWon += win;
                this.payoutWin(win, 'Blackjack Win');
                bestOutcome = 'win';
            } else if (pScore === dScore) {
                // Push
                totalWon += hand.bet;
                this.payoutWin(hand.bet, 'Blackjack Push');
                if (bestOutcome !== 'win') bestOutcome = 'push';
            } else {
                // Dealer wins
            }
        });

        if (bestOutcome === 'win') {
            this.playAudio('winFanfare');
            this.triggerConfetti();
            this.showBanner('win', 'YOU WIN!', totalWon);
        } else if (bestOutcome === 'push') {
            this.playAudio('winFly');
            this.showBanner('push', 'PUSH - STAKES RETURNED', totalWon);
        } else {
            this.showBanner('lose', 'DEALER WINS', 0);
        }

        this.updateButtons();
    }

    // ============================================================
    // INSURANCE MODAL
    // ============================================================
    showInsuranceModal() {
        const modal = document.getElementById('bj-insurance-modal');
        const costEl = document.getElementById('bj-insurance-cost');
        if (modal && costEl) {
            const cost = this.bets.main / 2;
            costEl.textContent = this.formatCurrency(cost);
            modal.classList.add('open');
        }
    }

    async answerInsurance(buy) {
        const modal = document.getElementById('bj-insurance-modal');
        if (modal) modal.classList.remove('open');

        if (buy) {
            const cost = this.bets.main / 2;
            if (this.deductFunds(cost, 'Blackjack Insurance Bet')) {
                this.insuranceBet = cost;
                this.hasInsured = true;
                this.playAudio('chip');
                this.showToast(`🛡️ Insurance placed for ${this.formatCurrency(cost)}`);
            }
        }

        // Check if dealer has natural blackjack
        const dScore = this.calcHandScore(this.dealerCards).total;
        const dHasBJ = (dScore === 21 && this.dealerCards.length === 2);

        if (dHasBJ) {
            await this.revealDealerHoleCard();
            if (this.hasInsured) {
                // Insurance pays 2:1
                const payout = this.insuranceBet * 3;
                this.payoutWin(payout, 'Blackjack Insurance Win (2:1)');
                this.showToast(`🛡️ Insurance Won 2:1! +${this.formatCurrency(payout)}`);
            }
            this.settleRound();
            return;
        }

        // Dealer doesn't have blackjack, continue player round
        this.gameState = 'PLAYER_TURN';
        this.updateButtons();
        this.renderHands();
    }

    // ============================================================
    // RENDERING & DOM UPDATES
    // ============================================================
    renderHands() {
        // 1. Dealer Cards
        const dealerZone = document.getElementById('bj-dealer-cards');
        const dealerScoreEl = document.getElementById('bj-dealer-score');

        if (dealerZone) {
            dealerZone.innerHTML = this.dealerCards.map((c, i) => {
                if (c.faceDown) {
                    return `
                        <div class="bj-card" style="z-index:${i+1};">
                            <div class="bj-card-inner">
                                <div class="bj-card-face back">
                                    <img src="../assets/games/card/deck/card_back.svg" alt="Card Back">
                                </div>
                            </div>
                        </div>
                    `;
                }
                return `
                    <div class="bj-card" style="z-index:${i+1};">
                        <div class="bj-card-inner">
                            <div class="bj-card-face front">
                                <img src="../assets/games/card/deck/${c.file}" alt="${c.rank} of ${c.suit}">
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (dealerScoreEl) {
            const visibleCards = this.dealerCards.filter(c => !c.faceDown);
            dealerScoreEl.textContent = this.formatHandDisplay(visibleCards);
        }

        // 2. Player Hands
        const wrapper = document.getElementById('bj-player-hands-wrapper');
        if (wrapper) {
            wrapper.innerHTML = this.playerHands.map((hand, idx) => {
                const isActive = (this.gameState === 'PLAYER_TURN' && this.activeHandIndex === idx);
                const score = this.calcHandScore(hand.cards).total;
                const scoreDisplay = this.formatHandDisplay(hand.cards);

                let scoreClass = '';
                if (score === 21 && hand.cards.length === 2 && !hand.isSplit) scoreClass = 'bj-natural';
                else if (score > 21) scoreClass = 'bj-bust';

                const cardsHtml = hand.cards.map((c, ci) => `
                    <div class="bj-card" style="z-index:${ci+1};">
                        <div class="bj-card-inner">
                            <div class="bj-card-face front">
                                <img src="../assets/games/card/deck/${c.file}" alt="${c.rank} of ${c.suit}">
                            </div>
                        </div>
                    </div>
                `).join('');

                return `
                    <div class="bj-hand-box ${isActive ? 'active-hand' : ''}">
                        <div class="bj-hand-badge">
                            <span>Player Hand ${this.playerHands.length > 1 ? `#${idx+1}` : ''}</span>
                            <span class="bj-score-val ${scoreClass}">${scoreDisplay}</span>
                        </div>
                        <div class="bj-cards-cluster">${cardsHtml}</div>
                    </div>
                `;
            }).join('');
        }
        // Fallback for cards.html single-panel tab
        const singlePlayerCards = document.getElementById('bj-player-cards');
        const singlePlayerScore = document.getElementById('bj-player-score');
        if (singlePlayerCards && this.playerHands[0]) {
            const h = this.playerHands[0];
            singlePlayerCards.innerHTML = h.cards.map(c => `
                <div class="playing-card" style="display:inline-block; margin:0 4px;">
                    <img src="../assets/games/card/deck/${c.file}" width="65" height="92" alt="${c.rank}">
                </div>
            `).join('');
            if (singlePlayerScore) {
                singlePlayerScore.textContent = this.formatHandDisplay(h.cards);
            }
        }
    }

    renderBots() {
        const container = document.getElementById('bj-seated-players');
        if (!container) return;

        container.innerHTML = this.bots.map(bot => `
            <div class="bj-seat-player">
                <div class="bj-seat-avatar">${bot.icon}</div>
                <div class="bj-seat-info">
                    <span class="bj-seat-name">${bot.name}</span>
                    <span class="bj-seat-bet">${this.formatCurrency(bot.bet)}</span>
                </div>
            </div>
        `).join('');
    }

    updateButtons() {
        const dealBtn = document.getElementById('bj-btn-deal') || document.getElementById('bj-deal-btn');
        const hitBtn = document.getElementById('bj-btn-hit') || document.getElementById('bj-hit-btn');
        const standBtn = document.getElementById('bj-btn-stand') || document.getElementById('bj-stand-btn');
        const doubleBtn = document.getElementById('bj-btn-double') || document.getElementById('bj-double-btn');
        const splitBtn = document.getElementById('bj-btn-split');
        const surrenderBtn = document.getElementById('bj-btn-surrender');
        const clearBtn = document.getElementById('bj-btn-clear');
        const rebetBtn = document.getElementById('bj-btn-rebet');
        const doubleBetBtn = document.getElementById('bj-btn-2x');

        const isBetting = (this.gameState === 'BETTING');
        const isPlayerTurn = (this.gameState === 'PLAYER_TURN');
        const currentHand = this.playerHands[this.activeHandIndex];

        if (dealBtn) dealBtn.disabled = !isBetting || (this.bets.main <= 0);
        if (clearBtn) clearBtn.disabled = !isBetting || (this.bets.main <= 0 && this.bets.perfectPairs <= 0 && this.bets.twentyOneThree <= 0);
        if (rebetBtn) rebetBtn.disabled = !isBetting || (!this.lastBets.main);
        if (doubleBetBtn) doubleBetBtn.disabled = !isBetting || (this.bets.main <= 0);

        if (hitBtn) hitBtn.disabled = !isPlayerTurn;
        if (standBtn) standBtn.disabled = !isPlayerTurn;

        const canDouble = isPlayerTurn && currentHand && currentHand.cards.length === 2 && this.getWalletBalance() >= currentHand.bet;
        if (doubleBtn) doubleBtn.disabled = !canDouble;

        const canSplit = isPlayerTurn && currentHand && currentHand.cards.length === 2 &&
                         (currentHand.cards[0].val === currentHand.cards[1].val) &&
                         this.playerHands.length === 1 &&
                         this.getWalletBalance() >= currentHand.bet;
        if (splitBtn) splitBtn.disabled = !canSplit;

        const canSurrender = isPlayerTurn && currentHand && currentHand.cards.length === 2 && !currentHand.isSplit;
        if (surrenderBtn) surrenderBtn.disabled = !canSurrender;
    }

    showBanner(type, title, payout) {
        const overlay = document.getElementById('bj-banner-overlay');
        const titleEl = document.getElementById('bj-banner-title');
        const payoutEl = document.getElementById('bj-banner-payout');
        if (!overlay || !titleEl || !payoutEl) return;

        titleEl.className = `bj-banner-title ${type}`;
        titleEl.textContent = title;

        if (payout > 0) {
            payoutEl.textContent = `+${this.formatCurrency(payout)}`;
            payoutEl.style.display = 'block';
        } else {
            payoutEl.style.display = 'none';
        }

        overlay.classList.add('show');
        setTimeout(() => {
            this.gameState = 'BETTING';
            this.updateButtons();
        }, 1200);
    }

    hideBanner() {
        const overlay = document.getElementById('bj-banner-overlay');
        if (overlay) overlay.classList.remove('show');
    }

    showToast(msg) {
        let toast = document.getElementById('bj-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'bj-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid rgba(250, 204, 21, 0.5);
                box-shadow: 0 8px 24px rgba(0,0,0,0.8);
                color: #ffffff;
                font-weight: 800;
                font-size: 13px;
                padding: 8px 18px;
                border-radius: 20px;
                z-index: 300;
                pointer-events: none;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(this._toastTimeout);
        this._toastTimeout = setTimeout(() => {
            toast.style.opacity = '0';
        }, 2200);
    }

    // ============================================================
    // WALLET ENGINE BRIDGE
    // ============================================================
    getWalletBalance() {
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return window.wallet.getBalance(this.currency);
        }
        try {
            const raw = localStorage.getItem('bwn_wallet_balance') || '25000';
            return parseFloat(raw);
        } catch (e) {
            return 25000;
        }
    }

    deductFunds(amount, desc) {
        if (window.wallet && typeof window.wallet.deductFunds === 'function') {
            const ok = window.wallet.deductFunds(amount, this.currency, desc);
            this.syncWallet();
            return ok;
        }

        const bal = this.getWalletBalance();
        if (bal >= amount) {
            localStorage.setItem('bwn_wallet_balance', (bal - amount).toFixed(2));
            this.syncWallet();
            return true;
        }
        return false;
    }

    payoutWin(amount, desc) {
        if (window.wallet && typeof window.wallet.addFunds === 'function') {
            window.wallet.addFunds(amount, this.currency, desc);
            this.syncWallet();
            return;
        }

        const bal = this.getWalletBalance();
        localStorage.setItem('bwn_wallet_balance', (bal + amount).toFixed(2));
        this.syncWallet();
    }

    syncWallet() {
        const el = document.getElementById('bj-balance-amount');
        if (el) {
            el.textContent = this.formatCurrency(this.getWalletBalance());
        }
    }

    formatCurrency(amt) {
        const prefix = (this.currency === 'PKR') ? '₨' : '$';
        return `${prefix}${amt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }

    toggleCurrency() {
        this.currency = (this.currency === 'PKR') ? 'USD' : 'PKR';
        this.syncWallet();
        this.renderBetSpots();
        this.showToast(`Switched currency to ${this.currency}`);
    }

    // ============================================================
    // CONFETTI PARTICLE CELEBRATION
    // ============================================================
    setupConfetti() {
        this.canvas = document.getElementById('bj-confetti');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.confettiParticles = [];

        window.addEventListener('resize', () => {
            if (this.canvas) {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
            }
        });
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    triggerConfetti() {
        if (!this.ctx) return;
        this.confettiParticles = [];
        const colors = ['#ffd700', '#f59e0b', '#38ef7d', '#00e5ff', '#ffffff', '#ec4899'];

        for (let i = 0; i < 90; i++) {
            this.confettiParticles.push({
                x: window.innerWidth / 2 + (Math.random() * 200 - 100),
                y: window.innerHeight * 0.45,
                vx: (Math.random() - 0.5) * 16,
                vy: -(Math.random() * 14 + 6),
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                gravity: 0.38,
                life: 1
            });
        }

        if (!this._confettiAnim) this.renderConfetti();
    }

    renderConfetti() {
        if (!this.ctx || this.confettiParticles.length === 0) {
            this._confettiAnim = false;
            return;
        }

        this._confettiAnim = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const p = this.confettiParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.rotation += p.rotSpeed;
            p.life -= 0.012;

            if (p.life <= 0) {
                this.confettiParticles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate((p.rotation * Math.PI) / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
            this.ctx.restore();
        }

        requestAnimationFrame(() => this.renderConfetti());
    }

    // ============================================================
    // DOM EVENT BINDINGS
    // ============================================================
    bindEvents() {
        // Keyboard Shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'BETTING') this.startRound();
            } else if (e.code === 'KeyH') {
                this.hit();
            } else if (e.code === 'KeyS') {
                this.stand();
            } else if (e.code === 'KeyD') {
                this.doubleDown();
            } else if (e.code === 'KeyP') {
                this.split();
            }
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global Singleton Export
window.blackjackGame = new BlackjackEngine();
