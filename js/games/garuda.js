/**
 * ============================================================
 * FORTUNE GARUDA 500 - JILI Authentic 1:1 Slot Game Engine
 * Bet With Net VIP Casino
 * 3 Reels x 3 Rows + 4th Special Multiplier Wheel Reel (1x-500x)
 * ============================================================
 */

class FortuneGarudaGame {
    constructor() {
        this.betSteps = [3, 6, 9, 15, 30, 60, 150, 300, 600, 1500];
        this.currentBetIndex = 0; // Default Bet 3 as in reference video
        this.betAmount = this.betSteps[this.currentBetIndex];

        this.spinning = false;
        this.turbo = false;
        this.autoPlay = false;
        this.soundEnabled = true;

        // 3x3 Symbols
        this.symbols = [
            { id: 'sym_wild', name: 'Garuda Wild', img: '../assets/games/garuda/tile_wild_3d.png', pay: 50, weight: 3 },
            { id: 'sym_ruby', name: 'Ruby', img: '../assets/games/garuda/tile_ruby.png', pay: 20, weight: 6 },
            { id: 'sym_sapphire', name: 'Sapphire', img: '../assets/games/garuda/tile_sapphire.png', pay: 15, weight: 8 },
            { id: 'sym_emerald', name: 'Emerald', img: '../assets/games/garuda/tile_emerald.png', pay: 10, weight: 10 },
            { id: 'sym_a', name: 'Ace', img: '../assets/games/garuda/sym_a.png', pay: 5, weight: 14 },
            { id: 'sym_k', name: 'King', img: '../assets/games/garuda/sym_k.png', pay: 3, weight: 16 },
            { id: 'sym_q', name: 'Queen', img: '../assets/games/garuda/sym_q.png', pay: 2, weight: 18 },
            { id: 'sym_j', name: 'Jack', img: '../assets/games/garuda/sym_j.png', pay: 1, weight: 20 }
        ];

        this.symbolMap = {};
        this.symbols.forEach(s => { this.symbolMap[s.id] = s; });

        // Extra Bet State & Multipliers List
        this.extraBet = false;
        this.baseMultipliers = [1, 2, 3, 5, 10, 15, 20, 50, 100, 500];
        this.extraBetMultipliers = [5, 10, 15, 20, 50, 100, 500];
        this.multipliers = this.baseMultipliers;

        // 5 Classic Paylines
        this.paylines = [
            { id: 1, slots: [1, 1, 1], name: 'Center' },
            { id: 2, slots: [0, 0, 0], name: 'Top' },
            { id: 3, slots: [2, 2, 2], name: 'Bottom' },
            { id: 4, slots: [0, 1, 2], name: 'Diagonal 1' },
            { id: 5, slots: [2, 1, 0], name: 'Diagonal 2' }
        ];

        // Initial Grid (3 cols x 3 rows)
        this.currentGrid = [
            ['sym_wild', 'sym_ruby', 'sym_a'],
            ['sym_ruby', 'sym_emerald', 'sym_k'],
            ['sym_sapphire', 'sym_q', 'sym_j']
        ];

        // 4th Reel Initial State (3 cells)
        this.currentMults = [3, 20, 100];
        this.activeMultiplier = 1;

        // Audio
        this.audioCtx = null;
        try {
            this.sfxGaruda = new Audio('../assets/games/garuda/garuda_sfx.mp3');
        } catch(e) {}
    }

    init() {
        this.renderGrid();
        this.renderMultiplierReel();
        this.updateBetDisplay();
        this.updateBalanceDisplay();
        this.initCanvas();

        window.addEventListener('resize', () => this.resizeCanvas());

        // Wallet Event Listeners
        if (window.wallet && typeof window.wallet.on === 'function') {
            window.wallet.on('change', () => this.updateBalanceDisplay());
            window.wallet.on('balanceChange', () => this.updateBalanceDisplay());
        }
        window.addEventListener('storage', () => this.updateBalanceDisplay());
    }

    /* ----------------------------------------------------
       Audio Synthesizer & Effects
       ---------------------------------------------------- */
    initAudio() {
        if (!this.audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }
    }

    playTone(freq, type, duration, vol = 0.2) {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + duration);
        } catch(e) {}
    }

    playSpinSound() {
        this.playTone(320, 'sine', 0.1, 0.25);
        if (this.sfxGaruda) {
            this.sfxGaruda.currentTime = 0;
            this.sfxGaruda.play().catch(() => {});
        }
    }

    playWinFanfare() {
        if (!this.soundEnabled || !this.audioCtx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((f, idx) => {
            setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.3), idx * 80);
        });
    }

    /* ----------------------------------------------------
       Intro Splash & Video Transition
       ---------------------------------------------------- */
    startIntroFlow() {
        this.initAudio();
        const splashView = document.getElementById('fgSplashView');
        const videoWrap = document.getElementById('fgIntroVideoWrap');
        const video = document.getElementById('fgIntroVideo');
        const guardianVideo = document.getElementById('fgGuardianVideo');

        if (splashView) splashView.style.display = 'none';
        if (videoWrap) videoWrap.style.display = 'block';

        if (video) {
            video.currentTime = 0;
            video.play().catch(() => {
                // If autoplay blocked, skip directly
                this.completeIntro();
            });

            video.onended = () => {
                this.completeIntro();
            };
        } else {
            this.completeIntro();
        }

        // Loop guardian video in background ready for reveal
        if (guardianVideo) {
            guardianVideo.play().catch(() => {});
        }
    }

    completeIntro() {
        const overlay = document.getElementById('fgIntroOverlay');
        const guardianVideo = document.getElementById('fgGuardianVideo');

        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        }

        if (guardianVideo) {
            guardianVideo.play().catch(() => {});
        }
    }

    /* ----------------------------------------------------
       Rendering Reels & Multipliers
       ---------------------------------------------------- */
    renderGrid() {
        for (let col = 0; col < 3; col++) {
            const colEl = document.getElementById(`fgCol_${col}`);
            if (!colEl) continue;
            colEl.innerHTML = '';
            for (let row = 0; row < 3; row++) {
                const symId = this.currentGrid[col][row];
                const sym = this.symbolMap[symId] || this.symbols[0];
                const cell = document.createElement('div');
                cell.className = 'fg-symbol-cell';
                cell.id = `fgCell_${col}_${row}`;
                cell.innerHTML = `<img src="${sym.img}" alt="${sym.name}">`;
                colEl.appendChild(cell);
            }
        }
    }

    renderMultiplierReel(activeRow = 1) {
        const multWrap = document.getElementById('fgMultReel');
        if (!multWrap) return;
        multWrap.innerHTML = '';
        for (let r = 0; r < 3; r++) {
            const m = this.currentMults[r];
            const cell = document.createElement('div');
            cell.className = 'fg-mult-cell';
            const badge = document.createElement('div');
            badge.className = `fg-mult-badge ${r === activeRow ? 'active-win' : ''}`;
            badge.textContent = `${m}x`;
            cell.appendChild(badge);
            multWrap.appendChild(cell);
        }
    }

    /* ----------------------------------------------------
       Spin & Outcome Evaluation
       ---------------------------------------------------- */
    changeBet(delta) {
        if (this.spinning) return;
        this.currentBetIndex += delta;
        if (this.currentBetIndex < 0) this.currentBetIndex = this.betSteps.length - 1;
        if (this.currentBetIndex >= this.betSteps.length) this.currentBetIndex = 0;
        this.betAmount = this.betSteps[this.currentBetIndex];
        this.updateBetDisplay();
        this.playTone(400, 'sine', 0.05, 0.15);
    }

    toggleExtraBet() {
        if (this.spinning) return;
        this.extraBet = !this.extraBet;
        const btn = document.getElementById('fgExtraBetBtn');
        const st = document.getElementById('fgExtraBetStatus');
        if (btn) btn.classList.toggle('active', this.extraBet);
        if (st) st.textContent = this.extraBet ? 'ON' : 'OFF';
        this.multipliers = this.extraBet ? this.extraBetMultipliers : this.baseMultipliers;
        this.updateBetDisplay();
        this.playTone(550, 'triangle', 0.12, 0.25);
    }

    updateBetDisplay() {
        const el = document.getElementById('fgBetVal');
        const total = this.extraBet ? this.betAmount * 1.5 : this.betAmount;
        if (el) el.textContent = `PKR ${total.toFixed(2)}`;
    }

    updateBalanceDisplay() {
        try {
            const w = (window.parent && window.parent.wallet) || window.wallet;
            let bal = 2000;
            if (w && typeof w.getBalance === 'function') {
                bal = w.getBalance();
            }
            const el = document.getElementById('fgBalanceVal');
            if (el) el.textContent = `PKR ${Number(bal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } catch(e) {}
    }

    toggleTurbo() {
        this.turbo = !this.turbo;
        const btn = document.getElementById('fgTurboBtn');
        if (btn) btn.classList.toggle('active', this.turbo);
    }

    toggleAuto() {
        this.autoPlay = !this.autoPlay;
        const btn = document.getElementById('fgAutoBtn');
        if (btn) btn.classList.toggle('active', this.autoPlay);
        if (this.autoPlay && !this.spinning) {
            this.spin();
        }
    }

    async spin() {
        if (this.spinning) return;

        const activeBet = this.extraBet ? this.betAmount * 1.5 : this.betAmount;

        // Check wallet balance
        const w = (window.parent && window.parent.wallet) || window.wallet;
        if (w && typeof w.hasBalance === 'function' && !w.hasBalance(activeBet)) {
            alert('Insufficient Balance! Please deposit funds to continue.');
            this.autoPlay = false;
            const btn = document.getElementById('fgAutoBtn');
            if (btn) btn.classList.remove('active');
            return;
        }

        // Deduct Bet from Wallet
        if (w && typeof w.deductBet === 'function') {
            w.deductBet(activeBet, 'Fortune Garuda 500');
            this.updateBalanceDisplay();
            if (window.parent && window.parent.syncWallet) window.parent.syncWallet();
        }

        this.spinning = true;
        this.clearPaylines();
        this.playSpinSound();

        const spinBtn = document.getElementById('fgSpinBtn');
        if (spinBtn) spinBtn.classList.add('spinning');

        // Reset win display
        const winEl = document.getElementById('fgWinVal');
        if (winEl) winEl.textContent = '0.00';

        // Check Gift of Garuda random trigger (~12% chance)
        const isGift = Math.random() < 0.12;
        if (isGift) {
            this.triggerGiftOfGaruda();
        }

        // Animate spin blur
        const spinDuration = this.turbo ? 600 : 1200;

        // Generate Random Outcome
        const newGrid = [];
        for (let c = 0; c < 3; c++) {
            newGrid[c] = [];
            for (let r = 0; r < 3; r++) {
                newGrid[c][r] = isGift && Math.random() < 0.4 ? 'sym_wild' : this.getRandomSymbolId();
            }
        }

        // Pick 4th reel multipliers
        const multPool = isGift ? [50, 100, 500] : this.multipliers;
        const pickedMults = [
            multPool[Math.floor(Math.random() * multPool.length)],
            multPool[Math.floor(Math.random() * multPool.length)],
            multPool[Math.floor(Math.random() * multPool.length)]
        ];

        // Animate Reel Spinning
        await new Promise(r => setTimeout(r, spinDuration));

        this.currentGrid = newGrid;
        this.currentMults = pickedMults;
        this.renderGrid();
        this.renderMultiplierReel(1);

        // Evaluate Wins
        const winResult = this.evaluateWin(newGrid, pickedMults[1], activeBet);

        if (winResult.totalWin > 0) {
            if (winEl) winEl.textContent = `PKR ${winResult.totalWin.toFixed(2)}`;
            this.playWinFanfare();

            // Highlight Winning Cells & Paylines
            this.highlightWins(winResult.winningLines);

            // Credit Win to Wallet
            if (w && typeof w.creditWin === 'function') {
                const multRatio = (winResult.totalWin / activeBet).toFixed(1);
                w.creditWin(activeBet, winResult.totalWin, 'Fortune Garuda 500', multRatio, 'Spin Win');
                this.updateBalanceDisplay();
                if (window.parent && window.parent.syncWallet) window.parent.syncWallet();
            }

            // Big Win Celebration Trigger
            const ratio = winResult.totalWin / activeBet;
            if (ratio >= 15) {
                let winType = 'BIG WIN';
                if (ratio >= 100) winType = 'GARUDA 500X WIN';
                else if (ratio >= 50) winType = 'SUPER WIN';
                else if (ratio >= 25) winType = 'MEGA WIN';
                this.showCelebration(winType, `${pickedMults[1]}X MULTIPLIER`, winResult.totalWin);
            }
        }

        if (spinBtn) spinBtn.classList.remove('spinning');
        this.spinning = false;

        // Autoplay Loop
        if (this.autoPlay) {
            setTimeout(() => {
                if (this.autoPlay) this.spin();
            }, this.turbo ? 400 : 1000);
        }
    }

    triggerGiftOfGaruda() {
        const banner = document.getElementById('fgBlessingBanner');
        if (banner) {
            banner.classList.add('active');
            setTimeout(() => banner.classList.remove('active'), 1800);
        }
        this.playTone(880, 'sawtooth', 0.35, 0.3);
    }

    showCelebration(type, multText, amount) {
        const modal = document.getElementById('fgCelebrationModal');
        const typeEl = document.getElementById('fgCelebrationType');
        const multEl = document.getElementById('fgCelebrationMult');
        const amtEl = document.getElementById('fgCelebrationAmount');
        if (!modal) return;
        if (typeEl) typeEl.textContent = type;
        if (multEl) multEl.textContent = multText;
        if (amtEl) amtEl.textContent = `PKR ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        modal.classList.add('active');
        this.playTone(600, 'sine', 0.5, 0.4);
    }

    closeCelebration() {
        const modal = document.getElementById('fgCelebrationModal');
        if (modal) modal.classList.remove('active');
    }

    getRandomSymbolId() {
        const rand = Math.random() * 100;
        let cumulative = 0;
        for (const sym of this.symbols) {
            cumulative += sym.weight;
            if (rand <= cumulative) return sym.id;
        }
        return this.symbols[0].id;
    }

    evaluateWin(grid, multiplier, currentBet = this.betAmount) {
        let totalWin = 0;
        const winningLines = [];

        for (const line of this.paylines) {
            const sym0 = grid[0][line.slots[0]];
            const sym1 = grid[1][line.slots[1]];
            const sym2 = grid[2][line.slots[2]];

            // Check if all 3 match or match with Wild
            const target = sym0 === 'sym_wild' ? (sym1 === 'sym_wild' ? sym2 : sym1) : sym0;
            const match0 = (sym0 === target || sym0 === 'sym_wild');
            const match1 = (sym1 === target || sym1 === 'sym_wild');
            const match2 = (sym2 === target || sym2 === 'sym_wild');

            if (match0 && match1 && match2) {
                const symObj = this.symbolMap[target] || this.symbols[0];
                const basePay = (currentBet / 5) * symObj.pay;
                const finalPay = basePay * multiplier;
                totalWin += finalPay;
                winningLines.push({
                    lineId: line.id,
                    slots: line.slots,
                    payout: finalPay,
                    symbol: symObj.name
                });
            }
        }

        return { totalWin, winningLines };
    }

    highlightWins(lines) {
        lines.forEach(l => {
            for (let c = 0; c < 3; c++) {
                const cell = document.getElementById(`fgCell_${c}_${l.slots[c]}`);
                if (cell) cell.classList.add('winning');
            }
        });
        this.drawPaylines(lines);
    }

    clearPaylines() {
        document.querySelectorAll('.fg-symbol-cell').forEach(c => c.classList.remove('winning'));
        const canvas = document.getElementById('fgPaylineCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    initCanvas() {
        const canvas = document.getElementById('fgPaylineCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    resizeCanvas() {
        this.initCanvas();
    }

    drawPaylines(lines) {
        const canvas = document.getElementById('fgPaylineCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const colors = ['#ffd700', '#ff3333', '#00e5ff', '#00e676', '#ff00ff'];

        lines.forEach((l, idx) => {
            ctx.strokeStyle = colors[idx % colors.length];
            ctx.lineWidth = 4;
            ctx.shadowColor = colors[idx % colors.length];
            ctx.shadowBlur = 10;
            ctx.beginPath();

            for (let c = 0; c < 3; c++) {
                const cell = document.getElementById(`fgCell_${c}_${l.slots[c]}`);
                if (cell) {
                    const rect = cell.getBoundingClientRect();
                    const canvasRect = canvas.getBoundingClientRect();
                    const x = rect.left - canvasRect.left + rect.width / 2;
                    const y = rect.top - canvasRect.top + rect.height / 2;
                    if (c === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        });
    }
}
