/**
 * Pinball Arcade Deluxe - Heavy Authentic 2.5D Physical Machine
 * Realistic 60FPS Physics Engine, Solenoid Flippers, Neon Pop Bumpers,
 * Spring Plunger, Dot Matrix Display (DMD), and Web Audio Synthesizer.
 * Integrated with Bet With Net Wallet System.
 */

class PinballDeluxeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 340;
        this.height = 540;
        this.dpr = 1;

        this.isPlaying = false;
        this.bet = 100;
        this.currentMultiplier = 1.0;
        this.score = 0;
        this.bumperHits = 0;
        this.rolloverCount = 0;
        this.allRolloversLit = false;
        this.soundEnabled = true;
        this.musicEnabled = false;
        this.currentMusicTrack = 0;
        this.currentTheme = localStorage.getItem('bwn_pinball_theme') || 'theme-cyber';

        this.themes = [
            {
                id: 'theme-cyber',
                name: '⚡ Cyber Neon 80s',
                badge: 'Retro Synth',
                cabinet: '#0d0d1a',
                playfield: '#090a14',
                gridColor: 'rgba(0, 229, 255, 0.12)',
                accent: '#00e5ff',
                bumperColors: ['#ff007f', '#00e5ff', '#ffeb3b'],
                flipperColor: '#ff007f',
                railColor: '#2a3b5c',
                ballGlow: '#00e5ff',
                dmdColor: '#ff007f',
                dmdBg: '#120412'
            },
            {
                id: 'theme-gold',
                name: '👑 Las Vegas VIP',
                badge: '24K Gold',
                cabinet: '#1a1205',
                playfield: '#140e06',
                gridColor: 'rgba(255, 215, 0, 0.10)',
                accent: '#ffd700',
                bumperColors: ['#ffd700', '#00e676', '#ff9100'],
                flipperColor: '#ffd700',
                railColor: '#614a1a',
                ballGlow: '#ffd700',
                dmdColor: '#ffd700',
                dmdBg: '#1a1402'
            },
            {
                id: 'theme-space',
                name: '🚀 Space Cadet 3D',
                badge: 'Galactic',
                cabinet: '#060a16',
                playfield: '#040711',
                gridColor: 'rgba(124, 77, 255, 0.12)',
                accent: '#7c4dff',
                bumperColors: ['#7c4dff', '#00e5ff', '#ff3366'],
                flipperColor: '#00e5ff',
                railColor: '#363d6b',
                ballGlow: '#7c4dff',
                dmdColor: '#ff9100',
                dmdBg: '#0e0b1c'
            }
        ];

        // Ball Physics State
        this.ball = {
            x: 320,
            y: 470,
            vx: 0,
            vy: 0,
            radius: 6.5,
            inPlay: false,
            inShooterLane: true,
            trail: []
        };

        this.gravity = 0.22;
        this.friction = 0.994;

        // Spring Plunger
        this.plunger = {
            x: 320,
            restY: 480,
            currentY: 480,
            maxPull: 50,
            isPulling: false,
            power: 0,
            autoLaunching: false
        };

        // Dual Flippers (Pivots and Geometry)
        this.leftFlipper = {
            pivotX: 95,
            pivotY: 455,
            length: 46,
            width: 9,
            restAngle: 0.52, // ~30 deg
            activeAngle: -0.55, // ~-32 deg
            currentAngle: 0.52,
            isPressed: false,
            angularVelocity: 0
        };

        this.rightFlipper = {
            pivotX: 205,
            pivotY: 455,
            length: 46,
            width: 9,
            restAngle: Math.PI - 0.52,
            activeAngle: Math.PI + 0.55,
            currentAngle: Math.PI - 0.52,
            isPressed: false,
            angularVelocity: 0
        };

        // 3 Classic Circular Pop Bumpers
        this.bumpers = [
            { x: 105, y: 165, radius: 21, pulse: 0, multAdd: 0.20, points: 200, label: '+0.2X', colorIdx: 0 },
            { x: 195, y: 165, radius: 21, pulse: 0, multAdd: 0.20, points: 200, label: '+0.2X', colorIdx: 1 },
            { x: 150, y: 228, radius: 23, pulse: 0, multAdd: 0.40, points: 400, label: '+0.4X', colorIdx: 2 }
        ];

        // Slingshot Kickers
        this.slingshots = [
            {
                p1: { x: 55, y: 375 },
                p2: { x: 75, y: 430 },
                p3: { x: 55, y: 430 },
                pulse: 0,
                multAdd: 0.15
            },
            {
                p1: { x: 245, y: 375 },
                p2: { x: 225, y: 430 },
                p3: { x: 245, y: 430 },
                pulse: 0,
                multAdd: 0.15
            }
        ];

        // 4 Top Rollover Lanes: B - O - N - U - S
        this.rollovers = [
            { x: 62, y: 78, width: 22, height: 26, lit: false, letter: 'B', multAdd: 0.35 },
            { x: 100, y: 72, width: 22, height: 26, lit: false, letter: 'O', multAdd: 0.35 },
            { x: 178, y: 72, width: 22, height: 26, lit: false, letter: 'N', multAdd: 0.35 },
            { x: 216, y: 78, width: 22, height: 26, lit: false, letter: 'U', multAdd: 0.35 }
        ];

        // Static Boundary Rails & Walls
        this.walls = [];
        this.buildStaticWalls();

        // Particles & Floating Text FX
        this.particles = [];
        this.floatingTexts = [];

        // DMD Display State
        this.dmdText = "★ PINBALL DELUXE ★";
        this.dmdSub = "PULL PLUNGER OR TAP AUTO LAUNCH";
        this.dmdTimer = null;

        // Music Tracks
        this.musicTracks = [
            '../assets/audio/slots_synth.wav',
            '../assets/audio/topspin_bgm.mp3'
        ];

        this.animFrameId = null;
        this.lastTime = 0;
    }

    init() {
        this.canvas = document.getElementById('pinball-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');

        this.setupDPI();
        window.addEventListener('resize', () => this.setupDPI());

        this.applyTheme(this.currentTheme);
        this.renderThemeCards();
        this.updateWalletHUD();
        this.setupAudio();
        this.setupControls();
        this.resetBallToShooter();
        this.highlightActiveChip(100);

        window.addEventListener('walletUpdated', () => this.updateWalletHUD());
        window.addEventListener('storage', () => this.updateWalletHUD());

        this.lastTime = performance.now();
        this.loop = this.loop.bind(this);
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    setupDPI() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        
        // Base coordinate size
        this.width = 340;
        this.height = 540;

        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    buildStaticWalls() {
        this.walls = [];
        const addWall = (x1, y1, x2, y2, restitution = 0.72) => {
            this.walls.push({ x1, y1, x2, y2, restitution });
        };

        // Left Boundary Outer Wall
        addWall(20, 160, 20, 480);
        addWall(20, 480, 50, 520); // bottom left slant

        // Shooter Lane Divider (Right side vertical rail)
        addWall(305, 120, 305, 520);

        // Right Outer Wall (Shooter lane right edge)
        addWall(335, 140, 335, 520);
        addWall(305, 520, 335, 520); // plunger bottom trough

        // Outlane / Inlane Dividers Left
        addWall(48, 380, 48, 470);
        addWall(48, 470, 75, 495); // inlane wire guide left
        addWall(20, 430, 42, 470); // outlane guide left

        // Outlane / Inlane Dividers Right
        addWall(252, 380, 252, 470);
        addWall(252, 470, 225, 495); // inlane wire guide right
        addWall(280, 430, 305, 470); // outlane guide right

        // Top Arch Arc Segments (Connecting Left Wall (20,160) to Right Wall (335,140))
        const cx = 170, cy = 110, rx = 150, ry = 100;
        const steps = 18;
        for (let i = 0; i < steps; i++) {
            const a1 = Math.PI + (i / steps) * Math.PI;
            const a2 = Math.PI + ((i + 1) / steps) * Math.PI;
            const x1 = cx + Math.cos(a1) * rx;
            const y1 = cy + Math.sin(a1) * ry;
            const x2 = cx + Math.cos(a2) * rx;
            const y2 = cy + Math.sin(a2) * ry;
            addWall(x1, y1, x2, y2, 0.85);
        }

        // Upper Deflector Guide (Routes ball exiting top shooter lane onto playfield)
        addWall(290, 45, 235, 30, 0.85);
    }

    /* -------------------------------------------------------------
       THEME MANAGEMENT
       ------------------------------------------------------------- */
    applyTheme(themeId) {
        document.body.classList.remove('theme-cyber', 'theme-gold', 'theme-space');
        document.body.classList.add(themeId);
        this.currentTheme = themeId;
        localStorage.setItem('bwn_pinball_theme', themeId);

        const theme = this.themes.find(t => t.id === themeId);
        const nameEl = document.getElementById('pb-current-theme-name');
        if (nameEl && theme) {
            nameEl.innerText = theme.name.split(' ')[0] + ' ' + theme.name.split(' ')[1];
        }
        this.renderThemeCards();
    }

    openThemeModal() {
        const modal = document.getElementById('pb-themes-modal');
        if (modal) modal.classList.add('open');
    }

    closeThemeModal() {
        const modal = document.getElementById('pb-themes-modal');
        if (modal) modal.classList.remove('open');
    }

    renderThemeCards() {
        const list = document.getElementById('pb-theme-cards-list');
        if (!list) return;
        list.innerHTML = this.themes.map(t => `
            <div class="pb-theme-card ${t.id === this.currentTheme ? 'selected' : ''}" onclick="window.pinball_deluxeGame.applyTheme('${t.id}')">
                <div class="pb-theme-card-top">
                    <span class="pb-theme-title">${t.name}</span>
                    <span class="pb-theme-badge" style="border-color:${t.accent}; color:${t.accent};">${t.badge}</span>
                </div>
            </div>
        `).join('');
    }

    /* -------------------------------------------------------------
       AUDIO ENGINE (Procedural Web Audio API + BGM)
       ------------------------------------------------------------- */
    setupAudio() {
        this.bgm = document.getElementById('pb-bgm-audio');
        if (this.bgm) {
            this.bgm.volume = 0.40;
            this.bgm.src = this.musicTracks[this.currentMusicTrack];
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch(e) {
            this.audioCtx = null;
        }

        const unlockAudio = () => {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            if (this.musicEnabled && this.bgm && this.bgm.paused) {
                this.bgm.play().catch(() => {});
            }
        };
        window.addEventListener('click', unlockAudio, { once: true, passive: true });
        window.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    }

    toggleMusic() {
        if (!this.bgm) return;
        if (this.musicEnabled) {
            this.bgm.pause();
            this.musicEnabled = false;
        } else {
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            this.bgm.play().then(() => {
                this.musicEnabled = true;
            }).catch(() => {
                this.musicEnabled = false;
            });
        }
        this.updateMusicUI();
    }

    switchMusicTrack(idx) {
        this.currentMusicTrack = idx;
        if (this.bgm) {
            this.bgm.src = this.musicTracks[this.currentMusicTrack];
            if (this.musicEnabled) {
                this.bgm.play().catch(() => {});
            }
        }
    }

    updateMusicUI() {
        const eq = document.getElementById('pb-music-eq');
        const lbl = document.getElementById('pb-music-label');
        if (eq) {
            eq.style.opacity = this.musicEnabled ? '1' : '0.4';
            const bars = eq.querySelectorAll('.eq-bar');
            bars.forEach(b => {
                b.style.animationPlayState = this.musicEnabled ? 'running' : 'paused';
            });
        }
        if (lbl) {
            lbl.innerText = this.musicEnabled ? 'Music ON' : 'Music OFF';
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const icon = document.getElementById('pb-sound-icon');
        if (icon) icon.innerText = this.soundEnabled ? '🔊' : '🔇';
    }

    // Procedural Pinball Sound Synthesizers
    playBumperSound(freq = 520) {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.04);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + 0.12);

            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch(e) {}
    }

    playFlipperSound(isUp = true) {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            const startF = isUp ? 180 : 120;
            const endF = isUp ? 340 : 80;
            osc.frequency.setValueAtTime(startF, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endF, ctx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.25, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch(e) {}
    }

    playPlungerLaunchSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.14);

            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.22);
        } catch(e) {}
    }

    playRolloverSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const notes = [659, 784, 987, 1318];
            const f = notes[Math.floor(Math.random() * notes.length)];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, ctx.currentTime);

            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch(e) {}
    }

    playJackpotSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            const ctx = this.audioCtx;
            const chords = [523.25, 659.25, 783.99, 1046.50];
            chords.forEach((note, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note, ctx.currentTime + i * 0.08);

                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.08 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime + i * 0.08);
                osc.stop(ctx.currentTime + i * 0.08 + 0.45);
            });
        } catch(e) {}
    }

    /* -------------------------------------------------------------
       INPUT & CONTROLS (Desktop Keys + Mobile Touch)
       ------------------------------------------------------------- */
    setupControls() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                this.setLeftFlipper(true);
            }
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                this.setRightFlipper(true);
            }
            if (e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                if (!this.isPlaying && this.ball.inShooterLane) {
                    this.chargePlunger();
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
                this.setLeftFlipper(false);
            }
            if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
                this.setRightFlipper(false);
            }
            if (e.key === ' ' || e.key === 'ArrowDown') {
                if (!this.isPlaying && this.ball.inShooterLane && this.plunger.isPulling) {
                    this.releasePlunger();
                }
            }
        });

        // Touch trigger buttons
        const leftBtn = document.getElementById('pb-btn-flip-left');
        const rightBtn = document.getElementById('pb-btn-flip-right');

        if (leftBtn) {
            leftBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.setLeftFlipper(true); });
            window.addEventListener('pointerup', () => this.setLeftFlipper(false));
            window.addEventListener('pointercancel', () => this.setLeftFlipper(false));
        }

        if (rightBtn) {
            rightBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); this.setRightFlipper(true); });
            window.addEventListener('pointerup', () => this.setRightFlipper(false));
            window.addEventListener('pointercancel', () => this.setRightFlipper(false));
        }

        // Canvas touch split: Tap left half -> Left Flipper, Tap right half -> Right Flipper
        if (this.canvas) {
            this.canvas.addEventListener('pointerdown', (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratioX = clickX / rect.width;

                if (ratioX > 0.88 && !this.isPlaying && this.ball.inShooterLane) {
                    // Tap on plunger lane launches
                    this.autoLaunch();
                    return;
                }

                if (ratioX < 0.5) {
                    this.setLeftFlipper(true);
                } else {
                    this.setRightFlipper(true);
                }
            });

            this.canvas.addEventListener('pointerup', () => {
                this.setLeftFlipper(false);
                this.setRightFlipper(false);
            });
        }
    }

    setLeftFlipper(pressed) {
        if (this.leftFlipper.isPressed !== pressed) {
            this.leftFlipper.isPressed = pressed;
            this.playFlipperSound(pressed);
        }
    }

    setRightFlipper(pressed) {
        if (this.rightFlipper.isPressed !== pressed) {
            this.rightFlipper.isPressed = pressed;
            this.playFlipperSound(pressed);
        }
    }

    /* -------------------------------------------------------------
       BETTING & WALLET INTEGRATION
       ------------------------------------------------------------- */
    setQuickBet(val) {
        this.bet = val;
        const input = document.getElementById('pb-bet-input');
        if (input) input.value = val;
        this.highlightActiveChip(val);
    }

    highlightActiveChip(val) {
        const chips = document.querySelectorAll('.casino-chip-3d');
        chips.forEach(c => {
            const chipVal = parseFloat(c.getAttribute('data-chip'));
            c.classList.toggle('active', chipVal === val);
        });
    }

    modifyBet(action) {
        const input = document.getElementById('pb-bet-input');
        if (!input) return;
        let cur = parseFloat(input.value) || 100;
        const bal = this.getWalletBalance();

        if (action === 'half') {
            cur = Math.max(10, Math.floor(cur / 2));
        } else if (action === 'double') {
            cur = Math.min(bal, Math.floor(cur * 2));
        } else if (action === 'max') {
            cur = Math.min(bal, 5000);
        }
        input.value = cur;
        this.bet = cur;
        this.highlightActiveChip(cur);
    }

    getWalletBalance() {
        if (typeof getRealWalletBalance === 'function') {
            return getRealWalletBalance();
        }
        return parseFloat(localStorage.getItem('BETWITHNET_balance') || '5000');
    }

    updateWalletHUD() {
        const bal = this.getWalletBalance();
        const el = document.getElementById('pb-wallet-balance');
        if (el) {
            el.innerText = `Rs. ${bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    /* -------------------------------------------------------------
       PLUNGER & BALL LAUNCH
       ------------------------------------------------------------- */
    chargePlunger() {
        if (this.isPlaying) return;
        this.plunger.isPulling = true;
        this.plunger.power = 0;
    }

    releasePlunger() {
        if (!this.plunger.isPulling) return;
        this.plunger.isPulling = false;
        const launchPower = Math.min(1.0, Math.max(0.35, this.plunger.power));
        this.fireBallWithPower(launchPower);
    }

    autoLaunch() {
        if (this.isPlaying) return;
        const input = document.getElementById('pb-bet-input');
        if (input) this.bet = parseFloat(input.value) || 100;

        const currentBal = this.getWalletBalance();
        if (this.bet > currentBal) {
            this.setDMD("LOW BALANCE!", `MIN RS. ${this.bet} REQUIRED`);
            alert("Insufficient Balance! Please recharge or adjust your bet.");
            return;
        }

        // Deduct bet from wallet
        let deducted = false;
        if (window.wallet && typeof window.wallet.placeBet === 'function') {
            deducted = window.wallet.placeBet(this.bet, 'Pinball Deluxe');
        } else if (typeof placeBet === 'function') {
            deducted = placeBet(this.bet);
        } else {
            // Local fallback
            const newBal = currentBal - this.bet;
            localStorage.setItem('BETWITHNET_balance', newBal.toString());
            window.dispatchEvent(new Event('walletUpdated'));
            deducted = true;
        }

        if (!deducted) return;

        this.updateWalletHUD();
        this.isPlaying = true;
        this.currentMultiplier = 1.0;
        this.score = 0;
        this.bumperHits = 0;
        this.rolloverCount = 0;
        this.rollovers.forEach(r => r.lit = false);
        this.allRolloversLit = false;

        this.setDMD("BALL LAUNCHED!", "ACCUMULATING MULTIPLIERS...");
        this.updateMultiplierDisplay();

        const launchBtn = document.getElementById('pb-launch-btn');
        if (launchBtn) {
            launchBtn.disabled = true;
            launchBtn.innerText = "BALL IN PLAY 🕹️";
        }

        // Random sweet-spot launch power between 0.75 and 0.98
        const pwr = 0.78 + Math.random() * 0.20;
        this.fireBallWithPower(pwr);
    }

    fireBallWithPower(power) {
        this.playPlungerLaunchSound();
        this.ball.x = 320;
        this.ball.y = 460;
        this.ball.vx = (Math.random() - 0.5) * 0.8;
        this.ball.vy = -(16.5 + power * 10.5);
        this.ball.inShooterLane = true;
        this.ball.inPlay = true;

        this.spawnSparks(this.ball.x, this.ball.y, 16, '#ffaa00');
    }

    resetBallToShooter() {
        this.ball.x = 320;
        this.ball.y = 480;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.inPlay = false;
        this.ball.inShooterLane = true;
        this.ball.trail = [];
        this.plunger.currentY = this.plunger.restY;
        this.plunger.power = 0;
        this.plunger.isPulling = false;

        const launchBtn = document.getElementById('pb-launch-btn');
        if (launchBtn) {
            launchBtn.disabled = false;
            launchBtn.innerText = "LAUNCH BALL 🕹️";
        }
    }

    /* -------------------------------------------------------------
       PHYSICS ENGINE & COLLISION DETECTION
       ------------------------------------------------------------- */
    updatePhysics() {
        // Update Plunger Charge Animation
        if (this.plunger.isPulling) {
            this.plunger.power = Math.min(1.0, this.plunger.power + 0.025);
            this.plunger.currentY = this.plunger.restY + this.plunger.power * this.plunger.maxPull;
            this.ball.y = this.plunger.currentY - this.ball.radius - 2;
        } else {
            this.plunger.currentY += (this.plunger.restY - this.plunger.currentY) * 0.35;
        }

        // Update Flippers Animation
        const flipperSpeed = 0.32;
        const targetLeft = this.leftFlipper.isPressed ? this.leftFlipper.activeAngle : this.leftFlipper.restAngle;
        const diffLeft = targetLeft - this.leftFlipper.currentAngle;
        this.leftFlipper.angularVelocity = diffLeft * flipperSpeed;
        this.leftFlipper.currentAngle += this.leftFlipper.angularVelocity;

        const targetRight = this.rightFlipper.isPressed ? this.rightFlipper.activeAngle : this.rightFlipper.restAngle;
        const diffRight = targetRight - this.rightFlipper.currentAngle;
        this.rightFlipper.angularVelocity = diffRight * flipperSpeed;
        this.rightFlipper.currentAngle += this.rightFlipper.angularVelocity;

        if (!this.ball.inPlay) return;

        // Apply Gravity
        this.ball.vy += this.gravity;
        this.ball.vx *= this.friction;
        this.ball.vy *= this.friction;

        // Cap Maximum Ball Velocity
        const maxV = 22;
        const currentV = Math.hypot(this.ball.vx, this.ball.vy);
        if (currentV > maxV) {
            this.ball.vx = (this.ball.vx / currentV) * maxV;
            this.ball.vy = (this.ball.vy / currentV) * maxV;
        }

        // Multi-substep Collision for High Velocity Stability
        const substeps = 4;
        const dt = 1 / substeps;

        for (let step = 0; step < substeps; step++) {
            this.ball.x += this.ball.vx * dt;
            this.ball.y += this.ball.vy * dt;

            // Check Shooter Lane Exit (Ball has passed the top curve into main arena)
            if (this.ball.inShooterLane && this.ball.x < 290 && this.ball.y < 120) {
                this.ball.inShooterLane = false;
                this.setDMD("SKILL SHOT ZONE!", "KEEP BALL ALIVE!");
            }

            // Wall Collisions
            for (let w of this.walls) {
                this.checkWallCollision(w);
            }

            // Pop Bumper Collisions
            for (let b of this.bumpers) {
                this.checkBumperCollision(b);
            }

            // Slingshot Collisions
            for (let s of this.slingshots) {
                this.checkSlingshotCollision(s);
            }

            // Rollover Lane Triggers
            for (let r of this.rollovers) {
                this.checkRolloverTrigger(r);
            }

            // Flipper Collisions
            this.checkFlipperCollision(this.leftFlipper, false);
            this.checkFlipperCollision(this.rightFlipper, true);
        }

        // Record Motion Trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 8) this.ball.trail.shift();

        // Check Drain Hole (Ball falls below flippers)
        if (this.ball.y > 540) {
            this.onBallDrained();
        }
    }

    checkWallCollision(wall) {
        const { x1, y1, x2, y2, restitution } = wall;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return;

        // Projection of ball center onto wall segment
        const t = Math.max(0, Math.min(1, ((this.ball.x - x1) * dx + (this.ball.y - y1) * dy) / lenSq));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        const distX = this.ball.x - projX;
        const distY = this.ball.y - projY;
        const dist = Math.hypot(distX, distY);

        if (dist < this.ball.radius && dist > 0) {
            const nx = distX / dist;
            const ny = distY / dist;

            // Separate ball from wall
            this.ball.x = projX + nx * this.ball.radius;
            this.ball.y = projY + ny * this.ball.radius;

            // Reflect velocity vector
            const dot = this.ball.vx * nx + this.ball.vy * ny;
            if (dot < 0) {
                this.ball.vx -= (1 + restitution) * dot * nx;
                this.ball.vy -= (1 + restitution) * dot * ny;

                if (Math.abs(dot) > 3) {
                    this.spawnSparks(projX, projY, 3, '#94a3b8');
                }
            }
        }
    }

    checkBumperCollision(b) {
        const dx = this.ball.x - b.x;
        const dy = this.ball.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minDist = this.ball.radius + b.radius;

        if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;

            // Push ball out
            this.ball.x = b.x + nx * minDist;
            this.ball.y = b.y + ny * minDist;

            // High impulse kick
            const kickSpeed = 12.5;
            this.ball.vx = nx * kickSpeed;
            this.ball.vy = ny * kickSpeed;

            // Bumper pulse animation & scoring
            b.pulse = 1.0;
            this.bumperHits++;
            this.currentMultiplier += b.multAdd;
            this.score += b.points;

            this.playBumperSound(480 + (this.bumperHits % 6) * 60);
            this.spawnSparks(b.x + nx * b.radius, b.y + ny * b.radius, 14, '#ffd700');
            this.spawnFloatingText(`+${b.multAdd.toFixed(2)}X!`, b.x, b.y - 15, '#ffd700');

            this.setDMD(`POP BUMPER +${b.multAdd.toFixed(2)}X!`, `TOTAL: ${this.currentMultiplier.toFixed(2)}X | ₨ ${(this.bet * this.currentMultiplier).toFixed(0)}`);
            this.updateMultiplierDisplay();
        }
    }

    checkSlingshotCollision(s) {
        const { p1, p2 } = s; // Front bouncing face
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        const t = Math.max(0, Math.min(1, ((this.ball.x - p1.x) * dx + (this.ball.y - p1.y) * dy) / lenSq));
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;

        const distX = this.ball.x - projX;
        const distY = this.ball.y - projY;
        const dist = Math.hypot(distX, distY);

        if (dist < this.ball.radius && dist > 0) {
            const nx = distX / dist;
            const ny = distY / dist;

            this.ball.x = projX + nx * this.ball.radius;
            this.ball.y = projY + ny * this.ball.radius;

            const kickSpeed = 11.0;
            this.ball.vx = nx * kickSpeed;
            this.ball.vy = Math.min(-6, ny * kickSpeed);

            s.pulse = 1.0;
            this.currentMultiplier += s.multAdd;
            this.score += 150;

            this.playBumperSound(380);
            this.spawnSparks(projX, projY, 8, '#00e5ff');
            this.spawnFloatingText(`+${s.multAdd.toFixed(2)}X`, projX, projY - 10, '#00e5ff');
            this.updateMultiplierDisplay();
        }
    }

    checkRolloverTrigger(r) {
        if (r.lit) return;
        if (
            this.ball.x >= r.x &&
            this.ball.x <= r.x + r.width &&
            this.ball.y >= r.y &&
            this.ball.y <= r.y + r.height
        ) {
            r.lit = true;
            this.rolloverCount++;
            this.currentMultiplier += r.multAdd;
            this.score += 300;

            this.playRolloverSound();
            this.spawnSparks(r.x + r.width / 2, r.y + r.height / 2, 10, '#00e676');
            this.spawnFloatingText(`+${r.multAdd.toFixed(2)}X`, r.x + 5, r.y - 12, '#00e676');

            // Check if all B-O-N-U-S lanes are lit
            if (this.rolloverCount >= this.rollovers.length && !this.allRolloversLit) {
                this.allRolloversLit = true;
                this.currentMultiplier += 3.0; // Mega Bonus
                this.score += 2500;
                this.playJackpotSound();
                this.spawnFloatingText("SUPER BONUS +3.00X!", 170, 100, '#ffd700');
                this.setDMD("★ SUPER BONUS UNLOCKED! ★", "+3.00X MULTIPLIER ADDED!");
            } else {
                this.setDMD(`LANE '${r.letter}' LIT!`, `BONUS PROGRESS ${this.rolloverCount}/4`);
            }
            this.updateMultiplierDisplay();
        }
    }

    checkFlipperCollision(flipper, isRight) {
        const angle = flipper.currentAngle;
        const tipX = flipper.pivotX + Math.cos(angle) * flipper.length;
        const tipY = flipper.pivotY + Math.sin(angle) * flipper.length;

        const dx = tipX - flipper.pivotX;
        const dy = tipY - flipper.pivotY;
        const lenSq = dx * dx + dy * dy;

        const t = Math.max(0, Math.min(1, ((this.ball.x - flipper.pivotX) * dx + (this.ball.y - flipper.pivotY) * dy) / lenSq));
        const projX = flipper.pivotX + t * dx;
        const projY = flipper.pivotY + t * dy;

        const distX = this.ball.x - projX;
        const distY = this.ball.y - projY;
        const dist = Math.hypot(distX, distY);

        if (dist < this.ball.radius + flipper.width / 2 && dist > 0) {
            const nx = distX / dist;
            const ny = distY / dist;

            this.ball.x = projX + nx * (this.ball.radius + flipper.width / 2);
            this.ball.y = projY + ny * (this.ball.radius + flipper.width / 2);

            // Compute Linear Velocity of Flipper Point
            const rArm = t * flipper.length;
            const vPerp = flipper.angularVelocity * rArm;
            const flipperVx = -Math.sin(angle) * vPerp;
            const flipperVy = Math.cos(angle) * vPerp;

            // Reflect and add flipper momentum
            const relVx = this.ball.vx - flipperVx;
            const relVy = this.ball.vy - flipperVy;
            const dot = relVx * nx + relVy * ny;

            if (dot < 0) {
                const restitution = 0.65;
                this.ball.vx -= (1 + restitution) * dot * nx;
                this.ball.vy -= (1 + restitution) * dot * ny;

                // Add active flip upward kick
                if (flipper.isPressed && (isRight ? flipper.angularVelocity > 0 : flipper.angularVelocity < 0)) {
                    this.ball.vy = Math.min(this.ball.vy, -13.0);
                    this.ball.vx += (isRight ? -4.5 : 4.5);
                    this.playFlipperSound(true);
                    this.spawnSparks(projX, projY, 8, '#ffffff');
                }
            }
        }
    }

    /* -------------------------------------------------------------
       BALL DRAIN & CASHOUT GAME OVER
       ------------------------------------------------------------- */
    onBallDrained() {
        this.isPlaying = false;
        const finalMult = Math.max(0.20, parseFloat(this.currentMultiplier.toFixed(2)));
        const winAmount = parseFloat((this.bet * finalMult).toFixed(2));

        // Credit Winnings to Wallet
        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(this.bet, winAmount, 'Pinball Deluxe', finalMult, 'PINBALL PAYOUT');
        } else {
            const curBal = this.getWalletBalance();
            const newBal = curBal + winAmount;
            localStorage.setItem('BETWITHNET_balance', newBal.toString());
            window.dispatchEvent(new Event('walletUpdated'));
        }

        this.updateWalletHUD();

        if (finalMult >= 1.0) {
            this.playJackpotSound();
            this.setDMD("WINNER! COLLECTING LOOT", `WON RS. ${winAmount.toFixed(2)} (${finalMult.toFixed(2)}X)`);
            this.openWinModal(winAmount, finalMult);
        } else {
            this.setDMD("BALL DRAINED!", `PAYOUT: RS. ${winAmount.toFixed(2)} (${finalMult.toFixed(2)}X)`);
        }

        setTimeout(() => {
            this.resetBallToShooter();
        }, 1200);
    }

    openWinModal(amount, mult) {
        const modal = document.getElementById('pb-win-modal');
        const amtEl = document.getElementById('pb-win-modal-amount');
        const multEl = document.getElementById('pb-win-modal-mult');
        if (amtEl) amtEl.innerText = `Rs. ${amount.toFixed(2)}`;
        if (multEl) multEl.innerText = `${mult.toFixed(2)}× ARCADE MULTIPLIER`;
        if (modal) modal.classList.add('open');
    }

    closeWinModal() {
        const modal = document.getElementById('pb-win-modal');
        if (modal) modal.classList.remove('open');
    }

    updateMultiplierDisplay() {
        const multEl = document.getElementById('pb-live-mult');
        if (multEl) {
            multEl.innerText = `${this.currentMultiplier.toFixed(2)}×`;
        }
        const payoutEl = document.getElementById('pb-live-payout');
        if (payoutEl) {
            const p = (this.bet * this.currentMultiplier).toFixed(2);
            payoutEl.innerText = `Rs. ${p}`;
        }
    }

    setDMD(title, sub = "") {
        this.dmdText = title;
        this.dmdSub = sub;
        const dmdTitleEl = document.getElementById('pb-dmd-title');
        const dmdSubEl = document.getElementById('pb-dmd-sub');
        if (dmdTitleEl) dmdTitleEl.innerText = title;
        if (dmdSubEl) dmdSubEl.innerText = sub;
    }

    /* -------------------------------------------------------------
       PARTICLES & VISUAL FX
       ------------------------------------------------------------- */
    spawnSparks(x, y, count = 8, color = '#ffd700') {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = Math.random() * 4 + 1.5;
            this.particles.push({
                x,
                y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                radius: Math.random() * 2.5 + 1.2,
                color,
                alpha: 1.0,
                decay: Math.random() * 0.04 + 0.02
            });
        }
    }

    spawnFloatingText(text, x, y, color = '#ffd700') {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -1.2,
            alpha: 1.0,
            color
        });
    }

    /* -------------------------------------------------------------
       MAIN RENDER LOOP (60 FPS HTML5 Canvas)
       ------------------------------------------------------------- */
    loop(timestamp) {
        this.updatePhysics();
        this.render();
        this.animFrameId = requestAnimationFrame(this.loop);
    }

    render() {
        const ctx = this.ctx;
        if (!ctx) return;

        const theme = this.themes.find(t => t.id === this.currentTheme) || this.themes[0];

        // 1. Playfield Background & Grid Pattern
        ctx.fillStyle = theme.playfield;
        ctx.fillRect(0, 0, this.width, this.height);

        // Retro perspective neon grid lines
        ctx.strokeStyle = theme.gridColor;
        ctx.lineWidth = 1;
        for (let y = 140; y < this.height - 40; y += 28) {
            ctx.beginPath();
            ctx.moveTo(20, y);
            ctx.lineTo(305, y);
            ctx.stroke();
        }
        for (let x = 30; x <= 300; x += 32) {
            ctx.beginPath();
            ctx.moveTo(x, 140);
            ctx.lineTo(x, this.height - 40);
            ctx.stroke();
        }

        // Center Playfield Emblem / Multiplier Star
        ctx.save();
        ctx.translate(150, 320);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const ang = (i * Math.PI) / 4;
            const r = i % 2 === 0 ? 44 : 22;
            const px = Math.cos(ang) * r;
            const py = Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

        // 2. Render Static Walls & Guide Rails
        ctx.strokeStyle = theme.railColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (let w of this.walls) {
            ctx.beginPath();
            ctx.moveTo(w.x1, w.y1);
            ctx.lineTo(w.x2, w.y2);
            ctx.stroke();
        }

        // 3. Render Top Rollover Lanes
        for (let r of this.rollovers) {
            ctx.save();
            ctx.fillStyle = r.lit ? 'rgba(0, 230, 118, 0.4)' : 'rgba(255, 255, 255, 0.06)';
            ctx.strokeStyle = r.lit ? '#00e676' : 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.fillRect(r.x, r.y, r.width, r.height);
            ctx.strokeRect(r.x, r.y, r.width, r.height);

            // Lit Indicator Light
            ctx.fillStyle = r.lit ? '#00e676' : '#555';
            ctx.beginPath();
            ctx.arc(r.x + r.width / 2, r.y + 6, 3, 0, Math.PI * 2);
            ctx.fill();

            // Letter
            ctx.font = '900 11px "JetBrains Mono", monospace';
            ctx.fillStyle = r.lit ? '#ffffff' : '#888';
            ctx.textAlign = 'center';
            ctx.fillText(r.letter, r.x + r.width / 2, r.y + 20);
            ctx.restore();
        }

        // 4. Render Pop Bumpers (3 Heavy 3D Bumpers)
        for (let b of this.bumpers) {
            ctx.save();
            const color = theme.bumperColors[b.colorIdx];
            const pulseScale = 1.0 + (b.pulse || 0) * 0.25;
            b.pulse = Math.max(0, (b.pulse || 0) - 0.05);

            // Outer Neon Glow Halo
            const glowGrad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.4, b.x, b.y, b.radius * 1.8 * pulseScale);
            glowGrad.addColorStop(0, color);
            glowGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGrad;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 1.8 * pulseScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Chrome Outer Skirt
            ctx.fillStyle = '#1e242e';
            ctx.strokeStyle = '#4a5568';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * pulseScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Glowing Inner Ring
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(b.x, b.y, (b.radius - 5) * pulseScale, 0, Math.PI * 2);
            ctx.fill();

            // Center Jewel / Multiplier Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '900 9.5px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            ctx.fillText(b.label, b.x, b.y);
            ctx.restore();
        }

        // 5. Render Slingshot Kickers
        for (let s of this.slingshots) {
            ctx.save();
            s.pulse = Math.max(0, (s.pulse || 0) - 0.06);
            ctx.fillStyle = s.pulse > 0 ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)';
            ctx.strokeStyle = s.pulse > 0 ? '#00e5ff' : '#4a5568';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(s.p1.x, s.p1.y);
            ctx.lineTo(s.p2.x, s.p2.y);
            ctx.lineTo(s.p3.x, s.p3.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // 6. Render Flippers (Left & Right Solenoids)
        this.renderFlipper(this.leftFlipper, theme.flipperColor);
        this.renderFlipper(this.rightFlipper, theme.flipperColor);

        // 7. Render Plunger (Shooter Lane Spring & Rod)
        ctx.save();
        const px = this.plunger.x;
        const py = this.plunger.currentY;

        // Plunger Spring Coil
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const coils = 9;
        const coilHeight = (520 - py) / coils;
        for (let i = 0; i <= coils; i++) {
            const yPos = py + i * coilHeight;
            const xOffset = (i % 2 === 0 ? 5 : -5);
            if (i === 0) ctx.moveTo(px, yPos);
            else ctx.lineTo(px + xOffset, yPos);
        }
        ctx.stroke();

        // Plunger Tip Cap
        ctx.fillStyle = '#e2e8f0';
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(px - 10, py - 4, 20, 8, 3);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 8. Render Chrome Ball & Motion Trail
        if (this.ball.inPlay || this.ball.inShooterLane) {
            // Speed Trail
            for (let i = 0; i < this.ball.trail.length; i++) {
                const t = this.ball.trail[i];
                const alpha = (i + 1) / this.ball.trail.length * 0.35;
                ctx.fillStyle = theme.ballGlow;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(t.x, t.y, this.ball.radius * 0.85, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1.0;

            // 3D Metallic Chrome Ball
            ctx.save();
            const ballGrad = ctx.createRadialGradient(
                this.ball.x - 2, this.ball.y - 2, 1,
                this.ball.x, this.ball.y, this.ball.radius
            );
            ballGrad.addColorStop(0, '#ffffff');
            ballGrad.addColorStop(0.35, '#d1d5db');
            ballGrad.addColorStop(0.75, '#6b7280');
            ballGrad.addColorStop(1, '#1f2937');

            ctx.fillStyle = ballGrad;
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetY = 3;
            ctx.beginPath();
            ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
            ctx.fill();

            // Specular Highlight Glint
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(this.ball.x - 2, this.ball.y - 2, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 9. Render Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;

        // 10. Render Floating Scores/Multipliers
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy;
            ft.alpha -= 0.02;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = '900 12px "JetBrains Mono", monospace';
            ctx.fillStyle = ft.color;
            ctx.shadowColor = 'rgba(0,0,0,0.9)';
            ctx.shadowBlur = 4;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        // 11. Glass Sheen / Reflection Overlay
        ctx.save();
        const glassGrad = ctx.createLinearGradient(0, 0, this.width, this.height);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        glassGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.02)');
        glassGrad.addColorStop(0.7, 'rgba(0, 229, 255, 0.03)');
        glassGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glassGrad;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }

    renderFlipper(flipper, color) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(flipper.pivotX, flipper.pivotY);
        ctx.rotate(flipper.currentAngle);

        // Flipper Bat Body
        const fl = flipper.length;
        const w = flipper.width;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.arc(0, 0, w / 2, Math.PI / 2, -Math.PI / 2);
        ctx.lineTo(fl, -w / 3.5);
        ctx.arc(fl, 0, w / 3.5, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(0, w / 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rubber Band Ring
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(0, 0, w / 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Global Export
window.pinball_deluxeGame = new PinballDeluxeGame();