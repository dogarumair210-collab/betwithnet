/**
 * Fortune Gems 2 - Core Slot Game Engine
 * TaDa Gaming / JILI Math Model & 4th Multiplier Reel Mechanics
 */

const SYMBOLS = {
    WILD:     { id: 'WILD',     name: 'Garuda Mask',  payout: 25, src: 'assets/symbols/sym_wild.png' },
    RUBY:     { id: 'RUBY',     name: 'Red Ruby',     payout: 20, src: 'assets/symbols/sym_ruby.png' },
    SAPPHIRE: { id: 'SAPPHIRE', name: 'Blue Sapphire',payout: 15, src: 'assets/symbols/sym_sapphire.png' },
    EMERALD:  { id: 'EMERALD',  name: 'Green Emerald',payout: 10, src: 'assets/symbols/sym_emerald.png' },
    A:        { id: 'A',        name: 'Golden Ace',   payout: 5,  src: 'assets/symbols/sym_a.png' },
    K:        { id: 'K',        name: 'Golden King',  payout: 4,  src: 'assets/symbols/sym_k.png' },
    Q:        { id: 'Q',        name: 'Golden Queen', payout: 3,  src: 'assets/symbols/sym_q.png' },
    J:        { id: 'J',        name: 'Golden Jack',  payout: 2,  src: 'assets/symbols/sym_j.png' }
};

const SYMBOL_KEYS = ['WILD', 'RUBY', 'SAPPHIRE', 'EMERALD', 'A', 'K', 'Q', 'J'];

const MULTIPLIERS = [
    { id: '1X', mult: 1, src: 'assets/multipliers_svg/multiplier_1x.svg' },
    { id: '2X', mult: 2, src: 'assets/multipliers_svg/multiplier_2x.svg' },
    { id: '3X', mult: 3, src: 'assets/multipliers_svg/multiplier_3x.svg' },
    { id: '5X', mult: 5, src: 'assets/multipliers_svg/multiplier_5x.svg' },
    { id: '10X', mult: 10, src: 'assets/multipliers_svg/multiplier_10x.svg' },
    { id: '15X', mult: 15, src: 'assets/multipliers_svg/multiplier_15x.svg' },
    { id: 'WHEEL', isWheel: true, src: 'assets/symbols/sym_wheel.png' }
];

// 5 Fixed Paylines: [row, col]
const PAYLINES = [
    { id: 1, name: 'Middle Line', coords: [[1, 0], [1, 1], [1, 2]], color: '#ffd700' },
    { id: 2, name: 'Top Line',    coords: [[0, 0], [0, 1], [0, 2]], color: '#00b0ff' },
    { id: 3, name: 'Bottom Line', coords: [[2, 0], [2, 1], [2, 2]], color: '#ff1744' },
    { id: 4, name: 'Diagonal ↘',  coords: [[0, 0], [1, 1], [2, 2]], color: '#00e676' },
    { id: 5, name: 'Diagonal ↗',  coords: [[2, 0], [1, 1], [0, 2]], color: '#d500f9' }
];

class FortuneGemsGame {
    constructor() {
        this.balance = 50000;
        this.baseBet = 50;
        this.isExtraBet = false;
        this.isTurbo = false;
        this.isAuto = false;
        this.autoCount = 0;
        this.isSpinning = false;

        this.grid = [
            ['RUBY', 'WILD', 'SAPPHIRE'],
            ['A', 'K', 'EMERALD'],
            ['Q', 'J', 'RUBY']
        ];
        this.specialMultiplier = MULTIPLIERS[0];

        this.audio = new SlotAudioEngine();
        this.initDOM();
        this.renderInitialGrid();
    }

    initDOM() {
        this.balanceEl = document.getElementById('userBalance');
        this.betEl = document.getElementById('betAmount');
        this.winEl = document.getElementById('lastWinAmount');
        this.spinBtn = document.getElementById('spinButton');
        this.extraBetBtn = document.getElementById('extraBetToggle');
        this.turboBtn = document.getElementById('turboToggle');
        this.autoBtn = document.getElementById('autoSpinToggle');
        this.wheelModal = document.getElementById('wheelModal');
        this.bigWinModal = document.getElementById('bigWinModal');

        this.updateUI();
    }

    get effectiveBet() {
        return this.isExtraBet ? Math.round(this.baseBet * 1.5) : this.baseBet;
    }

    updateUI() {
        if (this.balanceEl) this.balanceEl.innerText = '$' + this.balance.toLocaleString();
        if (this.betEl) this.betEl.innerText = '$' + this.effectiveBet.toLocaleString();
    }

    adjustBet(delta) {
        if (this.isSpinning) return;
        const bets = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
        let idx = bets.indexOf(this.baseBet);
        if (idx === -1) idx = 2;
        idx = Math.max(0, Math.min(bets.length - 1, idx + delta));
        this.baseBet = bets[idx];
        this.updateUI();
    }

    toggleExtraBet() {
        if (this.isSpinning) return;
        this.isExtraBet = !this.isExtraBet;
        this.extraBetBtn.classList.toggle('active', this.isExtraBet);
        this.updateUI();
    }

    toggleTurbo() {
        this.isTurbo = !this.isTurbo;
        this.turboBtn.classList.toggle('active', this.isTurbo);
    }

    toggleAutoSpin() {
        if (this.isAuto) {
            this.isAuto = false;
            this.autoCount = 0;
            this.autoBtn.classList.remove('active');
            this.autoBtn.innerText = 'AUTO';
        } else {
            this.isAuto = true;
            this.autoCount = 25;
            this.autoBtn.classList.add('active');
            this.autoBtn.innerText = 'AUTO (25)';
            if (!this.isSpinning) this.spin();
        }
    }

    renderInitialGrid() {
        for (let r = 0; r < 3; r++) {
            const strip = document.getElementById(`reelStrip${r}`);
            if (strip) {
                strip.innerHTML = '';
                for (let row = 0; row < 3; row++) {
                    const symKey = this.grid[row][r];
                    const div = document.createElement('div');
                    div.className = 'symbol-cell';
                    div.id = `cell_${row}_${r}`;
                    div.innerHTML = `<img src="${SYMBOLS[symKey].src}" alt="${symKey}">`;
                    strip.appendChild(div);
                }
            }
        }
        const stripSpecial = document.getElementById('reelStrip3');
        if (stripSpecial) {
            stripSpecial.innerHTML = '';
            for (let i = 0; i < 3; i++) {
                const item = i === 1 ? this.specialMultiplier : MULTIPLIERS[1];
                const div = document.createElement('div');
                div.className = 'symbol-cell';
                div.innerHTML = `<img src="${item.src}" alt="${item.id}">`;
                stripSpecial.appendChild(div);
            }
        }
    }

    async spin() {
        if (this.isSpinning) return;
        if (this.balance < this.effectiveBet) {
            alert('Insufficient balance to spin!');
            this.isAuto = false;
            if (this.autoBtn) this.autoBtn.classList.remove('active');
            return;
        }

        this.isSpinning = true;
        this.balance -= this.effectiveBet;
        this.updateUI();
        if (this.winEl) this.winEl.innerText = '$0';
        if (this.spinBtn) this.spinBtn.classList.add('spinning');
        this.clearPaylines();

        this.audio.playSpinStart();

        // 1. Determine RNG outcomes
        const nextGrid = [
            [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()],
            [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()],
            [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()]
        ];

        // Multiplier outcome: if Extra Bet active, 1X is excluded
        const availableMults = this.isExtraBet 
            ? MULTIPLIERS.filter(m => m.id !== '1X')
            : MULTIPLIERS;
        const nextMult = availableMults[Math.floor(Math.random() * availableMults.length)];

        // 2. Animate Reel strips
        const spinTime = this.isTurbo ? 500 : 1200;
        await this.animateReelSpin(nextGrid, nextMult, spinTime);

        this.grid = nextGrid;
        this.specialMultiplier = nextMult;
        if (this.spinBtn) this.spinBtn.classList.remove('spinning');

        // 3. Evaluate Wins
        await this.evaluateOutcome();

        this.isSpinning = false;

        // Auto spin loop
        if (this.isAuto && this.autoCount > 0) {
            this.autoCount--;
            this.autoBtn.innerText = `AUTO (${this.autoCount})`;
            if (this.autoCount <= 0) {
                this.isAuto = false;
                this.autoBtn.classList.remove('active');
                this.autoBtn.innerText = 'AUTO';
            } else {
                setTimeout(() => { if (this.isAuto) this.spin(); }, this.isTurbo ? 300 : 800);
            }
        }
    }

    randomSymbol() {
        return SYMBOL_KEYS[Math.floor(Math.random() * SYMBOL_KEYS.length)];
    }

    animateReelSpin(nextGrid, nextMult, duration) {
        return new Promise(resolve => {
            const reels = [0, 1, 2, 3];
            let finished = 0;

            reels.forEach(r => {
                const strip = document.getElementById(`reelStrip${r}`);
                const delay = r * (this.isTurbo ? 60 : 180);
                setTimeout(() => {
                    strip.style.transition = 'transform 0.1s ease-in';
                    strip.style.transform = 'translateY(15px)';

                    setTimeout(() => {
                        strip.style.transition = `transform ${duration / 1000}s cubic-bezier(0.1, 0.9, 0.2, 1)`;
                        strip.style.transform = 'translateY(0px)';

                        // Populate new symbols
                        if (r < 3) {
                            strip.innerHTML = '';
                            for (let row = 0; row < 3; row++) {
                                const symKey = nextGrid[row][r];
                                const div = document.createElement('div');
                                div.className = 'symbol-cell';
                                div.id = `cell_${row}_${r}`;
                                div.innerHTML = `<img src="${SYMBOLS[symKey].src}" alt="${symKey}">`;
                                strip.appendChild(div);
                            }
                        } else {
                            strip.innerHTML = '';
                            for (let i = 0; i < 3; i++) {
                                const item = i === 1 ? nextMult : MULTIPLIERS[(i + 1) % MULTIPLIERS.length];
                                const div = document.createElement('div');
                                div.className = 'symbol-cell';
                                div.innerHTML = `<img src="${item.src}" alt="${item.id}">`;
                                strip.appendChild(div);
                            }
                        }

                        this.audio.playReelStop(r);
                        finished++;
                        if (finished === 4) resolve();
                    }, 100);
                }, delay);
            });
        });
    }

    async evaluateOutcome() {
        let totalWin = 0;
        const winningLines = [];

        // Check each payline
        PAYLINES.forEach(line => {
            const sym0 = this.grid[line.coords[0][0]][line.coords[0][1]];
            const sym1 = this.grid[line.coords[1][0]][line.coords[1][1]];
            const sym2 = this.grid[line.coords[2][0]][line.coords[2][1]];

            const matchSymbol = this.checkThreeMatch(sym0, sym1, sym2);
            if (matchSymbol) {
                const basePayout = SYMBOLS[matchSymbol].payout * this.baseBet;
                winningLines.push({ line, symbol: matchSymbol, basePayout });
            }
        });

        // If Lucky Wheel bonus triggered on Reel 4 Center
        if (this.specialMultiplier.isWheel) {
            this.audio.playWheelBonusTrigger();
            await this.triggerLuckyWheelBonus();
            return;
        }

        // Apply 4th reel multiplier
        const mult = this.specialMultiplier.mult || 1;

        if (winningLines.length > 0) {
            winningLines.forEach(item => {
                totalWin += item.basePayout * mult;
                this.highlightLine(item.line);
            });

            this.balance += totalWin;
            this.winEl.innerText = '$' + totalWin.toLocaleString();
            this.updateUI();

            if (totalWin >= this.baseBet * 20) {
                this.audio.playBigWinFanfare();
                this.showBigWin(totalWin);
            } else {
                this.audio.playWinLine(winningLines.length);
            }
        }
    }

    checkThreeMatch(s0, s1, s2) {
        const set = [s0, s1, s2].filter(s => s !== 'WILD');
        if (set.length === 0) return 'WILD'; // 3 Wilds
        const target = set[0];
        const isMatch = [s0, s1, s2].every(s => s === 'WILD' || s === target);
        return isMatch ? target : null;
    }

    highlightLine(line) {
        line.coords.forEach(([r, c]) => {
            const cell = document.getElementById(`cell_${r}_${c}`);
            if (cell) cell.classList.add('win-hit');
        });
    }

    clearPaylines() {
        document.querySelectorAll('.symbol-cell').forEach(el => el.classList.remove('win-hit'));
    }

    triggerLuckyWheelBonus() {
        return new Promise(resolve => {
            if (!this.wheelModal) return resolve();
            this.wheelModal.classList.add('show');
            const spinBtn = document.getElementById('wheelSpinBtn');
            const disc = document.getElementById('wheelDisc');

            spinBtn.onclick = () => {
                spinBtn.disabled = true;
                const prizes = [20, 25, 30, 50, 100, 200, 500, 1000];
                const selectedPrize = prizes[Math.floor(Math.random() * prizes.length)];
                const randomRot = 1440 + Math.floor(Math.random() * 360);

                disc.style.transition = 'transform 3.5s cubic-bezier(0.15, 0.9, 0.25, 1)';
                disc.style.transform = `rotate(${randomRot}deg)`;

                setTimeout(() => {
                    const winAmount = selectedPrize * this.baseBet;
                    this.balance += winAmount;
                    this.winEl.innerText = '$' + winAmount.toLocaleString();
                    this.updateUI();
                    this.wheelModal.classList.remove('show');
                    this.showBigWin(winAmount);
                    spinBtn.disabled = false;
                    resolve();
                }, 4000);
            };
        });
    }

    showBigWin(amount) {
        if (!this.bigWinModal) return;
        const amtEl = document.getElementById('bigWinAmount');
        if (amtEl) amtEl.innerText = '$' + amount.toLocaleString();
        this.bigWinModal.classList.add('show');
        setTimeout(() => {
            this.bigWinModal.classList.remove('show');
        }, 3200);
    }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new FortuneGemsGame();
});
