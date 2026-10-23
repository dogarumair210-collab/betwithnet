// ============================================================
// Space XY Cosmic Rocket Engine (BGaming Official Aesthetics)
// Full Retina Canvas Flight Radar, Dynamic Coordinate Grids,
// Particle Thruster Trails, Web Audio / Jet BGM, and Wallet Sync
// ============================================================

class SpaceXYEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.dpr = 1;
        this.width = 0;
        this.height = 0;

        // Game State
        this.state = 'IDLE'; // 'IDLE', 'COUNTDOWN', 'FLYING', 'CRASHED'
        this.multiplier = 1.00;
        this.crashPoint = 2.00;
        this.startTime = 0;
        this.elapsed = 0;
        this.animFrameId = null;

        // Betting & Wallet
        this.betAmount = 100;
        this.hasBet = false;
        this.hasCashedOut = false;
        this.autoCashoutActive = false;
        this.autoCashoutMultiplier = 2.00;
        this.history = [1.84, 3.20, 1.15, 14.80, 2.05, 1.45, 5.60, 1.08, 2.75, 8.42];

        // Starfield & Particle Systems
        this.stars = [];
        this.particles = [];
        this.shockwaves = [];

        // Audio System
        this.isMuted = false;
        this.audioUnlocked = false;
        this.bgm = null;
        this.sndThrust = null;
        this.sndWin = null;
        this.sndCrash = null;
    }

    init() {
        this.canvas = document.getElementById('space-radar-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
        }

        this.initAudio();
        this.initStars();
        this.initWalletSync();
        this.renderHistory();
        this.bindEvents();
        this.startLoop();
    }

    /* -------------------------------------------------------------
       AUDIO SUBSYSTEM
       ------------------------------------------------------------- */
    initAudio() {
        try {
            this.isMuted = localStorage.getItem('bwn_sound_muted') === '1';
        } catch (e) {
            this.isMuted = false;
        }

        this.bgm = new Audio('../assets/audio/jet_bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = this.isMuted ? 0 : 0.35;

        this.sndThrust = new Audio('../assets/audio/jet_thrust.mp3');
        this.sndThrust.volume = this.isMuted ? 0 : 0.70;

        this.sndWin = new Audio('../assets/audio/jet_flyby_win.mp3');
        this.sndWin.volume = this.isMuted ? 0 : 0.85;

        this.sndCrash = new Audio('../assets/audio/aviator_crash.mp3');
        this.sndCrash.volume = this.isMuted ? 0 : 0.85;

        this.updateSoundToggleIcon();

        // Unlock on first interaction
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            this.audioUnlocked = true;
            if (!this.isMuted && this.bgm) {
                this.bgm.play().catch(() => {});
            }
            document.removeEventListener('pointerdown', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        document.addEventListener('pointerdown', unlockAudio, { passive: true });
        document.addEventListener('keydown', unlockAudio, { passive: true });
    }

    toggleSound() {
        this.isMuted = !this.isMuted;
        try {
            localStorage.setItem('bwn_sound_muted', this.isMuted ? '1' : '0');
        } catch (e) {}

        if (this.bgm) {
            this.bgm.volume = this.isMuted ? 0 : 0.35;
            if (!this.isMuted && this.bgm.paused) {
                this.bgm.play().catch(() => {});
            }
        }
        if (this.sndThrust) this.sndThrust.volume = this.isMuted ? 0 : 0.70;
        if (this.sndWin) this.sndWin.volume = this.isMuted ? 0 : 0.85;
        if (this.sndCrash) this.sndCrash.volume = this.isMuted ? 0 : 0.85;

        if (window.sound) {
            window.sound.muted = this.isMuted;
        }
        this.updateSoundToggleIcon();
    }

    updateSoundToggleIcon() {
        const btn = document.getElementById('space-sound-toggle');
        if (btn) {
            btn.innerHTML = this.isMuted ? '🔇' : '🔊';
            btn.style.color = this.isMuted ? '#ff5252' : '#00e5ff';
        }
    }

    startBgmOnReady() {
        if (!this.isMuted && this.bgm && this.bgm.paused) {
            this.bgm.play().catch(() => {});
        }
    }

    playSfx(type) {
        if (this.isMuted) return;
        try {
            if (type === 'thrust' && this.sndThrust) {
                this.sndThrust.currentTime = 0;
                this.sndThrust.play().catch(() => {});
            } else if (type === 'win' && this.sndWin) {
                this.sndWin.currentTime = 0;
                this.sndWin.play().catch(() => {});
            } else if (type === 'crash' && this.sndCrash) {
                this.sndCrash.currentTime = 0;
                this.sndCrash.play().catch(() => {});
            }
        } catch (e) {}
    }

    /* -------------------------------------------------------------
       WALLET INTEGRATION
       ------------------------------------------------------------- */
    initWalletSync() {
        this.updateBalanceUI();
        if (window.wallet) {
            if (typeof window.wallet.on === 'function') {
                window.wallet.on('change', () => this.updateBalanceUI());
                window.wallet.on('balanceChange', () => this.updateBalanceUI());
            }
        }
    }

    updateBalanceUI() {
        const el = document.getElementById('space-user-balance');
        if (!el) return;
        let bal = 0;
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            bal = window.wallet.getBalance('PKR');
        }
        el.innerText = bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* -------------------------------------------------------------
       CANVAS SIZING & STARFIELD
       ------------------------------------------------------------- */
    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = rect.width;
        this.height = rect.height;

        this.canvas.width = Math.floor(this.width * this.dpr);
        this.canvas.height = Math.floor(this.height * this.dpr);
        if (this.ctx) {
            this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        }
    }

    initStars() {
        this.stars = [];
        const count = 110;
        for (let i = 0; i < count; i++) {
            this.stars.push({
                x: Math.random(),
                y: Math.random(),
                radius: Math.random() * 1.5 + 0.4,
                alpha: Math.random() * 0.7 + 0.3,
                twinkleSpeed: Math.random() * 0.03 + 0.01,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    /* -------------------------------------------------------------
       BETTING CONTROLS
       ------------------------------------------------------------- */
    bindEvents() {
        const soundBtn = document.getElementById('space-sound-toggle');
        if (soundBtn) {
            soundBtn.onclick = () => this.toggleSound();
        }

        const autoCheck = document.getElementById('space-auto-check');
        if (autoCheck) {
            autoCheck.onchange = (e) => {
                this.autoCashoutActive = e.target.checked;
            };
        }

        const autoInput = document.getElementById('space-auto-val');
        if (autoInput) {
            autoInput.onchange = (e) => {
                let v = parseFloat(e.target.value) || 2.0;
                if (v < 1.05) v = 1.05;
                if (v > 500) v = 500;
                this.autoCashoutMultiplier = parseFloat(v.toFixed(2));
                autoInput.value = this.autoCashoutMultiplier.toFixed(2);
            };
        }
    }

    adjustBet(action) {
        const input = document.getElementById('space-bet-amount');
        if (!input) return;
        let val = parseFloat(input.value) || 100;
        let bal = 10000;
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            bal = window.wallet.getBalance('PKR') || 10000;
        }

        if (action === 'half') val = Math.max(10, Math.floor(val / 2));
        else if (action === 'double') val = Math.min(bal, Math.floor(val * 2));
        else if (action === '+50') val = Math.min(bal, val + 50);
        else if (action === '+100') val = Math.min(bal, val + 100);
        else if (action === '+500') val = Math.min(bal, val + 500);
        else if (action === 'max') val = Math.max(10, Math.floor(bal));

        input.value = Math.max(10, Math.floor(val));
    }

    stepAuto(delta) {
        const input = document.getElementById('space-auto-val');
        if (!input) return;
        let v = (parseFloat(input.value) || 2.0) + delta;
        if (v < 1.05) v = 1.05;
        if (v > 500) v = 500;
        this.autoCashoutMultiplier = parseFloat(v.toFixed(2));
        input.value = this.autoCashoutMultiplier.toFixed(2);
    }

    /* -------------------------------------------------------------
       GAME LOOP & ACTION HANDLING
       ------------------------------------------------------------- */
    handleAction() {
        if (this.state === 'FLYING') {
            if (this.hasBet && !this.hasCashedOut) {
                this.cashOut();
            }
        } else if (this.state === 'IDLE') {
            this.launch();
        }
    }

    launch() {
        if (this.state === 'FLYING') return;

        const input = document.getElementById('space-bet-amount');
        const bet = parseFloat(input ? input.value : 100) || 100;

        if (window.wallet && typeof window.wallet.placeBet === 'function') {
            const ok = window.wallet.placeBet(bet, 'Space XY');
            if (!ok) {
                this.shakeBetInput();
                return;
            }
        }

        this.hasBet = true;
        this.hasCashedOut = false;
        this.betAmount = bet;
        this.multiplier = 1.00;
        this.particles = [];
        this.shockwaves = [];

        // Check Auto-cashout setting
        const autoCheck = document.getElementById('space-auto-check');
        const autoInput = document.getElementById('space-auto-val');
        this.autoCashoutActive = autoCheck ? autoCheck.checked : false;
        this.autoCashoutMultiplier = autoInput ? parseFloat(autoInput.value) || 2.0 : 2.0;

        // Balanced 30% win / 70% loss probability distribution
        const rand = Math.random();
        if (rand < 0.15) {
            this.crashPoint = 1.00; // Immediate instant crash (15%)
        } else if (rand < 0.70) {
            this.crashPoint = parseFloat((1.01 + Math.random() * 0.46).toFixed(2)); // 70% total bust below 1.48x
        } else if (rand < 0.92) {
            this.crashPoint = parseFloat((1.50 + Math.random() * 2.50).toFixed(2)); // 1.50x - 4.00x (22%)
        } else {
            this.crashPoint = parseFloat((4.00 + Math.random() * 30.0).toFixed(2)); // High cosmic rocket
            if (this.crashPoint > 250) this.crashPoint = 250;
        }

        this.state = 'FLYING';
        this.startTime = performance.now();
        this.elapsed = 0;

        this.playSfx('thrust');
        this.hideCashoutBanner();
        this.updateHUD('1.00x', 'FLYING IN DEEP SPACE');
        this.updateMainButton('CASHOUT', true);
    }

    cashOut() {
        if (this.state !== 'FLYING' || !this.hasBet || this.hasCashedOut) return;
        this.hasCashedOut = true;

        const winAmount = parseFloat((this.betAmount * this.multiplier).toFixed(2));
        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(this.betAmount, winAmount, 'Space XY', this.multiplier, `Cashed out @ ${this.multiplier.toFixed(2)}x`);
        }

        this.playSfx('win');
        this.showCashoutBanner(winAmount, this.multiplier);
        this.updateMainButton(`CASHED OUT ₨ ${winAmount.toFixed(0)}`, false, 'btn-state-won');
    }

    explode() {
        this.state = 'CRASHED';
        const finalMult = this.multiplier;

        // Add to history
        this.history.unshift(finalMult);
        if (this.history.length > 15) this.history.pop();
        this.renderHistory();

        // Spawn explosion particles
        this.spawnExplosion(this.currentRocketX, this.currentRocketY);
        this.playSfx('crash');

        if (this.hasBet && !this.hasCashedOut) {
            if (window.wallet && typeof window.wallet.creditWin === 'function') {
                window.wallet.creditWin(this.betAmount, 0, 'Space XY', 0, `Exploded @ ${finalMult.toFixed(2)}x`);
            }
        }

        // Update HUD
        const multEl = document.getElementById('space-hud-multiplier');
        if (multEl) {
            multEl.className = 'space-multiplier-text state-crash';
            multEl.innerText = `CRASHED @ ${finalMult.toFixed(2)}x`;
        }
        const statusEl = document.getElementById('space-hud-status');
        if (statusEl) {
            statusEl.innerText = 'ROCKET FLEW AWAY';
            statusEl.style.color = '#ff3366';
        }

        this.updateMainButton('LAUNCH ROCKET 🚀', false, 'btn-state-launch');

        // Reset to next round after short delay
        setTimeout(() => {
            this.state = 'IDLE';
            this.hasBet = false;
            this.hasCashedOut = false;
            this.multiplier = 1.00;
            this.updateHUD('1.00x', 'SPACE COORDINATE XY');
            this.updateMainButton('LAUNCH ROCKET 🚀', false, 'btn-state-launch');
            this.hideCashoutBanner();
        }, 2400);
    }

    /* -------------------------------------------------------------
       UI UPDATERS
       ------------------------------------------------------------- */
    updateHUD(multText, subText) {
        const multEl = document.getElementById('space-hud-multiplier');
        if (multEl) {
            multEl.innerText = multText;
            multEl.className = 'space-multiplier-text';
            if (this.multiplier >= 10.0) {
                multEl.classList.add('tier-purple');
            } else if (this.multiplier >= 2.0) {
                multEl.classList.add('tier-gold');
            }
        }
        const statusEl = document.getElementById('space-hud-status');
        if (statusEl) {
            statusEl.innerText = subText;
            statusEl.style.color = '#8da2c0';
        }
    }

    updateMainButton(text, isCashoutActive, extraClass = '') {
        const btn = document.getElementById('space-main-btn');
        if (!btn) return;
        btn.className = 'space-action-btn';

        if (isCashoutActive) {
            btn.classList.add('btn-state-cashout');
            const potential = (this.betAmount * this.multiplier).toFixed(0);
            btn.innerHTML = `<span>CASHOUT @ ${this.multiplier.toFixed(2)}x (₨ ${potential})</span> <span>⚡</span>`;
        } else if (extraClass) {
            btn.classList.add(extraClass);
            btn.innerHTML = `<span>${text}</span>`;
        } else {
            btn.classList.add('btn-state-launch');
            btn.innerHTML = `<span>LAUNCH ROCKET</span> <span>🚀</span>`;
        }
    }

    showCashoutBanner(amt, mult) {
        const popup = document.getElementById('space-cashout-popup');
        const amtEl = document.getElementById('space-cashout-amount');
        if (popup && amtEl) {
            amtEl.innerText = `₨ ${amt.toLocaleString()} (${mult.toFixed(2)}x)`;
            popup.classList.add('show');
        }
    }

    hideCashoutBanner() {
        const popup = document.getElementById('space-cashout-popup');
        if (popup) popup.classList.remove('show');
    }

    shakeBetInput() {
        const box = document.querySelector('.bet-input-box');
        if (!box) return;
        box.style.borderColor = '#ff3366';
        box.style.boxShadow = '0 0 10px rgba(255, 51, 102, 0.6)';
        setTimeout(() => {
            box.style.borderColor = 'rgba(0, 229, 255, 0.3)';
            box.style.boxShadow = 'none';
        }, 800);
    }

    renderHistory() {
        const bar = document.getElementById('space-history-container');
        if (!bar) return;
        bar.innerHTML = '';
        this.history.forEach(h => {
            const tag = document.createElement('span');
            tag.className = 'history-tag ';
            if (h >= 10) tag.className += 'tier-epic';
            else if (h >= 2.0) tag.className += 'tier-high';
            else if (h >= 1.4) tag.className += 'tier-med';
            else tag.className += 'tier-low';
            tag.innerText = h.toFixed(2) + 'x';
            bar.appendChild(tag);
        });
    }

    /* -------------------------------------------------------------
       PARTICLE & SHOCKWAVE SYSTEM
       ------------------------------------------------------------- */
    spawnThrusterParticles(x, y, angle) {
        const count = 3;
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 0.45;
            const speed = Math.random() * 3.5 + 2.5;
            const pAngle = angle + Math.PI + spread;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(pAngle) * speed,
                vy: Math.sin(pAngle) * speed,
                radius: Math.random() * 3.5 + 1.5,
                color: Math.random() > 0.5 ? '#ff9100' : (Math.random() > 0.3 ? '#ffcc00' : '#00e5ff'),
                alpha: 1.0,
                decay: Math.random() * 0.04 + 0.02
            });
        }
    }

    spawnExplosion(x, y) {
        this.shockwaves.push({
            x: x,
            y: y,
            radius: 5,
            maxRadius: 75,
            alpha: 1.0
        });

        const count = 40;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 4 + 2,
                color: Math.random() > 0.4 ? '#ff3366' : (Math.random() > 0.5 ? '#ff9100' : '#ffea00'),
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.015
            });
        }
    }

    /* -------------------------------------------------------------
       MAIN DRAW & RENDER PIPELINE
       ------------------------------------------------------------- */
    startLoop() {
        const loop = () => {
            this.update();
            this.render();
            this.animFrameId = requestAnimationFrame(loop);
        };
        this.animFrameId = requestAnimationFrame(loop);
    }

    update() {
        if (this.state === 'FLYING') {
            this.elapsed = (performance.now() - this.startTime) / 1000;
            // Standard exponential flight multiplier curve: e^(0.075 * t)
            this.multiplier = parseFloat(Math.pow(Math.E, 0.075 * this.elapsed).toFixed(2));

            // Auto-cashout trigger
            if (this.hasBet && !this.hasCashedOut && this.autoCashoutActive) {
                if (this.multiplier >= this.autoCashoutMultiplier) {
                    this.cashOut();
                }
            }

            // HUD update during flight
            this.updateHUD(this.multiplier.toFixed(2) + 'x', 'ROCKET FLIGHT COORDINATE');
            if (this.hasBet && !this.hasCashedOut) {
                this.updateMainButton('CASHOUT', true);
            }

            // Check Crash Point
            if (this.multiplier >= this.crashPoint) {
                this.explode();
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            p.radius *= 0.98;
            if (p.alpha <= 0 || p.radius <= 0.2) {
                this.particles.splice(i, 1);
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += 2.8;
            sw.alpha = 1 - (sw.radius / sw.maxRadius);
            if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                this.shockwaves.splice(i, 1);
            }
        }
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Draw Starfield
        this.drawStarfield(ctx, w, h);

        // 2. Draw Space XY Grid & Coordinate Axes
        this.drawCoordinateGrid(ctx, w, h);

        // 3. Draw Trajectory Curve & Rocket
        if (this.state === 'FLYING') {
            this.drawFlightTrajectory(ctx, w, h);
        } else if (this.state === 'IDLE') {
            this.drawIdleRocket(ctx, w, h);
        }

        // 4. Draw Particles & Shockwaves
        this.drawParticles(ctx);
    }

    drawStarfield(ctx, w, h) {
        ctx.save();
        const time = performance.now() * 0.001;
        const drift = this.state === 'FLYING' ? (time * 15) % h : 0;

        for (let i = 0; i < this.stars.length; i++) {
            const s = this.stars[i];
            let sy = (s.y * h + drift) % h;
            let sx = s.x * w;
            const twinkle = 0.5 + 0.5 * Math.sin(time * 3 + s.phase);
            const alpha = s.alpha * twinkle;

            ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
            ctx.beginPath();
            ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawCoordinateGrid(ctx, w, h) {
        ctx.save();
        const originX = 35;
        const originY = h - 28;
        const plotW = w - originX - 20;
        const plotH = originY - 30;

        // Grid lines (X & Y)
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.07)';
        ctx.fillStyle = '#4f6888';
        ctx.font = '600 9px "JetBrains Mono", monospace';

        // Vertical Y Coordinate ticks (Multipliers)
        const ySteps = [
            { label: '1.0x', pct: 0.0 },
            { label: '1.5x', pct: 0.25 },
            { label: '2.0x', pct: 0.50 },
            { label: '5.0x', pct: 0.75 },
            { label: '10x', pct: 0.95 }
        ];

        ySteps.forEach(step => {
            const y = originY - step.pct * plotH;
            ctx.beginPath();
            ctx.moveTo(originX, y);
            ctx.lineTo(w - 15, y);
            ctx.stroke();

            // Label on Y axis
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(step.label, originX - 6, y);
        });

        // Horizontal X Coordinate ticks (Seconds)
        const xSteps = [
            { label: '0s', pct: 0.0 },
            { label: '2s', pct: 0.2 },
            { label: '4s', pct: 0.4 },
            { label: '6s', pct: 0.6 },
            { label: '8s', pct: 0.8 },
            { label: '10s', pct: 1.0 }
        ];

        xSteps.forEach(step => {
            const x = originX + step.pct * plotW;
            ctx.beginPath();
            ctx.moveTo(x, originY);
            ctx.lineTo(x, 25);
            ctx.stroke();

            // Label on X axis
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(step.label, x, originY + 6);
        });

        // Main Axes Lines
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.28)';
        ctx.beginPath();
        // Y Axis
        ctx.moveTo(originX, originY);
        ctx.lineTo(originX, 20);
        // X Axis
        ctx.moveTo(originX, originY);
        ctx.lineTo(w - 15, originY);
        ctx.stroke();

        ctx.restore();
    }

    drawIdleRocket(ctx, w, h) {
        const originX = 35;
        const originY = h - 28;
        const idleX = originX + 25;
        const idleY = originY - 20;

        // Subtle idle hover bobbing
        const hover = Math.sin(performance.now() * 0.004) * 4;
        this.drawRocket(ctx, idleX, idleY + hover, -Math.PI / 4, false);
    }

    drawFlightTrajectory(ctx, w, h) {
        const originX = 35;
        const originY = h - 28;
        const plotW = w - originX - 35;
        const plotH = originY - 45;

        // Curve progression based on elapsed time (up to 12s normalized canvas ceiling)
        const progress = Math.min(1.0, this.elapsed / 11.5);
        const curX = originX + progress * plotW;
        const curY = originY - Math.pow(progress, 1.25) * plotH;

        this.currentRocketX = curX;
        this.currentRocketY = curY;

        // Control point for smooth quadratic bezier ascent
        const cpX = originX + (curX - originX) * 0.65;
        const cpY = originY;

        // 1. Shaded Radar Area Under Trajectory Curve
        const grad = ctx.createLinearGradient(0, curY, 0, originY);
        grad.addColorStop(0, 'rgba(0, 229, 255, 0.22)');
        grad.addColorStop(0.6, 'rgba(0, 229, 255, 0.05)');
        grad.addColorStop(1, 'rgba(0, 229, 255, 0.00)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(cpX, cpY, curX, curY);
        ctx.lineTo(curX, originY);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // 2. Glowing Flight Curve Line
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.quadraticCurveTo(cpX, cpY, curX, curY);
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.restore();

        // 3. Tangent Angle calculation for rocket orientation
        const t = progress;
        // Derivative of Quadratic Bezier: B'(t) = 2(1-t)(P1-P0) + 2t(P2-P1)
        const dx = 2 * (1 - t) * (cpX - originX) + 2 * t * (curX - cpX);
        const dy = 2 * (1 - t) * (cpY - originY) + 2 * t * (curY - cpY);
        const angle = Math.atan2(dy, dx);

        // 4. Emit Thruster Particles
        const nozzleX = curX - Math.cos(angle) * 18;
        const nozzleY = curY - Math.sin(angle) * 18;
        this.spawnThrusterParticles(nozzleX, nozzleY, angle);

        // 5. Draw Rocket
        this.drawRocket(ctx, curX, curY, angle, true);
    }

    drawRocket(ctx, x, y, angle, hasFlame) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(0.82, 0.82);

        // Fiery Thruster Flame
        if (hasFlame) {
            const flicker = Math.random() * 6 + 18;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-16, -5);
            ctx.lineTo(-16 - flicker, 0);
            ctx.lineTo(-16, 5);
            ctx.closePath();
            const flameGrad = ctx.createLinearGradient(-16, 0, -16 - flicker, 0);
            flameGrad.addColorStop(0, '#ffffff');
            flameGrad.addColorStop(0.3, '#ffcc00');
            flameGrad.addColorStop(0.7, '#ff3d00');
            flameGrad.addColorStop(1, 'rgba(255, 61, 0, 0)');
            ctx.fillStyle = flameGrad;
            ctx.shadowColor = '#ff6d00';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.restore();
        }

        // Rocket Wings / Fins
        ctx.fillStyle = '#ff3366';
        ctx.beginPath();
        ctx.moveTo(-8, -6);
        ctx.lineTo(-18, -14);
        ctx.lineTo(-12, -4);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-8, 6);
        ctx.lineTo(-18, 14);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();

        // Rocket Fuselage (Aerodynamic Body)
        ctx.beginPath();
        ctx.moveTo(20, 0); // Nose tip
        ctx.quadraticCurveTo(8, -8, -14, -7);
        ctx.lineTo(-16, 7);
        ctx.quadraticCurveTo(8, 8, 20, 0);
        ctx.closePath();

        const bodyGrad = ctx.createLinearGradient(0, -8, 0, 8);
        bodyGrad.addColorStop(0, '#ffffff');
        bodyGrad.addColorStop(0.45, '#e2e8f0');
        bodyGrad.addColorStop(0.85, '#94a3b8');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // Cockpit Glass Canopy
        ctx.beginPath();
        ctx.ellipse(4, 0, 6, 3, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 6;
        ctx.fill();

        // Chrome Edge Highlight
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.stroke();

        ctx.restore();
    }

    drawParticles(ctx) {
        ctx.save();
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            ctx.strokeStyle = `rgba(255, 51, 102, ${Math.max(0, sw.alpha)})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }
}

// Global Single Instance
window.spaceGame = new SpaceXYEngine();
