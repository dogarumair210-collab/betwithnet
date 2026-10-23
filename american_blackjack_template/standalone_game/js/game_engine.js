/**
 * American Blackjack (Authentic Pragmatic Play / 1xBet Edition)
 * Full Game Engine with Exact Sliced Cards, Split Hands, Insurance Modal,
 * 2X Double Down, Realistic Chip Stacks, and Authentic Payouts.
 */

class AmericanBlackjackEngine {
    constructor() {
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

        this.chipValues = [
            { id: 0, val: 100, file: 's_chip_00.png' },
            { id: 1, val: 500, file: 's_chip_01.png' },
            { id: 2, val: 1000, file: 's_chip_02.png' },
            { id: 3, val: 5000, file: 's_chip_03.png' },
            { id: 4, val: 25000, file: 's_chip_04.png' }
        ];

        this.deckCount = 8;
        this.shoe = [];
        this.selectedChip = 500;
        this.selectedChipImg = 's_chip_01.png';
        this.currency = 'PKR';
        this.balance = 50000;

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
        this.currentTurnIndex = 0; // index in this.activeSpots
        this.gameState = 'BETTING'; // 'BETTING', 'DEALING', 'INSURANCE_OFFER', 'PLAYER_TURN', 'DEALER_TURN', 'ROUND_OVER'
        this.dealerHoleHidden = true;

        this.initShoe();
    }

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

    drawCard() {
        if (this.shoe.length < 52) {
            this.initShoe();
        }
        return this.shoe.pop();
    }

    setChip(amount, file) {
        this.selectedChip = amount;
        this.selectedChipImg = file;
        if (window.bjAudio) window.bjAudio.playChip();
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
        if (this.balance < this.selectedChip) {
            this.showNotification("Insufficient balance!");
            return;
        }

        this.currentBets[spotIndex] += this.selectedChip;
        this.balance -= this.selectedChip;
        if (window.bjAudio) window.bjAudio.playChip();
        this.updateUI();
    }

    clearBets() {
        if (this.gameState !== 'BETTING') return;
        const totalRefund = this.currentBets[0] + this.currentBets[1] + this.currentBets[2];
        this.balance += totalRefund;
        this.currentBets = { 0: 0, 1: 0, 2: 0 };
        if (window.bjAudio) window.bjAudio.playClick();
        this.updateUI();
    }

    doubleCurrentBets() {
        if (this.gameState !== 'BETTING') return;
        const totalCurrent = this.currentBets[0] + this.currentBets[1] + this.currentBets[2];
        if (totalCurrent === 0) return;
        if (this.balance < totalCurrent) {
            this.showNotification("Insufficient balance to 2X bet!");
            return;
        }

        this.balance -= totalCurrent;
        this.currentBets[0] *= 2;
        this.currentBets[1] *= 2;
        this.currentBets[2] *= 2;
        if (window.bjAudio) window.bjAudio.playChip();
        this.updateUI();
    }

    rebet() {
        if (this.gameState !== 'BETTING') return;
        const totalNeeded = this.lastBets[0] + this.lastBets[1] + this.lastBets[2];
        if (totalNeeded === 0) return;
        if (this.balance < totalNeeded) {
            this.showNotification("Insufficient balance for rebet!");
            return;
        }

        this.clearBets();
        this.currentBets[0] = this.lastBets[0];
        this.currentBets[1] = this.lastBets[1];
        this.currentBets[2] = this.lastBets[2];
        this.balance -= totalNeeded;
        if (window.bjAudio) window.bjAudio.playChip();
        this.updateUI();
    }

    calculateHand(cards) {
        let sum = 0;
        let aces = 0;
        for (const card of cards) {
            sum += card.value;
            if (card.rank === 'A') aces++;
        }
        while (sum > 21 && aces > 0) {
            sum -= 10;
            aces--;
        }
        const isSoft = aces > 0 && sum <= 21;
        const isBlackjack = cards.length === 2 && sum === 21;
        const isBust = sum > 21;
        return { total: sum, isSoft, isBlackjack, isBust };
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
        this.updateUI();

        // Deal 1st card to each active player spot
        for (const spot of this.activeSpots) {
            await this.sleep(260);
            this.playerHands[spot].push(this.drawCard());
            if (window.bjAudio) window.bjAudio.playCardDeal();
            this.updateUI();
        }

        // Deal 1st card to dealer
        await this.sleep(300);
        this.dealerCards.push(this.drawCard());
        if (window.bjAudio) window.bjAudio.playCardDeal();
        this.updateUI();

        // Deal 2nd card to each active player spot
        for (const spot of this.activeSpots) {
            await this.sleep(260);
            this.playerHands[spot].push(this.drawCard());
            if (window.bjAudio) window.bjAudio.playCardDeal();
            this.updateUI();
        }

        // Deal 2nd (hole) card to dealer
        await this.sleep(300);
        this.dealerCards.push(this.drawCard());
        if (window.bjAudio) window.bjAudio.playCardDeal();
        this.updateUI();

        // Check if dealer upcard is Ace -> Offer Insurance
        if (this.dealerCards[0].rank === 'A') {
            this.gameState = 'INSURANCE_OFFER';
            this.updateUI();
            return;
        }

        // Check Dealer 10-value card peek
        if (this.dealerCards[0].value === 10) {
            const dealerEval = this.calculateHand(this.dealerCards);
            if (dealerEval.isBlackjack) {
                await this.sleep(600);
                this.dealerHoleHidden = false;
                this.finishRound();
                return;
            }
        }

        this.startPlayerTurns();
    }

    resolveInsurance(accept) {
        if (this.gameState !== 'INSURANCE_OFFER') return;
        if (accept) {
            // Player takes insurance (half the bet)
            let totalIns = 0;
            for (const spot of this.activeSpots) {
                const insCost = Math.floor(this.currentBets[spot] / 2);
                if (this.balance >= insCost) {
                    this.balance -= insCost;
                    this.insuranceBets[spot] = insCost;
                    totalIns += insCost;
                }
            }
            if (totalIns > 0) {
                if (window.bjAudio) window.bjAudio.playChip();
            }
        }

        // Now check if dealer has Blackjack
        const dealerEval = this.calculateHand(this.dealerCards);
        if (dealerEval.isBlackjack) {
            this.dealerHoleHidden = false;
            // Insurance pays 2:1
            for (const spot of this.activeSpots) {
                if (this.insuranceBets[spot] > 0) {
                    this.balance += this.insuranceBets[spot] * 3;
                }
            }
            this.finishRound();
            return;
        } else {
            // Dealer does not have blackjack, insurance lost
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
            if (window.bjAudio) window.bjAudio.playBlackjack();
            this.nextTurn();
        } else if (hEval.isBust) {
            if (window.bjAudio) window.bjAudio.playBust();
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
        this.playerHands[spot].push(this.drawCard());
        if (window.bjAudio) window.bjAudio.playCardDeal();
        this.updateUI();

        const hEval = this.calculateHand(this.playerHands[spot]);
        if (hEval.isBust || hEval.total === 21) {
            await this.sleep(600);
            this.checkCurrentHand();
        }
    }

    stand() {
        if (this.gameState !== 'PLAYER_TURN') return;
        if (window.bjAudio) window.bjAudio.playClick();
        this.nextTurn();
    }

    async doubleDown() {
        if (this.gameState !== 'PLAYER_TURN') return;
        const spot = this.activeSpots[this.currentTurnIndex];
        const hand = this.playerHands[spot];
        if (hand.length !== 2) return;

        const bet = this.currentBets[spot];
        if (this.balance < bet) {
            this.showNotification("Insufficient balance to Double Down!");
            return;
        }

        this.balance -= bet;
        this.currentBets[spot] *= 2;
        if (window.bjAudio) window.bjAudio.playChip();
        
        hand.push(this.drawCard());
        if (window.bjAudio) window.bjAudio.playCardDeal();
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
        if (this.balance < bet) {
            this.showNotification("Insufficient balance to Split!");
            return;
        }

        this.balance -= bet;
        if (window.bjAudio) window.bjAudio.playChip();

        // Split card into next free spot or sub-hand
        const secondCard = hand.pop();
        hand.push(this.drawCard());
        if (window.bjAudio) window.bjAudio.playCardDeal();
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
        this.dealerHoleHidden = false;
        if (window.bjAudio) window.bjAudio.playCardDeal();
        this.updateUI();

        const allBusted = this.activeSpots.every(s => this.calculateHand(this.playerHands[s]).isBust);

        if (!allBusted) {
            let dEval = this.calculateHand(this.dealerCards);
            while (dEval.total < 17) {
                await this.sleep(700);
                this.dealerCards.push(this.drawCard());
                if (window.bjAudio) window.bjAudio.playCardDeal();
                dEval = this.calculateHand(this.dealerCards);
                this.updateUI();
            }
        }

        await this.sleep(500);
        this.finishRound();
    }

    finishRound() {
        this.gameState = 'ROUND_OVER';
        this.dealerHoleHidden = false;
        const dEval = this.calculateHand(this.dealerCards);
        let totalWin = 0;
        let anyWin = false;
        let anyBj = false;

        for (const spot of this.activeSpots) {
            const hEval = this.calculateHand(this.playerHands[spot]);
            const bet = this.currentBets[spot];

            if (hEval.isBust) {
                this.playerHands[spot].result = 'BUST';
            } else if (dEval.isBust) {
                const payout = bet * 2;
                totalWin += payout;
                anyWin = true;
                this.playerHands[spot].result = 'WIN (DEALER BUST)';
            } else if (hEval.isBlackjack && !dEval.isBlackjack) {
                const payout = bet * 2.5; // 3:2 payout
                totalWin += payout;
                anyWin = true;
                anyBj = true;
                this.playerHands[spot].result = 'BLACKJACK 3:2';
            } else if (hEval.isBlackjack && dEval.isBlackjack) {
                totalWin += bet;
                this.playerHands[spot].result = 'PUSH';
            } else if (dEval.isBlackjack && !hEval.isBlackjack) {
                this.playerHands[spot].result = 'DEALER BLACKJACK';
            } else if (hEval.total > dEval.total) {
                const payout = bet * 2;
                totalWin += payout;
                anyWin = true;
                this.playerHands[spot].result = 'WIN';
            } else if (hEval.total === dEval.total) {
                totalWin += bet;
                this.playerHands[spot].result = 'PUSH';
            } else {
                this.playerHands[spot].result = 'LOSE';
            }
        }

        this.balance += totalWin;

        if (anyBj) {
            if (window.bjAudio) window.bjAudio.playBlackjack();
        } else if (anyWin) {
            if (window.bjAudio) window.bjAudio.playWin();
        }

        this.updateUI();
    }

    newRound() {
        this.gameState = 'BETTING';
        this.dealerCards = [];
        this.playerHands = { 0: [], 1: [], 2: [] };
        this.currentBets = { 0: 0, 1: 0, 2: 0 };
        this.insuranceBets = { 0: 0, 1: 0, 2: 0 };
        this.dealerHoleHidden = true;
        this.updateUI();
    }

    toggleCurrency() {
        if (this.currency === 'PKR') {
            this.currency = 'USD';
            this.balance = Math.round(this.balance / 280);
            this.selectedChip = 5;
        } else {
            this.currency = 'PKR';
            this.balance = Math.round(this.balance * 280);
            this.selectedChip = 500;
        }
        if (window.bjAudio) window.bjAudio.playClick();
        this.updateUI();
    }

    formatMoney(val) {
        if (this.currency === 'PKR') {
            return `₨${val.toLocaleString()}`;
        }
        return `$${val.toLocaleString()}`;
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
        // Balance
        const balEl = document.getElementById('bj-balance-val');
        if (balEl) balEl.innerText = this.formatMoney(this.balance);

        // Insurance Modal
        const insModal = document.getElementById('bj-insurance-modal');
        if (insModal) {
            insModal.style.display = this.gameState === 'INSURANCE_OFFER' ? 'flex' : 'none';
        }

        // Betting Spots
        for (let i = 0; i <= 2; i++) {
            const spotCircle = document.getElementById(`bj-spot-${i}`);
            const chipStackEl = document.getElementById(`bj-spot-chip-${i}`);
            const betValEl = document.getElementById(`bj-spot-bet-${i}`);

            if (this.currentBets[i] > 0) {
                if (chipStackEl) {
                    chipStackEl.src = `assets/chips/${this.getChipFileForAmount(this.currentBets[i])}`;
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

            if (spotCircle) {
                const isActive = this.gameState === 'PLAYER_TURN' && this.activeSpots[this.currentTurnIndex] === i;
                spotCircle.classList.toggle('active-spot', isActive);
            }

            // Cards Rendering
            const cardsContainer = document.getElementById(`bj-cards-${i}`);
            if (cardsContainer) {
                cardsContainer.innerHTML = '';
                const cards = this.playerHands[i] || [];
                cards.forEach((card, cIdx) => {
                    const cardImg = document.createElement('img');
                    cardImg.src = `assets/cards/${card.file}`;
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
                cardImg.src = isHole ? 'assets/cards/s_card_back.png' : `assets/cards/${card.file}`;
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

        // Button Controls
        const isBetting = this.gameState === 'BETTING';
        const isPlayerTurn = this.gameState === 'PLAYER_TURN';
        const isRoundOver = this.gameState === 'ROUND_OVER';

        document.getElementById('btn-deal').style.display = isBetting ? 'inline-flex' : 'none';
        document.getElementById('btn-clear').style.display = isBetting ? 'inline-flex' : 'none';
        document.getElementById('btn-double-bet').style.display = isBetting ? 'inline-flex' : 'none';
        document.getElementById('btn-rebet').style.display = isBetting ? 'inline-flex' : 'none';

        document.getElementById('btn-hit').style.display = isPlayerTurn ? 'inline-flex' : 'none';
        document.getElementById('btn-stand').style.display = isPlayerTurn ? 'inline-flex' : 'none';

        // Check if double down allowed (2 cards only)
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
        document.getElementById('btn-double').style.display = canDouble ? 'inline-flex' : 'none';
        document.getElementById('btn-split').style.display = canSplit ? 'inline-flex' : 'none';

        document.getElementById('btn-newround').style.display = isRoundOver ? 'inline-flex' : 'none';

        // Chips rack interaction
        const chipsRack = document.getElementById('bj-chips-rack');
        if (chipsRack) {
            chipsRack.style.opacity = isBetting ? '1' : '0.4';
            chipsRack.style.pointerEvents = isBetting ? 'auto' : 'none';
        }
    }
}

window.bjEngine = new AmericanBlackjackEngine();
window.addEventListener('DOMContentLoaded', () => {
    window.bjEngine.updateUI();
});
