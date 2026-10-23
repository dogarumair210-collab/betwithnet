// Lucky 88 Pearls Chinese Lottery Engine
class Lucky88Game {
    constructor() {
        this.selectedNumbers = [];
        this.betAmount = 100;
        this.isPlaying = false;
        this.drawnNumbers = [];
    }
    init() { this.renderGrid(); }
    renderGrid() {
        const grid = document.getElementById('l88-grid');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 1; i <= 88; i++) {
            const btn = document.createElement('div');
            btn.className = 'l88-bead';
            btn.innerText = i;
            btn.onclick = () => this.toggleNumber(i, btn);
            grid.appendChild(btn);
        }
    }
    toggleNumber(num, el) {
        if (this.isPlaying) return;
        const idx = this.selectedNumbers.indexOf(num);
        if (idx > -1) {
            this.selectedNumbers.splice(idx, 1);
            el.classList.remove('selected');
        } else {
            if (this.selectedNumbers.length >= 6) {
                if (window.core && window.core.showToast) window.core.showToast('Maximum 6 lucky numbers allowed!', 'warning');
                return;
            }
            this.selectedNumbers.push(num);
            el.classList.add('selected');
            if (window.sound && window.sound.playChip) window.sound.playChip();
        }
        document.getElementById('l88-selected-count').innerText = this.selectedNumbers.length;
    }
    quickPick() {
        if (this.isPlaying) return;
        this.selectedNumbers = [];
        document.querySelectorAll('.l88-bead').forEach(b => b.classList.remove('selected'));
        while (this.selectedNumbers.length < 5) {
            const r = Math.floor(Math.random() * 88) + 1;
            if (!this.selectedNumbers.includes(r)) this.selectedNumbers.push(r);
        }
        document.querySelectorAll('.l88-bead').forEach(b => {
            if (this.selectedNumbers.includes(parseInt(b.innerText))) b.classList.add('selected');
        });
        document.getElementById('l88-selected-count').innerText = 5;
    }
    async startDraw() {
        if (this.isPlaying) return;
        if (this.selectedNumbers.length === 0) {
            if (window.core && window.core.showToast) window.core.showToast('Please select at least 1 number!', 'warning');
            return;
        }
        const bet = parseFloat(document.getElementById('l88-bet-input').value) || 100;
        if (!window.wallet.placeBet(bet, 'Lucky 88 Pearls')) return;

        this.isPlaying = true;
        this.betAmount = bet;
        document.getElementById('l88-draw-btn').disabled = true;
        document.getElementById('l88-drawn-row').innerHTML = '';
        document.getElementById('l88-status-text').innerHTML = '<span style="color:#ffd700;">Imperial Sphere Spinning...</span>';

        this.drawnNumbers = [];
        while (this.drawnNumbers.length < 8) {
            const r = Math.floor(Math.random() * 88) + 1;
            if (!this.drawnNumbers.includes(r)) this.drawnNumbers.push(r);
        }

        const drawnRow = document.getElementById('l88-drawn-row');
        let matches = 0;

        for (let i = 0; i < 8; i++) {
            await new Promise(res => setTimeout(res, 300));
            const val = this.drawnNumbers[i];
            const bead = document.createElement('div');
            const hit = this.selectedNumbers.includes(val);
            if (hit) matches++;
            bead.className = 'drawn-bead ' + (hit ? 'hit' : '');
            bead.innerText = val;
            drawnRow.appendChild(bead);
            if (window.sound && window.sound.playChip) window.sound.playChip();
        }

        // Payout table based on hits
        const payTable = { 0: 0, 1: 1.8, 2: 4.5, 3: 18.0, 4: 88.0, 5: 388.0, 6: 888.0 };
        const mult = payTable[matches] || 0;
        const statusEl = document.getElementById('l88-status-text');

        if (mult > 0) {
            const payout = bet * mult;
            window.wallet.creditWin(bet, payout, 'Lucky 88 Pearls', mult, `Matched ${matches} of ${this.selectedNumbers.length} beads`);
            statusEl.innerHTML = `<span style="color:#00e700;">MATCHED ${matches} PEARLS! (${mult}x) +${window.wallet.formatAmount(payout)}</span>`;
            if (window.sound && window.sound.playWin) window.sound.playWin();
        } else {
            window.wallet.creditWin(bet, 0, 'Lucky 88 Pearls', 0, `Matched ${matches} beads`);
            statusEl.innerHTML = `<span style="color:#ff3b30;">NO WINNING COMBINATION (${matches} HITS)</span>`;
            if (window.sound && window.sound.playLoss) window.sound.playLoss();
        }

        this.isPlaying = false;
        document.getElementById('l88-draw-btn').disabled = false;
        if (window.core && window.core.updateAllBalances) window.core.updateAllBalances();
    }
}
window.lucky88Game = new Lucky88Game();
