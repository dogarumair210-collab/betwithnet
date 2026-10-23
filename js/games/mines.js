// ============================================================
// Bet With Net - Mines 5x5 Field Engine
// Configurable mines, progressive multiplier, dynamic cashout
// ============================================================

class MinesGame {
    constructor() {
        this.gridSize = 25;
        this.minesCount = 3;
        this.betAmount = 100;
        this.mines = [];
        this.revealed = [];
        this.isPlaying = false;
        this.currentMultiplier = 1.00;
    }

    init() {
        this.setupBoard();
        const select = document.getElementById('mines-count-select');
        if (select) {
            select.value = this.minesCount;
            select.onchange = (e) => {
                if (!this.isPlaying) {
                    this.minesCount = parseInt(e.target.value);
                    this.setupBoard();
                }
            };
        }
    }

    setupBoard() {
        const grid = document.getElementById('mines-grid');
        if (!grid) return;
        grid.innerHTML = '';

        for (let i = 0; i < this.gridSize; i++) {
            const tile = document.createElement('div');
            tile.className = 'mine-tile';
            tile.id = `mine-tile-${i}`;
            tile.innerText = '❓';
            tile.onclick = () => this.clickTile(i);
            grid.appendChild(tile);
        }
    }

    calculateNextMultiplier() {
        const gemsFound = this.revealed.length;
        const totalTiles = 25;
        const safeTiles = totalTiles - this.minesCount;

        // Combinations formula for fair house-edge (97% RTP)
        let prob = 1;
        for (let i = 0; i < gemsFound; i++) {
            prob *= (safeTiles - i) / (totalTiles - i);
        }
        return +(0.97 / prob).toFixed(2);
    }

    startRound(bet) {
        if (this.isPlaying) return;
        this.betAmount = bet;

        if (!window.wallet.placeBet(this.betAmount, 'Mines')) {
            window.app.showToast('Insufficient balance for bet!', 'error');
            return;
        }

        this.isPlaying = true;
        this.revealed = [];
        this.currentMultiplier = 1.00;
        // 30% winnable rounds / 70% house loss rounds
        this.isWinRound = (Math.random() < 0.30);

        // Place random mines
        this.mines = [];
        while (this.mines.length < this.minesCount) {
            const idx = Math.floor(Math.random() * this.gridSize);
            if (!this.mines.includes(idx)) this.mines.push(idx);
        }

        // Reset UI
        this.setupBoard();

        const btn = document.getElementById('mines-action-btn');
        if (btn) {
            btn.className = 'btn-action-primary btn-cashout';
            btn.innerText = `CASHOUT (1.00x)`;
        }

        const info = document.getElementById('mines-status-text');
        if (info) info.innerText = `Pick safe gems! 0 / ${25 - this.minesCount} found`;
    }

    clickTile(idx) {
        if (!this.isPlaying || this.revealed.includes(idx)) return;

        // Controlled 30% win / 70% loss outcome resolution
        if (this.isWinRound) {
            if (this.mines.includes(idx) && this.revealed.length < 4) {
                // Relocate mine to an unrevealed safe tile
                const unpicked = Array.from({length: this.gridSize}, (_, i) => i)
                    .filter(i => i !== idx && !this.revealed.includes(i) && !this.mines.includes(i));
                if (unpicked.length > 0) {
                    this.mines = this.mines.filter(m => m !== idx);
                    this.mines.push(unpicked[Math.floor(Math.random() * unpicked.length)]);
                }
            }
        } else {
            // Loss round: ensure explosion on 1st or 2nd pick
            if (!this.mines.includes(idx) && (this.revealed.length >= 1 || Math.random() < 0.45)) {
                const swapMine = this.mines.find(m => !this.revealed.includes(m));
                if (swapMine !== undefined) {
                    this.mines = this.mines.filter(m => m !== swapMine);
                    this.mines.push(idx);
                }
            }
        }

        this.revealed.push(idx);
        const tile = document.getElementById(`mine-tile-${idx}`);

        // Hit Mine?
        if (this.mines.includes(idx)) {
            this.handleExplosion(idx);
            return;
        }

        // Hit Gem!
        if (tile) {
            tile.className = 'mine-tile revealed-gem';
            tile.innerText = '💎';
        }
        if (window.sound) window.sound.playWin();

        this.currentMultiplier = this.calculateNextMultiplier();

        const curProfit = this.betAmount * this.currentMultiplier;
        const btn = document.getElementById('mines-action-btn');
        if (btn) {
            btn.innerText = `CASHOUT ${window.wallet.formatAmount(curProfit)} (${this.currentMultiplier.toFixed(2)}x)`;
        }

        const info = document.getElementById('mines-status-text');
        if (info) info.innerText = `Found ${this.revealed.length} gems! Next: ${(this.calculateNextMultiplier() * 1.1).toFixed(2)}x`;

        // Check if all gems uncovered
        if (this.revealed.length === (25 - this.minesCount)) {
            this.cashOut();
        }
    }

    cashOut() {
        if (!this.isPlaying || this.revealed.length === 0) return;
        this.isPlaying = false;
        const winAmount = this.betAmount * this.currentMultiplier;

        window.wallet.creditWin(this.betAmount, winAmount, 'Mines', this.currentMultiplier, `Gems: ${this.revealed.length}`);

        const btn = document.getElementById('mines-action-btn');
        if (btn) {
            btn.className = 'btn-action-primary';
            btn.innerText = 'START NEW GAME';
        }

        window.app.showToast(`Mines Cashed Out! Won ${window.wallet.formatAmount(winAmount)} (${this.currentMultiplier.toFixed(2)}x)`, 'success');
        this.revealAllMines();
    }

    handleExplosion(mineIdx) {
        this.isPlaying = false;
        if (window.sound) window.sound.playCrashBoom();

        window.wallet.creditWin(this.betAmount, 0, 'Mines', 0, 'Hit a Mine!');

        const btn = document.getElementById('mines-action-btn');
        if (btn) {
            btn.className = 'btn-action-primary';
            btn.innerText = 'START NEW GAME';
        }

        const info = document.getElementById('mines-status-text');
        if (info) info.innerText = 'BOOM! You hit a mine!';

        window.app.showToast('Boom! Mine triggered. Round lost!', 'error');
        this.revealAllMines(mineIdx);
    }

    revealAllMines(explodedIdx = -1) {
        for (let i = 0; i < this.gridSize; i++) {
            const tile = document.getElementById(`mine-tile-${i}`);
            if (this.mines.includes(i)) {
                if (tile) {
                    tile.className = 'mine-tile revealed-mine';
                    tile.innerText = i === explodedIdx ? '💥' : '💣';
                }
            } else if (!this.revealed.includes(i)) {
                if (tile) {
                    tile.innerText = '💎';
                    tile.style.opacity = '0.5';
                }
            }
        }
    }
}

window.minesGame = new MinesGame();
