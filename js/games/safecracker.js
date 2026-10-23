// ============================================================
// SAFE CRACKER 100X HEIST - HEAVY DUTY 3D VAULT ENGINE & AUDIO
// Bet With Net Casino Studio - Master Edition
// ============================================================

const SAFECRACKER_THEMES = {
    titanium: {
        id: 'titanium',
        name: 'Titanium Cyber Vault',
        icon: '🛡️',
        desc: 'Reinforced Brushed Titanium & Electric Cyan Security Grid',
        bodyClass: 'theme-titanium',
        bg: '#04070d',
        bgGradient: 'radial-gradient(circle at 50% 30%, #0d1a2d 0%, #050b14 60%, #010307 100%)',
        vaultRim: 'linear-gradient(135deg, #485568 0%, #2b3543 45%, #18222f 70%, #0f1620 100%)',
        rimBorder: '#00e5ff',
        accent: '#00e5ff',
        glow: 'rgba(0, 229, 255, 0.45)',
        wheelColor: 'linear-gradient(135deg, #a6b5c7 0%, #607286 50%, #2f3b49 100%)',
        wheelBorder: '#00e5ff',
        dialBg: 'radial-gradient(circle at 50% 35%, #1a2738 0%, #0a111a 100%)',
        dialBorder: '#00e5ff',
        dialColor: '#00e5ff',
        statusColor: '#00e5ff'
    },
    swiss: {
        id: 'swiss',
        name: 'Swiss 24K Gold Reserve',
        icon: '👑',
        desc: 'Zurich Private Bank Polished Gold Bullion & Diamond Spotlight',
        bodyClass: 'theme-swiss',
        bg: '#090602',
        bgGradient: 'radial-gradient(circle at 50% 30%, #291b07 0%, #120b02 60%, #050301 100%)',
        vaultRim: 'linear-gradient(135deg, #ffd700 0%, #b8860b 45%, #7a5805 70%, #3d2b02 100%)',
        rimBorder: '#ffd700',
        accent: '#ffd700',
        glow: 'rgba(255, 215, 0, 0.45)',
        wheelColor: 'linear-gradient(135deg, #fff7c2 0%, #ffd700 45%, #d4af37 80%, #6b4c00 100%)',
        wheelBorder: '#ffd700',
        dialBg: 'radial-gradient(circle at 50% 35%, #2a1f0a 0%, #110c03 100%)',
        dialBorder: '#ffd700',
        dialColor: '#ffd700',
        statusColor: '#ffd700'
    },
    syndicate: {
        id: 'syndicate',
        name: 'Underground Mob Heist',
        icon: '⚡',
        desc: 'Heavy Industrial Cast Iron, Welding Sparks & Red Siren Lockdown',
        bodyClass: 'theme-syndicate',
        bg: '#080303',
        bgGradient: 'radial-gradient(circle at 50% 30%, #260c0c 0%, #120404 60%, #050101 100%)',
        vaultRim: 'linear-gradient(135deg, #5c2424 0%, #381212 45%, #210a0a 70%, #0f0404 100%)',
        rimBorder: '#ff3344',
        accent: '#ff3344',
        glow: 'rgba(255, 51, 68, 0.45)',
        wheelColor: 'linear-gradient(135deg, #993333 0%, #5e1f1f 50%, #2e0d0d 100%)',
        wheelBorder: '#ff3344',
        dialBg: 'radial-gradient(circle at 50% 35%, #290e0e 0%, #120505 100%)',
        dialBorder: '#ff3344',
        dialColor: '#ff4d5a',
        statusColor: '#ff3344'
    }
};

class SafeAudioEngine {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.audioPath = '../assets/games/safecracker/audio/';

        // Real mechanical locker audio assets
        this.spinAudio = new Audio(this.audioPath + 'vault_spin.mp3');
        this.spinAudio.loop = true;
        this.spinAudio.volume = 0.5;

        this.boltAudio = new Audio(this.audioPath + 'bolt_clank.mp3');
        this.boltAudio.volume = 0.85;

        this.tickAudio = new Audio(this.audioPath + 'ratchet_tick.mp3');
        this.tickAudio.volume = 0.6;

        this.winAudio = new Audio(this.audioPath + 'vault_win.mp3');
        this.winAudio.volume = 0.9;

        this.coinsAudio = new Audio(this.audioPath + 'gold_coins.mp3');
        this.coinsAudio.volume = 0.8;
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

    playLockerSpin() {
        if (!this.soundEnabled) return;
        try {
            this.spinAudio.currentTime = 0;
            this.spinAudio.play().catch(() => {});
        } catch(e) {}
    }

    stopLockerSpin() {
        try {
            this.spinAudio.pause();
            this.spinAudio.currentTime = 0;
        } catch(e) {}
    }

    playBoltClank() {
        if (!this.soundEnabled) return;
        try {
            const clone = this.boltAudio.cloneNode();
            clone.volume = 0.85;
            clone.play().catch(() => {});
        } catch(e) {}
        this.playClankSynth();
    }

    playTumblerTick() {
        if (!this.soundEnabled) return;
        try {
            const clone = this.tickAudio.cloneNode();
            clone.volume = 0.55;
            clone.play().catch(() => {});
        } catch(e) {}
    }

    playClick() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.04);
        } catch(e) {}
    }

    playRatchet(freq = 600) {
        if (!this.soundEnabled) return;
        this.playTumblerTick();
        this.init();
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.4, this.ctx.currentTime + 0.03);
            gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.03);
        } catch(e) {}
    }

    playClank() {
        this.playBoltClank();
    }

    playClankSynth() {
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const o1 = this.ctx.createOscillator();
            const o2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            o1.type = 'sawtooth';
            o2.type = 'sine';
            o1.frequency.setValueAtTime(240, t);
            o1.frequency.exponentialRampToValueAtTime(60, t + 0.18);
            o2.frequency.setValueAtTime(520, t);
            o2.frequency.exponentialRampToValueAtTime(120, t + 0.18);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            o1.connect(gain);
            o2.connect(gain);
            gain.connect(this.ctx.destination);

            o1.start();
            o2.start();
            o1.stop(t + 0.22);
            o2.stop(t + 0.22);
        } catch(e) {}
    }

    playHydraulicRelease() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.4;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1200, t);
            filter.frequency.exponentialRampToValueAtTime(300, t + 0.35);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
            noise.stop(t + 0.38);
        } catch(e) {}
    }

    playWin(mult = 1) {
        if (!this.soundEnabled) return;
        try {
            this.winAudio.currentTime = 0;
            this.winAudio.play().catch(() => {});
            if (mult >= 6) {
                setTimeout(() => {
                    try {
                        this.coinsAudio.currentTime = 0;
                        this.coinsAudio.play().catch(() => {});
                    } catch(e) {}
                }, 400);
            }
        } catch(e) {}

        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const chord = mult >= 15 ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [440, 554.37, 659.25, 880];
            chord.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t + idx * 0.08);
                gain.gain.setValueAtTime(0.18, t + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.6);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t + idx * 0.08);
                osc.stop(t + idx * 0.08 + 0.6);
            });
        } catch(e) {}
    }

    playAlarm() {
        if (!this.soundEnabled) return;
        this.init();
        if (!this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.linearRampToValueAtTime(450, t + 0.25);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.3);
        } catch(e) {}
    }
}

class SafeCrackerGame {
    constructor() {
        this.isCracking = false;
        this.currentTheme = 'titanium';
        this.audio = new SafeAudioEngine();
        this.history = [];
        this.jackpotAmount = 50000;
        this.selectedBet = 100;
        this.dials = [1, 2, 3];
    }

    toggleSound(btn) {
        this.audio.soundEnabled = !this.audio.soundEnabled;
        if (!this.audio.soundEnabled) {
            this.audio.stopLockerSpin();
            if (btn) btn.innerText = '🔇 SOUND OFF';
        } else {
            this.audio.playBoltClank();
            if (btn) btn.innerText = '🔊 SOUND ON';
        }
    }

    init() {
        this.loadSavedTheme();
        this.renderThemeOptions();
        this.bindEvents();
        this.initChips();
        this.updateWalletDisplay();

        // Unlock Web Audio on first gesture
        const unlockAudio = () => {
            this.audio.init();
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
        };
        window.addEventListener('click', unlockAudio);
        window.addEventListener('touchstart', unlockAudio);
    }

    loadSavedTheme() {
        const saved = localStorage.getItem('safecracker_theme');
        if (saved && SAFECRACKER_THEMES[saved]) {
            this.setTheme(saved);
        } else {
            this.setTheme('titanium');
        }
    }

    setTheme(themeId) {
        if (!SAFECRACKER_THEMES[themeId]) return;
        this.currentTheme = themeId;
        localStorage.setItem('safecracker_theme', themeId);

        const th = SAFECRACKER_THEMES[themeId];
        document.body.className = `game-page ${th.bodyClass}`;

        const root = document.documentElement;
        root.style.setProperty('--sc-accent', th.accent);
        root.style.setProperty('--sc-glow', th.glow);
        root.style.setProperty('--sc-rim', th.vaultRim);
        root.style.setProperty('--sc-rim-border', th.rimBorder);
        root.style.setProperty('--sc-wheel', th.wheelColor);
        root.style.setProperty('--sc-wheel-border', th.wheelBorder);
        root.style.setProperty('--sc-dial-bg', th.dialBg);
        root.style.setProperty('--sc-dial-border', th.dialBorder);
        root.style.setProperty('--sc-dial-color', th.dialColor);

        const label = document.getElementById('currentThemeLabel');
        if (label) label.innerText = `${th.icon} ${th.name}`;

        // Update active theme in selector modal
        document.querySelectorAll('.theme-picker-card').forEach(card => {
            card.classList.toggle('active', card.dataset.theme === themeId);
        });

        this.audio.playClick();
    }

    renderThemeOptions() {
        const container = document.getElementById('themeCardsList');
        if (!container) return;
        container.innerHTML = Object.values(SAFECRACKER_THEMES).map(th => `
            <div class="theme-picker-card ${th.id === this.currentTheme ? 'active' : ''}" data-theme="${th.id}" onclick="window.safecrackerGame.setTheme('${th.id}')">
                <div class="theme-card-icon">${th.icon}</div>
                <div class="theme-card-body">
                    <div class="theme-card-title">${th.name}</div>
                    <div class="theme-card-desc">${th.desc}</div>
                </div>
                <div class="theme-card-indicator"></div>
            </div>
        `).join('');
    }

    bindEvents() {
        // Quick Bet modifiers
        const input = document.getElementById('sc-bet-input');
        if (input) {
            input.addEventListener('change', () => {
                this.selectedBet = Math.max(10, parseFloat(input.value) || 10);
                this.highlightMatchingChip(this.selectedBet);
            });
        }
    }

    initChips() {
        const chips = [10, 50, 100, 500, 1000, 5000];
        const container = document.getElementById('scChipsGroup');
        if (!container) return;

        container.innerHTML = chips.map(val => `
            <button class="sc-chip-btn ${val === 100 ? 'active' : ''}" data-val="${val}" onclick="window.safecrackerGame.setBetAmount(${val})">
                <span class="sc-chip-currency">₨</span>${val >= 1000 ? (val/1000) + 'K' : val}
            </button>
        `).join('');
    }

    setBetAmount(val) {
        this.selectedBet = val;
        const input = document.getElementById('sc-bet-input');
        if (input) input.value = val;
        this.highlightMatchingChip(val);
        this.audio.playClick();
    }

    modifyBet(action) {
        let cur = parseFloat(document.getElementById('sc-bet-input').value) || 100;
        const maxBal = this.getRealBalance();

        if (action === 'half') {
            cur = Math.max(10, Math.floor(cur / 2));
        } else if (action === 'double') {
            cur = Math.min(maxBal, cur * 2);
        } else if (action === 'max') {
            cur = Math.max(10, Math.floor(maxBal));
        }
        this.setBetAmount(cur);
    }

    highlightMatchingChip(val) {
        document.querySelectorAll('.sc-chip-btn').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.val) === val);
        });
    }

    getRealBalance() {
        let bal = 0;
        if (typeof getRealWalletBalance === 'function') {
            bal = getRealWalletBalance();
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

    async crackVault() {
        if (this.isCracking) return;

        const bet = parseFloat(document.getElementById('sc-bet-input').value) || 100;
        const bal = this.getRealBalance();

        if (bet <= 0) {
            alert('Please enter a valid bet amount!');
            return;
        }

        if (bet > bal) {
            alert(`Insufficient balance! Available: PKR ${bal.toFixed(2)}, Required: PKR ${bet.toFixed(2)}`);
            return;
        }

        // Deduct Bet via Bet With Net wallet
        let betDeducted = false;
        if (window.wallet && typeof window.wallet.addBalancePKR === 'function') {
            window.wallet.addBalancePKR(-bet);
            betDeducted = true;
        } else if (window.wallet && typeof window.wallet.placeBet === 'function') {
            betDeducted = window.wallet.placeBet(bet, 'Safe Cracker Vault');
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
        this.isCracking = true;
        const crackBtn = document.getElementById('sc-crack-btn');
        if (crackBtn) {
            crackBtn.classList.add('disabled');
            crackBtn.innerText = 'CRACKING VAULT DIALS... 🔐';
        }

        // Reset previous animations
        this.resetVaultState();

        // Security Status UI
        const statusEl = document.getElementById('sc-status');
        if (statusEl) {
            statusEl.className = 'vault-status-ticker cracking';
            statusEl.innerHTML = `<span class="ticker-pulse">⚡</span> DECRYPTING VAULT CIPHER TUMBLERS...`;
        }

        // Start Vault Rotary Wheel & Locker Mechanical Spin sound
        this.audio.playHydraulicRelease();
        this.audio.playLockerSpin();
        const wheel = document.getElementById('scVaultWheel');
        if (wheel) wheel.classList.add('spinning');

        // Spin Mechanical Gears
        const gTL = document.getElementById('gearTL');
        const gTR = document.getElementById('gearTR');
        const gB = document.getElementById('gearB');
        if (gTL) gTL.classList.add('rotating');
        if (gTR) gTR.classList.add('rotating-reverse');
        if (gB) gB.classList.add('rotating');

        // Elevate Pressure Needle
        const needle = document.getElementById('gaugeNeedle');
        if (needle) needle.style.transform = 'rotate(75deg)';

        // Keypad Display
        const keypadLed = document.getElementById('keypadLed');
        const keypadDisplay = document.getElementById('keypadDisplay');
        if (keypadLed) {
            keypadLed.innerText = 'DECIPHERING';
            keypadLed.className = 'keypad-led-status cracking';
        }
        if (keypadDisplay) keypadDisplay.innerText = 'CALC-CIPHER';

        // Casino Probability Model: 30% Win / 70% Loss (~94.5% RTP)
        const rand = Math.random();
        let targetD1, targetD2, targetD3;

        if (rand < 0.002) {
            // 100x Jackpot: 7-7-7 (0.2%)
            targetD1 = 7; targetD2 = 7; targetD3 = 7;
        } else if (rand < 0.010) {
            // 50x Triple non-7 (0.8%)
            const d = [1, 2, 3, 4, 5, 6, 8, 9][Math.floor(Math.random() * 8)];
            targetD1 = d; targetD2 = d; targetD3 = d;
        } else if (rand < 0.035) {
            // 15x Straight sequence (2.5%) e.g. 1-2-3, 4-5-6, 7-8-9
            const starts = [1, 2, 3, 4, 5, 6, 7];
            const s = starts[Math.floor(Math.random() * starts.length)];
            targetD1 = s; targetD2 = s + 1; targetD3 = s + 2;
        } else if (rand < 0.100) {
            // 6x Double Match (6.5%)
            const pairVal = Math.floor(Math.random() * 9) + 1;
            let third = Math.floor(Math.random() * 9) + 1;
            while (third === pairVal) third = Math.floor(Math.random() * 9) + 1;
            const pos = Math.floor(Math.random() * 3);
            if (pos === 0) { targetD1 = pairVal; targetD2 = pairVal; targetD3 = third; }
            else if (pos === 1) { targetD1 = pairVal; targetD2 = third; targetD3 = pairVal; }
            else { targetD1 = third; targetD2 = pairVal; targetD3 = pairVal; }
        } else if (rand < 0.300) {
            // 1.5x Lucky Keypin 7 (20.0%) -> Total Wins = 30.0%
            targetD1 = 7;
            targetD2 = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)];
            targetD3 = [6, 8, 9][Math.floor(Math.random() * 3)];
            const arr = [targetD1, targetD2, targetD3].sort(() => Math.random() - 0.5);
            targetD1 = arr[0]; targetD2 = arr[1]; targetD3 = arr[2];
        } else {
            // 70% Loss: 3 distinct numbers, no pair, no sequence, no 7, sum < 21
            const lossSets = [
                [1, 3, 5], [2, 4, 6], [1, 4, 8], [2, 5, 8], [3, 6, 9],
                [1, 5, 9], [2, 6, 8], [3, 5, 8], [4, 6, 9], [1, 6, 8],
                [2, 4, 9], [3, 5, 9], [1, 3, 8], [2, 5, 9], [4, 5, 8]
            ];
            const chosen = lossSets[Math.floor(Math.random() * lossSets.length)].sort(() => Math.random() - 0.5);
            targetD1 = chosen[0]; targetD2 = chosen[1]; targetD3 = chosen[2];
        }

        // Dial spinning cycles
        if (keypadDisplay) keypadDisplay.innerText = 'PIN 1 / 3';
        await this.animateDial('sc-dial-1', targetD1, 800);
        this.audio.playClank();
        this.animateLockBolt('bolt-left');

        if (keypadDisplay) keypadDisplay.innerText = 'PIN 2 / 3';
        await this.animateDial('sc-dial-2', targetD2, 1400);
        this.audio.playClank();
        this.animateLockBolt('bolt-top');

        if (keypadDisplay) keypadDisplay.innerText = 'PIN 3 / 3';
        await this.animateDial('sc-dial-3', targetD3, 2000);
        this.audio.playClank();
        this.animateLockBolt('bolt-right');
        this.animateLockBolt('bolt-bottom');

        // Stop Locker Spin Sound, Rotary Wheel & Gears
        this.audio.stopLockerSpin();
        if (wheel) wheel.classList.remove('spinning');
        if (gTL) gTL.classList.remove('rotating');
        if (gTR) gTR.classList.remove('rotating-reverse');
        if (gB) gB.classList.remove('rotating');

        // Calculate Multiplier and Result
        this.evaluateResult(bet, targetD1, targetD2, targetD3);

        // Unlock UI
        this.isCracking = false;
        if (crackBtn) {
            crackBtn.classList.remove('disabled');
            crackBtn.innerText = 'CRACK VAULT DIALS 🔓';
        }
    }

    animateDial(elementId, finalNumber, totalDuration) {
        return new Promise(resolve => {
            const dial = document.getElementById(elementId);
            if (!dial) return resolve();

            dial.classList.add('spinning');
            const startTime = Date.now();
            let intervalTime = 50;

            const step = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < totalDuration) {
                    const rnd = Math.floor(Math.random() * 9) + 1;
                    dial.innerText = rnd;
                    this.audio.playRatchet(500 + rnd * 50);

                    // Decelerate towards end
                    if (elapsed > totalDuration * 0.7) intervalTime += 25;
                    setTimeout(step, intervalTime);
                } else {
                    dial.innerText = finalNumber;
                    dial.classList.remove('spinning');
                    dial.classList.add('locked');
                    resolve();
                }
            };
            step();
        });
    }

    animateLockBolt(boltId) {
        const bolt = document.getElementById(boltId);
        if (bolt) {
            bolt.classList.add('retracted');
            setTimeout(() => bolt.classList.remove('retracted'), 1200);
        }
    }

    evaluateResult(bet, d1, d2, d3) {
        let mult = 0;
        let winTitle = '';
        let winDesc = '';

        // 1. Triple 7s = 100x MEGA HEIST
        if (d1 === 7 && d2 === 7 && d3 === 7) {
            mult = 100.0;
            winTitle = '🌟 100X MEGA HEIST JACKPOT!';
            winDesc = `LEGENDARY 7-7-7 COMBINATION! 24K GOLD RESERVE CRACKED!`;
        }
        // 2. Any Triple Match = 50x
        else if (d1 === d2 && d2 === d3) {
            mult = 50.0;
            winTitle = '🏆 50X HIGH SECURITY JACKPOT!';
            winDesc = `TRIPLE TUMBLER MATCH ${d1}-${d2}-${d3}! DIAMOND SAFE UNLOCKED!`;
        }
        // 3. Consecutive Straight (e.g. 1-2-3, 4-5-6, 7-8-9) = 15x
        else if ((d1 + 1 === d2 && d2 + 1 === d3) || (d1 - 1 === d2 && d2 - 1 === d3)) {
            mult = 15.0;
            winTitle = '💎 15X CIPHER SEQUENCE MATCH!';
            winDesc = `PERFECT VAULT KEY SEQUENCE ${d1}-${d2}-${d3}!`;
        }
        // 4. Double Match (Any 2 equal) = 6x
        else if (d1 === d2 || d2 === d3 || d1 === d3) {
            mult = 6.0;
            winTitle = '💰 6X DOUBLE TUMBLER ALIGNED!';
            winDesc = `2 CIPHER PINS LOCKED! HEAVY CASH BRIEFCASE WON!`;
        }
        // 5. High Sum (Sum >= 21) = 2.5x
        else if ((d1 + d2 + d3) >= 21) {
            mult = 2.5;
            winTitle = '⚡ 2.5X PRESSURE OVERRIDE!';
            winDesc = `HIGH ENERGY TUMBLER SUM (${d1 + d2 + d3}) OVERRIDE!`;
        }
        // 6. Any One Match with Lucky 7 = 1.5x
        else if (d1 === 7 || d2 === 7 || d3 === 7) {
            mult = 1.5;
            winTitle = '💵 1.5X LUCKY KEYPIN MATCH!';
            winDesc = `PARTIAL LOCK PICK WITH KEYPIN 7!`;
        }

        const statusEl = document.getElementById('sc-status');
        const vaultDoor = document.getElementById('scVaultDoor');

        if (mult > 0) {
            const winAmount = bet * mult;

            // Credit Real Win via Bet With Net wallet
            if (window.wallet && typeof window.wallet.addBalancePKR === 'function') {
                window.wallet.addBalancePKR(winAmount);
            } else if (window.wallet && typeof window.wallet.creditWin === 'function') {
                window.wallet.creditWin(bet, winAmount, 'Safe Cracker Vault', mult, `Vault code ${d1}-${d2}-${d3}`);
            } else {
                const cur = this.getRealBalance();
                const newBal = cur + winAmount;
                localStorage.setItem('wallet_balance', newBal.toString());
                localStorage.setItem('BETWITHNET_balance', newBal.toString());
            }

            this.updateWalletDisplay();

            // Vault Door Open Visual Sequence
            if (vaultDoor) {
                vaultDoor.classList.add('cracked-open');
            }
            const portalFrame = document.getElementById('vaultPortalFrame');
            if (portalFrame) portalFrame.classList.add('open-heist');

            const winMultBadge = document.getElementById('interiorWinMult');
            const winCashBadge = document.getElementById('interiorWinCash');
            if (winMultBadge) winMultBadge.innerText = `+${mult}X`;
            if (winCashBadge) winCashBadge.innerText = `₨ ${winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // Keypad & Gauge state
            const keypadLed = document.getElementById('keypadLed');
            const keypadDisplay = document.getElementById('keypadDisplay');
            const needle = document.getElementById('gaugeNeedle');
            if (keypadLed) {
                keypadLed.innerText = 'GRANTED';
                keypadLed.className = 'keypad-led-status open';
            }
            if (keypadDisplay) keypadDisplay.innerText = `+${mult}X WON`;
            if (needle) needle.style.transform = 'rotate(-10deg)';

            // Audio Win
            this.audio.playWin(mult);

            // Trigger Confetti / Gold Coin Shower for big wins
            this.spawnGoldSparks();

            // Update Status Ticker
            if (statusEl) {
                statusEl.className = 'vault-status-ticker won';
                statusEl.innerHTML = `
                    <div class="status-win-headline">${winTitle}</div>
                    <div class="status-win-payout">+₨ ${winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${mult}X)</div>
                    <div class="status-win-sub">${winDesc}</div>
                `;
            }

            // Show Toast Banner
            const toast = document.getElementById('spinWinToast');
            const toastAmt = document.getElementById('toastWinAmount');
            if (toast && toastAmt) {
                toastAmt.innerText = `PKR ${winAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 4000);
            }

            // Add History
            this.addHistoryRecord(d1, d2, d3, mult, winAmount, true);

        } else {
            // Loss / Alarm Tripped
            const keypadLed = document.getElementById('keypadLed');
            const keypadDisplay = document.getElementById('keypadDisplay');
            const needle = document.getElementById('gaugeNeedle');
            if (keypadLed) {
                keypadLed.innerText = 'LOCKOUT';
                keypadLed.className = 'keypad-led-status lost';
            }
            if (keypadDisplay) keypadDisplay.innerText = 'SEC-ALERT';
            if (needle) needle.style.transform = 'rotate(-45deg)';

            this.audio.playAlarm();

            const vaultStage = document.getElementById('vaultStageWrapper');
            if (vaultStage) {
                vaultStage.classList.add('alarm-triggered');
                setTimeout(() => vaultStage.classList.remove('alarm-triggered'), 2500);
            }

            if (statusEl) {
                statusEl.className = 'vault-status-ticker lost';
                statusEl.innerHTML = `
                    <div class="status-lose-headline">🚨 ALARM TRIPPED! INTRUSION DETECTED! 🚨</div>
                    <div class="status-lose-sub">Code ${d1}-${d2}-${d3} failed to align the tumblers. Dials reset!</div>
                `;
            }

            // Add History
            this.addHistoryRecord(d1, d2, d3, 0, 0, false);
        }
    }

    resetVaultState() {
        const vaultDoor = document.getElementById('scVaultDoor');
        if (vaultDoor) vaultDoor.classList.remove('cracked-open');

        const portalFrame = document.getElementById('vaultPortalFrame');
        if (portalFrame) portalFrame.classList.remove('open-heist');

        const stage = document.getElementById('vaultStageWrapper');
        if (stage) stage.classList.remove('alarm-triggered');

        const keypadLed = document.getElementById('keypadLed');
        const keypadDisplay = document.getElementById('keypadDisplay');
        const needle = document.getElementById('gaugeNeedle');
        if (keypadLed) {
            keypadLed.innerText = 'SECURED';
            keypadLed.className = 'keypad-led-status';
        }
        if (keypadDisplay) keypadDisplay.innerText = 'SYS-READY';
        if (needle) needle.style.transform = 'rotate(-45deg)';

        document.querySelectorAll('.sc-dial-box').forEach(d => {
            d.classList.remove('locked', 'winning');
        });
    }

    spawnGoldSparks() {
        const container = document.getElementById('vaultSparksLayer');
        if (!container) return;

        container.innerHTML = '';
        for (let i = 0; i < 28; i++) {
            const spark = document.createElement('div');
            spark.className = 'gold-spark-particle';
            spark.style.left = `${Math.random() * 85 + 7}%`;
            spark.style.top = `${Math.random() * 50 + 25}%`;
            spark.style.animationDelay = `${Math.random() * 0.4}s`;
            spark.style.animationDuration = `${0.8 + Math.random() * 0.6}s`;
            container.appendChild(spark);
        }

        setTimeout(() => {
            if (container) container.innerHTML = '';
        }, 2500);
    }

    addHistoryRecord(d1, d2, d3, mult, win, won) {
        const historyList = document.getElementById('scHistoryList');
        if (!historyList) return;

        const item = document.createElement('div');
        item.className = `sc-history-item ${won ? 'win' : 'loss'}`;
        item.innerHTML = `
            <span class="sc-hist-code">${d1}-${d2}-${d3}</span>
            <span class="sc-hist-mult">${won ? mult + 'x' : '0x'}</span>
            <span class="sc-hist-amount">${won ? '+₨ ' + Math.floor(win) : '-₨ ' + this.selectedBet}</span>
        `;

        historyList.prepend(item);
        if (historyList.children.length > 8) {
            historyList.removeChild(historyList.lastChild);
        }
    }
}

// Global initialization
window.safecrackerGame = new SafeCrackerGame();
