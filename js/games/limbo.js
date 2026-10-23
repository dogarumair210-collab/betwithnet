// ============================================================
// Bet With Net - Limbo Fast Multiplier Rocket Engine
// Target multiplier up to 10,000x, fast RNG, instant result
// ============================================================

class LimboGame {
    constructor() {
        this.target = 2.00;
        this.running = false;
    }

    init() {
        const input = document.getElementById('limbo-target-input');
        if (input) {
            input.value = this.target.toFixed(2);
            input.oninput = (e) => {
                this.target = Math.max(1.01, parseFloat(e.target.value) || 1.01);
                this.updateChance();
            };
        }
        this.updateChance();
    }

    updateChance() {
        const chance = Math.min(98, (98 / this.target)).toFixed(2);
        const chanceEl = document.getElementById('limbo-chance-text');
        if (chanceEl) chanceEl.innerText = `${chance}%`;
    }

    play(bet) {
        if (this.running) return;
        if (!window.wallet.placeBet(bet, 'Limbo')) {
            window.app.showToast('Insufficient balance for bet!', 'error');
            return;
        }

        this.running = true;
        const playBtn = document.getElementById('limbo-play-btn');
        if (playBtn) playBtn.disabled = true;

        const display = document.getElementById('limbo-result-display');
        let count = 0;
        const interval = setInterval(() => {
            const fake = (1 + Math.random() * 5).toFixed(2);
            if (display) display.innerText = `${fake}x`;
            if (window.sound) window.sound.playClick();
            count++;

            if (count > 8) {
                clearInterval(interval);
                this.finish(bet);
            }
        }, 40);
    }

    finish(bet) {
        this.running = false;
        const playBtn = document.getElementById('limbo-play-btn');
        if (playBtn) playBtn.disabled = false;

        // Controlled 6% win rate / 94% loss probability (Full kam winning)
        let willWin = false;
        if (window.adminConfig && typeof window.adminConfig.shouldWin === 'function') {
            const rawRate = (window.adminConfig.getGameWinRate ? window.adminConfig.getGameWinRate('limbo') : 6) / 100;
            willWin = Math.random() < Math.min(0.06, rawRate);
        } else {
            willWin = Math.random() < 0.06;
        }
        let generated;
        if (willWin) {
            generated = +(this.target + Math.random() * (this.target * 0.25)).toFixed(2);
        } else {
            if (this.target <= 1.25) {
                generated = 1.00;
            } else {
                generated = +(Math.max(1.00, this.target * (0.10 + Math.random() * 0.65))).toFixed(2);
                if (generated >= this.target) {
                    generated = +(this.target * 0.85).toFixed(2);
                }
            }
        }

        const display = document.getElementById('limbo-result-display');
        if (display) {
            display.innerText = `${generated.toFixed(2)}x`;
        }

        const won = generated >= this.target;
        const payout = won ? (bet * this.target) : 0;

        if (display) {
            display.style.color = won ? '#00e700' : '#ff3b30';
            setTimeout(() => display.style.color = '#ffffff', 1200);
        }

        window.wallet.creditWin(bet, payout, 'Limbo', won ? this.target : 0, `Target: ${this.target.toFixed(2)}x | Rolled: ${generated.toFixed(2)}x`);

        if (won) {
            window.app.showToast(`Limbo Target Hit! Rolled ${generated.toFixed(2)}x. Won ${window.wallet.formatAmount(payout)}`, 'success');
        } else {
            window.app.showToast(`Limbo Bust! Rolled ${generated.toFixed(2)}x (Target was ${this.target.toFixed(2)}x)`, 'error');
        }
    }
}

window.limboGame = new LimboGame();
