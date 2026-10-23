/**
 * Bet With Net - Aztec Sun Wheel Slot & Wheel Bonus Game Engine
 * High Performance 60 FPS GPU-Accelerated Engine (Instant Load & Silky Smooth Spin)
 */

class SlotAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmStarted = false;
        try {
            this.audioSlotSpin = new Audio('../assets/games/wheel/audio/slot_spin.mp3');
            this.audioWheelSpin = new Audio('../assets/games/wheel/audio/wheel_spin.mp3');
            this.audioReelStop = new Audio('../assets/games/wheel/audio/reel_stop.mp3');
            this.audioTick = new Audio('../assets/games/wheel/audio/wheel_tick.mp3');
            this.audioWin = new Audio('../assets/games/wheel/audio/win.mp3');

            // Find existing DOM audio element or create new Audio
            const domAudio = document.getElementById('fruityBgmAudio');
            this.audioBgm = domAudio || new Audio('../assets/games/wheel/audio/fruity_bgm.mp3');

            if (this.audioSlotSpin) { this.audioSlotSpin.volume = 0.32; this.audioSlotSpin.load(); }
            if (this.audioWheelSpin) { this.audioWheelSpin.volume = 0.55; this.audioWheelSpin.load(); }
            if (this.audioReelStop) { this.audioReelStop.volume = 0.35; this.audioReelStop.load(); }
            if (this.audioTick) { this.audioTick.volume = 0.45; this.audioTick.load(); }
            if (this.audioWin) { this.audioWin.volume = 0.65; this.audioWin.load(); }
            if (this.audioBgm) {
                this.audioBgm.volume = 0.40;
                this.audioBgm.loop = true;
                this.audioBgm.preload = 'auto';
            }

            // Attempt immediate autoplay without touch
            this.setupAutoplayWithoutTouch();
        } catch (e) {
            console.warn('Audio FX preload warning:', e);
        }
    }

    setupAutoplayWithoutTouch() {
        const attemptPlay = () => {
            if (this.isMuted || this.bgmStarted || !this.audioBgm) return;
            const p = this.audioBgm.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    this.bgmStarted = true;
                    cleanup();
                }).catch(() => {
                    // Browser policy restricted unmuted play; listen on ambient non-touch events
                });
            }
        };

        // 1. Immediate trigger
        attemptPlay();

        // 2. DOM/Window load triggers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', attemptPlay, { once: true });
        }
        window.addEventListener('load', attemptPlay, { once: true });
        window.addEventListener('pageshow', attemptPlay, { once: true });

        // 3. Ambient triggers: ANY cursor movement, hover, scroll, wheel, focus or gesture
        const ambientEvents = ['mousemove', 'pointermove', 'mouseenter', 'wheel', 'scroll', 'touchstart', 'pointerdown', 'mousedown', 'keydown', 'visibilitychange', 'focus'];
        const cleanup = () => {
            ambientEvents.forEach(evt => window.removeEventListener(evt, attemptPlay));
        };
        ambientEvents.forEach(evt => {
            window.addEventListener(evt, attemptPlay, { passive: true });
        });
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.startBgm();
    }

    startBgm() {
        if (this.isMuted || this.bgmStarted || !this.audioBgm) return;
        try {
            const p = this.audioBgm.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    this.bgmStarted = true;
                }).catch(() => {});
            }
        } catch(e) {}
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        const icon = document.getElementById('muteIcon');
        if (icon) icon.innerText = this.isMuted ? '🔇' : '🔊';

        if (this.audioBgm) {
            if (this.isMuted) {
                this.audioBgm.pause();
            } else {
                this.audioBgm.play().catch(() => {});
            }
        }
        return this.isMuted;
    }

    playSlotSpin() {
        if (this.isMuted) return;
        this.init();
        try {
            if (this.audioSlotSpin) {
                this.audioSlotSpin.volume = 0.32;
                this.audioSlotSpin.currentTime = 0;
                const p = this.audioSlotSpin.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }

    stopSlotSpin() {
        if (this.audioSlotSpin) {
            try {
                this.audioSlotSpin.pause();
                this.audioSlotSpin.currentTime = 0;
            } catch (e) {}
        }
    }

    playWheelSpin() {
        if (this.isMuted) return;
        this.init();
        try {
            if (this.audioWheelSpin) {
                this.audioWheelSpin.currentTime = 0;
                const p = this.audioWheelSpin.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }

    playSpinStart() {
        this.playSlotSpin();
    }

    playReelStop(reelIdx = 0) {
        if (this.isMuted) return;
        this.init();
        try {
            if (this.audioReelStop) {
                const s = this.audioReelStop.cloneNode();
                // Intermediate reels softer (0.26), final 5th reel crisp & punchy (0.42)
                s.volume = (reelIdx === 4) ? 0.42 : 0.26;
                const p = s.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }

    playTick() {
        if (this.isMuted) return;
        try {
            if (this.audioTick) {
                const tick = this.audioTick.cloneNode();
                tick.volume = 0.45;
                const p = tick.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }

    playWinLine() {
        if (this.isMuted) return;
        this.init();
        try {
            if (this.audioWin) {
                this.audioWin.currentTime = 0;
                const p = this.audioWin.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }

    playBigWinFanfare() {
        if (this.isMuted) return;
        this.init();
        try {
            if (this.audioWin) {
                this.audioWin.currentTime = 0;
                const p = this.audioWin.play();
                if (p && typeof p.catch === 'function') p.catch(() => {});
            }
        } catch (e) {}
    }
}

class AztecFruityWheelGame {
    constructor() {
        this.audio = new SlotAudioEngine();

        // Game Configuration
        this.baseBet = 100;
        this.isTurbo = false;
        this.isAuto = false;
        this.autoCount = 0;
        this.isSpinning = false;
        this.wheelAngle = 0;

        // Symbol Definitions
        this.SYMBOLS = {
            WHEEL:      { id: 'WHEEL',      name: 'Sun Wheel Bonus', isScatter: true, src: '../assets/games/wheel/symbols/sym_wheel.png', pays: { 3: 5, 4: 15, 5: 50 } },
            WILD:       { id: 'WILD',       name: 'Golden Wild',     isWild: true,    src: '../assets/games/wheel/symbols/sym_wild.png',  pays: { 3: 20, 4: 80, 5: 250 } },
            GRAPES:     { id: 'GRAPES',     name: 'Royal Grapes',                     src: '../assets/games/wheel/symbols/sym_grapes.png', pays: { 3: 15, 4: 50, 5: 180 } },
            CHERRIES:   { id: 'CHERRIES',   name: 'Ruby Cherries',                    src: '../assets/games/wheel/symbols/sym_cherries.png', pays: { 3: 12, 4: 40, 5: 140 } },
            WATERMELON: { id: 'WATERMELON', name: 'Fresh Melon',                      src: '../assets/games/wheel/symbols/sym_watermelon.png', pays: { 3: 10, 4: 30, 5: 100 } },
            A:          { id: 'A',          name: 'Golden Ace',                       src: '../assets/games/wheel/symbols/sym_a.png',     pays: { 3: 8, 4: 20, 5: 60 } },
            K:          { id: 'K',          name: 'Imperial King',                    src: '../assets/games/wheel/symbols/sym_k.png',     pays: { 3: 6, 4: 15, 5: 45 } },
            Q:          { id: 'Q',          name: 'Emerald Queen',                    src: '../assets/games/wheel/symbols/sym_q.png',     pays: { 3: 5, 4: 12, 5: 35 } },
            J:          { id: 'J',          name: 'Topaz Jack',                       src: '../assets/games/wheel/symbols/sym_j.png',     pays: { 3: 4, 4: 10, 5: 25 } }
        };

        this.REEL_POOL = [
            'WHEEL', 'WILD', 'WILD', 
            'GRAPES', 'GRAPES', 'GRAPES', 'GRAPES',
            'CHERRIES', 'CHERRIES', 'CHERRIES', 'CHERRIES', 'CHERRIES',
            'WATERMELON', 'WATERMELON', 'WATERMELON', 'WATERMELON',
            'A', 'A', 'A', 'A', 'A', 'A',
            'K', 'K', 'K', 'K', 'K', 'K',
            'Q', 'Q', 'Q', 'Q', 'Q', 'Q', 'Q',
            'J', 'J', 'J', 'J', 'J', 'J', 'J'
        ];

        // 20 Paylines
        this.PAYLINES = [
            [[1,0],[1,1],[1,2],[1,3],[1,4]],
            [[0,0],[0,1],[0,2],[0,3],[0,4]],
            [[2,0],[2,1],[2,2],[2,3],[2,4]],
            [[0,0],[1,1],[2,2],[1,3],[0,4]],
            [[2,0],[1,1],[0,2],[1,3],[2,4]],
            [[0,0],[0,1],[1,2],[2,3],[2,4]],
            [[2,0],[2,1],[1,2],[0,3],[0,4]],
            [[1,0],[0,1],[0,2],[0,3],[1,4]],
            [[1,0],[2,1],[2,2],[2,3],[1,4]],
            [[0,0],[1,1],[0,2],[1,3],[0,4]],
            [[2,0],[1,1],[2,2],[1,3],[2,4]],
            [[1,0],[0,1],[1,2],[2,3],[1,4]],
            [[1,0],[2,1],[1,2],[0,3],[1,4]],
            [[0,0],[1,1],[1,2],[1,3],[0,4]],
            [[2,0],[1,1],[1,2],[1,3],[2,4]],
            [[0,0],[0,1],[1,2],[1,3],[2,4]],
            [[2,0],[2,1],[1,2],[1,3],[0,4]],
            [[1,0],[1,1],[0,2],[1,3],[1,4]],
            [[1,0],[1,1],[2,2],[1,3],[1,4]],
            [[0,0],[2,1],[0,2],[2,3],[0,4]]
        ];

        // 20 Wheel Segments
        this.WHEEL_SEGMENTS = [
            { mult: 2.0,  label: 'x2',  weight: 22 },
            { mult: 3.0,  label: 'x3',  weight: 18 },
            { mult: 5.0,  label: 'x5',  weight: 14 },
            { mult: 8.0,  label: 'x8',  weight: 10 },
            { mult: 20.0, label: 'x20', weight: 5 },
            { mult: 15.0, label: 'x15', weight: 6 },
            { mult: 10.0, label: 'x10', weight: 8 },
            { mult: 40.0, label: 'x40', weight: 2 },
            { mult: 10.0, label: 'x10', weight: 8 },
            { mult: 10.0, label: 'x10', weight: 8 },
            { mult: 8.0,  label: 'x8',  weight: 10 },
            { mult: 20.0, label: 'x20', weight: 5 },
            { mult: 20.0, label: 'x20', weight: 5 },
            { mult: 10.0, label: 'x10', weight: 8 },
            { mult: 30.0, label: 'x30', weight: 3 },
            { mult: 50.0, label: 'x50', weight: 1.8 },
            { mult: 100.0,label: '100x',weight: 1.0 },
            { mult: 5.0,  label: 'x5',  weight: 12 },
            { mult: 8.0,  label: 'x8',  weight: 10 },
            { mult: 10.0, label: 'x10', weight: 8 }
        ];

        this.currentGrid = [
            ['GRAPES', 'CHERRIES', 'A', 'K', 'Q'],
            ['GRAPES', 'CHERRIES', 'A', 'K', 'Q'],
            ['WILD',   'WATERMELON', 'A', 'K', 'J']
        ];

        this.coins = [];
        this.coinCanvas = null;
        this.cCtx = null;
        this.isBonusSpinning = false;
        this.idleRotationSpeed = 0.16; // gentle ambient slow spin
    }

    init() {
        this.initDOM();
        this.renderGrid(this.currentGrid);
        this.initCoinRain();
        this.initIdleWheelRotation();
        this.syncUI();
    }

    initIdleWheelRotation() {
        this.idleWheelLoop = this.idleWheelLoop.bind(this);
        requestAnimationFrame(this.idleWheelLoop);
    }

    idleWheelLoop() {
        if (!this.isBonusSpinning && this.discEl) {
            this.wheelAngle = (this.wheelAngle + this.idleRotationSpeed) % 360000;
            this.discEl.style.transition = 'none';
            this.discEl.style.transform = `translate3d(0,0,0) rotate(${this.wheelAngle.toFixed(2)}deg)`;
        }
        requestAnimationFrame(this.idleWheelLoop);
    }

    initDOM() {
        this.discEl = document.getElementById('aztec-wheel-disc');
        this.pointerGlowEl = document.getElementById('aztec-pointer-glow');
        this.sunGlowEl = document.getElementById('aztec-sun-glow') || document.getElementById('aztec-center-sun-glow');
        this.winDisplayEl = document.getElementById('win-amount-text');
        this.spinBtn = document.getElementById('mainSpinBtn');
        this.bigWinModal = document.getElementById('bigWinModal');
        this.bigWinAmountEl = document.getElementById('bigWinAmount');
        this.buyBonusModal = document.getElementById('buyBonusModal');
        this.paytableModal = document.getElementById('paytableModal');
        this.betModal = document.getElementById('betSelectModal');

        if (this.discEl) {
            this.discEl.style.transform = `translate3d(0,0,0) rotate(${this.wheelAngle}deg)`;
        }
    }

    initCoinRain() {
        this.coinCanvas = document.getElementById('coinRainCanvas');
        if (this.coinCanvas) {
            this.cCtx = this.coinCanvas.getContext('2d');
            this.resizeCoinCanvas();
            window.addEventListener('resize', () => this.resizeCoinCanvas());
            this.coinRainLoop = this.coinRainLoop.bind(this);
            requestAnimationFrame(this.coinRainLoop);
        }
    }

    resizeCoinCanvas() {
        if (!this.coinCanvas) return;
        this.cW = this.coinCanvas.width = window.innerWidth;
        this.cH = this.coinCanvas.height = window.innerHeight;
    }

    emitCoins(count = 50) {
        if (!this.coinCanvas) return;
        for (let i = 0; i < count; i++) {
            this.coins.push({
                x: Math.random() * this.cW,
                y: -20 - Math.random() * 200,
                size: 11 + Math.random() * 11,
                vy: 5 + Math.random() * 7,
                vx: (Math.random() - 0.5) * 3,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.25
            });
        }
    }

    coinRainLoop() {
        if (this.cCtx && this.coins.length > 0) {
            this.cCtx.clearRect(0, 0, this.cW, this.cH);
            for (let i = this.coins.length - 1; i >= 0; i--) {
                const c = this.coins[i];
                c.y += c.vy;
                c.x += c.vx;
                c.rot += c.vrot;
                const sy = Math.cos(c.rot);

                this.cCtx.save();
                this.cCtx.translate(c.x, c.y);
                this.cCtx.scale(1, Math.abs(sy));
                this.cCtx.beginPath();
                this.cCtx.arc(0, 0, c.size, 0, Math.PI * 2);
                this.cCtx.fillStyle = '#ffd700';
                this.cCtx.fill();
                this.cCtx.lineWidth = 2;
                this.cCtx.strokeStyle = '#b8860b';
                this.cCtx.stroke();
                this.cCtx.restore();

                if (c.y > this.cH + 40) this.coins.splice(i, 1);
            }
        }
        requestAnimationFrame(this.coinRainLoop);
    }

    renderGrid(grid) {
        for (let c = 0; c < 5; c++) {
            const colTape = document.getElementById(`reel-tape-${c}`);
            if (!colTape) continue;
            colTape.innerHTML = '';
            for (let r = 0; r < 3; r++) {
                const symKey = grid[r][c];
                const sym = this.SYMBOLS[symKey] || this.SYMBOLS.A;
                const cell = document.createElement('div');
                cell.className = 'slot-symbol-cell';
                cell.id = `cell_${r}_${c}`;
                cell.innerHTML = `<img src="${sym.src}" alt="" class="slot-sym-img" loading="eager">`;
                colTape.appendChild(cell);
            }
        }
    }

    getRandomSymbol() {
        return this.REEL_POOL[Math.floor(Math.random() * this.REEL_POOL.length)];
    }

    syncUI() {
        const bal = window.wallet ? window.wallet.getBalance() : 0;
        
        const balEl = document.getElementById('user-balance-display');
        if (balEl) balEl.innerText = 'Rs ' + (window.wallet ? window.wallet.formatAmount(bal).replace('₨', '').trim() : bal.toLocaleString());

        const betBtnText = document.getElementById('current-bet-display');
        if (betBtnText) betBtnText.innerText = 'Bet Rs ' + this.baseBet;

        const buyCostEl = document.getElementById('buy-bonus-cost');
        if (buyCostEl) buyCostEl.innerText = 'Rs ' + (this.baseBet * 50).toLocaleString();
    }

    setBet(amount) {
        if (this.isSpinning) return;
        this.baseBet = Math.max(1, parseFloat(amount) || 100);
        this.audio.playTick();
        this.syncUI();
        this.closeBetModal();
    }

    openBetModal() {
        if (this.betModal) this.betModal.classList.add('show');
    }

    closeBetModal() {
        if (this.betModal) this.betModal.classList.remove('show');
    }

    openPaytable() {
        if (this.paytableModal) this.paytableModal.classList.add('show');
    }

    closePaytable() {
        if (this.paytableModal) this.paytableModal.classList.remove('show');
    }

    openBuyBonus() {
        if (this.isSpinning) return;
        if (this.buyBonusModal) this.buyBonusModal.classList.add('show');
    }

    closeBuyBonus() {
        if (this.buyBonusModal) this.buyBonusModal.classList.remove('show');
    }

    confirmBuyBonus() {
        this.closeBuyBonus();
        const cost = this.baseBet * 50;
        
        if (window.wallet) {
            if (window.wallet.getBalance() < cost) {
                const msg = `Kam balance hai! Buy Bonus ke liye Rs ${cost.toLocaleString()} darqaar hain. Baraye meharbani deposit karein.`;
                if (window.core && window.core.showToast) {
                    window.core.showToast(msg, 'error');
                } else if (window.app && window.app.showToast) {
                    window.app.showToast(msg, 'error');
                } else {
                    alert(msg);
                }
                return;
            }
            if (!window.wallet.placeBet(cost, 'Aztec Sun Wheel Buy Bonus')) {
                return;
            }
            if (window.core) window.core.updateAllBalances();
        }

        this.syncUI();
        this.triggerSunWheelBonus(true);
    }

    toggleTurbo() {
        this.isTurbo = !this.isTurbo;
        const btn = document.getElementById('turboToggleBtn');
        if (btn) btn.classList.toggle('active', this.isTurbo);
        this.audio.playTick();
    }

    toggleAutoSpin() {
        const btn = document.getElementById('autoToggleBtn');
        if (this.isAuto) {
            this.isAuto = false;
            this.autoCount = 0;
            if (btn) {
                btn.classList.remove('active');
                btn.innerHTML = `<span class="icon-auto">🔄</span>`;
            }
        } else {
            this.isAuto = true;
            this.autoCount = 20;
            if (btn) {
                btn.classList.add('active');
                btn.innerHTML = `<span class="icon-auto">🔄</span><span class="auto-count">${this.autoCount}</span>`;
            }
            if (!this.isSpinning) this.spinSlot();
        }
    }

    clearWinHighlights() {
        document.querySelectorAll('.slot-symbol-cell').forEach(c => c.classList.remove('win-hit'));
    }

    async spinSlot() {
        if (this.isSpinning) return;
        this.audio.init();

        const cost = this.baseBet;

        if (window.wallet) {
            if (window.wallet.getBalance() < cost) {
                const msg = `Kam balance hai! Spin lagane ke liye Rs ${cost} darqaar hain. Baraye meharbani deposit karein.`;
                if (window.core && window.core.showToast) {
                    window.core.showToast(msg, 'error');
                } else if (window.app && window.app.showToast) {
                    window.app.showToast(msg, 'error');
                } else {
                    alert(msg);
                }
                if (this.isAuto) this.toggleAutoSpin();
                return;
            }
            try {
                if (!window.wallet.placeBet(cost, 'Aztec Sun Wheel Slot')) {
                    if (this.isAuto) this.toggleAutoSpin();
                    return;
                }
                if (window.core) window.core.updateAllBalances();
            } catch (err) {
                console.warn('placeBet error:', err);
                if (this.isAuto) this.toggleAutoSpin();
                return;
            }
        }

        this.isSpinning = true;
        this.syncUI();
        this.clearWinHighlights();

        if (this.winDisplayEl) this.winDisplayEl.innerText = 'Rs 0.00';
        if (this.spinBtn) this.spinBtn.classList.add('spinning');

        this.audio.playSpinStart();

        // 1. Generate target 5x3 outcomes
        const nextGrid = [
            [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
            [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()],
            [this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol(), this.getRandomSymbol()]
        ];

        // 2. High performance staggered 60 FPS animation (Snappy & Smooth)
        const colPromises = [];
        const baseDuration = this.isTurbo ? 240 : 500;
        const colStagger = this.isTurbo ? 45 : 75;

        for (let c = 0; c < 5; c++) {
            const duration = baseDuration + (c * colStagger);
            colPromises.push(this.animateReel(c, [nextGrid[0][c], nextGrid[1][c], nextGrid[2][c]], duration));
        }

        await Promise.all(colPromises);

        // Stop spin sound instantly when all reels have locked into position
        this.audio.stopSlotSpin();

        this.currentGrid = nextGrid;
        if (this.spinBtn) this.spinBtn.classList.remove('spinning');

        // 3. Evaluate results
        await this.evaluateSlotResults();

        this.isSpinning = false;

        // Auto spin loop
        if (this.isAuto && this.autoCount > 0) {
            this.autoCount--;
            const btn = document.getElementById('autoToggleBtn');
            if (btn) btn.innerHTML = `<span class="icon-auto">🔄</span><span class="auto-count">${this.autoCount}</span>`;
            if (this.autoCount <= 0) {
                this.isAuto = false;
                if (btn) {
                    btn.classList.remove('active');
                    btn.innerHTML = `<span class="icon-auto">🔄</span>`;
                }
            } else {
                setTimeout(() => {
                    if (this.isAuto) this.spinSlot();
                }, this.isTurbo ? 250 : 500);
            }
        }
    }

    animateReel(colIdx, finalSyms, duration) {
        return new Promise(resolve => {
            const tape = document.getElementById(`reel-tape-${colIdx}`);
            if (!tape) return resolve();

            // Lightweight dummy count (6 for normal, 3 for turbo) for instant 60 FPS
            const dummyCount = this.isTurbo ? 3 : 6;
            const tapeList = [];

            for (let i = 0; i < dummyCount; i++) {
                tapeList.push(this.getRandomSymbol());
            }
            finalSyms.forEach(s => tapeList.push(s));

            // Fast DOM populate
            let htmlStr = '';
            tapeList.forEach((symKey, idx) => {
                const sym = this.SYMBOLS[symKey] || this.SYMBOLS.A;
                const cellId = idx >= tapeList.length - 3 ? `id="cell_${idx - (tapeList.length - 3)}_${colIdx}"` : '';
                htmlStr += `<div class="slot-symbol-cell" ${cellId}><img src="${sym.src}" alt="" class="slot-sym-img"></div>`;
            });
            tape.innerHTML = htmlStr;

            const cellH = window.innerWidth >= 480 ? 88 : 78;
            const targetY = -(dummyCount * cellH);

            // GPU Hardware Accelerated Translate3D with responsive ease-out curve
            tape.style.transition = `transform ${duration}ms cubic-bezier(0.18, 0.95, 0.35, 1.04)`;
            tape.style.transform = `translate3d(0, ${targetY}px, 0)`;

            setTimeout(() => {
                this.audio.playReelStop(colIdx);
                tape.style.transition = 'none';
                tape.style.transform = 'translate3d(0, 0px, 0)';
                
                // Repopulate with clean final 3 symbols
                let finalHtml = '';
                finalSyms.forEach((symKey, row) => {
                    const sym = this.SYMBOLS[symKey] || this.SYMBOLS.A;
                    finalHtml += `<div class="slot-symbol-cell" id="cell_${row}_${colIdx}"><img src="${sym.src}" alt="" class="slot-sym-img"></div>`;
                });
                tape.innerHTML = finalHtml;
                resolve();
            }, duration);
        });
    }

    async evaluateSlotResults() {
        let totalWin = 0;
        const hitCells = new Set();
        let scatterCount = 0;

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 5; c++) {
                if (this.currentGrid[r][c] === 'WHEEL') {
                    scatterCount++;
                    hitCells.add(`${r}_${c}`);
                }
            }
        }

        this.PAYLINES.forEach(line => {
            const syms = line.map(([r, c]) => this.currentGrid[r][c]);
            const matchInfo = this.checkLineMatch(syms);
            if (matchInfo) {
                const { symKey, count } = matchInfo;
                const symDef = this.SYMBOLS[symKey];
                if (symDef && symDef.pays && symDef.pays[count]) {
                    const lineWin = (symDef.pays[count] / 20) * this.baseBet;
                    totalWin += lineWin;
                    for (let i = 0; i < count; i++) {
                        const [r, c] = line[i];
                        hitCells.add(`${r}_${c}`);
                    }
                }
            }
        });

        // Trigger Sun Wheel Bonus if 3+ Scatters
        if (scatterCount >= 3) {
            hitCells.forEach(coord => {
                const el = document.getElementById(`cell_${coord}`);
                if (el) el.classList.add('win-hit');
            });
            this.audio.playTick();
            await new Promise(r => setTimeout(r, 400));
            await this.triggerSunWheelBonus(false);
            return;
        }

        // Regular Wins
        if (totalWin > 0) {
            hitCells.forEach(coord => {
                const el = document.getElementById(`cell_${coord}`);
                if (el) el.classList.add('win-hit');
            });

            const roundedWin = Math.round(totalWin * 100) / 100;
            if (window.wallet) {
                window.wallet.creditWin(this.baseBet, roundedWin, 'Aztec Sun Wheel Slot', Math.round((roundedWin / this.baseBet) * 10) / 10);
                if (window.core) window.core.updateAllBalances();
            }

            if (this.winDisplayEl) {
                this.winDisplayEl.innerText = 'Rs ' + roundedWin.toLocaleString();
            }
            this.syncUI();

            if (roundedWin >= this.baseBet * 15) {
                this.audio.playBigWinFanfare();
                this.emitCoins(80);
                this.showBigWinModal(roundedWin);
            } else {
                this.audio.playWinLine();
                this.emitCoins(35);
            }
        }
    }

    checkLineMatch(syms) {
        const target = syms.find(s => s !== 'WILD' && s !== 'WHEEL');
        if (!target) return { symKey: 'WILD', count: 5 };

        let count = 0;
        for (let i = 0; i < syms.length; i++) {
            if (syms[i] === target || syms[i] === 'WILD') {
                count++;
            } else {
                break;
            }
        }

        if (count >= 3) return { symKey: target, count };
        return null;
    }

    flashPointer() {
        if (!this.pointerGlowEl) return;
        this.pointerGlowEl.style.opacity = '1';
        this.pointerGlowEl.style.transform = 'translate(-50%, -50%) scale(1.35)';
        setTimeout(() => {
            if (this.pointerGlowEl) {
                this.pointerGlowEl.style.opacity = '0';
                this.pointerGlowEl.style.transform = 'translate(-50%, -50%) scale(1)';
            }
        }, 60);
    }

    async triggerSunWheelBonus(isBuyBonus = false) {
        this.isBonusSpinning = true;
        if (this.sunGlowEl) this.sunGlowEl.classList.add('active');
        this.audio.playWheelSpin();

        const totalWeight = this.WHEEL_SEGMENTS.reduce((acc, s) => acc + s.weight, 0);
        let rand = Math.random() * totalWeight;
        let targetIndex = 0;
        for (let i = 0; i < this.WHEEL_SEGMENTS.length; i++) {
            if (rand < this.WHEEL_SEGMENTS[i].weight) {
                targetIndex = i;
                break;
            }
            rand -= this.WHEEL_SEGMENTS[i].weight;
        }

        const segDegrees = 18;
        const targetDeg = targetIndex * segDegrees;
        const targetOffset = (360 - targetDeg) % 360;
        const jitter = (Math.random() - 0.5) * 8;
        const extraSpins = 5 * 360;

        const currentRot = ((this.wheelAngle % 360) + 360) % 360;
        const deltaAngle = extraSpins + ((targetOffset - currentRot + 360) % 360) + jitter;
        this.wheelAngle = this.wheelAngle + deltaAngle;

        // Native 60 FPS CSS Transition on GPU compositor thread
        const spinTime = 3400; // ms
        if (this.discEl) {
            this.discEl.style.transition = `transform ${spinTime}ms cubic-bezier(0.12, 0.88, 0.28, 1)`;
            this.discEl.style.transform = `translate3d(0,0,0) rotate(${this.wheelAngle}deg)`;
        }

        // Periodic ticks during spin
        const tickInterval = setInterval(() => {
            this.audio.playTick();
            this.flashPointer();
        }, 120);

        return new Promise(resolve => {
            setTimeout(() => {
                clearInterval(tickInterval);
                this.finishSunWheel(targetIndex, isBuyBonus);
                setTimeout(() => {
                    this.isBonusSpinning = false;
                }, 3500);
                resolve();
            }, spinTime + 100);
        });
    }

    finishSunWheel(index, isBuyBonus) {
        if (this.sunGlowEl) this.sunGlowEl.classList.remove('active');

        const seg = this.WHEEL_SEGMENTS[index];
        const winAmount = Math.round(this.baseBet * seg.mult * 100) / 100;

        if (this.pointerGlowEl) {
            this.pointerGlowEl.classList.add('active');
            setTimeout(() => {
                if (this.pointerGlowEl) this.pointerGlowEl.classList.remove('active');
            }, 3000);
        }

        if (window.wallet) {
            window.wallet.creditWin(this.baseBet, winAmount, 'Aztec Sun Wheel Bonus', seg.mult, `Hit ${seg.label}!`);
            if (window.core) window.core.updateAllBalances();
        }

        if (this.winDisplayEl) {
            this.winDisplayEl.innerText = 'Rs ' + winAmount.toLocaleString();
        }
        this.syncUI();

        this.audio.playBigWinFanfare();
        this.emitCoins(100);
        this.showBigWinModal(winAmount);

        if (window.app && window.app.showToast) {
            window.app.showToast(`Sun Wheel Bonus: Hit ${seg.label}! Won Rs ${winAmount.toLocaleString()}`, 'success');
        }
    }

    showBigWinModal(amount) {
        if (!this.bigWinModal) return;
        if (this.bigWinAmountEl) {
            this.bigWinAmountEl.innerText = 'Rs ' + amount.toLocaleString();
        }
        this.bigWinModal.classList.add('show');
        setTimeout(() => {
            if (this.bigWinModal) this.bigWinModal.classList.remove('show');
        }, 3200);
    }
}

// Global instance
window.wheelGame = new AztecFruityWheelGame();
window.audio = window.wheelGame.audio;

// Helper global proxies
function executeSpin() { if (window.wheelGame) window.wheelGame.spinSlot(); }
function spinSlot() { if (window.wheelGame) window.wheelGame.spinSlot(); }
function toggleTurbo() { if (window.wheelGame) window.wheelGame.toggleTurbo(); }
function toggleAutoSpin() { if (window.wheelGame) window.wheelGame.toggleAutoSpin(); }
function openBetModal() { if (window.wheelGame) window.wheelGame.openBetModal(); }
function closeBetModal() { if (window.wheelGame) window.wheelGame.closeBetModal(); }
function selectBet(val) { if (window.wheelGame) window.wheelGame.setBet(val); }
function openBuyBonus() { if (window.wheelGame) window.wheelGame.openBuyBonus(); }
function closeBuyBonus() { if (window.wheelGame) window.wheelGame.closeBuyBonus(); }
function confirmBuyBonus() { if (window.wheelGame) window.wheelGame.confirmBuyBonus(); }
function openPaytable() { if (window.wheelGame) window.wheelGame.openPaytable(); }
function closePaytable() { if (window.wheelGame) window.wheelGame.closePaytable(); }

// Auto-init audio & BGM on page load & ambient activity without requiring touch
['DOMContentLoaded', 'load', 'mousemove', 'pointermove', 'wheel', 'scroll', 'mouseenter', 'click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
    window.addEventListener(evt, () => {
        if (window.audio) window.audio.init();
    }, { once: true, passive: true });
});
