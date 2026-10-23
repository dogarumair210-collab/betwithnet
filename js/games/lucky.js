// ============================================================
// Bet With Net - Lucky Number 777 VIP Studio Engine
// 3 Betting Modes: Lucky 7s (12x), Exact # (95x), Even/Odd (1.96x)
// High-roller CSS 3D reel cylinder animations and audio synthesis
// ============================================================

class LuckyNumberGame {
    constructor() {
        this.mode = 'lucky7'; // 'lucky7' | 'exact' | 'evenodd'
        this.choice = 'under'; // lucky7: 'under'|'lucky7'|'over' ; evenodd: 'even'|'odd'
        this.exactNumber = 7;
        this.isSpinning = false;
        this.history = [77, 14, 7, 42, 88, 3, 21, 7];
    }

    init() {
        this.updateHUD();
        this.renderHistory();
    }

    setMode(mode) {
        if (this.isSpinning) return;
        this.mode = mode;

        if (window.sound) window.sound.playClick();

        // Update tabs
        const tabs = document.querySelectorAll('.lucky-mode-tab');
        tabs.forEach((tab, idx) => {
            tab.classList.remove('active');
            if (
                (mode === 'lucky7' && idx === 0) ||
                (mode === 'exact' && idx === 1) ||
                (mode === 'evenodd' && idx === 2)
            ) {
                tab.classList.add('active');
            }
        });

        // Toggle panels
        const panelLucky7 = document.getElementById('panel-mode-lucky7');
        const panelExact = document.getElementById('panel-mode-exact');
        const panelEvenOdd = document.getElementById('panel-mode-evenodd');

        if (panelLucky7) panelLucky7.style.display = (mode === 'lucky7') ? 'block' : 'none';
        if (panelExact) panelExact.style.display = (mode === 'exact') ? 'block' : 'none';
        if (panelEvenOdd) panelEvenOdd.style.display = (mode === 'evenodd') ? 'block' : 'none';

        // Set default choice when switching modes
        if (mode === 'lucky7' && !['under', 'lucky7', 'over'].includes(this.choice)) {
            this.choice = 'lucky7';
            this.updateChoiceButtons();
        } else if (mode === 'evenodd' && !['even', 'odd'].includes(this.choice)) {
            this.choice = 'even';
            this.updateChoiceButtons();
        }

        this.updateHUD();
    }

    setChoice(choice) {
        if (this.isSpinning) return;
        this.choice = choice;
        if (window.sound) window.sound.playClick();
        this.updateChoiceButtons();
        this.updateHUD();
    }

    updateChoiceButtons() {
        // Lucky 7 choices
        const btnUnder = document.getElementById('btn-choice-under');
        const btnLucky7 = document.getElementById('btn-choice-lucky7');
        const btnOver = document.getElementById('btn-choice-over');

        if (btnUnder) btnUnder.classList.toggle('active', this.choice === 'under');
        if (btnLucky7) btnLucky7.classList.toggle('active', this.choice === 'lucky7');
        if (btnOver) btnOver.classList.toggle('active', this.choice === 'over');

        // Even / Odd choices
        const btnEven = document.getElementById('btn-choice-even');
        const btnOdd = document.getElementById('btn-choice-odd');

        if (btnEven) btnEven.classList.toggle('active', this.choice === 'even');
        if (btnOdd) btnOdd.classList.toggle('active', this.choice === 'odd');
    }

    setExactNumber(num) {
        if (this.isSpinning) return;
        let val = parseInt(num, 10);
        if (isNaN(val)) val = 7;
        val = Math.max(0, Math.min(99, val));
        this.exactNumber = val;

        const input = document.getElementById('lucky-exact-input');
        if (input && input.value != val) input.value = val;

        if (window.sound) window.sound.playChip();
        this.updateHUD();
    }

    getTargetDescription() {
        if (this.mode === 'lucky7') {
            if (this.choice === 'lucky7') return 'Lucky 7 or 77';
            if (this.choice === 'under') return 'Low (1-49)';
            if (this.choice === 'over') return 'High (50-99)';
        } else if (this.mode === 'exact') {
            return `Exact #${this.exactNumber}`;
        } else if (this.mode === 'evenodd') {
            return this.choice === 'even' ? 'Even Number' : 'Odd Number';
        }
        return 'Lucky 7';
    }

    getTargetPayout() {
        if (this.mode === 'lucky7') {
            return this.choice === 'lucky7' ? '12.00x' : '1.96x';
        } else if (this.mode === 'exact') {
            return '95.00x';
        } else if (this.mode === 'evenodd') {
            return '1.96x';
        }
        return '12.00x';
    }

    updateHUD() {
        const hudTarget = document.getElementById('lucky-hud-target');
        const hudPayout = document.getElementById('lucky-hud-payout');

        if (hudTarget) hudTarget.innerText = this.getTargetDescription();
        if (hudPayout) hudPayout.innerText = this.getTargetPayout();
    }

    renderHistory() {
        const bar = document.getElementById('lucky-history-bar');
        if (!bar) return;

        bar.innerHTML = this.history.map(num => {
            let pillClass = 'pill-med';
            if (num === 7 || num === 77) pillClass = 'pill-ultra';
            else if (num >= 70) pillClass = 'pill-high';
            else if (num < 30) pillClass = 'pill-low';

            return `<span class="history-pill ${pillClass}">${num}</span>`;
        }).join('');
    }

    roll() {
        if (this.isSpinning) return;

        const betInput = document.getElementById('lucky-bet-input');
        const bet = betInput ? parseFloat(betInput.value) : 100;

        if (isNaN(bet) || bet <= 0) {
            window.app.showToast('Please enter a valid bet amount!', 'error');
            return;
        }

        if (!window.wallet.placeBet(bet, 'Lucky Number 777')) {
            window.app.showToast('Insufficient balance for bet!', 'error');
            return;
        }

        this.isSpinning = true;

        const spinBtn = document.getElementById('lucky-spin-btn');
        if (spinBtn) spinBtn.disabled = true;

        const cylinder = document.getElementById('lucky-cylinder');
        const numberDisplay = document.getElementById('lucky-number-display');

        if (cylinder) {
            cylinder.classList.remove('won', 'lost');
            cylinder.classList.add('spinning');
        }
        if (numberDisplay) {
            numberDisplay.classList.remove('won', 'lost');
        }

        let ticks = 0;
        const maxTicks = 16;
        const interval = setInterval(() => {
            const fake = Math.floor(Math.random() * 100);
            if (numberDisplay) numberDisplay.innerText = fake;
            if (window.sound) window.sound.playCrashTick();
            ticks++;

            if (ticks >= maxTicks) {
                clearInterval(interval);
                this.finishRoll(bet);
            }
        }, 65);
    }

    finishRoll(bet) {
        // Balanced 30% win / 70% loss probability
        let roll;
        const shouldWin = (window.adminConfig && typeof window.adminConfig.shouldWin === 'function')
            ? window.adminConfig.shouldWin('lucky')
            : (Math.random() < 0.30);

        if (shouldWin) {
            if (this.mode === 'exact') roll = this.exactNumber;
            else if (this.mode === 'lucky7') {
                if (this.choice === 'lucky7') roll = Math.random() < 0.5 ? 7 : 77;
                else if (this.choice === 'under') roll = Math.floor(1 + Math.random() * 48);
                else roll = Math.floor(50 + Math.random() * 49);
            } else if (this.mode === 'evenodd') {
                roll = this.choice === 'even' ? (Math.floor(Math.random() * 49) * 2 + 2) : (Math.floor(Math.random() * 50) * 2 + 1);
            } else {
                roll = Math.floor(Math.random() * 100);
            }
        } else {
            if (this.mode === 'exact') {
                do { roll = Math.floor(Math.random() * 100); } while (roll === this.exactNumber);
            } else if (this.mode === 'lucky7') {
                if (this.choice === 'lucky7') {
                    do { roll = Math.floor(Math.random() * 100); } while (roll === 7 || roll === 77);
                } else if (this.choice === 'under') {
                    roll = Math.floor(50 + Math.random() * 50);
                } else {
                    roll = Math.floor(Math.random() * 50);
                }
            } else if (this.mode === 'evenodd') {
                roll = this.choice === 'even' ? (Math.floor(Math.random() * 50) * 2 + 1) : (Math.floor(Math.random() * 49) * 2 + 2);
            } else {
                roll = Math.floor(Math.random() * 100);
            }
        }

        const cylinder = document.getElementById('lucky-cylinder');
        const numberDisplay = document.getElementById('lucky-number-display');

        if (cylinder) cylinder.classList.remove('spinning');
        if (numberDisplay) numberDisplay.innerText = roll;

        // Evaluate win
        let won = false;
        let multiplier = 0;

        if (this.mode === 'lucky7') {
            if (this.choice === 'lucky7' && (roll === 7 || roll === 77)) {
                won = true;
                multiplier = 12.00;
            } else if (this.choice === 'under' && (roll >= 1 && roll <= 49)) {
                won = true;
                multiplier = 1.96;
            } else if (this.choice === 'over' && (roll >= 50 && roll <= 99)) {
                won = true;
                multiplier = 1.96;
            }
        } else if (this.mode === 'exact') {
            if (roll === this.exactNumber) {
                won = true;
                multiplier = 95.00;
            }
        } else if (this.mode === 'evenodd') {
            if (this.choice === 'even' && (roll % 2 === 0)) {
                won = true;
                multiplier = 1.96;
            } else if (this.choice === 'odd' && (roll % 2 !== 0)) {
                won = true;
                multiplier = 1.96;
            }
        }

        const payout = won ? (bet * multiplier) : 0;

        if (won) {
            if (cylinder) cylinder.classList.add('won');
            if (numberDisplay) numberDisplay.classList.add('won');

            if (multiplier >= 12 && window.sound) {
                window.sound.playJackpot();
            } else if (window.sound) {
                window.sound.playWin();
            }

            window.wallet.creditWin(
                bet,
                payout,
                'Lucky Number 777',
                multiplier,
                `Target: ${this.getTargetDescription()} | Rolled: #${roll}`
            );

            window.app.showToast(
                `🎉 LUCKY WIN! Rolled #${roll}! Won ${window.wallet.formatAmount(payout)} (${multiplier}x)`,
                'success'
            );
        } else {
            if (cylinder) cylinder.classList.add('lost');
            if (numberDisplay) numberDisplay.classList.add('lost');

            if (window.sound) window.sound.playLose();

            window.wallet.creditWin(
                bet,
                0,
                'Lucky Number 777',
                0,
                `Target: ${this.getTargetDescription()} | Rolled: #${roll}`
            );

            window.app.showToast(
                `Rolled #${roll}. Target was ${this.getTargetDescription()}.`,
                'error'
            );
        }

        // Update history
        this.history.unshift(roll);
        if (this.history.length > 10) this.history.pop();
        this.renderHistory();

        // Release controls
        this.isSpinning = false;
        const spinBtn = document.getElementById('lucky-spin-btn');
        if (spinBtn) spinBtn.disabled = false;
    }
}

window.luckyGame = new LuckyNumberGame();
