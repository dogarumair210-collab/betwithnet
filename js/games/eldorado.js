/**
 * Mines of El Dorado - Ultra HD VIP 3D Aztec Expedition
 * Authentic Ancient Mayan/Aztec Temple Runes & Golden Sun Idols
 * Integrated with Bet With Net Wallet & VIP Audio System
 */

class EldoradoGame {
    constructor() {
        this.isPlaying = false;
        this.bet = 100;
        this.trapCount = 3; // 2 = Explorer, 3 = Adventurer, 5 = High Roller
        this.traps = [];
        this.uncovered = 0;
        this.currentMult = 1.0;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.currentTheme = localStorage.getItem('bwn_eldorado_theme') || 'theme-gold';
        this.currentMusicTrack = 0;
        this.musicTracks = [
            '../assets/audio/eldorado_bgm.mp3',
            '../assets/audio/eldorado_temple.mp3'
        ];

        // Multipliers ladder (16 tiles total)
        this.multiplierLadders = {
            2: [1.18, 1.42, 1.72, 2.10, 2.60, 3.25, 4.15, 5.40, 7.20, 10.0, 14.5, 22.5, 38.0, 75.0],
            3: [1.25, 1.70, 2.40, 3.60, 5.80, 10.0, 18.0, 35.0, 75.0, 180.0, 500.0, 1600.0, 6000.0],
            5: [1.60, 2.80, 5.20, 10.5, 23.0, 55.0, 145.0, 420.0, 1400.0, 5500.0, 25000.0]
        };

        this.history = [];
        this.themes = [
            {
                id: 'theme-gold',
                name: '👑 Golden Sun Temple',
                badge: '24K Aztec Gold',
                desc: 'Ancient El Dorado sanctuary filled with golden idols and blazing torches.',
                accent: '#ffd700'
            },
            {
                id: 'theme-maya',
                name: '🌙 Midnight Sanctuary',
                badge: 'Obsidian & Moon',
                desc: 'Mystic nocturnal jungle temple bathed in blue lunar light.',
                accent: '#00e5ff'
            },
            {
                id: 'theme-magma',
                name: '🌋 Mictlan Molten Vault',
                badge: 'Volcanic Embers',
                desc: 'Deep underworld cavern with glowing lava fissures and cursed traps.',
                accent: '#ff5722'
            }
        ];
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.renderThemeCards();
        this.updateWalletHUD();
        this.updateMultiplierLadder();
        this.initAudio();
        this.setupConfetti();
        this.initDustParticles();
        this.highlightActiveChip(100);

        window.addEventListener('walletUpdated', () => this.updateWalletHUD());
        window.addEventListener('storage', () => this.updateWalletHUD());

        const bgVideo = document.querySelector('.ed-bg-video');
        if (bgVideo) {
            bgVideo.play().catch(() => {
                document.addEventListener('click', () => {
                    if (bgVideo.paused) bgVideo.play().catch(() => {});
                }, { once: true });
            });
        }
    }

    /* -------------------------------------------------------------
       THEME MANAGEMENT
       ------------------------------------------------------------- */
    applyTheme(themeId) {
        document.body.classList.remove('theme-gold', 'theme-maya', 'theme-magma');
        document.body.classList.add(themeId);
        this.currentTheme = themeId;
        localStorage.setItem('bwn_eldorado_theme', themeId);

        const theme = this.themes.find(t => t.id === themeId);
        const nameEl = document.getElementById('ed-current-theme-name');
        if (nameEl && theme) {
            nameEl.innerText = theme.name.split(' ')[0] + ' ' + theme.name.split(' ')[1];
        }
        this.renderThemeCards();
    }

    openThemeModal() {
        const modal = document.getElementById('ed-themes-modal');
        if (modal) modal.classList.add('open');
    }

    closeThemeModal() {
        const modal = document.getElementById('ed-themes-modal');
        if (modal) modal.classList.remove('open');
    }

    renderThemeCards() {
        const list = document.getElementById('ed-theme-cards-list');
        if (!list) return;
        list.innerHTML = this.themes.map(t => `
            <div class="ed-theme-card ${t.id === this.currentTheme ? 'selected' : ''}" onclick="window.eldoradoGame.applyTheme('${t.id}')">
                <div class="ed-theme-card-top">
                    <span class="ed-theme-title">${t.name}</span>
                    <span class="ed-theme-badge" style="border-color:${t.accent}; color:${t.accent};">${t.badge}</span>
                </div>
                <div class="ed-theme-desc">${t.desc}</div>
            </div>
        `).join('');
    }

    /* -------------------------------------------------------------
       AUDIO ENGINE
       ------------------------------------------------------------- */
    initAudio() {
        this.bgm = document.getElementById('ed-bgm-audio');
        if (this.bgm) {
            this.bgm.volume = 0.50;
            this.bgm.src = this.musicTracks[this.currentMusicTrack];

            const startBGM = () => {
                if (this.musicEnabled && this.bgm && this.bgm.paused) {
                    if (this.audioCtx && this.audioCtx.state === 'suspended') {
                        this.audioCtx.resume();
                    }
                    this.bgm.play().then(() => {
                        this.updateMusicUI();
                    }).catch(() => {});
                }
            };

            const playPromise = this.bgm.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    this.musicEnabled = true;
                    this.updateMusicUI();
                }).catch(() => {
                    // Browser policy blocked autoplay: start on first touch/click
                    window.addEventListener('click', startBGM, { once: true, passive: true });
                    window.addEventListener('touchstart', startBGM, { once: true, passive: true });
                    window.addEventListener('pointerdown', startBGM, { once: true, passive: true });
                });
            }
        }

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch(e) {
            this.audioCtx = null;
        }
        this.updateMusicUI();
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
        const eq = document.getElementById('ed-music-eq');
        const lbl = document.getElementById('ed-music-label');
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
        const icon = document.getElementById('ed-sound-icon');
        if (icon) icon.innerText = this.soundEnabled ? '🔊' : '🔇';
    }

    playSFX(type) {
        if (!this.soundEnabled) return;

        try {
            if (type === 'relic' || type === 'gem') {
                const s = new Audio('../assets/games/fortunegems/audio/coin_cascade.mp3');
                s.volume = 0.55;
                s.play().catch(() => this.synthChime());
                return;
            } else if (type === 'trap') {
                const s = new Audio('../assets/audio/aviator_crash.mp3');
                s.volume = 0.65;
                s.play().catch(() => this.synthTrap());
                return;
            } else if (type === 'win' || type === 'cashout') {
                const s = new Audio('../assets/games/fortunegems/audio/jackpot_fanfare.mp3');
                s.volume = 0.65;
                s.play().catch(() => this.synthFanfare());
                return;
            } else if (type === 'chip') {
                const s = new Audio('../assets/games/wheel/audio/chip_place.mp3');
                s.volume = 0.45;
                s.play().catch(() => {});
                return;
            }
        } catch(e) {}

        if (type === 'relic') this.synthChime();
        else if (type === 'trap') this.synthTrap();
        else if (type === 'win') this.synthFanfare();
    }

    synthChime() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const freqs = [587.33, 739.99, 880, 1174.66];
        freqs.forEach((f, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.05);
            gain.gain.setValueAtTime(0.12, now + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.05 + 0.5);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.05);
            osc.stop(now + i * 0.05 + 0.5);
        });
    }

    synthTrap() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.6);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
    }

    synthFanfare() {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + idx * 0.12);
            gain.gain.setValueAtTime(0.15, now + idx * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.8);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.8);
        });
    }

    /* -------------------------------------------------------------
       WALLET & STAKES
       ------------------------------------------------------------- */
    getRealBalance() {
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return window.wallet.getBalance();
        }
        const b = localStorage.getItem('BETWITHNET_balance');
        return b ? parseFloat(b) : 5000;
    }

    updateWalletHUD() {
        const bal = this.getRealBalance();
        const el = document.getElementById('ed-wallet-balance');
        if (el) {
            el.innerText = 'Rs. ' + bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    setQuickBet(val) {
        const input = document.getElementById('ed-bet-input');
        if (input) {
            input.value = val;
            this.bet = val;
        }
        this.highlightActiveChip(val);
        this.playSFX('chip');
        this.updateMultiplierLadder();
    }

    modifyBet(action) {
        const input = document.getElementById('ed-bet-input');
        if (!input) return;
        let val = parseFloat(input.value) || 100;
        const bal = this.getRealBalance();

        if (action === 'half') val = Math.max(10, Math.floor(val / 2));
        else if (action === 'double') val = Math.min(bal, Math.floor(val * 2));
        else if (action === 'max') val = Math.max(10, Math.floor(bal));

        input.value = val;
        this.bet = val;
        this.highlightActiveChip(val);
        this.playSFX('chip');
        this.updateMultiplierLadder();
    }

    highlightActiveChip(val) {
        document.querySelectorAll('.casino-chip-3d').forEach(chip => {
            const chipVal = parseInt(chip.getAttribute('data-chip'), 10);
            if (chipVal === val) chip.classList.add('active');
            else chip.classList.remove('active');
        });
    }

    setTrapCount(count) {
        if (this.isPlaying) return;
        this.trapCount = count;
        document.querySelectorAll('.ed-trap-btn').forEach(b => {
            const c = parseInt(b.getAttribute('data-traps'), 10);
            if (c === count) b.classList.add('active');
            else b.classList.remove('active');
        });
        this.playSFX('chip');
        this.updateMultiplierLadder();
    }

    /* -------------------------------------------------------------
       MULTIPLIER LADDER
       ------------------------------------------------------------- */
    getLadder() {
        return this.multiplierLadders[this.trapCount] || this.multiplierLadders[3];
    }

    updateMultiplierLadder() {
        const ladder = this.getLadder();
        const container = document.getElementById('ed-ladder-track');
        if (!container) return;

        const betVal = parseFloat(document.getElementById('ed-bet-input')?.value) || this.bet;

        container.innerHTML = ladder.map((mult, idx) => {
            const isCompleted = idx < this.uncovered;
            const isCurrent = idx === this.uncovered && this.isPlaying;
            const winVal = Math.round(betVal * mult);
            return `
                <div class="ed-ladder-step ${isCompleted ? 'step-cleared' : ''} ${isCurrent ? 'step-active' : ''}">
                    <span class="ladder-mult">${mult.toFixed(2)}×</span>
                    <span class="ladder-val">Rs. ${winVal >= 1000 ? (winVal/1000).toFixed(1) + 'k' : winVal}</span>
                </div>
            `;
        }).join('');

        if (this.isPlaying && this.uncovered > 0) {
            const activeStep = container.querySelector('.step-active');
            if (activeStep) {
                activeStep.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }

    /* -------------------------------------------------------------
       GAMEPLAY LOGIC
       ------------------------------------------------------------- */
    startExpedition() {
        if (this.isPlaying) return;

        const input = document.getElementById('ed-bet-input');
        const b = parseFloat(input ? input.value : this.bet) || 100;
        if (b < 10) {
            alert('Minimum stake is Rs. 10');
            return;
        }

        if (window.wallet && typeof window.wallet.placeBet === 'function') {
            if (!window.wallet.placeBet(b, 'Mines of El Dorado')) return;
        } else {
            const currentBal = this.getRealBalance();
            if (currentBal < b) {
                alert('Insufficient balance. Please deposit to explore!');
                return;
            }
            localStorage.setItem('BETWITHNET_balance', (currentBal - b).toString());
        }

        this.isPlaying = true;
        this.bet = b;
        this.uncovered = 0;
        this.currentMult = 1.0;

        // Generate random traps
        this.traps = [];
        while (this.traps.length < this.trapCount) {
            const r = Math.floor(Math.random() * 16);
            if (!this.traps.includes(r)) this.traps.push(r);
        }

        // Reset grid tiles with Master Aztec Stone Carvings
        const tiles = document.querySelectorAll('.ed-tile');
        tiles.forEach((t, i) => {
            t.className = 'ed-tile';
            t.disabled = false;
            t.innerHTML = `
                <div class="ed-tile-inner">
                    <div class="ed-tile-front">
                        <div class="stone-corner-deco tl"></div>
                        <div class="stone-corner-deco tr"></div>
                        <div class="stone-corner-deco bl"></div>
                        <div class="stone-corner-deco br"></div>
                        <svg class="aztec-sun-svg" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="44" stroke="#ffd700" stroke-width="2.5" stroke-dasharray="5 3" opacity="0.6"/>
                            <circle cx="50" cy="50" r="34" stroke="#e6b800" stroke-width="3" opacity="0.8"/>
                            <polygon points="50,12 55,26 68,26 58,35 62,48 50,40 38,48 42,35 32,26 45,26" fill="url(#sunGoldGrad)" opacity="0.95"/>
                            <circle cx="50" cy="50" r="14" fill="#00e676" stroke="#ffd700" stroke-width="2.5" filter="drop-shadow(0 0 6px #00e676)"/>
                            <circle cx="50" cy="50" r="6" fill="#fff" opacity="0.8"/>
                            <defs>
                                <linearGradient id="sunGoldGrad" x1="0" y1="0" x2="100" y2="100">
                                    <stop offset="0%" stop-color="#fff8db" />
                                    <stop offset="50%" stop-color="#ffd700" />
                                    <stop offset="100%" stop-color="#996515" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div class="ed-rune-shimmer"></div>
                    </div>
                    <div class="ed-tile-back"></div>
                </div>
            `;
        });

        // Switch Action Buttons
        const startBtn = document.getElementById('ed-start-btn');
        const cashoutBtn = document.getElementById('ed-cashout-btn');
        const trapBtns = document.getElementById('ed-trap-selector');

        if (startBtn) startBtn.style.display = 'none';
        if (cashoutBtn) {
            cashoutBtn.style.display = 'flex';
            cashoutBtn.disabled = true;
            cashoutBtn.classList.remove('pulse-cashout');
            cashoutBtn.innerHTML = `<span>SURFACE GOLD</span> <span class="cashout-val">Rs. 0.00</span>`;
        }
        if (trapBtns) trapBtns.classList.add('disabled-controls');

        this.updateStatus('ancient-active', 'Explore the ancient stone tablets. Avoid cursed serpent traps!');
        this.updateMultiplierLadder();
        this.updateWalletHUD();
        this.playSFX('chip');
    }

    step(idx) {
        if (!this.isPlaying) return;

        const tile = document.querySelectorAll('.ed-tile')[idx];
        if (!tile || tile.classList.contains('revealed')) return;

        tile.classList.add('revealed');
        const back = tile.querySelector('.ed-tile-back');

        if (this.traps.includes(idx)) {
            // HIT CURSED TRAP
            this.isPlaying = false;
            tile.classList.add('trap-hit');
            if (back) {
                back.innerHTML = `
                    <div class="ed-trap-content">
                        <div class="trap-skull-svg">
                            <svg viewBox="0 0 100 100" width="50" height="50">
                                <circle cx="50" cy="50" r="42" fill="#ff1744" opacity="0.35"/>
                                <path d="M26 40 C26 20 74 20 74 40 C74 58 68 70 62 76 L38 76 C32 70 26 58 26 40 Z" fill="#ff3b30" stroke="#ffd700" stroke-width="1.5"/>
                                <circle cx="40" cy="42" r="7" fill="#140003"/>
                                <circle cx="60" cy="42" r="7" fill="#140003"/>
                                <circle cx="40" cy="42" r="3" fill="#ff1744"/>
                                <circle cx="60" cy="42" r="3" fill="#ff1744"/>
                                <path d="M46 54 L54 54 L50 60 Z" fill="#140003"/>
                                <rect x="42" y="66" width="3.5" height="7" fill="#fff"/>
                                <rect x="48" y="66" width="3.5" height="7" fill="#fff"/>
                                <rect x="54" y="66" width="3.5" height="7" fill="#fff"/>
                            </svg>
                        </div>
                        <span class="trap-label">CURSED TRAP</span>
                    </div>
                `;
            }

            // Seismic screen quake
            const stage = document.querySelector('.ed-grid-card');
            if (stage) {
                stage.classList.add('temple-quake');
                setTimeout(() => stage.classList.remove('temple-quake'), 850);
            }

            this.playSFX('trap');
            if (window.wallet && typeof window.wallet.creditWin === 'function') {
                window.wallet.creditWin(this.bet, 0, 'Mines of El Dorado', 0, 'Cursed Aztec Trap');
            }

            this.updateStatus('curse-fail', 'TEMPLE COLLAPSED! Cursed Serpent Trap Triggered!');
            this.revealRemaining();
            this.endGame(false);
            this.recordHistory(false, 0);

        } else {
            // UNCOVERED EMERALD IDOL / SUN GOD RELIC
            this.uncovered++;
            const ladder = this.getLadder();
            this.currentMult = ladder[Math.min(this.uncovered - 1, ladder.length - 1)];
            const currentWin = Math.round(this.bet * this.currentMult);

            tile.classList.add('relic-hit');
            if (back) {
                back.innerHTML = `
                    <div class="ed-relic-content">
                        <div class="relic-sunburst"></div>
                        <img src="../assets/games/wheel/symbols/sym_wild.png" class="relic-img" alt="Sun Idol" />
                        <span class="relic-badge">+${this.currentMult.toFixed(2)}×</span>
                    </div>
                `;
            }

            this.playSFX('relic');

            // Update Surface Gold Cashout Button
            const cashoutBtn = document.getElementById('ed-cashout-btn');
            if (cashoutBtn) {
                cashoutBtn.disabled = false;
                cashoutBtn.classList.add('pulse-cashout');
                cashoutBtn.innerHTML = `
                    <span>SURFACE GOLD (${this.currentMult.toFixed(2)}×)</span>
                    <span class="cashout-val">Rs. ${currentWin.toLocaleString()}</span>
                `;
            }

            this.updateStatus('relic-success', `✨ Golden Sun Idol Found! Stash: Rs. ${currentWin.toLocaleString()} (${this.currentMult.toFixed(2)}×)`);
            this.updateMultiplierLadder();

            // Auto-cashout if cleared all safe relics
            const totalSafe = 16 - this.trapCount;
            if (this.uncovered >= totalSafe || this.uncovered >= ladder.length) {
                setTimeout(() => this.cashOut(), 400);
            }
        }
    }

    cashOut() {
        if (!this.isPlaying || this.uncovered === 0) return;

        this.isPlaying = false;
        const ladder = this.getLadder();
        const mult = ladder[Math.min(this.uncovered - 1, ladder.length - 1)];
        const winAmount = Math.round(this.bet * mult);

        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(this.bet, winAmount, 'Mines of El Dorado', mult, `Surfaced with ${this.uncovered} relics`);
        } else {
            const currentBal = this.getRealBalance();
            localStorage.setItem('BETWITHNET_balance', (currentBal + winAmount).toString());
        }

        this.playSFX('win');
        this.revealRemaining();
        this.endGame(true);
        this.updateWalletHUD();
        this.triggerConfetti();
        this.showWinModal(winAmount, mult);
        this.recordHistory(true, mult);
        this.updateStatus('relic-success', `🏆 ESCAPED WITH GOLD! +Rs. ${winAmount.toLocaleString()} (${mult.toFixed(2)}×)!`);
    }

    revealRemaining() {
        const tiles = document.querySelectorAll('.ed-tile');
        tiles.forEach((t, i) => {
            if (!t.classList.contains('revealed')) {
                t.classList.add('revealed', 'revealed-dormant');
                const back = t.querySelector('.ed-tile-back');
                if (this.traps.includes(i)) {
                    t.classList.add('dormant-trap');
                    if (back) {
                        back.innerHTML = `
                            <div class="ed-trap-content" style="opacity:0.75;">
                                <svg viewBox="0 0 100 100" width="34" height="34">
                                    <path d="M26 40 C26 20 74 20 74 40 C74 58 68 70 62 76 L38 76 C32 70 26 58 26 40 Z" fill="#ff3b30"/>
                                    <circle cx="40" cy="42" r="5" fill="#000"/>
                                    <circle cx="60" cy="42" r="5" fill="#000"/>
                                </svg>
                                <span class="trap-label" style="font-size:7.5px;">TRAP</span>
                            </div>
                        `;
                    }
                } else {
                    t.classList.add('dormant-relic');
                    if (back) {
                        back.innerHTML = `
                            <div class="ed-relic-content">
                                <img src="../assets/games/wheel/symbols/sym_wild.png" class="relic-img" style="opacity:0.6; filter:grayscale(30%); width:34px; height:34px;" alt="Idol" />
                            </div>
                        `;
                    }
                }
            }
        });
    }

    endGame(won) {
        const startBtn = document.getElementById('ed-start-btn');
        const cashoutBtn = document.getElementById('ed-cashout-btn');
        const trapBtns = document.getElementById('ed-trap-selector');

        if (cashoutBtn) {
            cashoutBtn.classList.remove('pulse-cashout');
            cashoutBtn.style.display = 'none';
        }
        if (startBtn) {
            startBtn.style.display = 'flex';
            startBtn.innerHTML = `<span>ENTER TEMPLE</span> <span class="btn-sub">🏺 16 RUNIC SLABS</span>`;
        }
        if (trapBtns) trapBtns.classList.remove('disabled-controls');
        this.updateMultiplierLadder();
    }

    updateStatus(type, msg) {
        const statusEl = document.getElementById('ed-status-banner');
        if (!statusEl) return;
        statusEl.className = 'status-banner ' + type;
        statusEl.innerHTML = `<span class="status-pulse-dot"></span><span>${msg}</span>`;
    }

    recordHistory(won, mult) {
        this.history.unshift({ won, mult, traps: this.trapCount });
        if (this.history.length > 8) this.history.pop();

        const bar = document.getElementById('ed-history-chips');
        if (!bar) return;
        bar.innerHTML = this.history.map(h => `
            <div class="ed-history-chip ${h.won ? 'chip-win' : 'chip-loss'}">
                ${h.won ? h.mult.toFixed(2) + '×' : '💀 0×'}
            </div>
        `).join('');
    }

    /* -------------------------------------------------------------
       WIN MODAL & CONFETTI
       ------------------------------------------------------------- */
    showWinModal(amount, mult) {
        const modal = document.getElementById('ed-win-modal');
        const amtEl = document.getElementById('ed-win-modal-amount');
        const multEl = document.getElementById('ed-win-modal-mult');
        if (!modal) return;

        if (amtEl) amtEl.innerText = 'Rs. ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });
        if (multEl) multEl.innerText = `Excavated ${this.uncovered} Sun Idols at ${mult.toFixed(2)}× Stake!`;
        modal.classList.add('open');

        const winVideo = document.getElementById('ed-win-coins-video');
        if (winVideo) {
            try {
                winVideo.currentTime = 0;
                const p = winVideo.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(e => console.log('Video autoplay deferred:', e));
                }
            } catch(e) {}
        }
    }

    closeWinModal() {
        const modal = document.getElementById('ed-win-modal');
        if (modal) modal.classList.remove('open');
        const winVideo = document.getElementById('ed-win-coins-video');
        if (winVideo) {
            try { winVideo.pause(); } catch(e) {}
        }
    }

    setupConfetti() {
        this.canvas = document.getElementById('confetti-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resizeConfetti();
        window.addEventListener('resize', () => this.resizeConfetti());
    }

    resizeConfetti() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    triggerConfetti() {
        if (!this.canvas || !this.ctx) return;
        this.resizeConfetti();
        this.particles = [];
        const colors = ['#ffd700', '#ffea00', '#00e676', '#00e5ff', '#ff5722', '#ffffff'];
        for (let i = 0; i < 90; i++) {
            this.particles.push({
                x: this.canvas.width / 2 + (Math.random() - 0.5) * 120,
                y: this.canvas.height / 2 + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 12,
                vy: (Math.random() - 0.9) * 16,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                spin: (Math.random() - 0.5) * 10,
                life: 1.0,
                decay: Math.random() * 0.015 + 0.01
            });
        }

        let animFrame;
        const render = () => {
            if (!this.ctx) return;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let active = 0;
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.35;
                p.rotation += p.spin;
                p.life -= p.decay;

                if (p.life > 0) {
                    active++;
                    this.ctx.save();
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate((p.rotation * Math.PI) / 180);
                    this.ctx.fillStyle = p.color;
                    this.ctx.globalAlpha = p.life;
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
                    this.ctx.restore();
                }
            });

            if (active > 0) {
                animFrame = requestAnimationFrame(render);
            } else {
                cancelAnimationFrame(animFrame);
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        };
        render();
    }

    /* -------------------------------------------------------------
       ATMOSPHERIC GOLDEN DUST & FIREFLIES
       ------------------------------------------------------------- */
    initDustParticles() {
        const canvas = document.getElementById('dust-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const dust = [];
        for (let i = 0; i < 45; i++) {
            dust.push({
                x: Math.random() * width,
                y: Math.random() * height,
                size: Math.random() * 2.5 + 0.8,
                speedY: Math.random() * 0.5 + 0.2,
                speedX: (Math.random() - 0.5) * 0.3,
                opacity: Math.random() * 0.6 + 0.2,
                fadeSpeed: Math.random() * 0.01 + 0.005,
                color: Math.random() > 0.3 ? '#ffd700' : '#00e676'
            });
        }

        const renderDust = () => {
            ctx.clearRect(0, 0, width, height);
            dust.forEach(d => {
                d.y -= d.speedY;
                d.x += d.speedX;
                d.opacity += d.fadeSpeed;
                if (d.opacity >= 0.8 || d.opacity <= 0.1) d.fadeSpeed = -d.fadeSpeed;

                if (d.y < 0) {
                    d.y = height + 10;
                    d.x = Math.random() * width;
                }

                ctx.save();
                ctx.fillStyle = d.color;
                ctx.globalAlpha = Math.max(0, d.opacity);
                ctx.shadowBlur = 8;
                ctx.shadowColor = d.color;
                ctx.beginPath();
                ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            requestAnimationFrame(renderDust);
        };
        renderDust();
    }
}

window.eldoradoGame = new EldoradoGame();
