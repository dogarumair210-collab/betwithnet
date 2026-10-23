// ============================================================
// TopSpin 3D - Multi-Theme High-Roller Gyroscope Engine & Audio
// Bet With Net Casino Studio
// ============================================================

const TOPSPIN_THEMES = {
    royale: {
        id: 'royale',
        name: 'Royale 24K Gold',
        icon: '👑',
        desc: 'Macau High-Roller VIP Velvet Felt & 24K Gold',
        bodyClass: 'theme-royale',
        bg: '#070913',
        gradient: 'radial-gradient(circle at 50% 25%, #1b2640 0%, #0b0f1c 55%, #040508 100%)',
        rim: ['#53380b', '#855b14', '#ffd700', '#fff4b8', '#d4af37'],
        rimBorder: '#ffd700',
        studColor1: '#ffffff',
        studColor2: '#ffd700',
        spindle: ['#ffffff', '#fff2a8', '#e5b128', '#996515', '#4a2f05'],
        gem: ['#ff99aa', '#ff1744', '#b71c1c', '#4a000d'],
        gemBorder: '#ffffff',
        pointerGold: ['#fff8db', '#ffd700', '#b8860b', '#664600'],
        pointerGem: ['#ff8099', '#ff1744', '#7a0014'],
        needleStroke: '#ffd700',
        stageGlow: 'rgba(255, 215, 0, 0.45)',
        accent: '#ffd700',
        cardBorder: 'rgba(255, 215, 0, 0.25)',
        chipColor: '#d4af37',
        quads: [
            { id: 1, name: 'RED', symbol: '👑', startColor: '#ff1744', endColor: '#99001a', textColor: '#ffffff' },
            { id: 2, name: 'GREEN', symbol: '🍀', startColor: '#00e676', endColor: '#006629', textColor: '#ffffff' },
            { id: 3, name: 'BLUE', symbol: '💎', startColor: '#00b0ff', endColor: '#004c8c', textColor: '#ffffff' },
            { id: 4, name: 'YELLOW', symbol: '⚡', startColor: '#ffd600', endColor: '#b28900', textColor: '#1a1000' }
        ]
    },
    cyber: {
        id: 'cyber',
        name: 'Cyberpunk 2077',
        icon: '⚡',
        desc: 'Tokyo Synthwave Laser Grid & Holograms',
        bodyClass: 'theme-cyber',
        bg: '#050414',
        gradient: 'radial-gradient(circle at 50% 25%, #241045 0%, #0d061f 55%, #03010a 100%)',
        rim: ['#0f0c2e', '#231b54', '#00f0ff', '#ffffff', '#7c4dff'],
        rimBorder: '#00f0ff',
        studColor1: '#00f0ff',
        studColor2: '#ff007f',
        spindle: ['#ffffff', '#d4faff', '#00e5ff', '#0077b6', '#02182b'],
        gem: ['#ffc2eb', '#ff007f', '#a30052', '#3d001e'],
        gemBorder: '#00f0ff',
        pointerGold: ['#ffffff', '#00f0ff', '#0091ea', '#002b4d'],
        pointerGem: ['#ffffff', '#ff007f', '#800040'],
        needleStroke: '#00f0ff',
        stageGlow: 'rgba(0, 240, 255, 0.5)',
        accent: '#00f0ff',
        cardBorder: 'rgba(0, 240, 255, 0.35)',
        chipColor: '#00f0ff',
        quads: [
            { id: 1, name: 'LASER', symbol: '⚡', startColor: '#ff007f', endColor: '#8a0044', textColor: '#ffffff' },
            { id: 2, name: 'MATRIX', symbol: '👾', startColor: '#00ff88', endColor: '#006633', textColor: '#ffffff' },
            { id: 3, name: 'PLASMA', symbol: '🔮', startColor: '#00f0ff', endColor: '#0059b3', textColor: '#ffffff' },
            { id: 4, name: 'AMBER', symbol: '💥', startColor: '#ffbe00', endColor: '#997300', textColor: '#1a1000' }
        ]
    },
    emerald: {
        id: 'emerald',
        name: 'Macau Jade VIP',
        icon: '🎰',
        desc: 'Imperial Asian Dragon Palace & Pure Jade',
        bodyClass: 'theme-emerald',
        bg: '#02120a',
        gradient: 'radial-gradient(circle at 50% 25%, #0e3d24 0%, #051a0e 55%, #010804 100%)',
        rim: ['#2e4720', '#4d7c2a', '#d4af37', '#fff1a8', '#1a3311'],
        rimBorder: '#d4af37',
        studColor1: '#00e676',
        studColor2: '#ffd700',
        spindle: ['#ffffff', '#fff7c2', '#d4af37', '#73570c', '#332604'],
        gem: ['#bbf7d0', '#00e676', '#047857', '#022c22'],
        gemBorder: '#ffd700',
        pointerGold: ['#fff8db', '#ffd700', '#b8860b', '#473200'],
        pointerGem: ['#dcfce7', '#00e676', '#065f46'],
        needleStroke: '#ffd700',
        stageGlow: 'rgba(0, 230, 118, 0.45)',
        accent: '#00e676',
        cardBorder: 'rgba(0, 230, 118, 0.3)',
        chipColor: '#00e676',
        quads: [
            { id: 1, name: 'DRAGON', symbol: '🐉', startColor: '#e11d48', endColor: '#881337', textColor: '#ffffff' },
            { id: 2, name: 'JADE', symbol: '🍃', startColor: '#10b981', endColor: '#064e3b', textColor: '#ffffff' },
            { id: 3, name: 'LOTUS', symbol: '🪷', startColor: '#0284c7', endColor: '#075985', textColor: '#ffffff' },
            { id: 4, name: 'GOLDEN', symbol: '🪙', startColor: '#f59e0b', endColor: '#78350f', textColor: '#1a1000' }
        ]
    },
    galaxy: {
        id: 'galaxy',
        name: 'Cosmic Nebula',
        icon: '🌌',
        desc: 'Interstellar Supernova & Crystal Void',
        bodyClass: 'theme-galaxy',
        bg: '#060312',
        gradient: 'radial-gradient(circle at 50% 25%, #220b42 0%, #0a0418 55%, #020106 100%)',
        rim: ['#120826', '#2b1459', '#b388ff', '#ffffff', '#45177a'],
        rimBorder: '#b388ff',
        studColor1: '#ffffff',
        studColor2: '#b388ff',
        spindle: ['#ffffff', '#e8daff', '#b388ff', '#512da8', '#1a0933'],
        gem: ['#e1bee7', '#ab47bc', '#6a1b9a', '#240046'],
        gemBorder: '#ffffff',
        pointerGold: ['#ffffff', '#b388ff', '#7c4dff', '#311b92'],
        pointerGem: ['#ffffff', '#e040fb', '#7b1fa2'],
        needleStroke: '#b388ff',
        stageGlow: 'rgba(179, 136, 255, 0.5)',
        accent: '#b388ff',
        cardBorder: 'rgba(179, 136, 255, 0.35)',
        chipColor: '#b388ff',
        quads: [
            { id: 1, name: 'PULSAR', symbol: '✨', startColor: '#f43f5e', endColor: '#881337', textColor: '#ffffff' },
            { id: 2, name: 'AURORA', symbol: '🌌', startColor: '#06b6d4', endColor: '#164e63', textColor: '#ffffff' },
            { id: 3, name: 'VOID', symbol: '🪐', startColor: '#8b5cf6', endColor: '#4c1d95', textColor: '#ffffff' },
            { id: 4, name: 'SOLAR', symbol: '☀️', startColor: '#fbbf24', endColor: '#92400e', textColor: '#1a1000' }
        ]
    },
    inferno: {
        id: 'inferno',
        name: 'Inferno Magma',
        icon: '🌋',
        desc: 'Volcanic Basalt Rock & Molten Lava Core',
        bodyClass: 'theme-inferno',
        bg: '#140402',
        gradient: 'radial-gradient(circle at 50% 25%, #3d0c04 0%, #1a0502 55%, #080100 100%)',
        rim: ['#2b0a04', '#591408', '#ff4500', '#ffd700', '#1f0502'],
        rimBorder: '#ff4500',
        studColor1: '#ffd700',
        studColor2: '#ff3d00',
        spindle: ['#ffffff', '#ffe0b2', '#ff6f00', '#bf360c', '#3e1100'],
        gem: ['#ffcc80', '#ff3d00', '#bf360c', '#3e0e00'],
        gemBorder: '#ffd700',
        pointerGold: ['#fff3e0', '#ff6d00', '#d84315', '#4e1400'],
        pointerGem: ['#ffffff', '#ff1744', '#b71c1c'],
        needleStroke: '#ff6d00',
        stageGlow: 'rgba(255, 69, 0, 0.5)',
        accent: '#ff5722',
        cardBorder: 'rgba(255, 87, 34, 0.35)',
        chipColor: '#ff5722',
        quads: [
            { id: 1, name: 'MAGMA', symbol: '🔥', startColor: '#dc2626', endColor: '#7f1d1d', textColor: '#ffffff' },
            { id: 2, name: 'VENOM', symbol: '🐍', startColor: '#84cc16', endColor: '#365314', textColor: '#ffffff' },
            { id: 3, name: 'BLAZE', symbol: '⚡', startColor: '#0284c7', endColor: '#0c4a6e', textColor: '#ffffff' },
            { id: 4, name: 'EMBER', symbol: '💥', startColor: '#ea580c', endColor: '#7c2d12', textColor: '#ffffff' }
        ]
    }
};

class TopSpinSoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxMuted = localStorage.getItem('topspin_sfx_muted') === 'true';
        this.musicMuted = localStorage.getItem('topspin_music_muted') === 'true';
        this.spinOsc = null;
        this.spinGain = null;
        this.bgmAudio = null;
        this.bgmPlaying = false;
        this.targetMusicVolume = 0.35;
        this.tracks = [
            { id: 'sweet', name: 'Sweet Spin Melody', src: '../assets/audio/topspin_bgm.mp3' },
            { id: 'lounge', name: 'VIP Casino Lounge', src: '../assets/audio/topspin_lounge.mp3' }
        ];
        this.currentTrackIdx = 0;
    }

    init() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && !this.ctx) {
                this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        } catch(e) {}
    }

    initBGM() {
        if (this.bgmAudio) return;
        try {
            const el = document.getElementById('ts-bgm-audio');
            if (el) {
                this.bgmAudio = el;
            } else {
                this.bgmAudio = new Audio(this.tracks[this.currentTrackIdx].src);
            }
            this.bgmAudio.loop = true;
            this.bgmAudio.volume = this.musicMuted ? 0 : this.targetMusicVolume;
            this.bgmAudio.preload = 'auto';

            this.bgmAudio.addEventListener('play', () => {
                this.bgmPlaying = true;
                this.updateMusicUI();
            });
            this.bgmAudio.addEventListener('pause', () => {
                this.bgmPlaying = false;
                this.updateMusicUI();
            });
            this.bgmAudio.addEventListener('ended', () => {
                this.bgmAudio.currentTime = 0;
                this.bgmAudio.play().catch(() => {});
            });
        } catch(e) {}
    }

    startBGM() {
        if (this.musicMuted) return;
        this.initBGM();
        if (!this.bgmAudio) return;
        try {
            this.bgmAudio.volume = this.targetMusicVolume;
            const playPromise = this.bgmAudio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.bgmPlaying = true;
                    this.updateMusicUI();
                }).catch(() => {
                    // Autoplay restriction will unlock on user interaction
                });
            }
        } catch(e) {}
    }

    pauseBGM() {
        if (this.bgmAudio) {
            try {
                this.bgmAudio.pause();
            } catch(e) {}
            this.bgmPlaying = false;
            this.updateMusicUI();
        }
    }

    toggleMusic() {
        this.initBGM();
        this.musicMuted = !this.musicMuted;
        localStorage.setItem('topspin_music_muted', this.musicMuted);

        if (this.musicMuted) {
            this.pauseBGM();
        } else {
            this.startBGM();
        }
        this.updateMusicUI();
        this.playChip();
    }

    duckMusic(ducked = true) {
        if (!this.bgmAudio || this.musicMuted) return;
        try {
            this.bgmAudio.volume = ducked ? 0.16 : this.targetMusicVolume;
        } catch(e) {}
    }

    switchTrack(trackIdx) {
        if (trackIdx === undefined) {
            this.currentTrackIdx = (this.currentTrackIdx + 1) % this.tracks.length;
        } else {
            this.currentTrackIdx = trackIdx % this.tracks.length;
        }
        const wasPlaying = this.bgmPlaying && !this.musicMuted;
        if (this.bgmAudio) {
            this.bgmAudio.pause();
            this.bgmAudio.src = this.tracks[this.currentTrackIdx].src;
            this.bgmAudio.currentTime = 0;
            if (wasPlaying) {
                this.startBGM();
            }
        }
        this.updateMusicUI();
    }

    updateMusicUI() {
        const btn = document.getElementById('ts-music-btn');
        const label = document.getElementById('ts-music-label');
        if (btn) {
            btn.classList.toggle('muted', this.musicMuted);
            btn.classList.toggle('music-playing', this.bgmPlaying && !this.musicMuted);
        }
        if (label) {
            label.textContent = this.musicMuted ? 'Muted' : 'Music';
        }
    }

    playChip() {
        if (this.sfxMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1350, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(350, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.26, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.08);
        } catch(e) {}
    }

    playTick() {
        if (this.sfxMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1900, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.035);
            gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.035);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.035);
        } catch(e) {}
    }

    startSpinSound() {
        if (this.sfxMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            this.stopSpinSound();
            this.spinOsc = this.ctx.createOscillator();
            this.spinGain = this.ctx.createGain();
            this.spinOsc.type = 'sawtooth';
            
            const lowpass = this.ctx.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.setValueAtTime(340, this.ctx.currentTime);

            this.spinOsc.frequency.setValueAtTime(150, this.ctx.currentTime);
            this.spinOsc.frequency.linearRampToValueAtTime(520, this.ctx.currentTime + 0.6);

            this.spinGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
            this.spinGain.gain.linearRampToValueAtTime(0.14, this.ctx.currentTime + 0.5);

            this.spinOsc.connect(lowpass);
            lowpass.connect(this.spinGain);
            this.spinGain.connect(this.ctx.destination);

            this.spinOsc.start();
        } catch(e) {}
    }

    updateSpinPitch(progress) {
        if (!this.spinOsc || !this.spinGain || !this.ctx) return;
        try {
            const factor = Math.max(0, 1 - progress);
            const freq = 130 + 390 * factor;
            this.spinOsc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            this.spinGain.gain.setValueAtTime(0.14 * factor, this.ctx.currentTime);
        } catch(e) {}
    }

    stopSpinSound() {
        try {
            if (this.spinGain && this.ctx) {
                this.spinGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
            }
            if (this.spinOsc) {
                setTimeout(() => {
                    try { this.spinOsc.stop(); } catch(e) {}
                    this.spinOsc = null;
                }, 100);
            }
        } catch(e) {
            this.spinOsc = null;
        }
    }

    playWin() {
        if (this.sfxMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.09);
                gain.gain.setValueAtTime(0.24, this.ctx.currentTime + idx * 0.09);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.09 + 0.38);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + idx * 0.09);
                osc.stop(this.ctx.currentTime + idx * 0.09 + 0.38);
            });
        } catch(e) {}
    }

    playLoss() {
        if (this.sfxMuted) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(260, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(85, this.ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.3);
        } catch(e) {}
    }
}

class TopSpinGame {
    constructor() {
        this.selectedQuad = 1;
        this.betAmount = 100;
        this.isPlaying = false;
        this.canvas = null;
        this.ctx = null;
        this.angle = 0;
        this.wobbleX = 0;
        this.wobbleY = 0;
        this.speedVelocity = 0;
        this.lastSectorCrossed = -1;
        this.winningQuad = null;
        this.isSettled = false;
        this.history = [1, 3, 2, 4, 1, 2, 3];
        this.soundEngine = new TopSpinSoundEngine();
        this.particles = [];
        this.sparks = [];
        this.confettiCanvas = null;
        this.confettiCtx = null;
        this.confettiActive = false;
        this.currentThemeKey = localStorage.getItem('topspin_theme') || 'royale';
        if (!TOPSPIN_THEMES[this.currentThemeKey]) this.currentThemeKey = 'royale';
    }

    init() {
        this.canvas = document.getElementById('topspin-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupHiDPI(this.canvas, this.ctx, 280, 280);
            this.drawTop(0, 0, 0, null, false);
        }

        this.confettiCanvas = document.getElementById('confetti-canvas');
        if (this.confettiCanvas) {
            this.confettiCtx = this.confettiCanvas.getContext('2d');
            this.resizeConfetti();
            window.addEventListener('resize', () => this.resizeConfetti());
        }

        this.applyTheme(this.currentThemeKey);
        this.renderThemeModalCards();
        this.renderHistory();
        this.updateWalletDisplay();
        this.updateChipPlacement(this.selectedQuad);

        // Initialize BGM
        this.soundEngine.initBGM();
        this.soundEngine.updateMusicUI();

        // Autoplay unlocker on ANY interaction
        const unlockAudio = () => {
            this.soundEngine.init();
            if (!this.soundEngine.musicMuted) {
                this.soundEngine.startBGM();
            }
            ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(ev => {
                document.removeEventListener(ev, unlockAudio);
            });
        };
        ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(ev => {
            document.addEventListener(ev, unlockAudio, { passive: true });
        });

        // Try playing immediately if browser allows
        if (!this.soundEngine.musicMuted) {
            this.soundEngine.startBGM();
        }

        const icon = document.getElementById('ts-sound-icon');
        if (icon) {
            icon.textContent = this.soundEngine.sfxMuted ? '🔇' : '🔊';
        }

        window.addEventListener('storage', () => this.updateWalletDisplay());
    }

    setupHiDPI(canvas, ctx, width, height) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        ctx.scale(dpr, dpr);
    }

    resizeConfetti() {
        if (!this.confettiCanvas) return;
        this.confettiCanvas.width = window.innerWidth;
        this.confettiCanvas.height = window.innerHeight;
    }

    getTheme() {
        return TOPSPIN_THEMES[this.currentThemeKey] || TOPSPIN_THEMES.royale;
    }

    setTheme(themeKey) {
        if (!TOPSPIN_THEMES[themeKey]) return;
        this.currentThemeKey = themeKey;
        localStorage.setItem('topspin_theme', themeKey);
        this.applyTheme(themeKey);
        this.renderThemeModalCards();
        this.drawTop(this.angle, this.wobbleX, this.wobbleY, this.winningQuad, this.isSettled);
        this.soundEngine.playChip();
        this.closeThemeModal();
    }

    openThemeModal() {
        const modal = document.getElementById('ts-themes-modal');
        if (modal) modal.classList.add('open');
        this.soundEngine.playChip();
    }

    closeThemeModal() {
        const modal = document.getElementById('ts-themes-modal');
        if (modal) modal.classList.remove('open');
    }

    applyTheme(themeKey) {
        const t = TOPSPIN_THEMES[themeKey] || TOPSPIN_THEMES.royale;
        
        Object.values(TOPSPIN_THEMES).forEach(th => {
            document.body.classList.remove(th.bodyClass);
        });
        document.body.classList.add(t.bodyClass);

        const themeBtnText = document.getElementById('ts-current-theme-name');
        if (themeBtnText) {
            const shortName = t.name.split(' ')[0];
            themeBtnText.textContent = `${t.icon} ${shortName}`;
        }

        const needleGold = document.getElementById('needleGold');
        if (needleGold && t.pointerGold) {
            needleGold.innerHTML = `
                <stop offset="0%" stop-color="${t.pointerGold[0]}" />
                <stop offset="40%" stop-color="${t.pointerGold[1]}" />
                <stop offset="80%" stop-color="${t.pointerGold[2]}" />
                <stop offset="100%" stop-color="${t.pointerGold[3]}" />
            `;
        }

        const needleRuby = document.getElementById('needleRuby');
        if (needleRuby && t.pointerGem) {
            needleRuby.innerHTML = `
                <stop offset="0%" stop-color="${t.pointerGem[0]}" />
                <stop offset="50%" stop-color="${t.pointerGem[1]}" />
                <stop offset="100%" stop-color="${t.pointerGem[2]}" />
            `;
        }

        const needleEl = document.getElementById('ts-needle-pointer');
        if (needleEl) {
            const path = needleEl.querySelector('path');
            if (path) path.setAttribute('stroke', t.needleStroke || '#ffd700');
        }

        t.quads.forEach(q => {
            const card = document.querySelector(`.ts-quad-card[data-quad="${q.id}"]`);
            if (card) {
                const title = card.querySelector('.quad-title');
                const symbol = card.querySelector('.quad-symbol');
                if (title) title.textContent = q.name;
                if (symbol) symbol.textContent = q.symbol;
            }
        });

        this.updateChipPlacement(this.selectedQuad);
    }

    renderThemeModalCards() {
        const container = document.getElementById('ts-theme-cards-list');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(TOPSPIN_THEMES).forEach(key => {
            const th = TOPSPIN_THEMES[key];
            const isActive = (key === this.currentThemeKey);

            const card = document.createElement('div');
            card.className = `ts-theme-choice-card ${isActive ? 'active' : ''}`;
            card.onclick = () => this.setTheme(key);

            const swatches = th.quads.map(q => `<span class="swatch-dot" style="background:${q.startColor};"></span>`).join('');

            card.innerHTML = `
                <div class="theme-choice-header">
                    <span class="theme-choice-icon">${th.icon}</span>
                    <div class="theme-choice-info">
                        <div class="theme-choice-title">${th.name}</div>
                        <div class="theme-choice-desc">${th.desc}</div>
                    </div>
                    ${isActive ? '<span class="theme-active-pill">ACTIVE</span>' : ''}
                </div>
                <div class="theme-swatches-row">
                    ${swatches}
                </div>
            `;
            container.appendChild(card);
        });
    }

    toggleMusic() {
        this.soundEngine.toggleMusic();
    }

    switchMusicTrack(idx) {
        this.soundEngine.switchTrack(idx);
        this.soundEngine.playChip();
    }

    toggleSound() {
        this.soundEngine.sfxMuted = !this.soundEngine.sfxMuted;
        localStorage.setItem('topspin_sfx_muted', this.soundEngine.sfxMuted);
        const icon = document.getElementById('ts-sound-icon');
        if (icon) {
            icon.textContent = this.soundEngine.sfxMuted ? '🔇' : '🔊';
        }
    }

    selectQuad(q) {
        if (this.isPlaying) return;
        this.selectedQuad = q;
        document.querySelectorAll('.ts-quad-card').forEach(card => {
            const cardQuad = parseInt(card.dataset.quad);
            card.classList.toggle('active', cardQuad === q);
        });

        this.updateChipPlacement(q);
        this.soundEngine.playChip();
    }

    updateChipPlacement(q) {
        document.querySelectorAll('.ts-quad-card .chip-badge').forEach(b => b.remove());
        const activeCard = document.querySelector(`.ts-quad-card[data-quad="${q}"]`);
        if (activeCard) {
            const chip = document.createElement('div');
            chip.className = 'chip-badge';
            const val = document.getElementById('ts-bet-input') ? document.getElementById('ts-bet-input').value : '100';
            chip.innerHTML = `<span>Rs.${val}</span>`;
            activeCard.appendChild(chip);
        }
    }

    setQuickBet(val) {
        if (this.isPlaying) return;
        const input = document.getElementById('ts-bet-input');
        if (input) {
            input.value = val;
            this.betAmount = parseFloat(val);
            this.updateChipPlacement(this.selectedQuad);
            this.soundEngine.playChip();
        }
    }

    modifyBet(action) {
        if (this.isPlaying) return;
        const input = document.getElementById('ts-bet-input');
        if (!input) return;
        let curr = parseFloat(input.value) || 100;
        const maxBal = this.getRealBalance();

        if (action === 'half') {
            curr = Math.max(10, Math.floor(curr / 2));
        } else if (action === 'double') {
            curr = Math.min(maxBal > 0 ? maxBal : 50000, curr * 2);
        } else if (action === 'max') {
            curr = maxBal > 0 ? Math.floor(maxBal) : 10000;
        }
        input.value = curr;
        this.betAmount = curr;
        this.updateChipPlacement(this.selectedQuad);
        this.soundEngine.playChip();
    }

    getRealBalance() {
        if (typeof getRealWalletBalance === 'function') {
            return getRealWalletBalance();
        }
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return window.wallet.getBalance();
        }
        try {
            const u = JSON.parse(localStorage.getItem('bwn_session_user') || 'null');
            if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
                return parseFloat(u.balance_pkr || u.balancePKR);
            }
            const s = localStorage.getItem('BETWITHNET_balance');
            if (s !== null) return parseFloat(s);
        } catch(e) {}
        return 5000;
    }

    updateWalletDisplay() {
        const bal = this.getRealBalance();
        const displayEl = document.getElementById('ts-wallet-balance');
        if (displayEl) {
            displayEl.textContent = 'Rs. ' + bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    renderHistory() {
        const container = document.getElementById('ts-history-chips');
        if (!container) return;
        container.innerHTML = '';

        const th = this.getTheme();
        this.history.slice(0, 10).forEach(qId => {
            const qMeta = th.quads.find(item => item.id === qId) || th.quads[0];
            const chip = document.createElement('div');
            chip.className = 'history-pill';
            chip.style.borderColor = qMeta.startColor;
            chip.style.color = qMeta.startColor;
            chip.style.boxShadow = `0 0 8px ${qMeta.startColor}33`;
            chip.innerHTML = `<span class="pill-dot" style="background:${qMeta.startColor}"></span>#${qId} ${qMeta.name}`;
            container.appendChild(chip);
        });
    }

    drawTop(rot, wobbleX = 0, wobbleY = 0, winningSector = null, isSettled = false) {
        if (!this.ctx) return;
        const w = 280, h = 280;
        const cx = w / 2 + wobbleX, cy = h / 2 + wobbleY;
        const r = 118;
        const th = this.getTheme();

        this.ctx.clearRect(0, 0, w, h);

        // 1. Dynamic 3D Floor Shadow
        this.ctx.save();
        this.ctx.beginPath();
        const shadowScale = 0.38 + Math.abs(wobbleX) * 0.015;
        this.ctx.ellipse(w / 2 + wobbleX * 1.5, h / 2 + 75 + wobbleY * 0.5, r * 0.85, r * shadowScale, 0, 0, Math.PI * 2);
        const shadowGrad = this.ctx.createRadialGradient(
            w / 2 + wobbleX * 1.5, h / 2 + 75 + wobbleY * 0.5, 5,
            w / 2 + wobbleX * 1.5, h / 2 + 75 + wobbleY * 0.5, r * 0.85
        );
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = shadowGrad;
        this.ctx.fill();
        this.ctx.restore();

        // 2. High-speed Sparkles / Sparks
        if (this.isPlaying && this.speedVelocity > 0.08) {
            for (let i = 0; i < 2; i++) {
                const spAngle = Math.random() * Math.PI * 2;
                const spDist = r + Math.random() * 8;
                this.sparks.push({
                    x: cx + Math.cos(spAngle) * spDist,
                    y: cy + Math.sin(spAngle) * spDist,
                    vx: Math.cos(spAngle) * (Math.random() * 3 + 1),
                    vy: Math.sin(spAngle) * (Math.random() * 3 + 1),
                    color: th.studColor1 || '#ffd700',
                    alpha: 1,
                    size: Math.random() * 2.5 + 1.2
                });
            }
        }

        // Render Sparks
        if (this.sparks.length > 0) {
            this.ctx.save();
            this.sparks.forEach((sp, idx) => {
                sp.x += sp.vx;
                sp.y += sp.vy;
                sp.alpha -= 0.04;
                if (sp.alpha > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
                    this.ctx.fillStyle = sp.color;
                    this.ctx.globalAlpha = Math.max(0, sp.alpha);
                    this.ctx.shadowColor = sp.color;
                    this.ctx.shadowBlur = 6;
                    this.ctx.fill();
                } else {
                    this.sparks.splice(idx, 1);
                }
            });
            this.ctx.restore();
        }

        // 3. Main Gyro Top Disc Body
        this.ctx.save();
        this.ctx.translate(cx, cy);
        this.ctx.rotate(rot);

        // Outer Metallic Rim
        const outerRimR = r + 8;
        const rimGrad = this.ctx.createRadialGradient(0, 0, r - 6, 0, 0, outerRimR);
        rimGrad.addColorStop(0, th.rim[0]);
        rimGrad.addColorStop(0.3, th.rim[1]);
        rimGrad.addColorStop(0.6, th.rim[2]);
        rimGrad.addColorStop(0.85, th.rim[3]);
        rimGrad.addColorStop(1, th.rim[4] || th.rim[0]);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, outerRimR, 0, Math.PI * 2);
        this.ctx.fillStyle = rimGrad;
        this.ctx.fill();
        this.ctx.strokeStyle = th.rimBorder;
        this.ctx.lineWidth = 1.8;
        this.ctx.stroke();

        // 24 Rim Studs / Rivets
        for (let s = 0; s < 24; s++) {
            const sAngle = (s * Math.PI * 2) / 24;
            const sx = Math.cos(sAngle) * (r + 4);
            const sy = Math.sin(sAngle) * (r + 4);
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
            this.ctx.fillStyle = s % 2 === 0 ? th.studColor1 : th.studColor2;
            this.ctx.shadowColor = '#000';
            this.ctx.shadowBlur = 2;
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Inner Recessed Disc Track
        this.ctx.beginPath();
        this.ctx.arc(0, 0, r, 0, Math.PI * 2);
        this.ctx.fillStyle = '#080c14';
        this.ctx.fill();

        // 4 Quadrants
        const quads = th.quads;

        for (let i = 0; i < 4; i++) {
            const startAngle = (i * Math.PI) / 2;
            const endAngle = ((i + 1) * Math.PI) / 2;
            const q = quads[i];
            const isWinner = (isSettled && winningSector === q.id);

            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, r, startAngle, endAngle);
            this.ctx.closePath();

            // Radiant sector gradient
            const midAngle = startAngle + Math.PI / 4;
            const gx = Math.cos(midAngle) * r;
            const gy = Math.sin(midAngle) * r;
            const secGrad = this.ctx.createRadialGradient(0, 0, 15, gx * 0.7, gy * 0.7, r);
            secGrad.addColorStop(0, isWinner ? '#ffffff' : q.startColor);
            secGrad.addColorStop(0.7, q.startColor);
            secGrad.addColorStop(1, q.endColor);

            this.ctx.fillStyle = secGrad;
            this.ctx.fill();

            // Sector divider lines
            this.ctx.strokeStyle = th.rimBorder;
            this.ctx.lineWidth = 2.5;
            this.ctx.stroke();

            // Inner sector glow if winner
            if (isWinner) {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
                this.ctx.fill();
            }

            // Typography & Multiplier & Symbol on Sector
            this.ctx.rotate(midAngle);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            const isFlipped = (midAngle > Math.PI / 2 && midAngle < (Math.PI * 3) / 2);
            if (isFlipped) {
                this.ctx.rotate(Math.PI);
                const posX = -r * 0.68;
                
                // Theme Emblem / Symbol
                this.ctx.font = '11px sans-serif';
                this.ctx.fillText(q.symbol, posX, -18);

                // Name
                this.ctx.font = '900 12px "Inter", "JetBrains Mono", sans-serif';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText(`${q.id} ${q.name}`, posX + 1, -4);
                this.ctx.fillStyle = q.textColor;
                this.ctx.fillText(`${q.id} ${q.name}`, posX, -5);

                // Multiplier
                this.ctx.font = '800 10px "JetBrains Mono", monospace';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText('3.84×', posX + 1, 9);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                this.ctx.fillText('3.84×', posX, 8);
            } else {
                const posX = r * 0.68;

                // Theme Emblem / Symbol
                this.ctx.font = '11px sans-serif';
                this.ctx.fillText(q.symbol, posX, -18);

                // Name
                this.ctx.font = '900 12px "Inter", "JetBrains Mono", sans-serif';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText(`${q.id} ${q.name}`, posX + 1, -4);
                this.ctx.fillStyle = q.textColor;
                this.ctx.fillText(`${q.id} ${q.name}`, posX, -5);

                // Multiplier
                this.ctx.font = '800 10px "JetBrains Mono", monospace';
                this.ctx.fillStyle = '#000000';
                this.ctx.fillText('3.84×', posX + 1, 9);
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                this.ctx.fillText('3.84×', posX, 8);
            }

            this.ctx.restore();
        }

        // Concentric Decorative Labyrinth Rings
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 48, 0, Math.PI * 2);
        this.ctx.strokeStyle = th.rimBorder;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.arc(0, 0, 42, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        // 4. Glossy Glass Reflection Arc across Upper Hemisphere
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(0, -22, r * 0.88, r * 0.52, 0, 0, Math.PI * 2);
        const glassGrad = this.ctx.createLinearGradient(0, -r, 0, 10);
        glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.38)');
        glassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.12)');
        glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = glassGrad;
        this.ctx.fill();
        this.ctx.restore();

        // 5. 3D Conical Brass Spindle (The Lattu Center Crown)
        const spindleR = 32;
        const spindleGrad = this.ctx.createRadialGradient(-6, -6, 2, 0, 0, spindleR);
        spindleGrad.addColorStop(0, th.spindle[0]);
        spindleGrad.addColorStop(0.2, th.spindle[1]);
        spindleGrad.addColorStop(0.5, th.spindle[2]);
        spindleGrad.addColorStop(0.85, th.spindle[3]);
        spindleGrad.addColorStop(1, th.spindle[4] || th.spindle[3]);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, spindleR, 0, Math.PI * 2);
        this.ctx.fillStyle = spindleGrad;
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        this.ctx.shadowBlur = 8;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        this.ctx.strokeStyle = th.rimBorder;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 6. Center Jewel Faceted Core
        const gemR = 12;
        const gemGrad = this.ctx.createRadialGradient(-3, -3, 1, 0, 0, gemR);
        gemGrad.addColorStop(0, th.gem[0]);
        gemGrad.addColorStop(0.3, th.gem[1]);
        gemGrad.addColorStop(0.8, th.gem[2]);
        gemGrad.addColorStop(1, th.gem[3] || th.gem[2]);

        this.ctx.beginPath();
        this.ctx.arc(0, 0, gemR, 0, Math.PI * 2);
        this.ctx.fillStyle = gemGrad;
        this.ctx.fill();
        this.ctx.strokeStyle = th.gemBorder || '#ffffff';
        this.ctx.lineWidth = 1.2;
        this.ctx.stroke();

        // Jewel Glint Highlight
        this.ctx.beginPath();
        this.ctx.arc(-4, -4, 2.5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();

        this.ctx.restore();
    }

    async spin() {
        if (this.isPlaying) return;
        const betInput = document.getElementById('ts-bet-input');
        const bet = parseFloat(betInput ? betInput.value : 100) || 100;

        const currentBal = this.getRealBalance();
        if (currentBal < bet) {
            this.showToast('Balance kam hai! Please deposit or lower bet.', 'error');
            return;
        }

        let deducted = false;
        if (typeof placeBet === 'function') {
            deducted = placeBet(bet);
        } else if (window.wallet && typeof window.wallet.placeBet === 'function') {
            deducted = window.wallet.placeBet(bet, 'Spinning Top 3D');
        }

        if (!deducted) {
            const newBal = Math.max(0, currentBal - bet);
            localStorage.setItem('BETWITHNET_balance', newBal.toString());
            try {
                const u = JSON.parse(localStorage.getItem('bwn_session_user') || '{}');
                u.balance_pkr = newBal;
                u.balancePKR = newBal;
                localStorage.setItem('bwn_session_user', JSON.stringify(u));
            } catch(e) {}
            if (typeof updateWalletUI === 'function') updateWalletUI();
        }

        this.updateWalletDisplay();
        this.isPlaying = true;
        this.isSettled = false;
        this.winningQuad = null;
        this.betAmount = bet;

        // Duck music slightly so gyro sound is front and center
        this.soundEngine.duckMusic(true);

        const spinBtn = document.getElementById('ts-spin-btn');
        if (spinBtn) {
            spinBtn.disabled = true;
            spinBtn.innerHTML = '<span class="spin-loader-spinner"></span> SPINNING AT 3,200 RPM...';
        }

        const statusEl = document.getElementById('ts-status-banner');
        if (statusEl) {
            statusEl.className = 'status-banner active-spin';
            statusEl.innerHTML = '<span class="status-pulse-dot"></span> TOP ACCELERATING... GYRO IN MOTION';
        }

        const shouldWin = (window.adminConfig && typeof window.adminConfig.shouldWin === 'function')
            ? window.adminConfig.shouldWin('topspin')
            : (Math.random() < 0.30);
        let winner;
        if (shouldWin) {
            winner = this.selectedQuad;
        } else {
            const losers = [1, 2, 3, 4].filter(q => q !== this.selectedQuad);
            winner = losers[Math.floor(Math.random() * losers.length)];
        }

        const targetSectorAngle = (winner - 1) * (Math.PI / 2) + Math.PI / 4;
        const baseAlignment = (Math.PI * 1.5 - targetSectorAngle);
        const fullSpins = (7 + Math.floor(Math.random() * 3)) * Math.PI * 2;
        const totalRot = baseAlignment + fullSpins;

        const startT = performance.now();
        const duration = 4200;

        this.soundEngine.startSpinSound();
        this.lastSectorCrossed = -1;

        const pointerEl = document.getElementById('ts-needle-pointer');

        let lastAngle = 0;

        const anim = (now) => {
            const elapsed = now - startT;
            const progress = Math.min(1, elapsed / duration);

            const ease = 1 - Math.pow(1 - progress, 3.2);
            this.angle = totalRot * ease;

            this.speedVelocity = Math.abs(this.angle - lastAngle);
            lastAngle = this.angle;

            const wobbleIntensity = Math.pow(progress, 1.8) * 4.5;
            const wobbleFreq = (1 - progress) * 25 + 6;
            this.wobbleX = Math.cos(elapsed * 0.01 * wobbleFreq) * wobbleIntensity;
            this.wobbleY = Math.sin(elapsed * 0.01 * wobbleFreq) * wobbleIntensity * 0.5;

            const normRot = (this.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const currentSectorUnderPointer = Math.floor(normRot / (Math.PI / 2));
            if (currentSectorUnderPointer !== this.lastSectorCrossed) {
                this.lastSectorCrossed = currentSectorUnderPointer;
                this.soundEngine.playTick();
                if (pointerEl) {
                    pointerEl.classList.remove('needle-tick');
                    void pointerEl.offsetWidth;
                    pointerEl.classList.add('needle-tick');
                }
            }

            this.soundEngine.updateSpinPitch(progress);
            this.drawTop(this.angle, this.wobbleX, this.wobbleY, null, false);

            if (progress < 1) {
                requestAnimationFrame(anim);
            } else {
                this.speedVelocity = 0;
                this.soundEngine.stopSpinSound();
                this.settle(winner);
            }
        };

        requestAnimationFrame(anim);
    }

    settle(winner) {
        this.winningQuad = winner;
        this.isSettled = true;
        this.isPlaying = false;

        this.history.unshift(winner);
        this.renderHistory();

        this.drawTop(this.angle, 0, 0, winner, true);

        const won = (winner === this.selectedQuad);
        const spinBtn = document.getElementById('ts-spin-btn');
        const statusEl = document.getElementById('ts-status-banner');
        const th = this.getTheme();
        const winningMeta = th.quads.find(q => q.id === winner) || th.quads[0];

        if (won) {
            const payout = parseFloat((this.betAmount * 3.84).toFixed(2));
            
            if (typeof winBet === 'function') {
                winBet(this.betAmount, 3.84);
            } else if (window.wallet && typeof window.wallet.creditWin === 'function') {
                window.wallet.creditWin(this.betAmount, payout, 'Spinning Top 3D', 3.84, `Top stopped on Quadrant #${winner}`);
            } else {
                const currentBal = this.getRealBalance();
                const newBal = currentBal + payout;
                localStorage.setItem('BETWITHNET_balance', newBal.toString());
            }

            this.soundEngine.playWin();
            this.triggerConfetti();

            if (statusEl) {
                statusEl.className = 'status-banner win';
                statusEl.innerHTML = `🎉 <b>MEGA WIN!</b> #${winner} ${winningMeta.symbol} ${winningMeta.name} HIT! <span>+Rs. ${payout.toLocaleString()} (3.84×)</span>`;
            }

            this.showWinModal(payout, winner, winningMeta);
            setTimeout(() => this.soundEngine.duckMusic(false), 1800);
        } else {
            this.soundEngine.playLoss();
            if (statusEl) {
                statusEl.className = 'status-banner loss';
                statusEl.innerHTML = `🛑 STOPPED ON #${winner} ${winningMeta.symbol} ${winningMeta.name} • TRY AGAIN!`;
            }
            this.soundEngine.duckMusic(false);
        }

        if (spinBtn) {
            spinBtn.disabled = false;
            spinBtn.innerHTML = '⚡ SPIN GYRO TOP 🌀';
        }

        this.updateWalletDisplay();
        if (typeof updateWalletUI === 'function') updateWalletUI();
        if (window.core && typeof window.core.updateAllBalances === 'function') {
            window.core.updateAllBalances();
        }
    }

    triggerConfetti() {
        if (!this.confettiCanvas || !this.confettiCtx) return;
        this.confettiActive = true;
        this.particles = [];
        const th = this.getTheme();
        const colors = [th.accent, '#ffd700', '#ff1744', '#00e676', '#00b0ff', '#ffffff'];

        for (let i = 0; i < 90; i++) {
            this.particles.push({
                x: window.innerWidth / 2,
                y: window.innerHeight * 0.45,
                vx: (Math.random() - 0.5) * 16,
                vy: (Math.random() - 0.7) * 18,
                size: Math.random() * 9 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 12,
                opacity: 1
            });
        }

        const renderConfetti = () => {
            if (!this.confettiActive) return;
            this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            let alive = 0;

            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.38;
                p.rotation += p.rotSpeed;
                p.opacity -= 0.011;

                if (p.opacity > 0) {
                    alive++;
                    this.confettiCtx.save();
                    this.confettiCtx.translate(p.x, p.y);
                    this.confettiCtx.rotate((p.rotation * Math.PI) / 180);
                    this.confettiCtx.fillStyle = p.color;
                    this.confettiCtx.globalAlpha = Math.max(0, p.opacity);
                    this.confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                    this.confettiCtx.restore();
                }
            });

            if (alive > 0) {
                requestAnimationFrame(renderConfetti);
            } else {
                this.confettiActive = false;
                this.confettiCtx.clearRect(0, 0, this.confettiCanvas.width, this.confettiCanvas.height);
            }
        };

        requestAnimationFrame(renderConfetti);
    }

    showWinModal(amount, sectorId, meta) {
        const modal = document.getElementById('ts-win-modal');
        const amountEl = document.getElementById('ts-win-modal-amount');
        const sectorEl = document.getElementById('ts-win-modal-sector');
        if (!modal) return;

        if (amountEl) amountEl.textContent = 'Rs. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
        if (sectorEl) sectorEl.textContent = `Matched Sector #${sectorId} ${meta.symbol} ${meta.name}`;

        modal.classList.add('visible');
        setTimeout(() => {
            modal.classList.remove('visible');
        }, 3400);
    }

    closeWinModal() {
        const modal = document.getElementById('ts-win-modal');
        if (modal) modal.classList.remove('visible');
    }

    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `ts-toast ${type}`;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2800);
    }
}

window.topSpinGame = new TopSpinGame();
