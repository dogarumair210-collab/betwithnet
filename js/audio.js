// ============================================================
// Bet With Net - Web Audio API Sound Synthesizer & Music Engine
// Provides realistic procedural casino sound effects and Aviator BGM
// Zero external assets required - 100% pure Web Audio API synthesis
// ============================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;

        // Gain Nodes
        this.masterGain = null;
        this.sfxGain = null;
        this.bgmGain = null;
        this.engineGain = null;

        // Real Aviator Audio Tracks (Direct from Official Video)
        this.bgmPlaying = false;
        this.loadingMusicPlaying = false;
        this.aviatorBgmAudio = null;
        this.casinoThemeAudio = null;
        this.casinoThemePlaying = false;
        this.crashAudio = null;
        this.crashBuffer = null;

        try {
            const prefix = typeof window !== 'undefined' && window.location && window.location.pathname.includes('/games/') ? '../assets/audio/' : 'assets/audio/';
            this.crashAudio = new Audio(prefix + 'aviator_crash.mp3?v=spribe_real_crash_v9');
            this.crashAudio.preload = 'auto';
        } catch(e) {}
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx) {
            if (!this.masterGain) {
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
                this.masterGain.connect(this.ctx.destination);

                this.sfxGain = this.ctx.createGain();
                this.sfxGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
                this.sfxGain.connect(this.masterGain);

                this.bgmGain = this.ctx.createGain();
                this.bgmGain.gain.setValueAtTime(0.38, this.ctx.currentTime);
                this.bgmGain.connect(this.masterGain);

                this.engineGain = this.ctx.createGain();
                this.engineGain.gain.setValueAtTime(0.24, this.ctx.currentTime);
                this.engineGain.connect(this.masterGain);
            }

            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }

            this.preloadBuffers();
        }
        this.initialized = true;
        this.updateToggleButtons();
    }

    getDestination(type = 'sfx') {
        if (!this.ctx) return null;
        if (typeof window !== 'undefined' && window.location && (window.location.pathname.includes('dragontiger') || window.location.pathname.includes('card.html'))) {
            return null;
        }
        if (type === 'bgm' && this.bgmGain) return this.bgmGain;
        if (type === 'engine' && this.engineGain) return this.engineGain;
        return this.sfxGain || this.masterGain || this.ctx.destination;
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('bwn_sound_muted', this.muted ? '1' : '0');
        } catch (e) {}

        this.updateMasterMute();
        this.updateToggleButtons();

        // If unmuting, resume context and resume casino theme BGM
        if (!this.muted) {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            if (this.casinoThemeAudio) {
                this.casinoThemeAudio.play().catch(() => {});
            } else {
                this.startCasinoThemeBGM();
            }
        } else {
            if (this.casinoThemeAudio) {
                this.casinoThemeAudio.pause();
            }
        }

        return this.muted;
    }

    updateMasterMute() {
        if (this.masterGain && this.ctx) {
            const now = this.ctx.currentTime;
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, now);
        }
        if (this.htmlAudio) {
            this.htmlAudio.volume = this.muted ? 0.0 : 0.32;
        }
        if (this.aviatorBgmAudio) {
            this.aviatorBgmAudio.volume = this.muted ? 0.0 : 0.42;
        }
        if (this.casinoThemeAudio) {
            this.casinoThemeAudio.volume = this.muted ? 0.0 : 0.35;
        }
    }

    updateToggleButtons() {
        const btns = document.querySelectorAll('#sound-toggle-btn, .sound-toggle-btn, #aviatorSoundBtn');
        btns.forEach(btn => {
            const iconEl = btn.querySelector('#aviatorSoundIcon') || btn;
            iconEl.innerText = this.muted ? '🔇' : '🔊';
            btn.setAttribute('title', this.muted ? 'Unmute Sound' : 'Mute Sound');
        });
    }

    // =============================================================
    // 1. AUTHENTIC AVIATOR CONTINUOUS SOUNDTRACK (Video 1:1 Loop)
    // =============================================================
    startAviatorLoadingMusic() {
        // Seamless continuous BGM starting right from opening splash
        this.startAviatorBGM();
    }

    updateLoadingProgress(pct) {
        // High fidelity audio soundtrack plays seamlessly
    }

    onLoadingComplete() {
        this.loadingMusicPlaying = false;
        this.startAviatorBGM();
    }

    stopAviatorLoadingMusic(fadeTime = 0.4) {
        this.loadingMusicPlaying = false;
    }

    // =============================================================
    // 2. AUTHENTIC AVIATOR CONTINUOUS BGM (Never stops, loops endlessly)
    // =============================================================
    startAviatorBGM() {
        if (this.muted) return;
        const prefix = window.location.pathname.includes('/games/') ? '../assets/audio/' : 'assets/audio/';
        try {
            if (!this.aviatorBgmAudio) {
                this.aviatorBgmAudio = new Audio(prefix + 'aviator_bgm_clean.mp3?v=pure_clean_track_v5');
                this.aviatorBgmAudio.loop = true;
                this.aviatorBgmAudio.preload = 'auto';
            }
            this.aviatorBgmAudio.loop = true;
            this.aviatorBgmAudio.volume = this.muted ? 0.0 : 0.42;

            // Extra watchdog to ensure seamless infinite looping
            this.aviatorBgmAudio.onended = () => {
                if (!this.muted && this.aviatorBgmAudio) {
                    try {
                        this.aviatorBgmAudio.currentTime = 0;
                        this.aviatorBgmAudio.play();
                    } catch(e) {}
                }
            };

            const p = this.aviatorBgmAudio.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    this.bgmPlaying = true;
                }).catch(() => {
                    this.bgmPlaying = false;
                });
            } else {
                this.bgmPlaying = true;
            }
        } catch (e) {
            this.bgmPlaying = false;
        }
    }

    stopAviatorBGM() {
        this.bgmPlaying = false;
        if (this.aviatorBgmAudio) {
            try {
                this.aviatorBgmAudio.pause();
            } catch (e) {}
        }
    }

    startLoadingMusic() {
        const path = (typeof window !== 'undefined' && window.location ? window.location.pathname : '').toLowerCase();
        if (path.includes('/crash') || path.includes('/aviator')) {
            this.startAviatorLoadingMusic();
        }
    }

    startGenreBGM(genre = 'casino_lounge') {
        const path = (typeof window !== 'undefined' && window.location ? window.location.pathname : '').toLowerCase();
        if (genre === 'electro_flight' || path.includes('/crash') || path.includes('/aviator')) {
            this.startAviatorBGM();
            return;
        }
        // STRICT RULE: No background music inside any other games (only game SFX like cards, dice, roulette ball, spins)
        this.stopBGM();
    }

    // =============================================================
    // OFFICIAL BET WITH NET CASINO THEME BGM (Website & APK Background)
    // Plays continuously on all website pages, settings, and popups.
    // Strictly NEVER plays inside /games/.
    // =============================================================
    startCasinoThemeBGM() {
        if (this.muted) return;
        const path = (typeof window !== 'undefined' && window.location ? window.location.pathname : '').toLowerCase();
        // STRICT ENFORCEMENT: Never play inside any game
        if (path.includes('/games/')) {
            this.stopCasinoThemeBGM();
            return;
        }

        try {
            // Calculate target seek position from saved state & elapsed wall-clock time
            const savedPos = parseFloat(sessionStorage.getItem('bwn_bgm_pos') || '0');
            const savedTs = parseInt(sessionStorage.getItem('bwn_bgm_ts') || '0', 10);
            let targetPos = savedPos;

            if (savedTs > 0 && savedPos > 0) {
                const elapsed = (Date.now() - savedTs) / 1000;
                // If navigation happened recently (within 20s), add elapsed time for seamless continuity
                if (elapsed > 0 && elapsed < 20) {
                    targetPos += elapsed;
                }
            }

            if (!this.casinoThemeAudio) {
                this.casinoThemeAudio = document.getElementById('bwn-casino-theme-bgm') || new Audio('/assets/audio/bwn_casino_theme.mp3?v=2026_bgm_v4');
                this.casinoThemeAudio.loop = true;
                this.casinoThemeAudio.preload = 'auto';

                let seekDone = (targetPos <= 0.8);

                const performSeek = () => {
                    if (seekDone || !this.casinoThemeAudio) return;
                    try {
                        const dur = this.casinoThemeAudio.duration;
                        let dest = targetPos;
                        if (dur && Number.isFinite(dur) && dur > 0) {
                            dest = targetPos % dur;
                        }
                        if (dest > 0.5) {
                            this.casinoThemeAudio.currentTime = dest;
                            seekDone = true;
                            if (!this.muted) this.casinoThemeAudio.muted = false;
                        } else {
                            seekDone = true;
                            if (!this.muted) this.casinoThemeAudio.muted = false;
                        }
                    } catch(e) {}
                };

                // Temporarily mute while jumping to target position so 0:00 intro is never heard
                if (targetPos > 0.8) {
                    this.casinoThemeAudio.muted = true;
                }

                this.casinoThemeAudio.addEventListener('loadedmetadata', performSeek);
                this.casinoThemeAudio.addEventListener('canplay', performSeek);
                this.casinoThemeAudio.addEventListener('playing', performSeek);
                this.casinoThemeAudio.addEventListener('seeked', () => {
                    seekDone = true;
                    if (!this.muted && this.casinoThemeAudio) {
                        this.casinoThemeAudio.muted = false;
                    }
                });

                // Safety fallback to unmute and seek within 350ms
                setTimeout(() => {
                    if (!seekDone) performSeek();
                    if (!this.muted && this.casinoThemeAudio) {
                        this.casinoThemeAudio.muted = false;
                    }
                }, 350);

                if (this.casinoThemeAudio.readyState >= 1) {
                    performSeek();
                }

                // Continually remember position with timestamp so page navigation continues seamlessly
                this.casinoThemeAudio.ontimeupdate = () => {
                    try {
                        if (this.casinoThemeAudio && !this.casinoThemeAudio.paused) {
                            // CRITICAL: NEVER overwrite saved position with 0.0 before seek has completed!
                            if (!seekDone && targetPos > 0.8) {
                                return;
                            }
                            seekDone = true;
                            if (!this.muted && this.casinoThemeAudio.muted) {
                                this.casinoThemeAudio.muted = false;
                            }
                            if (this.casinoThemeAudio.currentTime > 0) {
                                sessionStorage.setItem('bwn_bgm_pos', this.casinoThemeAudio.currentTime.toFixed(2));
                                sessionStorage.setItem('bwn_bgm_ts', Date.now().toString());
                            }
                        }
                    } catch(e) {}
                };

                // Flush exact position on page exit/navigate
                window.addEventListener('beforeunload', () => {
                    try {
                        if (this.casinoThemeAudio && !this.casinoThemeAudio.paused && this.casinoThemeAudio.currentTime > 0) {
                            sessionStorage.setItem('bwn_bgm_pos', this.casinoThemeAudio.currentTime.toFixed(2));
                            sessionStorage.setItem('bwn_bgm_ts', Date.now().toString());
                        }
                    } catch(e) {}
                });
            }

            // If already playing smoothly, do not interrupt
            if (this.casinoThemeAudio && !this.casinoThemeAudio.paused && this.casinoThemePlaying) {
                return;
            }

            this.casinoThemeAudio.loop = true;
            this.casinoThemeAudio.volume = this.muted ? 0.0 : 0.35;

            const p = this.casinoThemeAudio.play();
            if (p && typeof p.then === 'function') {
                p.then(() => {
                    this.casinoThemePlaying = true;
                    this.bgmPlaying = true;
                    if (!this.muted && this.casinoThemeAudio) {
                        this.casinoThemeAudio.muted = false;
                        this.casinoThemeAudio.volume = 0.35;
                    }
                }).catch(() => {
                    // Browser Autoplay Policy: unmuted autoplay was blocked by browser
                    // AUTOMATIC GUARANTEE: Start muted playback immediately so audio plays nonstop!
                    if (this.casinoThemeAudio) {
                        this.casinoThemeAudio.muted = true;
                        this.casinoThemeAudio.play().then(() => {
                            this.casinoThemePlaying = true;
                            this.bgmPlaying = true;

                            // Unmute on ANY interaction anywhere (scroll, touch, move) — no button press needed!
                            const autoUnmute = () => {
                                if (this.casinoThemeAudio && !this.muted) {
                                    this.casinoThemeAudio.muted = false;
                                    this.casinoThemeAudio.volume = 0.35;
                                }
                                ['touchstart', 'touchend', 'scroll', 'pointerdown', 'mousedown', 'wheel'].forEach(ev => {
                                    window.removeEventListener(ev, autoUnmute);
                                    document.removeEventListener(ev, autoUnmute);
                                });
                            };

                            ['touchstart', 'touchend', 'scroll', 'pointerdown', 'mousedown', 'wheel'].forEach(ev => {
                                window.addEventListener(ev, autoUnmute, { passive: true, once: true });
                                document.addEventListener(ev, autoUnmute, { passive: true, once: true });
                            });
                        }).catch(() => {
                            this.casinoThemePlaying = false;
                        });
                    }
                });
            } else {
                this.casinoThemePlaying = true;
                this.bgmPlaying = true;
            }
        } catch (e) {
            this.casinoThemePlaying = false;
        }
    }

    stopCasinoThemeBGM() {
        this.casinoThemePlaying = false;
        if (this.casinoThemeAudio) {
            try {
                this.casinoThemeAudio.pause();
            } catch (e) {}
        }
    }

    stopBGM() {
        this.stopAviatorBGM();
        this.stopCasinoThemeBGM();
        if (this.htmlAudio) {
            try {
                this.htmlAudio.pause();
                this.htmlAudio.currentTime = 0;
            } catch (e) {}
        }
        this.bgmPlaying = false;
    }

    // =============================================================
    // 3. AUTHENTIC CRASH FLEW-AWAY SOUND (Directly from user video)
    // =============================================================
    preloadBuffers() {
        if (!this.ctx) return;
        const prefix = window.location.pathname.includes('/games/') ? '../assets/audio/' : 'assets/audio/';
        fetch(prefix + 'aviator_crash.mp3?v=spribe_real_crash_v9')
            .then(res => res.arrayBuffer())
            .then(data => {
                const p = this.ctx.decodeAudioData(
                    data,
                    (buf) => { this.crashBuffer = buf; },
                    () => {}
                );
                if (p && typeof p.then === 'function') {
                    p.then(buf => { this.crashBuffer = buf; }).catch(() => {});
                }
            })
            .catch(() => {});
    }

    setFlightEngineState(state, multiplier = 1.0) {
        if (this.muted) {
            this.stopFlightEngine();
            return;
        }
        this.init();
        if (!this.ctx) return;

        if (state === 'flying') {
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                if (!this.flightOsc) {
                    this.flightOsc = this.ctx.createOscillator();
                    this.flightGain = this.ctx.createGain();
                    this.flightFilter = this.ctx.createBiquadFilter();

                    this.flightOsc.type = 'sawtooth';
                    this.flightFilter.type = 'lowpass';
                    this.flightFilter.frequency.setValueAtTime(320, this.ctx.currentTime);

                    // Gentle, comfortable background hum volume (0.05)
                    this.flightGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
                    this.flightGain.gain.linearRampToValueAtTime(0.05, this.ctx.currentTime + 0.25);

                    this.flightOsc.connect(this.flightFilter);
                    this.flightFilter.connect(this.flightGain);
                    this.flightGain.connect(this.getDestination('engine'));

                    this.flightOsc.start();
                }

                // Smoothly modulate pitch as the plane climbs (from 75Hz at 1.0x up to 260Hz)
                const targetFreq = Math.min(260, 75 + (multiplier - 1.0) * 16);
                this.flightOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
            } catch (e) {}
        } else {
            this.stopFlightEngine();
        }
    }

    playAviatorTakeoff() {
        this.setFlightEngineState('flying', 1.00);
    }

    stopFlightEngine() {
        if (this.flightOsc) {
            try {
                if (this.flightGain && this.ctx) {
                    this.flightGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
                }
                const oldOsc = this.flightOsc;
                setTimeout(() => {
                    try {
                        oldOsc.stop();
                        oldOsc.disconnect();
                    } catch(e) {}
                }, 130);
            } catch(e) {}
            this.flightOsc = null;
            this.flightGain = null;
            this.flightFilter = null;
        }
    }

    playFlewAway() {
        this.stopFlightEngine();
        if (this.muted) return;
        this.init();

        let played = false;

        // 1. Dedicated pre-unlocked DOM element (100% reliable on all mobile phones & webviews)
        const domAudio = document.getElementById('aviator-crash-audio');
        if (domAudio) {
            try {
                domAudio.currentTime = 0;
                domAudio.volume = 1.0;
                const p = domAudio.play();
                if (p && typeof p.then === 'function') {
                    p.then(() => { played = true; }).catch(() => {});
                } else {
                    played = true;
                }
            } catch(e) {}
        }

        // 2. Play Web Audio BufferSourceNode for instant 0ms punch
        if (this.ctx && this.crashBuffer) {
            try {
                if (this.ctx.state === 'suspended') this.ctx.resume();
                const source = this.ctx.createBufferSource();
                source.buffer = this.crashBuffer;
                const gain = this.ctx.createGain();
                gain.gain.value = 1.0;
                source.connect(gain);
                gain.connect(this.masterGain || this.ctx.destination);
                source.start(0);
                played = true;
            } catch (e) {}
        }

        // 3. Fallback to pre-instantiated HTML5 Audio instance
        if (!domAudio || (!played && domAudio.paused)) {
            try {
                const prefix = window.location.pathname.includes('/games/') ? '../assets/audio/' : 'assets/audio/';
                if (!this.crashAudio) {
                    this.crashAudio = new Audio(prefix + 'aviator_crash.mp3?v=spribe_real_crash_v9');
                    this.crashAudio.preload = 'auto';
                }
                this.crashAudio.currentTime = 0;
                this.crashAudio.volume = 1.0;
                this.crashAudio.play().catch(() => {});
            } catch (e) {}
        }
    }

    playCashoutWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Cascading celebratory coin win arpeggio (G5, C6, E6, G6, C7)
        const notes = [783.99, 1046.50, 1318.51, 1567.98, 2093.00];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.24, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

            osc.connect(gain);
            gain.connect(this.getDestination('sfx'));
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.38);
        });
    }

    playBet() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start(now);
        osc.stop(now + 0.1);
    }

    // =============================================================
    // 4. LEGACY CASINO SOUND EFFECTS (ROUTED VIA SFX GAIN)
    // =============================================================
    playClick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    playChip() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.07);
    }

    playCard() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.07);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.getDestination('sfx'));
        noise.start();
    }

    playScratch() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2400;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.getDestination('sfx'));
        noise.start();
    }

    playCoinToss() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playCoinLand() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        [2200, 3100, 4400].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

            gain.gain.setValueAtTime(0.12 / (idx + 1), this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);

            osc.connect(gain);
            gain.connect(this.getDestination('sfx'));
            osc.start();
            osc.stop(this.ctx.currentTime + 0.13);
        });
    }

    playWin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.getDestination('sfx'));
            osc.start(this.ctx.currentTime + idx * 0.08);
            osc.stop(this.ctx.currentTime + idx * 0.08 + 0.28);
        });
    }

    playJackpot() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        for (let i = 0; i < 8; i++) {
            const note = chord[i % chord.length] * (1 + Math.floor(i / 5) * 0.2);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(note, this.ctx.currentTime + i * 0.09);

            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + i * 0.09);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + i * 0.09 + 0.2);

            osc.connect(gain);
            gain.connect(this.getDestination('sfx'));
            osc.start(this.ctx.currentTime + i * 0.09);
            osc.stop(this.ctx.currentTime + i * 0.09 + 0.22);
        }
    }

    playLose() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.26);
    }

    playPlinkoBounce(pitchMultiplier = 1) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const baseFreq = 880 * (0.8 + Math.random() * 0.4) * pitchMultiplier;
        osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.06);
    }

    playCrashTick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.03);
    }

    playCrashBoom() {
        this.playFlewAway();
    }

    playReelSpin() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    playReelStop() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(240, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.07);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playRouletteTick() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1400 + Math.random() * 200, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.02);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.025);
    }

    playCoinFlip() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1900, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    playBeep() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(this.getDestination('sfx'));
        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
    }
}

window.sound = new SoundManager();

// INSTANT AUTOPLAY: Start casino theme BGM immediately without requiring any button click
try {
    const _p = (typeof window !== 'undefined' && window.location ? window.location.pathname : '').toLowerCase();
    if (!_p.includes('/games/')) {
        window.sound.startCasinoThemeBGM();
    }
} catch(e) {}
