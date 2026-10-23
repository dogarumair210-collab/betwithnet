// Gold Rush - Mega7 / Manna Gaming Engine with Full Trailer Animation
(function() {
    'use strict';

    const SYMBOLS = [
        { id: 'p1', name: 'Gem Cart', img: '/gold_rush_template/standalone_game/assets/images/symbols/p1.png', pay: { 5: 50, 4: 20, 3: 10 } },
        { id: 'a', name: 'Dinosaur Skull', img: '/gold_rush_template/standalone_game/assets/images/symbols/a.png', pay: { 5: 35, 4: 15, 3: 8 } },
        { id: 'k', name: 'Ammonite Shell', img: '/gold_rush_template/standalone_game/assets/images/symbols/k.png', pay: { 5: 25, 4: 12, 3: 6 } },
        { id: 'p3', name: 'Ruby Gem', img: '/gold_rush_template/standalone_game/assets/images/symbols/p3.png', pay: { 5: 18, 4: 9, 3: 4 } },
        { id: 'p4', name: 'Emerald Gem', img: '/gold_rush_template/standalone_game/assets/images/symbols/p4.png', pay: { 5: 15, 4: 7, 3: 3 } },
        { id: 'p5', name: 'Sapphire Gem', img: '/gold_rush_template/standalone_game/assets/images/symbols/p5.png', pay: { 5: 12, 4: 5, 3: 2.5 } },
        { id: 'q', name: 'Gold Nugget', img: '/gold_rush_template/standalone_game/assets/images/symbols/q.png', pay: { 5: 8, 4: 4, 3: 2 } },
        { id: '10', name: 'Amber Ore', img: '/gold_rush_template/standalone_game/assets/images/symbols/10.png', pay: { 5: 6, 4: 3, 3: 1.5 } },
        { id: 'j', name: 'Quartz Ore', img: '/gold_rush_template/standalone_game/assets/images/symbols/j.png', pay: { 5: 4, 4: 2, 3: 1 } },
        { id: 'wild', name: 'Rainbow Gem Wild', img: '/gold_rush_template/standalone_game/assets/images/symbols/wild.png', isWild: true }
    ];

    // Standard 25 Paylines for 5x3 grid
    const PAYLINES = [
        [1, 1, 1, 1, 1], // line 1: middle
        [0, 0, 0, 0, 0], // line 2: top
        [2, 2, 2, 2, 2], // line 3: bottom
        [0, 1, 2, 1, 0], // line 4: V
        [2, 1, 0, 1, 2], // line 5: inverted V
        [0, 0, 1, 2, 2], // line 6
        [2, 2, 1, 0, 0], // line 7
        [1, 2, 2, 2, 1], // line 8
        [1, 0, 0, 0, 1], // line 9
        [0, 1, 1, 1, 0], // line 10
        [2, 1, 1, 1, 2], // line 11
        [0, 1, 0, 1, 0], // line 12
        [2, 1, 2, 1, 2], // line 13
        [1, 0, 1, 0, 1], // line 14
        [1, 2, 1, 2, 1], // line 15
        [0, 0, 0, 1, 2], // line 16
        [2, 2, 2, 1, 0], // line 17
        [0, 2, 0, 2, 0], // line 18
        [2, 0, 2, 0, 2], // line 19
        [1, 0, 2, 0, 1], // line 20
        [1, 2, 0, 2, 1], // line 21
        [0, 0, 2, 2, 2], // line 22
        [2, 2, 0, 0, 0], // line 23
        [0, 2, 2, 2, 0], // line 24
        [2, 0, 0, 0, 2]  // line 25
    ];

    const BET_OPTIONS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

    const MINER_SPRITES = {
        idle: '/gold_rush_template/standalone_game/assets/images/miner_anim/miner_state_idle.png',
        spin: '/gold_rush_template/standalone_game/assets/images/miner_anim/miner_state_spin.png',
        win: '/gold_rush_template/standalone_game/assets/images/miner_anim/miner_state_win.png'
    };

    class GoldRushGame {
        constructor() {
            let initialBal = 50000;
            try {
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('balance')) {
                    const b = parseFloat(urlParams.get('balance'));
                    if (!isNaN(b) && b >= 0) initialBal = b;
                } else {
                    const rawW = localStorage.getItem('wallet_balance') || localStorage.getItem('BETWITHNET_balance');
                    if (rawW !== null) {
                        const b = parseFloat(rawW);
                        if (!isNaN(b) && b >= 0) initialBal = b;
                    }
                }
            } catch(e) {}

            this.balance = initialBal;
            this.betIndex = 3; // 100
            this.isSpinning = false;
            this.isAuto = false;
            this.isTurbo = false;
            this.freeSpinsRemaining = 0;
            this.currentMultiplier = 1;
            this.trailerTimer = null;
            this.currentTrailerStep = 1;

            this.grid = [
                ['p1', 'wild', 'p3'],
                ['p4', 'wild', 'p5'],
                ['a', 'k', 'q'],
                ['p1', 'wild', 'j'],
                ['p3', '10', 'q']
            ];

            this.dom = {
                balance: document.getElementById('valBalance'),
                bet: document.getElementById('valBet'),
                win: document.getElementById('valWin'),
                multiplier: document.getElementById('valMultiplier'),
                btnSpin: document.getElementById('btnSpin'),
                btnBetMinus: document.getElementById('btnBetMinus'),
                btnBetPlus: document.getElementById('btnBetPlus'),
                btnTurbo: document.getElementById('btnTurbo'),
                btnAuto: document.getElementById('btnAuto'),
                btnSound: document.getElementById('btnSound'),
                fsBadge: document.getElementById('fsBadge'),
                fsCount: document.getElementById('fsCount'),
                bigwinModal: document.getElementById('bigwinModal'),
                bigwinCount: document.getElementById('bigwinCount'),
                minerMascot: document.getElementById('minerMascot'),
                minerImg: document.getElementById('minerImg'),
                minerSpeech: document.getElementById('minerSpeech'),
                plungerSparks: document.getElementById('plungerSparks'),
                cabinetWrapper: document.getElementById('cabinetWrapper'),
                canvas: document.getElementById('paylineCanvas'),
                reelsGrid: document.getElementById('reelsGrid'),
                btnWatchTrailer: document.getElementById('btnWatchTrailer'),
                btnTriggerFs: document.getElementById('btnTriggerFs'),
                btnPaytableRules: document.getElementById('btnPaytableRules'),
                cinematicTrailerModal: document.getElementById('cinematicTrailerModal'),
                trailerVideoView: document.getElementById('trailerVideoView'),
                trailerStoryView: document.getElementById('trailerStoryView'),
                trailerVideo: document.getElementById('trailerVideo'),
                tabBtnVideo: document.getElementById('tabBtnVideo'),
                tabBtnStory: document.getElementById('tabBtnStory'),
                btnCloseTrailer: document.getElementById('btnCloseTrailer'),
                btnTrailerPlay: document.getElementById('btnTrailerPlay'),
                trailerDots: document.getElementById('trailerDots'),
                trailerCountdown: document.getElementById('trailerCountdown'),
                fsTransitionOverlay: document.getElementById('fsTransitionOverlay'),
                paytableModal: document.getElementById('paytableModal'),
                btnClosePaytable: document.getElementById('btnClosePaytable'),
                settlementModal: document.getElementById('settlementModal'),
                settlementWinAmount: document.getElementById('settlementWinAmount'),
                btnSettlementContinue: document.getElementById('btnSettlementContinue'),
                boxTotalBet: document.getElementById('boxTotalBet'),
                quickBetPopover: document.getElementById('quickBetPopover'),
                bombDropContainer: document.getElementById('bombDropContainer'),
                bombDropBadge: document.getElementById('bombDropBadge'),
                comboBanner: document.getElementById('comboBanner'),
                comboText: document.getElementById('comboText'),
                lizardMascot: document.getElementById('lizardMascot'),
                splashTrailer: document.getElementById('splashTrailer'),
                dynamiteBarFill: document.getElementById('dynamiteBarFill'),
                loaderStatus: document.getElementById('loaderStatus'),
                btnEnterMine: document.getElementById('btnEnterMine'),
                dustCanvas: document.getElementById('ambientDustCanvas')
            };

            this.fsTotalWin = 0;
            this.wasInFreeSpins = false;

            this.init();
        }

        init() {
            this.updateUI();
            this.renderGrid();
            this.bindEvents();
            this.resizeCanvas();
            this.initAmbientDust();
            this.initSplashLoader();

            window.addEventListener('resize', () => {
                this.resizeCanvas();
                this.resizeDustCanvas();
            });

            // Listen for cross-frame messages from 1xBet embed portal / Bet With Net wrapper
            window.addEventListener('message', (e) => {
                if (!e.data) return;
                if (e.data.action === 'playTrailer') {
                    this.openCinematicTrailer();
                } else if (e.data.action === 'closeTrailer') {
                    this.closeCinematicTrailer();
                } else if (e.data.action === 'triggerFs') {
                    // Free spins feature disabled by user request
                    return;
                } else if (e.data.action === 'openRules') {
                    if (this.dom.paytableModal) this.dom.paytableModal.style.display = 'flex';
                } else if (e.data.action === 'updateBalance') {
                    if (typeof e.data.balance === 'number') {
                        this.balance = e.data.balance;
                        this.updateUI();
                    }
                }
            });

            // Start BGM on user first touch/click anywhere
            const startAudioOnFirstAction = () => {
                if (window.goldRushAudio) {
                    window.goldRushAudio.playBgm('main');
                }
                window.removeEventListener('click', startAudioOnFirstAction);
                window.removeEventListener('touchstart', startAudioOnFirstAction);
            };
            window.addEventListener('click', startAudioOnFirstAction);
            window.addEventListener('touchstart', startAudioOnFirstAction);
        }

        bindEvents() {
            this.dom.btnSpin.addEventListener('click', () => {
                if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                this.spin();
            });

            this.dom.btnBetMinus.addEventListener('click', () => {
                if (this.betIndex > 0) {
                    this.betIndex--;
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    this.updateUI();
                }
            });

            this.dom.btnBetPlus.addEventListener('click', () => {
                if (this.betIndex < BET_OPTIONS.length - 1) {
                    this.betIndex++;
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    this.updateUI();
                }
            });

            this.dom.btnTurbo.addEventListener('click', () => {
                this.isTurbo = !this.isTurbo;
                this.dom.btnTurbo.classList.toggle('active', this.isTurbo);
                if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
            });

            this.dom.btnAuto.addEventListener('click', () => {
                this.isAuto = !this.isAuto;
                this.dom.btnAuto.classList.toggle('active', this.isAuto);
                if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                if (this.isAuto && !this.isSpinning) {
                    this.spin();
                }
            });

            this.dom.btnSound.addEventListener('click', () => {
                if (window.goldRushAudio) {
                    const muted = window.goldRushAudio.toggleMute();
                    this.dom.btnSound.textContent = muted ? '🔇' : '🔊';
                    this.dom.btnSound.classList.toggle('active', !muted);
                }
            });

            this.dom.bigwinModal.addEventListener('click', () => {
                this.dom.bigwinModal.style.display = 'none';
            });

            // Trailer & Feature Demo triggers
            if (this.dom.btnWatchTrailer) {
                this.dom.btnWatchTrailer.addEventListener('click', () => {
                    this.openCinematicTrailer();
                });
            }

            if (this.dom.btnTriggerFs) {
                this.dom.btnTriggerFs.addEventListener('click', () => {
                    this.triggerFreeSpinsTransition();
                });
            }

            if (this.dom.btnCloseTrailer) {
                this.dom.btnCloseTrailer.addEventListener('click', () => {
                    this.closeCinematicTrailer();
                });
            }

            if (this.dom.btnTrailerPlay) {
                this.dom.btnTrailerPlay.addEventListener('click', () => {
                    this.closeCinematicTrailer();
                    this.spin();
                });
            }

            // Trailer Dots & Navigation Arrows
            const dots = this.dom.trailerDots ? this.dom.trailerDots.querySelectorAll('.tdot') : [];
            dots.forEach(dot => {
                dot.addEventListener('click', () => {
                    const step = parseInt(dot.getAttribute('data-step'), 10);
                    this.goToTrailerSlide(step);
                });
            });

            const btnPrev = document.getElementById('btnTrailerPrev');
            const btnNext = document.getElementById('btnTrailerNext');
            if (btnPrev) {
                btnPrev.addEventListener('click', () => {
                    let prev = (this.currentTrailerStep || 1) - 1;
                    if (prev < 1) prev = 5;
                    this.goToTrailerSlide(prev);
                });
            }
            if (btnNext) {
                btnNext.addEventListener('click', () => {
                    let next = (this.currentTrailerStep || 1) + 1;
                    if (next > 5) next = 1;
                    this.goToTrailerSlide(next);
                });
            }

            // Paytable & Rules Modal triggers
            if (this.dom.btnPaytableRules) {
                this.dom.btnPaytableRules.addEventListener('click', () => {
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    if (this.dom.paytableModal) this.dom.paytableModal.style.display = 'flex';
                });
            }
            if (this.dom.btnClosePaytable) {
                this.dom.btnClosePaytable.addEventListener('click', () => {
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    if (this.dom.paytableModal) this.dom.paytableModal.style.display = 'none';
                });
            }

            // Quick Bet Selection Popover
            if (this.dom.boxTotalBet) {
                this.dom.boxTotalBet.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    if (this.dom.quickBetPopover) {
                        this.dom.quickBetPopover.classList.toggle('active');
                    }
                });
            }

            document.addEventListener('click', (e) => {
                if (this.dom.quickBetPopover && !e.target.closest('.bet-selector-group')) {
                    this.dom.quickBetPopover.classList.remove('active');
                }
            });

            document.querySelectorAll('.btn-quick-chip').forEach(chip => {
                chip.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const val = parseInt(chip.getAttribute('data-bet'), 10);
                    const idx = BET_OPTIONS.indexOf(val);
                    if (idx !== -1) {
                        this.betIndex = idx;
                    } else {
                        const closest = BET_OPTIONS.findIndex(b => b >= val);
                        this.betIndex = closest !== -1 ? closest : BET_OPTIONS.length - 1;
                    }
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('click');
                    this.updateUI();
                    if (this.dom.quickBetPopover) this.dom.quickBetPopover.classList.remove('active');
                });
            });

            // Free Spins Settlement Continue
            if (this.dom.btnSettlementContinue) {
                this.dom.btnSettlementContinue.addEventListener('click', () => {
                    if (window.goldRushAudio) {
                        window.goldRushAudio.playSfx('click');
                        window.goldRushAudio.playBgm('main');
                    }
                    if (this.dom.settlementModal) this.dom.settlementModal.style.display = 'none';
                    this.fsTotalWin = 0;
                    this.updateUI();
                });
            }

            // Desert Lizard Mascot Interaction
            if (this.dom.lizardMascot) {
                this.dom.lizardMascot.addEventListener('click', () => {
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('scatter');
                    this.dom.lizardMascot.style.transform = 'scale(1.25) rotate(-15deg)';
                    setTimeout(() => {
                        this.dom.lizardMascot.style.transform = '';
                    }, 400);
                });
            }

            // Splash Enter Button
            if (this.dom.btnEnterMine) {
                this.dom.btnEnterMine.addEventListener('click', () => {
                    this.dismissSplash();
                });
            }
        }

        // ==========================================
        // 1. INTRO SPLASH SCREEN TRAILER LOADER
        // ==========================================
        initSplashLoader() {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.floor(Math.random() * 15) + 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    if (this.dom.dynamiteBarFill) this.dom.dynamiteBarFill.style.width = '100%';
                    if (this.dom.loaderStatus) this.dom.loaderStatus.textContent = 'DYNAMITE CHARGED! 100%';
                    if (this.dom.btnEnterMine) {
                        this.dom.btnEnterMine.style.display = 'block';
                    }
                    // Auto-dismiss after 1.5 seconds if user hasn't clicked
                    setTimeout(() => {
                        this.dismissSplash();
                    }, 1800);
                } else {
                    if (this.dom.dynamiteBarFill) this.dom.dynamiteBarFill.style.width = `${progress}%`;
                    if (this.dom.loaderStatus) this.dom.loaderStatus.textContent = `IGNITING DYNAMITE... ${progress}%`;
                }
            }, 80);
        }

        dismissSplash() {
            if (!this.dom.splashTrailer || this.dom.splashTrailer.style.display === 'none') return;
            if (window.goldRushAudio) {
                window.goldRushAudio.playSfx('multiplier');
            }
            this.dom.splashTrailer.style.opacity = '0';
            this.dom.splashTrailer.style.transform = 'scale(1.1)';
            setTimeout(() => {
                this.dom.splashTrailer.style.display = 'none';
                // Automatically present the official cinematic story trailer!
                this.openCinematicTrailer();
            }, 450);
        }

        // ==========================================
        // 2. FULL CINEMATIC STORY TRAILER MODAL
        // ==========================================
        openCinematicTrailer() {
            if (this.isSpinning) return;
            if (window.goldRushAudio) {
                window.goldRushAudio.playSfx('pickaxe');
                window.goldRushAudio.playBgm('freespin');
            }
            if (this.dom.cinematicTrailerModal) {
                this.dom.cinematicTrailerModal.style.display = 'flex';
                this.goToTrailerSlide(1);

                clearInterval(this.trailerTimer);
                this.trailerTimer = setInterval(() => {
                    let nextStep = (this.currentTrailerStep || 1) + 1;
                    if (nextStep > 5) nextStep = 1;
                    this.goToTrailerSlide(nextStep);
                }, 4000);
            }
        }

        closeCinematicTrailer() {
            clearInterval(this.trailerTimer);
            if (this.dom.cinematicTrailerModal) {
                this.dom.cinematicTrailerModal.style.display = 'none';
            }
            if (window.goldRushAudio) {
                window.goldRushAudio.playBgm(this.freeSpinsRemaining > 0 ? 'freespin' : 'main');
            }
        }

        goToTrailerSlide(step) {
            this.currentTrailerStep = step;
            for (let i = 1; i <= 5; i++) {
                const slide = document.getElementById(`tslide${i}`);
                if (slide) slide.classList.toggle('active', i === step);
            }

            const dots = this.dom.trailerDots ? this.dom.trailerDots.querySelectorAll('.tdot') : [];
            dots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx + 1 === step);
            });

            // Update Progress Bar
            const bar = document.getElementById('trailerProgressBar');
            if (bar) {
                bar.style.width = `${(step / 5) * 100}%`;
            }

            // Slide 3 Countdown Animation
            if (step === 3 && this.dom.trailerCountdown) {
                let count = 3;
                this.dom.trailerCountdown.textContent = count;
                const cInterval = setInterval(() => {
                    count--;
                    if (count <= 0) {
                        this.dom.trailerCountdown.textContent = '💥';
                        clearInterval(cInterval);
                        if (window.goldRushAudio) window.goldRushAudio.playSfx('multiplier');
                    } else {
                        this.dom.trailerCountdown.textContent = count;
                        if (window.goldRushAudio) window.goldRushAudio.playSfx('stop');
                    }
                }, 800);
            }

            // Slide 4 Explosion FX sound
            if (step === 4 && window.goldRushAudio) {
                window.goldRushAudio.playSfx('multiplier');
            }

            // Slide 5 Big win fanfare sound
            if (step === 5 && window.goldRushAudio) {
                window.goldRushAudio.playSfx('win_big');
            }
        }

        // ==========================================
        // 3. FREE SPINS CINEMATIC TRANSITION TRAILER
        // ==========================================
        triggerFreeSpinsTransition() {
            // Free spins feature disabled by user request
            this.freeSpinsRemaining = 0;
            this.wasInFreeSpins = false;
            if (this.dom.fsTransitionOverlay) this.dom.fsTransitionOverlay.style.display = 'none';
            if (this.dom.fsBadge) this.dom.fsBadge.style.display = 'none';
            return;
        }

        // ==========================================
        // 4. MULTIPLIER BOMB DROP & COMBO FX
        // ==========================================
        triggerBombDrop(multiplier) {
            if (!this.dom.bombDropContainer || !this.dom.bombDropBadge) return;
            this.dom.bombDropBadge.textContent = 'x' + multiplier;
            this.dom.bombDropContainer.classList.add('dropping');
            if (window.goldRushAudio) window.goldRushAudio.playSfx('multiplier');

            setTimeout(() => {
                this.currentMultiplier = multiplier;
                if (this.dom.valMultiplier) this.dom.valMultiplier.textContent = 'x' + multiplier;
                if (this.dom.minerSpeech) this.dom.minerSpeech.textContent = `💥 DYNAMITE x${multiplier} BLAST! 💥`;
            }, 300);

            setTimeout(() => {
                this.dom.bombDropContainer.classList.remove('dropping');
            }, 1300);
        }

        showComboBanner(linesCount) {
            if (!this.dom.comboBanner || !this.dom.comboText) return;
            this.dom.comboText.textContent = `COMBO x${linesCount}! 💎`;
            this.dom.comboBanner.classList.add('active');
            if (window.goldRushAudio) window.goldRushAudio.playSfx('payout');

            setTimeout(() => {
                this.dom.comboBanner.classList.remove('active');
            }, 1400);
        }

        showSettlementModal(totalBonus) {
            // Free spins settlement modal disabled
            if (this.dom.settlementModal) this.dom.settlementModal.style.display = 'none';
            return;
        }

        // ==========================================
        // 4. ANIMATED MINER MASCOT CONTROLLER
        // ==========================================
        setMinerState(state, text) {
            if (this.dom.minerImg && MINER_SPRITES[state]) {
                this.dom.minerImg.src = MINER_SPRITES[state];
            }

            if (this.dom.minerSpeech && text) {
                this.dom.minerSpeech.textContent = text;
            }

            if (state === 'plunge') {
                this.dom.minerMascot.classList.add('plunging');
                if (this.dom.plungerSparks) {
                    this.dom.plungerSparks.classList.add('active');
                    setTimeout(() => {
                        this.dom.plungerSparks.classList.remove('active');
                    }, 400);
                }
                if (this.dom.cabinetWrapper) {
                    this.dom.cabinetWrapper.classList.add('cabinet-shake');
                    setTimeout(() => {
                        this.dom.cabinetWrapper.classList.remove('cabinet-shake');
                    }, 450);
                }
            } else {
                this.dom.minerMascot.classList.remove('plunging');
            }

            if (state === 'win') {
                this.dom.minerMascot.classList.add('celebrate');
            } else {
                this.dom.minerMascot.classList.remove('celebrate');
            }
        }

        // ==========================================
        // 5. AMBIENT DUST & SPARK CANVAS
        // ==========================================
        initAmbientDust() {
            if (!this.dom.dustCanvas) return;
            this.resizeDustCanvas();
            this.dustParticles = [];
            for (let i = 0; i < 45; i++) {
                this.dustParticles.push({
                    x: Math.random() * this.dom.dustCanvas.width,
                    y: Math.random() * this.dom.dustCanvas.height,
                    radius: Math.random() * 2.2 + 0.8,
                    color: Math.random() > 0.4 ? 'rgba(255, 215, 0, ' : 'rgba(255, 152, 0, ',
                    alpha: Math.random() * 0.7 + 0.2,
                    speedX: (Math.random() - 0.5) * 0.6,
                    speedY: -Math.random() * 0.8 - 0.2
                });
            }

            const renderDust = () => {
                if (!this.dom.dustCanvas) return;
                const ctx = this.dom.dustCanvas.getContext('2d');
                ctx.clearRect(0, 0, this.dom.dustCanvas.width, this.dom.dustCanvas.height);

                this.dustParticles.forEach(p => {
                    p.x += p.speedX;
                    p.y += p.speedY;
                    if (p.y < 0) {
                        p.y = this.dom.dustCanvas.height;
                        p.x = Math.random() * this.dom.dustCanvas.width;
                    }
                    if (p.x < 0) p.x = this.dom.dustCanvas.width;
                    if (p.x > this.dom.dustCanvas.width) p.x = 0;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.alpha + ')';
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = '#ffd700';
                    ctx.fill();
                });

                requestAnimationFrame(renderDust);
            };

            renderDust();
        }

        resizeDustCanvas() {
            if (!this.dom.dustCanvas) return;
            this.dom.dustCanvas.width = window.innerWidth;
            this.dom.dustCanvas.height = window.innerHeight;
        }

        // ==========================================
        // 6. MAIN SLOT REEL CYCLE
        // ==========================================
        updateUI() {
            this.dom.balance.textContent = this.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            this.dom.bet.textContent = BET_OPTIONS[this.betIndex].toLocaleString('en-US');
            this.dom.multiplier.textContent = `x${this.currentMultiplier}`;

            if (this.freeSpinsRemaining > 0) {
                this.dom.fsBadge.style.display = 'block';
                this.dom.fsCount.textContent = this.freeSpinsRemaining;
            } else {
                this.dom.fsBadge.style.display = 'none';
            }
        }

        renderGrid() {
            this.dom.reelsGrid.innerHTML = '';
            for (let c = 0; c < 5; c++) {
                const col = document.createElement('div');
                col.className = 'reel-column';
                col.id = `reel_${c}`;

                for (let r = 0; r < 3; r++) {
                    const symId = this.grid[c][r];
                    const sym = SYMBOLS.find(s => s.id === symId) || SYMBOLS[0];
                    const cell = document.createElement('div');
                    cell.className = 'symbol-cell';
                    cell.id = `cell_${c}_${r}`;

                    const img = document.createElement('img');
                    img.src = sym.img;
                    img.alt = sym.name;

                    cell.appendChild(img);
                    col.appendChild(cell);
                }
                this.dom.reelsGrid.appendChild(col);
            }
        }

        resizeCanvas() {
            if (!this.dom.canvas || !this.dom.reelsGrid) return;
            const rect = this.dom.reelsGrid.getBoundingClientRect();
            this.dom.canvas.width = rect.width;
            this.dom.canvas.height = rect.height;
            this.clearCanvas();
        }

        clearCanvas() {
            if (!this.dom.canvas) return;
            const ctx = this.dom.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.dom.canvas.width, this.dom.canvas.height);
        }

        async spin() {
            if (this.isSpinning) return;

            const bet = BET_OPTIONS[this.betIndex];
            if (this.freeSpinsRemaining <= 0) {
                if (this.balance < bet) {
                    alert(`Balance kam hai! Available: PKR ${this.balance.toFixed(2)}, Required: PKR ${bet.toFixed(2)}`);
                    return;
                }
                this.balance -= bet;
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ action: 'bwn_bet', amount: bet, newBalance: this.balance }, '*');
                }
                if (localStorage.getItem('wallet_balance') !== null) {
                    localStorage.setItem('wallet_balance', this.balance.toString());
                }
                if (localStorage.getItem('BETWITHNET_balance') !== null) {
                    localStorage.setItem('BETWITHNET_balance', this.balance.toString());
                }
            } else {
                this.freeSpinsRemaining--;
            }

            this.isSpinning = true;
            this.dom.btnSpin.classList.add('disabled');
            this.dom.win.textContent = '0.00';
            this.dom.win.classList.remove('win-highlight');
            this.clearCanvas();
            this.removeWinHighlights();
            this.updateUI();

            // 1. Miner Mascot Spin Action
            this.setMinerState('spin', 'FIRE IN THE HOLE! 💥');

            setTimeout(() => {
                this.setMinerState('plunge');
                if (window.goldRushAudio) {
                    window.goldRushAudio.playSfx('multiplier');
                }
            }, 180);

            if (window.goldRushAudio) {
                window.goldRushAudio.playSfx('spin');
            }

            // 2. Animate spinning reels
            for (let c = 0; c < 5; c++) {
                const col = document.getElementById(`reel_${c}`);
                if (col) col.classList.add('spinning');
            }

            // 3. Generate outcome
            const nextGrid = this.generateOutcome();
            const baseDelay = this.isTurbo ? 200 : 450;
            const stopStagger = this.isTurbo ? 100 : 250;

            // Stop each reel in sequence
            for (let c = 0; c < 5; c++) {
                await new Promise(r => setTimeout(r, c === 0 ? baseDelay : stopStagger));
                this.grid[c] = nextGrid[c];
                this.updateReelColumn(c);
                const col = document.getElementById(`reel_${c}`);
                if (col) col.classList.remove('spinning');
                if (window.goldRushAudio) {
                    window.goldRushAudio.playSfx('stop');
                }
            }

            // 4. Evaluate wins
            await this.evaluateOutcome();

            this.isSpinning = false;
            this.dom.btnSpin.classList.remove('disabled');

            // Handle Auto Spin
            if (this.isAuto) {
                setTimeout(() => {
                    if (this.isAuto) this.spin();
                }, this.isTurbo ? 400 : 900);
            }
        }

        generateOutcome() {
            const next = [];
            for (let c = 0; c < 5; c++) {
                const col = [];
                for (let r = 0; r < 3; r++) {
                    const rnd = Math.random();
                    let chosen = '10';

                    // Bias for exciting gameplay
                    if (rnd < 0.10) chosen = 'wild';
                    else if (rnd < 0.20) chosen = 'p1';
                    else if (rnd < 0.30) chosen = 'a';
                    else if (rnd < 0.40) chosen = 'k';
                    else if (rnd < 0.50) chosen = 'p3';
                    else if (rnd < 0.60) chosen = 'p4';
                    else if (rnd < 0.70) chosen = 'p5';
                    else if (rnd < 0.80) chosen = 'q';
                    else if (rnd < 0.90) chosen = '10';
                    else chosen = 'j';

                    col.push(chosen);
                }
                next.push(col);
            }
            return next;
        }

        updateReelColumn(c) {
            for (let r = 0; r < 3; r++) {
                const cell = document.getElementById(`cell_${c}_${r}`);
                if (!cell) continue;
                const symId = this.grid[c][r];
                const sym = SYMBOLS.find(s => s.id === symId);
                const img = cell.querySelector('img');
                if (img && sym) {
                    img.src = sym.img;
                    img.alt = sym.name;
                }
            }
        }

        removeWinHighlights() {
            const winningCells = document.querySelectorAll('.symbol-cell.winning');
            winningCells.forEach(cell => cell.classList.remove('winning'));
            this.dom.minerMascot.classList.remove('celebrate');
        }

        async evaluateOutcome() {
            const bet = BET_OPTIONS[this.betIndex];
            const lineBet = bet / 25;
            let totalWin = 0;
            const winningLines = [];
            let wildCount = 0;

            // Count wilds & calculate multiplier
            for (let c = 0; c < 5; c++) {
                for (let r = 0; r < 3; r++) {
                    if (this.grid[c][r] === 'wild') wildCount++;
                }
            }

            // Determine multiplier from bombs
            if (wildCount > 0) {
                const multipliers = [2, 3, 5, 10, 25, 50, 100];
                this.currentMultiplier = multipliers[Math.min(wildCount - 1, multipliers.length - 1)];
                if (window.goldRushAudio) window.goldRushAudio.playSfx('multiplier');
            } else {
                this.currentMultiplier = 1;
            }
            this.dom.multiplier.textContent = `x${this.currentMultiplier}`;

            // Check each payline
            PAYLINES.forEach((line, lineIdx) => {
                let matchSym = null;
                let count = 0;
                const lineCells = [];

                for (let c = 0; c < 5; c++) {
                    const r = line[c];
                    const symId = this.grid[c][r];
                    lineCells.push({ c, r });

                    if (symId === 'wild') {
                        count++;
                    } else if (matchSym === null) {
                        matchSym = symId;
                        count++;
                    } else if (matchSym === symId) {
                        count++;
                    } else {
                        break;
                    }
                }

                if (count >= 3 && matchSym) {
                    const symDef = SYMBOLS.find(s => s.id === matchSym);
                    if (symDef && symDef.pay && symDef.pay[count]) {
                        const payout = symDef.pay[count] * lineBet * this.currentMultiplier;
                        totalWin += payout;
                        winningLines.push({
                            lineIdx,
                            cells: lineCells.slice(0, count),
                            payout
                        });
                    }
                }
            });

            // Free spins feature disabled: 3+ wilds continue to standard win evaluation without free spins

            // Celebration & payout
            if (totalWin > 0) {
                if (this.freeSpinsRemaining > 0 || this.wasInFreeSpins) {
                    this.fsTotalWin += totalWin;
                }

                // Bomb drop trigger if wild or high multiplier win
                if (wildCount > 0 || Math.random() < 0.35) {
                    const mults = [2, 3, 5, 10, 50, 100];
                    const pickMult = mults[Math.floor(Math.random() * (wildCount > 1 ? mults.length : 3))];
                    this.triggerBombDrop(pickMult);
                }

                // Combo banner if multiple winning lines
                if (winningLines.length >= 2) {
                    this.showComboBanner(winningLines.length);
                }

                this.balance += totalWin;
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({ action: 'bwn_win', amount: totalWin, newBalance: this.balance }, '*');
                }
                if (localStorage.getItem('wallet_balance') !== null) {
                    localStorage.setItem('wallet_balance', this.balance.toString());
                }
                if (localStorage.getItem('BETWITHNET_balance') !== null) {
                    localStorage.setItem('BETWITHNET_balance', this.balance.toString());
                }
                this.dom.win.textContent = totalWin.toFixed(2);
                this.dom.win.classList.add('win-highlight');
                this.updateUI();

                // Miner joy
                if (totalWin >= bet * 15) {
                    this.setMinerState('win', 'YEE-HAW! 5,000X BIG WIN! 💰💰');
                } else {
                    this.setMinerState('win', 'WOOHOO! JACKPOT! 💎');
                }

                // Highlight winning tiles
                winningLines.forEach(wl => {
                    wl.cells.forEach(coord => {
                        const cell = document.getElementById(`cell_${coord.c}_${coord.r}`);
                        if (cell) cell.classList.add('winning');
                    });
                });

                this.drawWinningPaylines(winningLines);

                // Check Big Win (> 15x bet)
                if (totalWin >= bet * 15) {
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('win_big');
                    this.showBigWinModal(totalWin);
                } else {
                    if (window.goldRushAudio) window.goldRushAudio.playSfx('win');
                }
            } else {
                // Reset miner to idle after spin
                setTimeout(() => {
                    if (!this.isSpinning) {
                        this.setMinerState('idle', 'Let\'s blast some gold! ⛏️');
                    }
                }, 600);

                if (this.freeSpinsRemaining === 0 && window.goldRushAudio) {
                    window.goldRushAudio.playBgm('main');
                }
            }

            this.wasInFreeSpins = false;
        }

        drawWinningPaylines(winningLines) {
            if (!this.dom.canvas) return;
            const ctx = this.dom.canvas.getContext('2d');
            this.clearCanvas();

            const colors = ['#ffd700', '#ff5722', '#00e676', '#00e5ff', '#e040fb', '#ffeb3b'];

            winningLines.forEach((wl, idx) => {
                ctx.beginPath();
                ctx.lineWidth = 4;
                ctx.strokeStyle = colors[idx % colors.length];
                ctx.shadowColor = colors[idx % colors.length];
                ctx.shadowBlur = 10;

                wl.cells.forEach((coord, i) => {
                    const cell = document.getElementById(`cell_${coord.c}_${coord.r}`);
                    if (!cell) return;
                    const rect = cell.getBoundingClientRect();
                    const gridRect = this.dom.reelsGrid.getBoundingClientRect();

                    const x = rect.left - gridRect.left + rect.width / 2;
                    const y = rect.top - gridRect.top + rect.height / 2;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                });
                ctx.stroke();
            });
        }

        showBigWinModal(amount) {
            this.dom.bigwinModal.style.display = 'flex';
            this.dom.bigwinCount.textContent = '0.00';

            let cur = 0;
            const target = amount;
            const step = target / 30;

            const interval = setInterval(() => {
                cur += step;
                if (cur >= target) {
                    cur = target;
                    clearInterval(interval);
                    setTimeout(() => {
                        this.dom.bigwinModal.style.display = 'none';
                        this.setMinerState('idle', 'What a strike! Again! ⛏️');
                    }, 2500);
                }
                this.dom.bigwinCount.textContent = cur.toFixed(2);
            }, 30);
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        window.goldRushGame = new GoldRushGame();
    });
})();
