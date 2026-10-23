// ============================================================
// Bet With Net - Bingo 75-Ball Casino Engine
// 5x5 card, live letter-number caller (B, I, N, G, O), 35 calls, line wins
// ============================================================

class BingoGame {
    constructor() {
        this.card = []; // 5x5 numbers
        this.marked = []; // 5x5 booleans
        this.calledBalls = [];
        this.isPlaying = false;
        this.betAmount = 100;
        this.callInterval = null;
        this.maxCalls = 35;
    }

    init() {
        this.generateCard();
    }

    getLetter(num) {
        if (num <= 15) return 'B';
        if (num <= 30) return 'I';
        if (num <= 45) return 'N';
        if (num <= 60) return 'G';
        return 'O';
    }

    generateCard() {
        if (this.isPlaying) return;

        const ranges = [
            [1, 15],   // B
            [16, 30],  // I
            [31, 45],  // N
            [46, 60],  // G
            [61, 75]   // O
        ];

        this.card = [];
        this.marked = [];

        for (let r = 0; r < 5; r++) {
            this.card[r] = [];
            this.marked[r] = [];
        }

        for (let col = 0; col < 5; col++) {
            const [min, max] = ranges[col];
            const pool = [];
            for (let n = min; n <= max; n++) pool.push(n);

            for (let row = 0; row < 5; row++) {
                if (row === 2 && col === 2) {
                    this.card[row][col] = 'FREE';
                    this.marked[row][col] = true;
                } else {
                    const idx = Math.floor(Math.random() * pool.length);
                    this.card[row][col] = pool.splice(idx, 1)[0];
                    this.marked[row][col] = false;
                }
            }
        }

        this.calledBalls = [];
        this.renderCard();

        const orb = document.getElementById('bingo-caller-orb');
        if (orb) orb.innerText = '--';

        const track = document.getElementById('bingo-calls-track');
        if (track) track.innerHTML = '';

        const countEl = document.getElementById('bingo-calls-count');
        if (countEl) countEl.innerText = '0';

        const linesEl = document.getElementById('bingo-lines-count');
        if (linesEl) linesEl.innerText = '0 Lines Completed';

        this.updatePrizeStrip(0);
    }

    renderCard(winningLines = []) {
        const board = document.getElementById('bingo-card-grid');
        if (!board) return;
        board.innerHTML = '';

        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5; c++) {
                const val = this.card[r][c];
                const isMarked = this.marked[r][c];
                const isFree = val === 'FREE';

                const cell = document.createElement('div');
                cell.className = 'bingo-cell';
                if (isFree) cell.classList.add('free');
                else if (isMarked) cell.classList.add('marked');

                // Check if part of winning pattern
                if (winningLines.some(line => line.some(([lr, lc]) => lr === r && lc === c))) {
                    cell.classList.add('winning-line');
                }

                cell.innerText = val;
                cell.onclick = () => this.toggleMark(r, c);
                board.appendChild(cell);
            }
        }
    }

    toggleMark(r, c) {
        if (!this.isPlaying) return;
        const val = this.card[r][c];
        if (val === 'FREE') return;

        if (this.calledBalls.includes(val)) {
            this.marked[r][c] = !this.marked[r][c];
            if (window.sound) window.sound.playClick();
            const { count, lines } = this.checkPatterns();
            this.renderCard(lines);
            this.updatePrizeStrip(count);
        }
    }

    startRound(bet) {
        if (this.isPlaying) return;
        this.betAmount = bet;

        if (!window.wallet.placeBet(this.betAmount, 'Bingo 75-Ball')) {
            this.toast('Insufficient balance for bet!', 'error');
            return;
        }

        this.isPlaying = true;
        this.calledBalls = [];
        this.generateCard();

        const btn = document.getElementById('bingo-start-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>CALLING BALLS...</span> <span class="spinner">⏳</span>';
        }

        const shuffleBtn = document.getElementById('bingo-new-card-btn');
        if (shuffleBtn) shuffleBtn.disabled = true;

        const orb = document.getElementById('bingo-caller-orb');
        const title = document.getElementById('bingo-caller-title');
        const sub = document.getElementById('bingo-caller-sub');
        const track = document.getElementById('bingo-calls-track');
        const countEl = document.getElementById('bingo-calls-count');

        if (title) title.innerText = 'Live Ball Caller Active';

        // 75 balls pool
        const pool = [];
        for (let i = 1; i <= 75; i++) pool.push(i);

        let callsCount = 0;

        this.callInterval = setInterval(() => {
            const idx = Math.floor(Math.random() * pool.length);
            const ball = pool.splice(idx, 1)[0];
            const letter = this.getLetter(ball);
            this.calledBalls.push(ball);
            callsCount++;

            if (orb) {
                orb.innerText = `${letter}${ball}`;
                orb.className = 'bingo-ball-orb calling';
                setTimeout(() => { if (orb) orb.className = 'bingo-ball-orb'; }, 200);
            }

            if (countEl) countEl.innerText = callsCount;
            if (sub) sub.innerText = `Call #${callsCount}: ${letter}-${ball} | ${this.maxCalls - callsCount} calls remaining`;

            let hasMatched = false;
            // Auto-mark matched ball on card
            for (let r = 0; r < 5; r++) {
                for (let c = 0; c < 5; c++) {
                    if (this.card[r][c] === ball) {
                        this.marked[r][c] = true;
                        hasMatched = true;
                    }
                }
            }

            if (track) {
                const mini = document.createElement('div');
                mini.className = `bingo-mini-ball ${hasMatched ? 'matched' : ''}`;
                mini.innerText = ball;
                track.insertBefore(mini, track.firstChild);
            }

            if (window.sound) {
                if (hasMatched) window.sound.playWin();
                else window.sound.playClick();
            }

            const { count, lines } = this.checkPatterns();
            this.renderCard(lines);
            this.updatePrizeStrip(count);

            const linesEl = document.getElementById('bingo-lines-count');
            if (linesEl) linesEl.innerText = `${count} Lines Completed`;

            if (callsCount >= this.maxCalls || count >= 5) {
                clearInterval(this.callInterval);
                this.finishRound();
            }
        }, 340);
    }

    checkPatterns() {
        const lines = [];

        // Check 5 rows
        for (let r = 0; r < 5; r++) {
            if (this.marked[r].every(v => v)) {
                lines.push([[r,0], [r,1], [r,2], [r,3], [r,4]]);
            }
        }

        // Check 5 columns
        for (let c = 0; c < 5; c++) {
            if ([0, 1, 2, 3, 4].every(r => this.marked[r][c])) {
                lines.push([[0,c], [1,c], [2,c], [3,c], [4,c]]);
            }
        }

        // Main diagonal
        if ([0, 1, 2, 3, 4].every(i => this.marked[i][i])) {
            lines.push([[0,0], [1,1], [2,2], [3,3], [4,4]]);
        }

        // Anti diagonal
        if ([0, 1, 2, 3, 4].every(i => this.marked[i][4 - i])) {
            lines.push([[0,4], [1,3], [2,2], [3,1], [4,0]]);
        }

        return { count: lines.length, lines };
    }

    updatePrizeStrip(completedLines) {
        for (let i = 1; i <= 5; i++) {
            const pill = document.getElementById(`prize-line-${i}`);
            if (pill) {
                if (completedLines >= i) pill.classList.add('active');
                else pill.classList.remove('active');
            }
        }
    }

    finishRound() {
        this.isPlaying = false;
        const btn = document.getElementById('bingo-start-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>BUY TICKET & START BINGO</span> <span>🎫</span>';
        }

        const shuffleBtn = document.getElementById('bingo-new-card-btn');
        if (shuffleBtn) shuffleBtn.disabled = false;

        const { count, lines } = this.checkPatterns();
        let mult = 0;
        if (count >= 5) mult = 50;
        else if (count >= 4) mult = 30;
        else if (count >= 3) mult = 15;
        else if (count >= 2) mult = 5;
        else if (count === 1) mult = 2;

        const payout = this.betAmount * mult;
        window.wallet.creditWin(this.betAmount, payout, 'Bingo 75-Ball', mult, `${count} Lines Completed`);
        this.renderCard(lines);
        this.updatePrizeStrip(count);

        const title = document.getElementById('bingo-caller-title');
        const sub = document.getElementById('bingo-caller-sub');

        if (mult > 0) {
            if (title) title.innerHTML = `<span style="color:#00e700;">🎉 BINGO! ${count} LINES!</span>`;
            if (sub) sub.innerText = `Won ${window.wallet.formatAmount(payout)} (${mult}x Multiplier)`;
            if (window.sound) {
                if (mult >= 15) window.sound.playJackpot();
                else window.sound.playWin();
            }
            this.toast(`BINGO! ${count} Lines Completed! Won ${window.wallet.formatAmount(payout)} (${mult}x)`, 'success');
        } else {
            if (title) title.innerText = 'Round Complete';
            if (sub) sub.innerText = `Matched ${count} lines. No payout this ticket.`;
            if (window.sound) window.sound.playLose();
            this.toast('Bingo: No complete lines this ticket.', 'error');
        }
    }

    toast(msg, type = 'info') {
        if (window.core && window.core.showToast) {
            window.core.showToast(msg, type);
        } else if (window.app && window.app.showToast) {
            window.app.showToast(msg, type);
        }
    }
}

window.bingoGame = new BingoGame();
