// ============================================================
// BULLSEYE ARCHERY 3D - AAA CASINO STUDIO SUITE & GRAPHICS ENGINE
// Bet With Net Casino Studio - Master Edition
// ============================================================

const ARCHERY_THEMES = {
    olympic: {
        id: 'olympic',
        name: 'Olympic Arena',
        icon: '🏅',
        desc: 'World Championship Olympic Range & Stadium Floodlights',
        bgImage: '../assets/games/archery/olympic_bg.jpg',
        primary: '#ffd700',
        accent: '#00e5ff',
        glow: 'rgba(0, 229, 255, 0.4)',
        bowColor: '#ffd700',
        particleType: 'dust'
    },
    sherwood: {
        id: 'sherwood',
        name: 'Sherwood Forest',
        icon: '🌲',
        desc: 'Ancient Medieval Mythical Forest & Sunlit Glade',
        bgImage: '../assets/games/archery/sherwood_bg.jpg',
        primary: '#ffb300',
        accent: '#4caf50',
        glow: 'rgba(76, 175, 80, 0.4)',
        bowColor: '#b45309',
        particleType: 'leaves'
    },
    cyber: {
        id: 'cyber',
        name: 'Cyberpunk 2077',
        icon: '⚡',
        desc: 'Neon Cybernetic Mega City Holographic Range',
        bgImage: '../assets/games/archery/cyber_bg.jpg',
        primary: '#00f0ff',
        accent: '#ff007f',
        glow: 'rgba(0, 240, 255, 0.5)',
        bowColor: '#00f0ff',
        particleType: 'glitch'
    },
    dojo: {
        id: 'dojo',
        name: 'Zen Kyudo Dojo',
        icon: '🌸',
        desc: 'Peaceful Japanese Zen Garden with Floating Cherry Blossoms',
        bgImage: '../assets/games/archery/dojo_bg.jpg',
        primary: '#ff80ab',
        accent: '#ffd700',
        glow: 'rgba(255, 128, 171, 0.4)',
        bowColor: '#d97706',
        particleType: 'sakura'
    }
};

class ArcheryAudioEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.audioPath = '../assets/games/archery/audio/';

        // Preload realistic audio files
        this.winAudio = new Audio(this.audioPath + 'bullseye_win.mp3');
        this.winAudio.volume = 0.9;

        this.coinsAudio = new Audio(this.audioPath + 'gold_coins.mp3');
        this.coinsAudio.volume = 0.8;

        this.cheerAudio = new Audio(this.audioPath + 'crowd_cheer.mp3');
        this.cheerAudio.volume = 0.7;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    playBowDraw() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // String tension creak: dual saw/triangle ramp
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.linearRampToValueAtTime(320, t + 0.25);
            gain.gain.setValueAtTime(0.02, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 0.2);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.28);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.28);
        } catch(e) {}
    }

    playBowRelease() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // String snap twang
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, t);
            osc.frequency.exponentialRampToValueAtTime(75, t + 0.14);
            gain.gain.setValueAtTime(0.35, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
        } catch(e) {}
    }

    playArrowFly() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // White-noise bandpass whoosh
            const bufferSize = this.ctx.sampleRate * 0.45;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(2200, t + 0.25);
            filter.frequency.exponentialRampToValueAtTime(400, t + 0.45);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.05, t);
            gain.gain.linearRampToValueAtTime(0.25, t + 0.25);
            gain.gain.linearRampToValueAtTime(0.001, t + 0.45);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(t);
            noise.stop(t + 0.45);
        } catch(e) {}
    }

    playTargetThud() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            // Heavy physical wood / straw impact thud
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            o1.type = 'triangle';
            o2.type = 'sine';
            o1.frequency.setValueAtTime(180, t);
            o1.frequency.exponentialRampToValueAtTime(35, t + 0.2);
            o2.frequency.setValueAtTime(320, t);
            o2.frequency.exponentialRampToValueAtTime(50, t + 0.2);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);

            o1.start(t);
            o2.start(t);
            o1.stop(t + 0.22);
            o2.stop(t + 0.22);
        } catch(e) {}
    }

    playBullseyeWin(mult) {
        if (!this.soundEnabled) return;
        try {
            this.winAudio.currentTime = 0;
            this.winAudio.play().catch(() => {});
            if (mult >= 25) {
                setTimeout(() => {
                    try {
                        this.cheerAudio.currentTime = 0;
                        this.cheerAudio.play().catch(() => {});
                    } catch(e) {}
                }, 300);
            }
            if (mult >= 8) {
                setTimeout(() => {
                    try {
                        this.coinsAudio.currentTime = 0;
                        this.coinsAudio.play().catch(() => {});
                    } catch(e) {}
                }, 500);
            }
        } catch(e) {}
    }

    playMiss() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400, t);
            osc.frequency.linearRampToValueAtTime(150, t + 0.3);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
        } catch(e) {}
    }
}

class ArcheryGame {
    constructor() {
        this.isShooting = false;
        this.currentTheme = 'olympic';
        this.audio = new ArcheryAudioEngine();
        this.selectedBet = 100;

        // Wind Physics Vector
        this.windSpeed = 2.4; // m/s
        this.windAngle = 25; // degrees (-90 to +90)
        this.windTimer = null;

        // Player Aim Offsets
        this.aimOffsetX = 0;
        this.aimOffsetY = 0;

        // Reticle Sway Animation
        this.swayAngle = 0;
        this.swayRaf = null;

        // Particles
        this.particlesInterval = null;
    }

    init() {
        this.loadSavedTheme();
        this.renderThemeCards();
        this.initChips();
        this.updateWalletDisplay();
        this.startWindEngine();
        this.startReticleSway();
        this.spawnThemeParticles();

        // Interactive 3D Bow Tracking on Mouse Move
        const stage = document.getElementById('archeryStage');
        if (stage) {
            stage.addEventListener('mousemove', (e) => {
                if (this.isShooting) return;
                const rect = stage.getBoundingClientRect();
                const relX = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
                const relY = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
                const bow = document.getElementById('archerBow');
                if (bow) {
                    bow.style.transform = `translateX(calc(-50% + ${relX * 18}px)) rotate(${relX * 7}deg) translateY(${relY * 6}px)`;
                }
            });
        }

        // Audio unlock on user touch/click
        const unlock = () => {
            this.audio.init();
            window.removeEventListener('click', unlock);
            window.removeEventListener('touchstart', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('touchstart', unlock);
    }

    loadSavedTheme() {
        const saved = localStorage.getItem('archery_theme') || 'olympic';
        this.setTheme(saved in ARCHERY_THEMES ? saved : 'olympic');
    }

    setTheme(themeId) {
        if (!ARCHERY_THEMES[themeId]) return;
        this.currentTheme = themeId;
        localStorage.setItem('archery_theme', themeId);
        const t = ARCHERY_THEMES[themeId];

        // Apply background to stage and body
        const stage = document.getElementById('archeryStage');
        if (stage) {
            stage.style.backgroundImage = `radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%), url('${t.bgImage}')`;
        }

        // Update Theme Label in HUD
        const label = document.getElementById('currentThemeLabel');
        if (label) {
            label.innerText = `${t.icon} ${t.name}`;
        }

        // Update CSS Variables for Dynamic Glow
        document.documentElement.style.setProperty('--arc-primary', t.primary);
        document.documentElement.style.setProperty('--arc-accent', t.accent);
        document.documentElement.style.setProperty('--arc-glow', t.glow);

        // Re-spawn theme particles
        this.spawnThemeParticles();

        // Update Theme Card Active States
        document.querySelectorAll('.theme-picker-card').forEach(c => {
            if (c.dataset.theme === themeId) c.classList.add('active');
            else c.classList.remove('active');
        });
    }

    renderThemeCards() {
        const container = document.getElementById('themeCardsList');
        if (!container) return;

        container.innerHTML = Object.values(ARCHERY_THEMES).map(t => `
            <div class="theme-picker-card ${t.id === this.currentTheme ? 'active' : ''}" data-theme="${t.id}" onclick="window.archeryGame.setTheme('${t.id}'); closeModal('themeModal');">
                <img src="${t.bgImage}" class="theme-card-thumb" alt="${t.name}">
                <div class="theme-card-body">
                    <div class="theme-card-title">${t.icon} ${t.name}</div>
                    <div class="theme-card-desc">${t.desc}</div>
                </div>
                <div class="theme-card-indicator"></div>
            </div>
        `).join('');
    }

    toggleSound(btn) {
        this.audio.soundEnabled = !this.audio.soundEnabled;
        if (!this.audio.soundEnabled) {
            if (btn) btn.innerText = '🔇 SOUND OFF';
        } else {
            this.audio.playBowRelease();
            if (btn) btn.innerText = '🔊 SOUND ON';
        }
    }

    initChips() {
        const chipsGroup = document.getElementById('arcChipsGroup');
        if (!chipsGroup) return;

        const presets = [10, 50, 100, 500, 1000, 5000];
        chipsGroup.innerHTML = presets.map(val => {
            const fmt = val >= 1000 ? `${val / 1000}K` : val;
            const active = val === this.selectedBet ? 'active' : '';
            return `
                <button class="arc-chip-btn ${active}" onclick="window.archeryGame.selectChip(${val}, this)">
                    <span class="arc-chip-currency">₨</span>${fmt}
                </button>
            `;
        }).join('');
    }

    selectChip(amount, btn) {
        this.selectedBet = amount;
        const input = document.getElementById('arc-bet-input');
        if (input) input.value = amount;

        document.querySelectorAll('.arc-chip-btn').forEach(c => c.classList.remove('active'));
        if (btn) btn.classList.add('active');
    }

    modifyBet(type) {
        const input = document.getElementById('arc-bet-input');
        if (!input) return;
        let cur = parseFloat(input.value) || 100;
        const bal = this.getRealBalance();

        if (type === 'half') cur = Math.max(10, Math.floor(cur / 2));
        else if (type === 'double') cur = Math.min(bal > 0 ? bal : 50000, Math.floor(cur * 2));
        else if (type === 'max') cur = Math.max(10, Math.min(bal > 0 ? bal : 50000, 50000));

        input.value = cur;
        this.selectedBet = cur;

        document.querySelectorAll('.arc-chip-btn').forEach(c => c.classList.remove('active'));
    }

    getRealBalance() {
        let bal = 0;
        if (window.wallet && typeof window.wallet.getBalancePKR === 'function') {
            bal = window.wallet.getBalancePKR();
        } else if (window.wallet && typeof window.wallet.getBalance === 'function') {
            bal = window.wallet.getBalance();
        } else {
            try {
                const u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
                if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
                    bal = parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
                } else if (u && u.balance !== undefined) {
                    bal = parseFloat(u.balance);
                } else {
                    const l = localStorage.getItem("wallet_balance") || localStorage.getItem("BETWITHNET_balance");
                    if (l !== null) bal = parseFloat(l);
                }
            } catch(e) {}
        }
        return isNaN(bal) || bal < 0 ? 0 : bal;
    }

    updateWalletDisplay() {
        const bal = this.getRealBalance();
        const el = document.getElementById('walletBalance');
        if (el) el.innerText = bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    startWindEngine() {
        const updateWind = () => {
            // Random speed from 0.5 to 11.5 m/s
            this.windSpeed = +(Math.random() * 8 + 0.8).toFixed(1);
            // Random angle from -75 to +75 deg
            this.windAngle = Math.floor(Math.random() * 150) - 75;

            const wrap = document.getElementById('windArrowWrap');
            const valEl = document.getElementById('windValue');
            const ratEl = document.getElementById('windRating');

            if (wrap) wrap.style.transform = `rotate(${this.windAngle}deg)`;
            if (valEl) valEl.innerText = `${this.windSpeed} m/s`;

            if (ratEl) {
                if (this.windSpeed < 2.5) ratEl.innerText = 'CALM BREEZE';
                else if (this.windSpeed < 5.5) ratEl.innerText = 'MILD CROSSWIND';
                else if (this.windSpeed < 8.5) ratEl.innerText = 'GUSTY CROSSWIND';
                else ratEl.innerText = 'STIFF GALE';
            }
        };

        updateWind();
        this.windTimer = setInterval(updateWind, 7000);
    }

    startReticleSway() {
        const reticle = document.getElementById('aimReticle');
        if (!reticle) return;

        const loop = () => {
            if (!this.isShooting) {
                this.swayAngle += 0.04;
                // Subtle organic swaying motion influenced by wind
                const windDriftX = (this.windAngle / 90) * (this.windSpeed * 1.5);
                const swayX = Math.sin(this.swayAngle) * 5 + windDriftX + this.aimOffsetX;
                const swayY = Math.cos(this.swayAngle * 1.4) * 3 + this.aimOffsetY;

                reticle.style.transform = `translate(calc(-50% + ${swayX}px), calc(-50% + ${swayY}px))`;
            }
            this.swayRaf = requestAnimationFrame(loop);
        };
        this.swayRaf = requestAnimationFrame(loop);
    }

    aimAtTarget(event) {
        if (this.isShooting) return;
        const targetDisc = document.getElementById('targetBossDisc');
        if (!targetDisc) return;

        const rect = targetDisc.getBoundingClientRect();
        const clickX = event.clientX - rect.left - rect.width / 2;
        const clickY = event.clientY - rect.top - rect.height / 2;

        // Dampen offset
        this.aimOffsetX = Math.max(-25, Math.min(25, clickX * 0.4));
        this.aimOffsetY = Math.max(-25, Math.min(25, clickY * 0.4));
    }

    spawnThemeParticles() {
        const container = document.getElementById('stageParticles');
        if (!container) return;

        if (this.particlesInterval) clearInterval(this.particlesInterval);
        container.innerHTML = '';

        const t = ARCHERY_THEMES[this.currentTheme];

        this.particlesInterval = setInterval(() => {
            if (container.children.length > 20) {
                container.removeChild(container.firstChild);
            }

            const p = document.createElement('div');
            p.style.position = 'absolute';
            p.style.left = `${Math.random() * 100}%`;
            p.style.top = '-10px';
            p.style.pointerEvents = 'none';

            if (t.particleType === 'sakura') {
                // Pink cherry petal
                p.style.width = `${Math.random() * 8 + 6}px`;
                p.style.height = `${Math.random() * 10 + 8}px`;
                p.style.background = 'radial-gradient(circle, #ff80ab 0%, #ff4081 100%)';
                p.style.borderRadius = '60% 0 60% 0';
                p.style.opacity = `${Math.random() * 0.6 + 0.3}`;
                p.style.transition = `transform ${Math.random() * 3 + 3}s linear, top ${Math.random() * 3 + 3}s linear`;
            } else if (t.particleType === 'leaves') {
                // Amber oak leaf
                p.style.width = `${Math.random() * 10 + 6}px`;
                p.style.height = `${Math.random() * 7 + 5}px`;
                p.style.background = 'radial-gradient(circle, #ff9800 0%, #d84315 100%)';
                p.style.borderRadius = '50% 50% 10% 50%';
                p.style.opacity = `${Math.random() * 0.6 + 0.4}`;
                p.style.transition = `transform ${Math.random() * 3 + 3}s linear, top ${Math.random() * 3 + 3}s linear`;
            } else if (t.particleType === 'glitch') {
                // Cyan/Magenta digital pulse
                p.style.width = `${Math.random() * 4 + 2}px`;
                p.style.height = `${Math.random() * 14 + 6}px`;
                p.style.background = Math.random() > 0.5 ? '#00e5ff' : '#ff007f';
                p.style.boxShadow = '0 0 8px currentColor';
                p.style.opacity = `${Math.random() * 0.7 + 0.3}`;
                p.style.transition = `transform ${Math.random() * 2 + 1.5}s linear, top ${Math.random() * 2 + 1.5}s linear`;
            } else {
                // Olympic golden dust
                p.style.width = `${Math.random() * 4 + 2}px`;
                p.style.height = `${Math.random() * 4 + 2}px`;
                p.style.borderRadius = '50%';
                p.style.background = '#ffd700';
                p.style.boxShadow = '0 0 6px #ffd700';
                p.style.opacity = `${Math.random() * 0.5 + 0.3}`;
                p.style.transition = `transform ${Math.random() * 4 + 3}s linear, top ${Math.random() * 4 + 3}s linear`;
            }

            container.appendChild(p);

            // Animate downwards and drifting with wind
            setTimeout(() => {
                const drift = (this.windAngle / 90) * 120;
                p.style.top = '110%';
                p.style.transform = `translateX(${drift}px) rotate(${Math.random() * 360}deg)`;
            }, 50);

        }, 400);
    }

    async releaseArrow() {
        if (this.isShooting) return;

        const bet = parseFloat(document.getElementById('arc-bet-input').value) || 100;
        const bal = this.getRealBalance();

        if (bet <= 0) {
            alert('Please enter a valid bet amount!');
            return;
        }

        if (bet > bal) {
            alert(`Insufficient balance! Available: PKR ${bal.toFixed(2)}, Required: PKR ${bet.toFixed(2)}`);
            return;
        }

        // Deduct bet via BWN wallet
        let betDeducted = false;
        if (window.wallet && typeof window.wallet.addBalancePKR === 'function') {
            window.wallet.addBalancePKR(-bet);
            betDeducted = true;
        } else if (window.wallet && typeof window.wallet.placeBet === 'function') {
            betDeducted = window.wallet.placeBet(bet, 'Bullseye Archery 3D');
        } else {
            const newBal = Math.max(0, bal - bet);
            localStorage.setItem('wallet_balance', newBal.toString());
            localStorage.setItem('BETWITHNET_balance', newBal.toString());
            betDeducted = true;
        }

        if (!betDeducted) {
            alert('Failed to place bet. Please verify your wallet balance.');
            return;
        }

        this.updateWalletDisplay();

        // Lock UI
        this.isShooting = true;
        const releaseBtn = document.getElementById('arc-release-btn');
        if (releaseBtn) {
            releaseBtn.classList.add('disabled');
            releaseBtn.innerText = 'DRAWING BOWSTRING... 🏹';
        }

        const bow = document.getElementById('archerBow');
        const reticle = document.getElementById('aimReticle');
        const readyArrow = document.getElementById('readyArrowGraphic');
        const flyingArrow = document.getElementById('flyingArrow');
        const statusEl = document.getElementById('arcStatus');

        if (statusEl) {
            statusEl.className = 'arc-status-ticker aiming';
            statusEl.innerHTML = `<span class="ticker-pulse">🎯</span> SIGHTING BULLSEYE & CALCULATING TRAJECTORY...`;
        }

        // 1. Draw Tension (0 to 280ms)
        this.audio.playBowDraw();
        if (bow) bow.classList.add('drawing');
        if (reticle) reticle.classList.add('drawing');

        await new Promise(r => setTimeout(r, 260));

        // 2. Release Arrow (Launch 3D Flight)
        if (readyArrow) readyArrow.style.display = 'none';
        if (bow) bow.classList.remove('drawing');
        if (reticle) reticle.classList.remove('drawing');

        this.audio.playBowRelease();
        this.audio.playArrowFly();

        // Casino Mathematical Probability Model: 30% Win / 70% Loss (~94.5% RTP, 5.5% House Edge)
        // 30% Total Hits:
        // - 100x Center Pin: 0.2%
        // - 25x Gold Bullseye: 0.8%
        // - 8x Red Inner: 2.5%
        // - 3.5x Blue Mid: 5.5%
        // - 1.5x Outer White: 21.0%
        // 70% Total Misses:
        // - 0x Wind Deflection / Outer Miss: 70.0%
        const rand = Math.random();
        let targetDistance = 0; // px from dead center of 175px disc (radius = 87.5px)
        let mult = 0;
        let ringTitle = '';
        let ringDesc = '';

        if (rand < 0.002) {
            // 100x Center Pin (0.2%)
            mult = 100.0;
            targetDistance = Math.random() * 6;
            ringTitle = '🎯 100X LEGENDARY CENTER PIN!';
            ringDesc = 'DEAD-CENTER GOLDEN X-PIN! FLAWLESS CHAMPIONSHIP SHOT!';
        } else if (rand < 0.010) {
            // 25x Gold Ring (0.8%)
            mult = 25.0;
            targetDistance = 6 + Math.random() * 16;
            ringTitle = '🟡 25X GOLDEN BULLSEYE!';
            ringDesc = '10-RING GOLD BULLSEYE HIT! EXQUISITE MARKSMANSHIP!';
        } else if (rand < 0.035) {
            // 8x Red Ring (2.5%)
            mult = 8.0;
            targetDistance = 22 + Math.random() * 20;
            ringTitle = '🔴 8X RED INNER RING!';
            ringDesc = 'INNER SCORING ZONE! PRECISE SHOT!';
        } else if (rand < 0.090) {
            // 3.5x Blue Ring (5.5%)
            mult = 3.5;
            targetDistance = 42 + Math.random() * 22;
            ringTitle = '🔵 3.5X BLUE MID RING!';
            ringDesc = 'SOLID SCORING RING HIT!';
        } else if (rand < 0.300) {
            // 1.5x Outer Ring (21.0%) -> Total Wins = 30.0%
            mult = 1.5;
            targetDistance = 64 + Math.random() * 20;
            ringTitle = '⚪ 1.5X OUTER RING HIT!';
            ringDesc = 'OUTER RING HIT! BASE PAYOUT SECURED!';
        } else {
            // 0x Miss (70.0% Loss)
            mult = 0.0;
            targetDistance = 88 + Math.random() * 28;
            ringTitle = '💨 TARGET DEFLECTION / MISS!';
            ringDesc = 'WIND DEFLECTED THE ARROW OUTSIDE SCORING RINGS!';
        }

        // Calculate radial coordinates (x, y) with angle
        const hitAngle = Math.random() * Math.PI * 2;
        const hitX = Math.cos(hitAngle) * targetDistance;
        const hitY = Math.sin(hitAngle) * targetDistance;

        // Apply offsets to flying projectile CSS variables
        if (flyingArrow) {
            flyingArrow.style.setProperty('--target-x-offset', `${hitX}px`);
            flyingArrow.style.setProperty('--target-y-offset', `${hitY}px`);
            flyingArrow.classList.add('in-flight');
        }

        // Flight time: 480ms
        await new Promise(r => setTimeout(r, 480));

        // 3. Impact Target
        if (flyingArrow) flyingArrow.classList.remove('in-flight');

        const targetRig = document.getElementById('targetRig');
        if (targetRig) {
            targetRig.classList.add('wobble-impact');
            setTimeout(() => targetRig.classList.remove('wobble-impact'), 450);
        }

        const stage = document.getElementById('archeryStage');
        if (stage) {
            stage.classList.add('camera-punch');
            setTimeout(() => stage.classList.remove('camera-punch'), 350);
        }

        if (mult > 0) {
            this.audio.playTargetThud();
            this.spawnImpactSparks(hitX, hitY);
            this.addStuckArrow(hitX, hitY);
            this.audio.playBullseyeWin(mult);

            const winAmount = bet * mult;

            // Credit Real Win via Bet With Net wallet
            if (window.wallet && typeof window.wallet.addBalancePKR === 'function') {
                window.wallet.addBalancePKR(winAmount);
            } else if (window.wallet && typeof window.wallet.creditWin === 'function') {
                window.wallet.creditWin(bet, winAmount, 'Bullseye Archery 3D', mult, ringTitle);
            } else {
                const cur = this.getRealBalance();
                const newBal = cur + winAmount;
                localStorage.setItem('wallet_balance', newBal.toString());
                localStorage.setItem('BETWITHNET_balance', newBal.toString());
            }

            this.updateWalletDisplay();

            // Status Ticker Win
            if (statusEl) {
                statusEl.className = 'arc-status-ticker won';
                statusEl.innerHTML = `
                    <div class="status-win-headline">${ringTitle}</div>
                    <div class="status-win-payout">+₨ ${winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${mult}X)</div>
                    <div class="status-win-sub">${ringDesc}</div>
                `;
            }

            // Show Toast Banner
            const toast = document.getElementById('spinWinToast');
            const toastAmt = document.getElementById('toastWinAmount');
            if (toast && toastAmt) {
                toastAmt.innerText = `PKR ${winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3500);
            }

            this.addHistoryRecord(ringTitle, mult, winAmount, true);

        } else {
            // Missed Target
            this.audio.playMiss();
            this.addStuckArrow(hitX, hitY, true);

            if (statusEl) {
                statusEl.className = 'arc-status-ticker lost';
                statusEl.innerHTML = `
                    <div class="status-lose-headline">${ringTitle}</div>
                    <div class="status-lose-sub">${ringDesc}</div>
                `;
            }

            this.addHistoryRecord('MISSED', 0, 0, false);
        }

        // Reset bow ready arrow
        if (readyArrow) readyArrow.style.display = 'block';

        // Unlock UI
        this.isShooting = false;
        if (releaseBtn) {
            releaseBtn.classList.remove('disabled');
            releaseBtn.innerText = 'DRAW & RELEASE ARROW 🎯';
        }
    }

    addStuckArrow(x, y, isMiss = false) {
        const container = document.getElementById('stuckArrowsContainer');
        if (!container) return;

        // Keep at most 7 stuck arrows to prevent clutter
        if (container.children.length > 7) {
            container.removeChild(container.firstChild);
        }

        const arrow = document.createElement('div');
        arrow.className = 'stuck-arrow';
        arrow.style.left = `calc(50% + ${x}px)`;
        arrow.style.top = `calc(50% + ${y}px)`;
        arrow.style.setProperty('--shaft-angle', `${(Math.random() * 20 - 10).toFixed(1)}deg`);

        if (isMiss) {
            arrow.innerHTML = `
                <div class="stuck-arrow-notch" style="background:#ff3344; box-shadow:0 0 10px #ff3344;"></div>
                <div class="stuck-arrow-shaft" style="background:#ff3344; opacity:0.8;"></div>
            `;
        } else {
            arrow.innerHTML = `
                <div class="stuck-arrow-notch"></div>
                <div class="stuck-arrow-shaft"></div>
            `;
        }

        container.appendChild(arrow);
    }

    spawnImpactSparks(x, y) {
        const layer = document.getElementById('impactSparksLayer');
        if (!layer) return;

        layer.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const spark = document.createElement('div');
            spark.className = 'hit-spark-particle';
            spark.style.left = `calc(50% + ${x}px)`;
            spark.style.top = `calc(50% + ${y}px)`;
            spark.style.setProperty('--rand-x', `${(Math.random() * 60 - 30).toFixed(0)}px`);
            spark.style.setProperty('--rand-y', `${(Math.random() * -60 - 10).toFixed(0)}px`);
            layer.appendChild(spark);
        }

        setTimeout(() => {
            if (layer) layer.innerHTML = '';
        }, 800);
    }

    addHistoryRecord(zone, mult, amount, isWin) {
        const historyList = document.getElementById('arcHistoryList');
        if (!historyList) return;

        const item = document.createElement('div');
        item.className = `arc-history-item ${isWin ? 'win' : 'loss'}`;
        const shortZone = zone.replace(/[🎯🟡🔴🔵⚪💨]/g, '').trim().split(' ')[0] || 'HIT';
        item.innerHTML = `
            <span class="arc-hist-zone">${shortZone}</span>
            <span class="arc-hist-mult">${isWin ? mult + 'x' : '0x'}</span>
            <span class="arc-hist-amount">${isWin ? '+₨ ' + Math.floor(amount) : '-₨ ' + this.selectedBet}</span>
        `;

        historyList.prepend(item);
        if (historyList.children.length > 8) {
            historyList.removeChild(historyList.lastChild);
        }
    }
}

// Global initialization
window.archeryGame = new ArcheryGame();