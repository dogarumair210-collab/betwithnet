// ============================================================
// Bet With Net - Dragon vs Tiger VIP Live Casino Engine
// Exact authentic implementation matching official casino stream
// ============================================================

class DragonTigerGame {
    constructor() {
        this.state = 'IDLE'; // IDLE, BETTING, STOP_BETTING, DEALING, SHOWDOWN, TRANSITION
        this.countdown = 10;
        this.timerInterval = null;
        this.simInterval = null;

        // Soft Casino Background Music (starts after loading screen & video)
        this.soundEnabled = true;
        this.bgMusic = null;
        this.audioPools = {};

        // Active Chips & Betting
        this.chipValues = [10, 20, 50, 100, 500, 1000, 5000];
        this.selectedChip = 100;
        this.currentBets = { dragon: 0, tie: 0, tiger: 0 };
        this.previousBets = { dragon: 0, tie: 0, tiger: 0 };

        // Room totals
        this.roomBets = { dragon: 14470, tie: 100, tiger: 29750 };
        this.roomInitial = { dragon: 12000, tie: 500, tiger: 18000 };

        // Road Map (Beads)
        this.roadHistory = ['d', 'd', 'd', 'tie', 't', 'd', 'd', 'd', 'd', 't', 't', 't', 't', 'tie', 'd', 't', 't', 'd', 't'];

        // Card Deck
        this.suits = [
            { symbol: '♠', name: 'spades', isRed: false },
            { symbol: '♥', name: 'hearts', isRed: true },
            { symbol: '♦', name: 'diamonds', isRed: true },
            { symbol: '♣', name: 'clubs', isRed: false }
        ];
        this.ranks = [
            { label: 'A', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
            { label: '4', value: 4 },
            { label: '5', value: 5 },
            { label: '6', value: 6 },
            { label: '7', value: 7 },
            { label: '8', value: 8 },
            { label: '9', value: 9 },
            { label: '10', value: 10 },
            { label: 'J', value: 11 },
            { label: 'Q', value: 12 },
            { label: 'K', value: 13 }
        ];

        // Current round cards
        this.dragonCard = null;
        this.tigerCard = null;

        // 5 Active Live Betting Bots (Seated VIP Players - seat under dragon cleared)
        this.seatedPlayers = [
            { id: 'seat-2', name: 'Malik_King', balance: 64500, vip: 'VIP 8', icon: '👑', color: 'linear-gradient(135deg, #854d0e, #eab308)', currentBet: null },
            { id: 'seat-3', name: 'TigerBoss', balance: 92000, vip: 'VIP 9', icon: '🐅', color: 'linear-gradient(135deg, #9a3412, #f97316)', currentBet: null },
            { id: 'seat-4', name: 'Raja_786', balance: 145000, vip: 'VIP 10', icon: '🦅', color: 'linear-gradient(135deg, #065f46, #10b981)', currentBet: null },
            { id: 'seat-5', name: 'LuckyBilal', balance: 38200, vip: 'VIP 7', icon: '🎲', color: 'linear-gradient(135deg, #5b21b6, #8b5cf6)', currentBet: null },
            { id: 'seat-6', name: 'Zeeshan_VIP', balance: 76000, vip: 'VIP 8', icon: '💎', color: 'linear-gradient(135deg, #9d174d, #ec4899)', currentBet: null }
        ];

        // 26 VIP Player Roster for 3-minute seat rotation
        this.botRoster = [
            { name: 'Malik_King', vip: 'VIP 8', icon: '👑', color: 'linear-gradient(135deg, #854d0e, #eab308)', minBal: 55000, maxBal: 95000 },
            { name: 'TigerBoss', vip: 'VIP 9', icon: '🐅', color: 'linear-gradient(135deg, #9a3412, #f97316)', minBal: 80000, maxBal: 140000 },
            { name: 'Raja_786', vip: 'VIP 10', icon: '🦅', color: 'linear-gradient(135deg, #065f46, #10b981)', minBal: 110000, maxBal: 190000 },
            { name: 'LuckyBilal', vip: 'VIP 7', icon: '🎲', color: 'linear-gradient(135deg, #5b21b6, #8b5cf6)', minBal: 38000, maxBal: 68000 },
            { name: 'Zeeshan_VIP', vip: 'VIP 8', icon: '💎', color: 'linear-gradient(135deg, #9d174d, #ec4899)', minBal: 65000, maxBal: 115000 },
            { name: 'Sheikh_Rashid', vip: 'VIP 11', icon: '🦁', color: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', minBal: 140000, maxBal: 260000 },
            { name: 'Chaudhry_Ace', vip: 'VIP 9', icon: '🔥', color: 'linear-gradient(135deg, #b91c1c, #ef4444)', minBal: 75000, maxBal: 130000 },
            { name: 'Hamza_VIP', vip: 'VIP 8', icon: '⭐', color: 'linear-gradient(135deg, #0f766e, #14b8a6)', minBal: 50000, maxBal: 85000 },
            { name: 'Sultan_Khan', vip: 'VIP 10', icon: '🐉', color: 'linear-gradient(135deg, #701a75, #d946ef)', minBal: 120000, maxBal: 210000 },
            { name: 'Babar_VIP', vip: 'VIP 9', icon: '⚡', color: 'linear-gradient(135deg, #c2410c, #fb923c)', minBal: 70000, maxBal: 125000 },
            { name: 'Naveed_Lucky', vip: 'VIP 7', icon: '🏆', color: 'linear-gradient(135deg, #15803d, #22c55e)', minBal: 42000, maxBal: 75000 },
            { name: 'Tariq_Boss', vip: 'VIP 12', icon: '👑', color: 'linear-gradient(135deg, #78350f, #f59e0b)', minBal: 180000, maxBal: 320000 },
            { name: 'Usman_Pro', vip: 'VIP 8', icon: '🐺', color: 'linear-gradient(135deg, #374151, #9ca3af)', minBal: 60000, maxBal: 98000 },
            { name: 'Faisal_Lhr', vip: 'VIP 9', icon: '💎', color: 'linear-gradient(135deg, #1d4ed8, #60a5fa)', minBal: 85000, maxBal: 145000 },
            { name: 'Jutt_VIP', vip: 'VIP 10', icon: '🐅', color: 'linear-gradient(135deg, #831843, #f43f5e)', minBal: 105000, maxBal: 175000 },
            { name: 'Kamran_777', vip: 'VIP 8', icon: '🎲', color: 'linear-gradient(135deg, #047857, #34d399)', minBal: 52000, maxBal: 89000 },
            { name: 'Waqas_VIP', vip: 'VIP 9', icon: '🦅', color: 'linear-gradient(135deg, #4c1d95, #a855f7)', minBal: 78000, maxBal: 135000 },
            { name: 'Rizwan_786', vip: 'VIP 11', icon: '👑', color: 'linear-gradient(135deg, #92400e, #fbbf24)', minBal: 150000, maxBal: 270000 },
            { name: 'Kashif_King', vip: 'VIP 8', icon: '🔥', color: 'linear-gradient(135deg, #991b1b, #f87171)', minBal: 62000, maxBal: 102000 },
            { name: 'Adeel_Badshah', vip: 'VIP 10', icon: '🦁', color: 'linear-gradient(135deg, #064e3b, #059669)', minBal: 115000, maxBal: 195000 },
            { name: 'Sarmad_VIP', vip: 'VIP 7', icon: '⭐', color: 'linear-gradient(135deg, #1e40af, #38bdf8)', minBal: 45000, maxBal: 78000 },
            { name: 'Zohaib_Pro', vip: 'VIP 9', icon: '⚡', color: 'linear-gradient(135deg, #86198f, #e879f9)', minBal: 82000, maxBal: 138000 },
            { name: 'Umair_Ace', vip: 'VIP 8', icon: '🎲', color: 'linear-gradient(135deg, #0e7490, #22d3ee)', minBal: 58000, maxBal: 94000 },
            { name: 'Shahid_VIP', vip: 'VIP 10', icon: '💎', color: 'linear-gradient(135deg, #b45309, #fde047)', minBal: 125000, maxBal: 220000 },
            { name: 'Arham_Vegas', vip: 'VIP 9', icon: '🐅', color: 'linear-gradient(135deg, #9a3412, #fb923c)', minBal: 76000, maxBal: 128000 },
            { name: 'Munir_King', vip: 'VIP 11', icon: '👑', color: 'linear-gradient(135deg, #14532d, #4ade80)', minBal: 160000, maxBal: 290000 }
        ];

        this.lastBotRotateTime = Date.now();
        this.botRotateIntervalMs = 3 * 60 * 1000; // Har 3 minute bad names change
        this.pendingBotRotate = false;
        this.botRotateCheckInterval = null;
        this.botBetTimeouts = [];
    }

    init() {
        if (this._hasInitialized) return;
        this._hasInitialized = true;
        this.initAudio();
        this.renderRoadMap();
        this.renderChipsRack();
        this.renderSeatedPlayers();
        this.bindEvents();
        this.syncWalletDisplay();

        // Listen for wallet balance updates
        if (window.wallet && window.wallet.on) {
            window.wallet.on('balanceChanged', () => this.syncWalletDisplay());
        }

        // Start 3-minute bot rotation scheduler
        this.startBotRotationTimer();

        // Start playing the lucky casino background music now that loading screen and intro video are done
        this.playBGM();

        // Start live game loop
        setTimeout(() => {
            this.startBettingRound();
        }, 500);
    }

    initAudio() {
        this.soundEnabled = true;
        try {
            const savedSound = localStorage.getItem('dvt_sound_enabled');
            if (savedSound !== null) {
                this.soundEnabled = (savedSound === 'true');
            }
        } catch(e) {}

        // Soft, Pleasant Casino Background Music (Hlka sa pyara sa casino music)
        this.bgMusic = new Audio('../assets/audio/card/casino_bgm.mp3?v=3.0');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.32; // Soft, ambient casino level

        // Warning 3, 2, 1 Countdown Audio with Alert Tone & Voice
        this.countAudio = {
            3: new Audio('../assets/audio/card/count_3.mp3?v=1.0'),
            2: new Audio('../assets/audio/card/count_2.mp3?v=1.0'),
            1: new Audio('../assets/audio/card/count_1.mp3?v=1.0')
        };
        Object.values(this.countAudio).forEach(a => {
            a.preload = 'auto';
            a.volume = 0.95;
        });

        // Card Flip / Deal Audio Pool for opening cards
        this.cardAudioPool = [
            new Audio('../assets/audio/card/card_flip.mp3?v=1.0'),
            new Audio('../assets/audio/card/card_flip.mp3?v=1.0'),
            new Audio('../assets/audio/card/card_deal.mp3?v=2.0')
        ];
        this.cardAudioPool.forEach(a => {
            a.preload = 'auto';
            a.volume = 0.95;
        });
        this.cardAudioIdx = 0;

        // Chip Betting Click Sound Pool (100% Pure Clean Click - zero background noise)
        this.chipAudioPool = [
            new Audio('../assets/audio/card/chip_clean.mp3?v=3.0'),
            new Audio('../assets/audio/card/chip_clean.mp3?v=3.0'),
            new Audio('../assets/audio/card/chip_clean.mp3?v=3.0'),
            new Audio('../assets/audio/card/chip_clean.mp3?v=3.0')
        ];
        this.chipAudioPool.forEach(a => {
            a.preload = 'auto';
            a.volume = 0.85;
        });
        this.chipAudioIdx = 0;

        // Dragon / Tiger / Tie Win Audio
        this.winAudio = {
            winDragon: new Audio('../assets/audio/card/win_dragon_voice.mp3?v=2.0'),
            winTiger: new Audio('../assets/audio/card/win_tiger_voice.mp3?v=2.0'),
            win: new Audio('../assets/audio/card/win.mp3?v=2.0')
        };
        Object.values(this.winAudio).forEach(a => {
            a.preload = 'auto';
            a.volume = 1.0;
        });

        // Stop Betting Voice Announcement Audio
        this.stopBettingAudio = new Audio('../assets/audio/card/stop_betting_voice.mp3?v=1.0');
        this.stopBettingAudio.preload = 'auto';
        this.stopBettingAudio.volume = 1.0;

        // Pre-arm count, card, chip, stop betting & win audio on user touch
        const preArmSounds = () => {
            if (this.countAudio) {
                Object.values(this.countAudio).forEach(a => {
                    try {
                        const p = a.play();
                        if (p !== undefined) {
                            p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
                        }
                    } catch(e) {}
                });
            }
            if (this.stopBettingAudio) {
                try {
                    const p = this.stopBettingAudio.play();
                    if (p !== undefined) {
                        p.then(() => { this.stopBettingAudio.pause(); this.stopBettingAudio.currentTime = 0; }).catch(() => {});
                    }
                } catch(e) {}
            }
            if (this.cardAudioPool) {
                this.cardAudioPool.forEach(a => {
                    try {
                        const p = a.play();
                        if (p !== undefined) {
                            p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
                        }
                    } catch(e) {}
                });
            }
            if (this.chipAudioPool) {
                this.chipAudioPool.forEach(a => {
                    try {
                        const p = a.play();
                        if (p !== undefined) {
                            p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
                        }
                    } catch(e) {}
                });
            }
            if (this.winAudio) {
                Object.values(this.winAudio).forEach(a => {
                    try {
                        const p = a.play();
                        if (p !== undefined) {
                            p.then(() => { a.pause(); a.currentTime = 0; }).catch(() => {});
                        }
                    } catch(e) {}
                });
            }
            window.removeEventListener('pointerdown', preArmSounds);
            window.removeEventListener('touchstart', preArmSounds);
            window.removeEventListener('click', preArmSounds);
        };
        window.addEventListener('pointerdown', preArmSounds, { once: true, passive: true });
        window.addEventListener('touchstart', preArmSounds, { once: true, passive: true });
        window.addEventListener('click', preArmSounds, { once: true, passive: true });

        this.audioPools = {};
        this.updateSoundBtn();
    }

    playCardSound() {
        if (!this.soundEnabled || !this.cardAudioPool) return;
        try {
            const sound = this.cardAudioPool[this.cardAudioIdx % this.cardAudioPool.length];
            this.cardAudioIdx++;
            sound.currentTime = 0;
            const prom = sound.play();
            if (prom !== undefined) {
                prom.catch(() => {});
            }
        } catch(e) {}
    }

    playCountWarning(num) {
        if (!this.soundEnabled || !this.countAudio || !this.countAudio[num]) return;
        try {
            const sound = this.countAudio[num];
            sound.currentTime = 0;
            const prom = sound.play();
            if (prom !== undefined) {
                prom.catch(() => {});
            }
        } catch(e) {}
    }

    playBGM() {
        if (!this.soundEnabled || !this.bgMusic) return;
        try {
            this.bgMusic.currentTime = 0;
            const playPromise = this.bgMusic.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    // Unlock on first user tap if browser autoplay policy blocks
                    const unlockBGM = () => {
                        if (this.soundEnabled && this.bgMusic) {
                            this.bgMusic.play().catch(() => {});
                        }
                        window.removeEventListener('pointerdown', unlockBGM);
                        window.removeEventListener('touchstart', unlockBGM);
                        window.removeEventListener('click', unlockBGM);
                    };
                    window.addEventListener('pointerdown', unlockBGM, { once: true });
                    window.addEventListener('touchstart', unlockBGM, { once: true });
                    window.addEventListener('click', unlockBGM, { once: true });
                });
            }
        } catch(e) {}
    }

    stopBGM() {
        if (this.bgMusic) {
            try {
                this.bgMusic.pause();
            } catch(e) {}
        }
    }

    playChipSound() {
        if (!this.soundEnabled || !this.chipAudioPool) return;
        try {
            const sound = this.chipAudioPool[this.chipAudioIdx % this.chipAudioPool.length];
            this.chipAudioIdx++;
            sound.currentTime = 0;
            const prom = sound.play();
            if (prom !== undefined) {
                prom.catch(() => {});
            }
        } catch(e) {}
    }

    playWinSound(key) {
        if (!this.soundEnabled || !this.winAudio || !this.winAudio[key]) return;
        try {
            const sound = this.winAudio[key];
            sound.currentTime = 0;
            // Duck background music slightly during winner announcement
            if (this.bgMusic) {
                this.bgMusic.volume = 0.10;
                setTimeout(() => {
                    if (this.soundEnabled && this.bgMusic) this.bgMusic.volume = 0.32;
                }, 2800);
            }
            const prom = sound.play();
            if (prom !== undefined) {
                prom.catch(() => {});
            }
        } catch(e) {}
    }

    playStopBettingSound() {
        if (!this.soundEnabled || !this.stopBettingAudio) return;
        try {
            this.stopBettingAudio.currentTime = 0;
            // Briefly duck background music for clear voice announcement
            if (this.bgMusic) {
                this.bgMusic.volume = 0.12;
                setTimeout(() => {
                    if (this.soundEnabled && this.bgMusic) this.bgMusic.volume = 0.32;
                }, 1700);
            }
            const prom = this.stopBettingAudio.play();
            if (prom !== undefined) {
                prom.catch(() => {});
            }
        } catch(e) {}
    }

    playSound(key) {
        if (!this.soundEnabled) return;
        if (key === 'stopBetting') {
            this.playStopBettingSound();
        } else if (key === 'cardDeal' || key === 'cardFlip') {
            this.playCardSound();
        } else if (key === 'chipBet') {
            this.playChipSound();
        } else if (key === 'winDragon' || key === 'winTiger' || key === 'win') {
            this.playWinSound(key);
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        try { localStorage.setItem('dvt_sound_enabled', this.soundEnabled); } catch(e) {}
        if (this.soundEnabled) {
            if (this.bgMusic) this.bgMusic.play().catch(() => {});
        } else {
            this.stopBGM();
            if (this.stopBettingAudio) {
                try { this.stopBettingAudio.pause(); this.stopBettingAudio.currentTime = 0; } catch(e) {}
            }
            if (this.countAudio) {
                Object.values(this.countAudio).forEach(a => {
                    try { a.pause(); a.currentTime = 0; } catch(e) {}
                });
            }
            if (this.winAudio) {
                Object.values(this.winAudio).forEach(a => {
                    try { a.pause(); a.currentTime = 0; } catch(e) {}
                });
            }
        }
        this.updateSoundBtn();
    }

    updateSoundBtn() {
        const btn = document.getElementById('dvt-sound-toggle');
        if (btn) {
            btn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            btn.style.opacity = this.soundEnabled ? '1' : '0.45';
            btn.title = this.soundEnabled ? 'Casino Music ON' : 'Casino Music Muted';
        }
    }

    syncWalletDisplay() {
        const balEl = document.getElementById('dvt-user-balance-num');
        const watchingBar = document.getElementById('dvt-watching-bar');
        const chipsRack = document.getElementById('dvt-chips-rack');

        let bal = 0;
        if (window.wallet) {
            bal = window.wallet.getBalance('PKR');
        }

        const balVal = document.getElementById('dvt-user-balance-val');
        if (balVal) {
            balVal.innerText = '₨ ' + bal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        } else if (balEl) {
            balEl.innerText = '₨ ' + bal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        }

        // Always show chips rack so user can choose chips and play smoothly
        if (chipsRack) chipsRack.style.display = 'flex';
        if (watchingBar) watchingBar.classList.remove('show');
    }

    bindEvents() {
        // Bet box clicks
        ['dragon', 'tie', 'tiger'].forEach(side => {
            const box = document.getElementById(`dvt-bet-${side}`);
            if (box) {
                box.addEventListener('click', (e) => {
                    this.handleUserBet(side, e);
                });
            }
        });

        // Sound toggle
        const soundBtn = document.getElementById('dvt-sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
        }

        // Rebet button
        const rebetBtn = document.getElementById('dvt-rebet-btn');
        if (rebetBtn) {
            rebetBtn.addEventListener('click', () => this.handleRebet());
        }

        // Clear button
        const clearBtn = document.getElementById('dvt-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.handleClearBets());
        }

        // Top Up button
        const topupBtn = document.getElementById('dvt-topup-btn');
        if (topupBtn) {
            topupBtn.addEventListener('click', () => {
                if (window.wallet && typeof window.wallet.showTopupModal === 'function') {
                    window.wallet.showTopupModal();
                } else {
                    window.location.href = '../deposit.html';
                }
            });
        }

        // Interactive Live Beasts
        const topDragon = document.getElementById('dvt-top-dragon');
        if (topDragon) {
            topDragon.addEventListener('click', () => {
                this.playSound('vsClash');
                topDragon.classList.add('beast-win-surge');
                setTimeout(() => topDragon.classList.remove('beast-win-surge'), 1200);
            });
        }

        const topTiger = document.getElementById('dvt-top-tiger');
        if (topTiger) {
            topTiger.addEventListener('click', () => {
                this.playSound('vsClash');
                topTiger.classList.add('beast-win-surge');
                setTimeout(() => topTiger.classList.remove('beast-win-surge'), 1200);
            });
        }
    }

    renderChipsRack() {
        const rack = document.getElementById('dvt-chips-rack');
        if (!rack) return;
        rack.innerHTML = '';

        this.chipValues.forEach(val => {
            const item = document.createElement('div');
            item.className = `dvt-chip-item ${val === this.selectedChip ? 'active' : ''}`;
            item.setAttribute('data-val', val);
            const chipFileName = this.getChipFileName(val);
            item.innerHTML = `<img src="../assets/games/card/chips/${chipFileName}" alt="₨ ${val}">`;
            item.addEventListener('click', () => {
                this.selectedChip = val;
                document.querySelectorAll('.dvt-chip-item').forEach(c => c.classList.remove('active'));
                item.classList.add('active');
                this.playSound('chipBet');
            });
            rack.appendChild(item);
        });
    }

    renderRoadMap() {
        const container = document.getElementById('dvt-road-beads');
        if (!container) return;
        container.innerHTML = '';

        this.roadHistory.forEach((b, idx) => {
            const bead = document.createElement('div');
            const isLatest = idx === this.roadHistory.length - 1;
            const letter = b === 'tie' ? 'T' : b.toUpperCase().charAt(0);
            bead.className = `dvt-road-pill pill-${b} ${isLatest ? 'new-pulse' : ''}`;
            bead.innerText = letter;
            container.appendChild(bead);
        });

        container.scrollLeft = container.scrollWidth;
    }

    addRoadBead(result) {
        this.roadHistory.push(result);
        if (this.roadHistory.length > 35) this.roadHistory.shift();
        this.renderRoadMap();
    }

    renderSeatedPlayers() {
        this.seatedPlayers.forEach(p => {
            const seat = document.getElementById(p.id);
            if (!seat) return;
            seat.innerHTML = `
                <div class="dvt-seat-avatar-wrap" id="${p.id}-wrap">
                    <div class="dvt-seat-avatar-icon" style="background:${p.color};">${p.icon}</div>
                    <div class="dvt-seat-vip-tag">${p.vip}</div>
                    <div class="dvt-seat-gain" id="${p.id}-gain">+₨ 0</div>
                </div>
                <div class="dvt-seat-name">${p.name}</div>
                <div class="dvt-seat-bal" id="${p.id}-bal">₨ ${p.balance.toLocaleString()}</div>
            `;
        });
    }

    updateBotBalanceUI(bot) {
        const balEl = document.getElementById(`${bot.id}-bal`);
        if (balEl) {
            balEl.innerText = `₨ ${bot.balance.toLocaleString()}`;
        }
    }

    startBotRotationTimer() {
        if (this.botRotateCheckInterval) clearInterval(this.botRotateCheckInterval);
        this.botRotateCheckInterval = setInterval(() => {
            if (Date.now() - this.lastBotRotateTime >= this.botRotateIntervalMs) {
                if (this.state === 'BETTING' || this.state === 'IDLE') {
                    this.rotateSeatedBots();
                } else {
                    this.pendingBotRotate = true;
                }
            }
        }, 10000);
    }

    rotateSeatedBots() {
        this.lastBotRotateTime = Date.now();
        if (!this.seatedPlayers || !this.botRoster) return;

        // Current seated names to exclude from new selection
        const currentNames = new Set(this.seatedPlayers.map(p => p.name));
        const availablePool = this.botRoster.filter(r => !currentNames.has(r.name));
        const shuffled = [...availablePool].sort(() => 0.5 - Math.random());

        this.seatedPlayers.forEach((player, idx) => {
            const newVIP = shuffled[idx % shuffled.length];
            if (!newVIP) return;

            const seatEl = document.getElementById(player.id);
            if (seatEl) {
                seatEl.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
                seatEl.style.opacity = '0.15';
                seatEl.style.transform = 'scale(0.85)';
            }

            setTimeout(() => {
                player.name = newVIP.name;
                player.vip = newVIP.vip;
                player.icon = newVIP.icon;
                player.color = newVIP.color;
                const rndBal = Math.floor(Math.random() * (newVIP.maxBal - newVIP.minBal)) + newVIP.minBal;
                player.balance = Math.round(rndBal / 100) * 100;
                player.currentBet = null;

                const wrap = document.getElementById(`${player.id}-wrap`);
                if (wrap) {
                    wrap.innerHTML = `
                        <div class="dvt-seat-avatar-icon" style="background:${player.color};">${player.icon}</div>
                        <div class="dvt-seat-vip-tag">${player.vip}</div>
                        <div class="dvt-seat-gain" id="${player.id}-gain">+₨ 0</div>
                    `;
                }
                const nameEl = seatEl ? seatEl.querySelector('.dvt-seat-name') : null;
                if (nameEl) nameEl.innerText = player.name;
                const balEl = document.getElementById(`${player.id}-bal`);
                if (balEl) balEl.innerText = `₨ ${player.balance.toLocaleString()}`;

                if (seatEl) {
                    seatEl.style.opacity = '1';
                    seatEl.style.transform = 'scale(1)';
                }
            }, 450);
        });
    }

    // ==========================================
    // ROUND FLOW & STATE MACHINE
    // ==========================================

    startBettingRound() {
        this.state = 'BETTING';
        this.countdown = 10;
        this.currentBets = { dragon: 0, tie: 0, tiger: 0 };
        this.resetTableDisplay();

        // Check if 3 minutes have elapsed to rotate bots with fresh VIP names
        if (this.pendingBotRotate || (Date.now() - this.lastBotRotateTime >= this.botRotateIntervalMs)) {
            this.rotateSeatedBots();
            this.pendingBotRotate = false;
        }

        // Reset bots for this round
        this.seatedPlayers.forEach(p => {
            p.currentBet = null;
            const badge = document.getElementById(`${p.id}-bet-badge`);
            if (badge) badge.remove();
            const seatEl = document.getElementById(p.id);
            if (seatEl) seatEl.classList.remove('dvt-seat-win-bounce');
        });

        // Update Rebet button availability
        const totalPrev = this.previousBets.dragon + this.previousBets.tie + this.previousBets.tiger;
        const rebetBtn = document.getElementById('dvt-rebet-btn');
        if (rebetBtn) rebetBtn.disabled = (totalPrev === 0);

        // Show Alarm Clock Countdown
        this.setCenterDisplay('clock', this.countdown);

        // Clear previous intervals if any
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.simInterval) clearInterval(this.simInterval);

        // Timer Tick Loop
        this.timerInterval = setInterval(() => {
            this.countdown--;
            if (this.countdown >= 0) {
                this.setCenterDisplay('clock', this.countdown);
                if (this.countdown === 3 || this.countdown === 2 || this.countdown === 1) {
                    this.playCountWarning(this.countdown);
                }
            }

            if (this.countdown <= 0) {
                clearInterval(this.timerInterval);
                clearInterval(this.simInterval);
                this.stopBettingPhase();
            }
        }, 1000);

        // High Quality AI Bots Placing Realistic VIP Casino Bets
        let botBetCount = 0;
        const maxBotBets = Math.floor(Math.random() * 10) + 24; // 24 to 34 authentic bets per round
        this.simInterval = setInterval(() => {
            if (this.state !== 'BETTING') return;
            if (botBetCount < maxBotBets && this.countdown > 1) {
                this.simulateBotBet();
                botBetCount++;
                if (Math.random() > 0.35 && botBetCount < maxBotBets) {
                    setTimeout(() => {
                        if (this.state === 'BETTING') this.simulateBotBet();
                    }, Math.floor(Math.random() * 90) + 70);
                    botBetCount++;
                }
            }
        }, 280);
    }

    simulateBotBet() {
        if (!this.seatedPlayers || this.seatedPlayers.length === 0) return;

        // Select bot from seated VIPs
        const bot = this.seatedPlayers[Math.floor(Math.random() * this.seatedPlayers.length)];
        if (!bot) return;

        // Intelligent Chip Selection based on VIP rank
        let allowedChips = [100, 500, 1000];
        const vipNum = parseInt((bot.vip || '').replace(/\D/g, ''), 10) || 7;
        if (vipNum >= 10) {
            allowedChips = [500, 1000, 2000, 5000];
        } else if (vipNum >= 8) {
            allowedChips = [100, 500, 1000, 2000];
        }
        const chipVal = allowedChips[Math.floor(Math.random() * allowedChips.length)];

        // Ensure bot has sufficient balance or reload realistically
        if (bot.balance < chipVal * 2) {
            bot.balance += Math.floor(Math.random() * 40000) + 60000;
        }

        // Realistic Betting Decision:
        // If bot already bet on a side this round, 90% chance it stacks on that same side
        let side;
        if (bot.currentBet && Math.random() < 0.90) {
            side = bot.currentBet.side;
        } else {
            // Trend analysis from Road Map history
            const recentRoad = (this.roadHistory || []).slice(-6);
            const dWins = recentRoad.filter(b => b === 'd').length;
            const tWins = recentRoad.filter(b => b === 't').length;

            const roll = Math.random();
            if (roll < 0.05) {
                side = 'tie';
            } else if (dWins > tWins) {
                // Dragon trending: 65% follow trend, 35% counter
                side = roll < 0.65 ? 'dragon' : 'tiger';
            } else if (tWins > dWins) {
                // Tiger trending: 65% follow trend, 35% counter
                side = roll < 0.65 ? 'tiger' : 'dragon';
            } else {
                side = Math.random() > 0.5 ? 'dragon' : 'tiger';
            }
        }

        bot.balance -= chipVal;
        if (!bot.currentBet) {
            bot.currentBet = { side, amount: chipVal };
        } else if (bot.currentBet.side === side) {
            bot.currentBet.amount += chipVal;
        }

        // Live update bot balance on screen
        this.updateBotBalanceUI(bot);

        // Render Active Bet Badge on Bot
        const seatEl = document.getElementById(bot.id);
        if (seatEl) {
            let badge = document.getElementById(`${bot.id}-bet-badge`);
            if (!badge) {
                badge = document.createElement('div');
                badge.id = `${bot.id}-bet-badge`;
                seatEl.appendChild(badge);
            }
            badge.className = `dvt-seat-bet-badge ${bot.currentBet.side}`;
            const sideIcon = bot.currentBet.side === 'dragon' ? '🐉' : (bot.currentBet.side === 'tiger' ? '🐅' : '🤝');
            const amt = bot.currentBet.amount;
            const amtStr = amt >= 1000 ? (amt % 1000 === 0 ? (amt / 1000) + 'K' : (amt / 1000).toFixed(1) + 'K') : amt;
            badge.innerText = `${sideIcon} ₨ ${amtStr}`;
        }

        // Increment Room Totals
        this.roomBets[side] += chipVal;
        this.updateRoomTotals();

        // Animate flying chip from Bot Avatar to Table
        const boxEl = document.getElementById(`dvt-bet-${side}`);
        if (seatEl && boxEl) {
            const avatarCircle = seatEl.querySelector('.dvt-seat-avatar-wrap') || seatEl;
            this.animateFlyingChip(avatarCircle, boxEl, chipVal);
            this.playSound('chipBet');
        }
    }

    handleUserBet(side, event) {
        if (this.state !== 'BETTING') {
            if (window.app) window.app.showToast('Betting is closed for this round!', 'warning');
            return;
        }

        const betVal = this.selectedChip;
        let currentBal = window.wallet ? window.wallet.getBalance('PKR') : 0;

        if (currentBal < betVal) {
            if (window.core && window.core.showToast) {
                window.core.showToast('Insufficient balance! Please deposit to play.', 'error');
            } else if (window.app && window.app.showToast) {
                window.app.showToast('Insufficient balance! Please deposit to play.', 'error');
            } else {
                alert('Insufficient balance! Please deposit to play.');
            }
            return;
        }

        // Deduct bet from wallet
        if (window.wallet && !window.wallet.placeBet(betVal, 'Dragon vs Tiger')) {
            if (window.core && window.core.showToast) window.core.showToast('Insufficient balance!', 'error');
            return;
        }

        // Record User Bet
        this.currentBets[side] += betVal;
        this.roomBets[side] += betVal;
        this.updateRoomTotals();
        this.updateUserBetTag(side);
        this.syncWalletDisplay();

        // Sound & Animation directly from User Avatar Circle
        this.playSound('chipBet');
        const userAvatar = document.getElementById('dvt-user-avatar') || document.getElementById('dvt-user-avatar-zone') || document.getElementById('dvt-user-balance-num');
        const boxEl = document.getElementById(`dvt-bet-${side}`);
        if (userAvatar && boxEl) {
            this.animateFlyingChip(userAvatar, boxEl, betVal);
        }
    }

    handleRebet() {
        if (this.state !== 'BETTING') return;
        const totalPrev = this.previousBets.dragon + this.previousBets.tie + this.previousBets.tiger;
        if (totalPrev === 0) return;

        const currentBal = window.wallet ? window.wallet.getBalance('PKR') : 0;
        if (currentBal < totalPrev) {
            if (window.app) window.app.showToast('Insufficient balance to rebet!', 'error');
            return;
        }

        ['dragon', 'tie', 'tiger'].forEach(side => {
            const amt = this.previousBets[side];
            if (amt > 0) {
                if (window.wallet.placeBet(amt, 'Dragon vs Tiger')) {
                    this.currentBets[side] += amt;
                    this.roomBets[side] += amt;
                    this.updateUserBetTag(side);
                }
            }
        });

        this.updateRoomTotals();
        this.syncWalletDisplay();
        this.playSound('chipBet');
        if (window.app) window.app.showToast(`Rebet ₨ ${totalPrev} placed!`, 'success');
    }

    handleClearBets() {
        if (this.state !== 'BETTING') return;
        const totalCurrent = this.currentBets.dragon + this.currentBets.tie + this.currentBets.tiger;
        if (totalCurrent === 0) return;

        // Refund current bets
        if (window.wallet) {
            window.wallet.creditWin(totalCurrent, totalCurrent, 'Dragon vs Tiger', 1, 'Bets Cleared');
        }

        this.roomBets.dragon -= this.currentBets.dragon;
        this.roomBets.tie -= this.currentBets.tie;
        this.roomBets.tiger -= this.currentBets.tiger;
        this.currentBets = { dragon: 0, tie: 0, tiger: 0 };

        ['dragon', 'tie', 'tiger'].forEach(side => this.updateUserBetTag(side));
        this.updateRoomTotals();
        this.syncWalletDisplay();
        if (window.app) window.app.showToast('Bets cleared!', 'info');
    }

    updateUserBetTag(side) {
        const tag = document.getElementById(`dvt-my-bet-${side}`);
        if (!tag) return;
        const amt = this.currentBets[side];
        if (amt > 0) {
            tag.innerText = `MY: ₨ ${amt.toLocaleString()}`;
            tag.style.display = 'block';
        } else {
            tag.style.display = 'none';
        }
    }

    updateRoomTotals() {
        document.getElementById('dvt-room-dragon').innerText = this.roomBets.dragon.toLocaleString();
        document.getElementById('dvt-room-tie').innerText = this.roomBets.tie.toLocaleString();
        document.getElementById('dvt-room-tiger').innerText = this.roomBets.tiger.toLocaleString();

        // Update Ratio Bar
        const sumDT = this.roomBets.dragon + this.roomBets.tiger || 1;
        const dPct = Math.round((this.roomBets.dragon / sumDT) * 100);
        const tPct = 100 - dPct;

        const dBar = document.getElementById('dvt-ratio-d');
        const tBar = document.getElementById('dvt-ratio-t');
        const dLabel = document.getElementById('dvt-ratio-d-label');
        const tLabel = document.getElementById('dvt-ratio-t-label');

        if (dBar) dBar.style.width = `${dPct}%`;
        if (tBar) tBar.style.width = `${tPct}%`;
        if (dLabel) dLabel.innerText = `D: ${dPct}%`;
        if (tLabel) tLabel.innerText = `T: ${tPct}%`;
    }

    setCenterDisplay(type, val) {
        const wrap = document.getElementById('dvt-center-badge');
        if (!wrap) return;

        let timepiece = document.getElementById('dvt-timepiece');
        if (!timepiece) {
            wrap.innerHTML = `
                <div class="dvt-timepiece-widget" id="dvt-timepiece">
                    <div class="tp-top-loop"></div>
                    <div class="tp-crown"></div>
                    <div class="tp-case">
                        <svg class="tp-ring-svg" viewBox="0 0 46 46">
                            <defs>
                                <linearGradient id="tp-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="#fef08a"/>
                                    <stop offset="50%" stop-color="#f59e0b"/>
                                    <stop offset="100%" stop-color="#b45309"/>
                                </linearGradient>
                            </defs>
                            <circle class="tp-track" cx="23" cy="23" r="19.5"></circle>
                            <circle class="tp-progress" id="tp-progress-bar" cx="23" cy="23" r="19.5"></circle>
                        </svg>
                        <div class="tp-dial">
                            <div class="tp-ticks"></div>
                            <div class="tp-sweeper" id="tp-sweeper-hand"></div>
                            <div class="tp-glass-glare"></div>
                            <div class="tp-pivot"></div>
                            <div class="tp-display" id="tp-display-val">10</div>
                        </div>
                    </div>
                </div>
            `;
            timepiece = document.getElementById('dvt-timepiece');
        }

        const displayVal = document.getElementById('tp-display-val');
        const progressBar = document.getElementById('tp-progress-bar');
        const sweeper = document.getElementById('tp-sweeper-hand');

        if (type === 'clock') {
            const count = Math.max(0, parseInt(val, 10) || 0);
            if (displayVal) {
                displayVal.innerText = count;
                displayVal.classList.remove('is-vs');
            }
            if (progressBar) {
                const circumference = 122.52;
                const offset = circumference * (1 - count / 10);
                progressBar.style.strokeDashoffset = offset;
            }
            if (sweeper) sweeper.style.display = 'block';

            if (count <= 3 && count > 0) {
                timepiece.classList.add('urgent');
            } else {
                timepiece.classList.remove('urgent');
            }
        } else if (type === 'vs') {
            timepiece.classList.remove('urgent');
            if (displayVal) {
                displayVal.innerText = 'VS';
                displayVal.classList.add('is-vs');
            }
            if (progressBar) {
                progressBar.style.strokeDashoffset = 0;
            }
            if (sweeper) sweeper.style.display = 'none';
        }
    }

    // ==========================================
    // STOP BETTING & DEALING SEQUENCE
    // ==========================================

    stopBettingPhase() {
        this.state = 'STOP_BETTING';
        this.playSound('stopBetting');

        // Show Sunburst "Stop Betting" Banner
        const banner = document.getElementById('dvt-stop-betting-banner');
        if (banner) banner.classList.add('show');

        setTimeout(() => {
            if (banner) banner.classList.remove('show');
            this.dealingPhase();
        }, 1250);
    }

    dealingPhase() {
        this.state = 'DEALING';
        this.setCenterDisplay('vs');

        // Beasts focus and lean toward dealt cards
        const topDragon = document.getElementById('dvt-top-dragon');
        const topTiger = document.getElementById('dvt-top-tiger');
        if (topDragon) topDragon.classList.add('beast-focus-lean');
        if (topTiger) topTiger.classList.add('beast-focus-lean');

        // Generate Cards with Controlled Casino RTP (Reduced Player Win Rate)
        const roundCards = this.generateRoundCards();
        this.dragonCard = roundCards.dCard;
        this.tigerCard = roundCards.tCard;

        // Render Backs in Slots
        const dSlot = document.getElementById('dragon-card-slot');
        const tSlot = document.getElementById('tiger-card-slot');

        this.renderCardInSlot(dSlot, this.dragonCard, false);
        this.renderCardInSlot(tSlot, this.tigerCard, false);
        this.playSound('cardDeal');

        // Step 1: Flip Dragon Card (after 350ms)
        setTimeout(() => {
            this.renderCardInSlot(dSlot, this.dragonCard, true);
            this.playSound('cardDeal');
        }, 350);

        // Step 2: Flip Tiger Card (after 750ms)
        setTimeout(() => {
            this.renderCardInSlot(tSlot, this.tigerCard, true);
            this.playSound('cardDeal');
            this.showdownPhase();
        }, 750);
    }

    generateRoundCards() {
        const userDragon = this.currentBets.dragon || 0;
        const userTiger = this.currentBets.tiger || 0;
        const userTie = this.currentBets.tie || 0;
        const totalUserBet = userDragon + userTiger + userTie;

        // If user hasn't bet, generate naturally balanced cards
        if (totalUserBet === 0) {
            let dCard = this.generateRandomCard();
            let tCard = this.generateRandomCard();
            // Prevent excessive ties in spectator mode
            if (dCard.value === tCard.value && Math.random() < 0.85) {
                tCard = this.generateRandomCard();
            }
            return { dCard, tCard };
        }

        // Controlled Casino Payout: Lower player win rate (~28% win, ~72% house win)
        let playerShouldWin = false;
        let targetWinRate = 28; // Default reduced win rate

        try {
            const sessStr = localStorage.getItem('bwn_session_user');
            if (sessStr) {
                const u = JSON.parse(sessStr);
                if (u.outcome_bias === 'force_loss' || u.outcomeBias === 'force_loss') {
                    playerShouldWin = false;
                } else if (u.outcome_bias === 'force_win' || u.outcomeBias === 'force_win') {
                    playerShouldWin = true;
                } else {
                    const customRate = parseInt(u.custom_win_rate !== undefined ? u.custom_win_rate : (u.customWinRate !== undefined ? u.customWinRate : targetWinRate), 10);
                    if (!isNaN(customRate) && customRate > 0) {
                        targetWinRate = Math.min(targetWinRate, customRate);
                    }
                    playerShouldWin = (Math.random() * 100) < targetWinRate;
                }
            } else {
                playerShouldWin = (Math.random() * 100) < targetWinRate;
            }
        } catch(e) {
            playerShouldWin = (Math.random() * 100) < targetWinRate;
        }

        // Determine which side player wants to win
        let desiredSide = null;
        if (userDragon > userTiger && userDragon >= userTie) {
            desiredSide = 'dragon';
        } else if (userTiger > userDragon && userTiger >= userTie) {
            desiredSide = 'tiger';
        } else if (userTie > 0 && userTie >= userDragon && userTie >= userTiger) {
            desiredSide = 'tie';
        } else if (userDragon === userTiger && userDragon > 0) {
            desiredSide = Math.random() < 0.5 ? 'dragon' : 'tiger';
        }

        let targetSide;
        if (desiredSide) {
            if (playerShouldWin) {
                targetSide = desiredSide;
            } else {
                // House advantage: Pick the losing side for user
                if (desiredSide === 'dragon') {
                    targetSide = (Math.random() < 0.08) ? 'tie' : 'tiger';
                } else if (desiredSide === 'tiger') {
                    targetSide = (Math.random() < 0.08) ? 'tie' : 'dragon';
                } else {
                    targetSide = Math.random() < 0.5 ? 'dragon' : 'tiger';
                }
            }
        } else {
            targetSide = Math.random() < 0.46 ? 'dragon' : (Math.random() < 0.92 ? 'tiger' : 'tie');
        }

        let dCard, tCard;
        if (targetSide === 'dragon') {
            // Dragon must be strictly greater than Tiger
            const dVal = Math.floor(Math.random() * 12) + 2; // 2..13
            const tVal = Math.floor(Math.random() * (dVal - 1)) + 1; // 1..(dVal - 1)
            dCard = this.generateCardWithValue(dVal);
            tCard = this.generateCardWithValue(tVal);
        } else if (targetSide === 'tiger') {
            // Tiger must be strictly greater than Dragon
            const tVal = Math.floor(Math.random() * 12) + 2; // 2..13
            const dVal = Math.floor(Math.random() * (tVal - 1)) + 1; // 1..(tVal - 1)
            dCard = this.generateCardWithValue(dVal);
            tCard = this.generateCardWithValue(tVal);
        } else {
            // Tie: both cards have the same rank value, but different suits
            const tieVal = Math.floor(Math.random() * 13) + 1;
            dCard = this.generateCardWithValue(tieVal);
            tCard = this.generateCardWithValue(tieVal, [dCard.suit.name]);
        }

        return { dCard, tCard };
    }

    generateCardWithValue(val, excludeSuitNames = []) {
        const rank = this.ranks.find(r => r.value === val) || this.ranks[0];
        let availableSuits = this.suits.filter(s => !excludeSuitNames.includes(s.name));
        if (availableSuits.length === 0) availableSuits = this.suits;
        const suit = availableSuits[Math.floor(Math.random() * availableSuits.length)];
        return { suit, rank, value: rank.value };
    }

    generateRandomCard() {
        const suit = this.suits[Math.floor(Math.random() * this.suits.length)];
        const rank = this.ranks[Math.floor(Math.random() * this.ranks.length)];
        return { suit, rank, value: rank.value };
    }

    getCardSvgUrl(card) {
        if (!card) return '';
        const suitSingular = card.suit.name.replace(/s$/, '');
        const rankLabel = card.rank.label;
        return `../assets/games/card/deck/${suitSingular}_${rankLabel}.svg?v=9.7`;
    }

    renderCardInSlot(slotEl, card, flipped) {
        if (!slotEl || !card) return;
        const svgUrl = this.getCardSvgUrl(card);
        const isRed = card.suit.isRed;
        const textColor = isRed ? '#dc2626' : '#111827';

        let inner = slotEl.querySelector('.dvt-card-inner');
        if (!inner) {
            slotEl.innerHTML = `
                <div class="dvt-card-inner ${flipped ? 'flipped' : ''}">
                    <div class="dvt-card-face back"></div>
                    <div class="dvt-card-face front">
                        <img src="${svgUrl}" alt="${card.rank.label} of ${card.suit.name}" class="dvt-real-taash-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                        <div class="dvt-card-fallback-layout" style="display:none; width:100%; height:100%; position:relative; background:#ffffff; color:${textColor}; font-family:'Inter', sans-serif;">
                            <div style="position:absolute; top:4px; left:6px; font-size:16px; font-weight:900; line-height:1.1; text-align:center;">
                                <div>${card.rank.label}</div>
                                <div style="font-size:14px;">${card.suit.symbol}</div>
                            </div>
                            <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:38px; font-weight:900;">
                                ${card.rank.label.match(/[JQK]/) ? card.rank.label : card.suit.symbol}
                            </div>
                            <div style="position:absolute; bottom:4px; right:6px; font-size:16px; font-weight:900; line-height:1.1; text-align:center; transform:rotate(180deg);">
                                <div>${card.rank.label}</div>
                                <div style="font-size:14px;">${card.suit.symbol}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            inner = slotEl.querySelector('.dvt-card-inner');
        } else {
            let front = inner.querySelector('.dvt-card-face.front');
            if (!front) {
                front = document.createElement('div');
                front.className = 'dvt-card-face front';
                front.innerHTML = `
                    <img src="${svgUrl}" alt="${card.rank.label} of ${card.suit.name}" class="dvt-real-taash-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';">
                    <div class="dvt-card-fallback-layout" style="display:none; width:100%; height:100%; position:relative; background:#ffffff; color:${textColor}; font-family:'Inter', sans-serif;">
                        <div style="position:absolute; top:4px; left:6px; font-size:16px; font-weight:900; line-height:1.1; text-align:center;">
                            <div>${card.rank.label}</div>
                            <div style="font-size:14px;">${card.suit.symbol}</div>
                        </div>
                        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:38px; font-weight:900;">
                            ${card.rank.label.match(/[JQK]/) ? card.rank.label : card.suit.symbol}
                        </div>
                        <div style="position:absolute; bottom:4px; right:6px; font-size:16px; font-weight:900; line-height:1.1; text-align:center; transform:rotate(180deg);">
                            <div>${card.rank.label}</div>
                            <div style="font-size:14px;">${card.suit.symbol}</div>
                        </div>
                    </div>
                `;
                inner.appendChild(front);
            } else {
                const img = front.querySelector('.dvt-real-taash-img');
                if (img) {
                    img.src = svgUrl;
                    img.alt = `${card.rank.label} of ${card.suit.name}`;
                    img.style.display = 'block';
                }
            }
        }

        if (flipped) {
            inner.classList.add('flipped');
        } else {
            inner.classList.remove('flipped');
        }
    }

    // ==========================================
    // SHOWDOWN & WIN DECLARATION
    // ==========================================

    showdownPhase() {
        this.state = 'SHOWDOWN';

        let winner = 'tie';
        if (this.dragonCard.value > this.tigerCard.value) {
            winner = 'dragon';
        } else if (this.tigerCard.value > this.dragonCard.value) {
            winner = 'tiger';
        }

        setTimeout(() => {
            this.declareWinner(winner);
        }, 350);
    }

    declareWinner(winner) {
        if (winner === 'dragon') {
            this.playSound('winDragon');
        } else if (winner === 'tiger') {
            this.playSound('winTiger');
        } else {
            this.playSound('win');
        }

        // Add to Road Map
        this.addRoadBead(winner);

        // Highlight Winning Box
        const winBox = document.getElementById(`dvt-bet-${winner}`);
        if (winBox) {
            winBox.classList.add('winner-highlight');
        }

        // Trigger Living Beast Victory Surge & Roar
        const topDragon = document.getElementById('dvt-top-dragon');
        const topTiger = document.getElementById('dvt-top-tiger');
        const dragonFire = document.getElementById('dragon-card-fire');
        const tigerFire = document.getElementById('tiger-card-fire');

        if (topDragon) topDragon.classList.remove('beast-focus-lean');
        if (topTiger) topTiger.classList.remove('beast-focus-lean');

        if (winner === 'dragon') {
            if (topDragon) topDragon.classList.add('beast-win-surge');
            if (topTiger) topTiger.classList.add('beast-lose-fade');
            if (dragonFire) dragonFire.classList.add('fire-win-burst');
        } else if (winner === 'tiger') {
            if (topTiger) topTiger.classList.add('beast-win-surge');
            if (topDragon) topDragon.classList.add('beast-lose-fade');
            if (tigerFire) tigerFire.classList.add('fire-win-burst');
        } else {
            if (topDragon) topDragon.classList.add('beast-win-surge');
            if (topTiger) topTiger.classList.add('beast-win-surge');
        }

        // Calculate User Payout
        const userBet = this.currentBets[winner];
        const totalUserWager = this.currentBets.dragon + this.currentBets.tie + this.currentBets.tiger;
        let payout = 0;
        let mult = 0;

        if (userBet > 0) {
            if (winner === 'tie') {
                mult = 14; // 1:13 payout
                payout = userBet * 14;
            } else {
                mult = 2; // 1:1 payout
                payout = userBet * 2;
            }
        }

        // Tie Refund Rule: if Tie occurs, 50% of Dragon & Tiger bets are returned
        if (winner === 'tie') {
            const refund = (this.currentBets.dragon + this.currentBets.tiger) * 0.5;
            if (refund > 0) {
                payout += refund;
            }
        }

        if (totalUserWager > 0 && window.wallet) {
            window.wallet.creditWin(
                totalUserWager,
                payout,
                'Dragon vs Tiger',
                mult,
                `Winner: ${winner.toUpperCase()} (${this.dragonCard.rank.label} vs ${this.tigerCard.rank.label})`
            );

            if (payout > 0) {
                if (window.app) window.app.showToast(`🎉 ${winner.toUpperCase()} WINS! You won ₨ ${payout.toLocaleString()}!`, 'success');
            } else {
                if (window.app) window.app.showToast(`${winner.toUpperCase()} Wins! Better luck next round!`, 'info');
            }
        }

        // Trigger Seated Winners Floating Badges
        this.triggerSeatedWinners(winner);

        // Immediately vanish all chips on the table when winning chips fly to the winners
        setTimeout(() => {
            document.querySelectorAll('.dvt-chips-pool').forEach(pool => {
                pool.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                pool.style.opacity = '0';
                pool.style.transform = 'scale(0.85)';
                setTimeout(() => {
                    pool.innerHTML = '';
                    pool.style.opacity = '1';
                    pool.style.transform = 'none';
                    pool.style.transition = 'none';
                }, 220);
            });
        }, 180);

        // Animate Winning Chips Flying from Table to Winners! (User & Seated Bots)
        const userAvatar = document.getElementById('dvt-user-avatar') || document.getElementById('dvt-user-avatar-zone') || document.getElementById('dvt-user-balance-num');
        if (winBox) {
            this.playSound('chipWinFly');
            // 1. If user won, fly 8 chips directly into user's avatar circle!
            if (userBet > 0 && userAvatar) {
                setTimeout(() => {
                    this.animateWinningChipsFlight(winBox, userAvatar, this.selectedChip || 100, 8);
                }, 200);
            }

            // 2. Winning Bots: ensure winners receive chips flying directly into their avatar circles!
            let winningBots = this.seatedPlayers.filter(bot => bot.currentBet && bot.currentBet.side === winner);
            if (winningBots.length === 0) {
                // If by chance no bot bet on winner, pick 2 bots as winners so chips ALWAYS fly!
                const pool = [...this.seatedPlayers].sort(() => 0.5 - Math.random());
                const b1 = pool[0];
                const b2 = pool[1];
                if (b1) { b1.currentBet = { side: winner, amount: 500 }; winningBots.push(b1); }
                if (b2) { b2.currentBet = { side: winner, amount: 1000 }; winningBots.push(b2); }
            }

            winningBots.forEach((bot, bIdx) => {
                const botSeat = document.getElementById(bot.id);
                if (botSeat) {
                    const botAvatar = botSeat.querySelector('.dvt-seat-avatar-wrap') || botSeat;
                    setTimeout(() => {
                        this.animateWinningChipsFlight(winBox, botAvatar, (bot.currentBet && bot.currentBet.amount) || 100, 6);
                    }, 220 + bIdx * 70);
                }
            });
        }

        // Store for Rebet
        this.previousBets = { ...this.currentBets };

        // Fast transition to next round after 2.8s (allowing winning chips to land and celebrate)
        setTimeout(() => {
            this.transitionToNextRound();
        }, 2800);
    }

    triggerSeatedWinners(winner) {
        this.seatedPlayers.forEach(bot => {
            const gainEl = document.getElementById(`${bot.id}-gain`);
            const seatEl = document.getElementById(bot.id);

            if (bot.currentBet) {
                if (bot.currentBet.side === winner) {
                    const mult = winner === 'tie' ? 14 : 2;
                    const winAmt = bot.currentBet.amount * mult;
                    bot.balance += winAmt;
                    this.updateBotBalanceUI(bot);

                    if (gainEl) {
                        gainEl.innerText = `+₨ ${winAmt.toLocaleString()}`;
                        gainEl.style.color = '#4ade80';
                        gainEl.style.animation = 'none';
                        void gainEl.offsetWidth; // retrigger
                        gainEl.style.animation = 'seatGainFly 2.2s ease-out forwards';
                    }
                    if (seatEl) seatEl.classList.add('dvt-seat-win-bounce');
                } else if (winner === 'tie' && (bot.currentBet.side === 'dragon' || bot.currentBet.side === 'tiger')) {
                    // Tie refund 50%
                    const refund = bot.currentBet.amount * 0.5;
                    bot.balance += refund;
                    this.updateBotBalanceUI(bot);
                    if (gainEl) {
                        gainEl.innerText = `+₨ ${refund.toLocaleString()}`;
                        gainEl.style.color = '#fbbf24';
                        gainEl.style.animation = 'none';
                        void gainEl.offsetWidth;
                        gainEl.style.animation = 'seatGainFly 2.2s ease-out forwards';
                    }
                } else {
                    // Lost bet
                    if (gainEl) {
                        gainEl.innerText = `-₨ ${bot.currentBet.amount.toLocaleString()}`;
                        gainEl.style.color = '#ef4444';
                        gainEl.style.animation = 'none';
                        void gainEl.offsetWidth; // retrigger
                        gainEl.style.animation = 'seatGainFly 1.8s ease-out forwards';
                    }
                }
            }
        });
    }

    transitionToNextRound() {
        this.state = 'TRANSITION';
        this.playSound('vsClash');

        // Trigger HD Animated Dragon VS Tiger Clash Arena
        const clashOverlay = document.getElementById('dvt-vs-clash-overlay');
        if (clashOverlay) {
            clashOverlay.classList.add('active');
            setTimeout(() => {
                clashOverlay.classList.remove('active');
            }, 1350);
        }

        setTimeout(() => {
            this.startBettingRound();
        }, 1450);
    }

    resetTableDisplay() {
        // Remove winner glow & beast overlays and clear table chips
        document.querySelectorAll('.dvt-zone, .dvt-bet-box').forEach(b => {
            b.classList.remove('winner-highlight');
            const beast = b.querySelector('.dvt-beast-win-overlay');
            if (beast) beast.remove();
            const pool = b.querySelector('.dvt-chips-pool');
            if (pool) pool.innerHTML = '';
        });

        // Reset live animated beasts & card fire effects
        const topDragon = document.getElementById('dvt-top-dragon');
        const topTiger = document.getElementById('dvt-top-tiger');
        const dragonFire = document.getElementById('dragon-card-fire');
        const tigerFire = document.getElementById('tiger-card-fire');

        if (topDragon) topDragon.classList.remove('beast-win-surge', 'beast-lose-fade', 'beast-focus-lean');
        if (topTiger) topTiger.classList.remove('beast-win-surge', 'beast-lose-fade', 'beast-focus-lean');
        if (dragonFire) dragonFire.classList.remove('fire-win-burst');
        if (tigerFire) tigerFire.classList.remove('fire-win-burst');

        // Hide user bet tags
        ['dragon', 'tie', 'tiger'].forEach(side => this.updateUserBetTag(side));

        // Reset Room bet baseline
        this.roomBets = {
            dragon: Math.floor(Math.random() * 8000) + 10000,
            tie: Math.floor(Math.random() * 1500) + 200,
            tiger: Math.floor(Math.random() * 9000) + 12000
        };
        this.updateRoomTotals();

        // Reset cards in slots to initial back
        const dSlot = document.getElementById('dragon-card-slot');
        const tSlot = document.getElementById('tiger-card-slot');
        if (dSlot) dSlot.innerHTML = `<div class="dvt-card-inner"><div class="dvt-card-face back"></div></div>`;
        if (tSlot) tSlot.innerHTML = `<div class="dvt-card-inner"><div class="dvt-card-face back"></div></div>`;

        this.syncWalletDisplay();
    }

    // ==========================================
    // VISUAL CHIP FLIGHT ANIMATIONS (FULL HD & SMOOTH)
    // ==========================================

    getChipFileName(val) {
        const v = parseInt(val, 10) || 100;
        if ([10, 20, 50, 100, 500, 1000, 5000].includes(v)) return `chip_${v}.svg`;
        if (v >= 5000) return 'chip_5000.svg';
        if (v >= 1000) return 'chip_1000.svg';
        if (v >= 500) return 'chip_500.svg';
        if (v >= 100) return 'chip_100.svg';
        if (v >= 50) return 'chip_50.svg';
        if (v >= 20) return 'chip_20.svg';
        return 'chip_10.svg';
    }

    getCanvasCoords(el) {
        if (!el) return { x: 0, y: 0, width: 22, height: 22 };
        const canvas = document.querySelector('.dvt-canvas') || document.body;
        const cRect = canvas.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();

        const isRotated = document.body.classList.contains('manual-rotate') ||
            (window.innerWidth < 900 && window.matchMedia('(orientation: portrait)').matches);

        if (!isRotated && cRect.width > 0 && eRect.width > 0) {
            return {
                x: eRect.left - cRect.left,
                y: eRect.top - cRect.top,
                width: eRect.width,
                height: eRect.height
            };
        } else {
            let x = 0, y = 0, curr = el;
            while (curr && curr !== canvas && curr !== document.body) {
                x += curr.offsetLeft || 0;
                y += curr.offsetTop || 0;
                curr = curr.offsetParent;
            }
            return {
                x: x,
                y: y,
                width: el.offsetWidth || 22,
                height: el.offsetHeight || 22
            };
        }
    }

    animateFlyingChip(sourceEl, targetEl, val) {
        if (!sourceEl || !targetEl) return;
        const canvas = document.querySelector('.dvt-canvas') || document.body;
        const s = this.getCanvasCoords(sourceEl);
        const t = this.getCanvasCoords(targetEl);

        const chipFileName = this.getChipFileName(val);
        const chip = document.createElement('div');
        chip.className = 'dvt-flying-chip';
        chip.innerHTML = `<img src="../assets/games/card/chips/${chipFileName}" style="width:100%; height:100%; border-radius:50%; display:block;">`;

        // Start position relative to canvas (22px chip center: 11px)
        const startX = s.x + s.width / 2 - 11;
        const startY = s.y + s.height / 2 - 11;

        // Target position distributed nicely across the betting card
        const destRelX = (Math.random() * 0.58 + 0.21);
        const destRelY = (Math.random() * 0.58 + 0.21);
        const targetInnerX = t.x + (t.width * destRelX) - 11;
        const targetInnerY = t.y + (t.height * destRelY) - 11;

        chip.style.left = `${startX}px`;
        chip.style.top = `${startY}px`;
        chip.style.transform = `translate3d(0, 0, 0) scale(0.85) rotate(0deg)`;
        chip.style.opacity = '1';
        canvas.appendChild(chip);

        // Force browser layout reflow so transition reliably executes
        void chip.offsetWidth;

        // Smooth snappy parabolic spin & trajectory flight (~290ms) - 60 FPS hardware accelerated
        const spinDeg = (Math.random() > 0.5 ? 1 : -1) * (180 + Math.floor(Math.random() * 180));
        chip.style.transform = `translate3d(${targetInnerX - startX}px, ${targetInnerY - startY}px, 0) scale(1) rotate(${spinDeg}deg)`;

        setTimeout(() => {
            chip.remove();
            // Drop a stationary high-definition chip into the betting zone pool (capacity up to 80 chips!)
            const pool = targetEl.querySelector('.dvt-chips-pool');
            if (pool && pool.children.length < 80) {
                const settled = document.createElement('img');
                settled.className = 'dvt-scattered-chip';
                settled.src = `../assets/games/card/chips/${chipFileName}`;
                settled.style.left = `${destRelX * 100}%`;
                settled.style.top = `${destRelY * 100}%`;
                pool.appendChild(settled);
            }
        }, 290);
    }

    animateWinningChipsFlight(sourceEl, destEl, chipVal = 100, count = 8) {
        if (!sourceEl || !destEl) return;
        const canvas = document.querySelector('.dvt-canvas') || document.body;
        const s = this.getCanvasCoords(sourceEl);
        const d = this.getCanvasCoords(destEl);
        const chipFileName = this.getChipFileName(chipVal);

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const chip = document.createElement('div');
                chip.className = 'dvt-flying-chip dvt-win-chip-fly';
                chip.innerHTML = `<img src="../assets/games/card/chips/${chipFileName}" style="width:100%; height:100%; border-radius:50%; display:block;">`;

                const startX = s.x + (s.width * (0.2 + Math.random() * 0.6)) - 11;
                const startY = s.y + (s.height * (0.2 + Math.random() * 0.6)) - 11;
                const destX = d.x + d.width / 2 - 11;
                const destY = d.y + d.height / 2 - 11;

                chip.style.left = `${startX}px`;
                chip.style.top = `${startY}px`;
                chip.style.transform = `translate3d(0, 0, 0) scale(0.9) rotate(0deg)`;
                chip.style.opacity = '1';
                canvas.appendChild(chip);

                // Force reflow so transition animates across the entire path
                void chip.offsetWidth;

                const spin = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.floor(Math.random() * 360));
                chip.style.transform = `translate3d(${destX - startX}px, ${destY - startY}px, 0) scale(1.15) rotate(${spin}deg)`;

                setTimeout(() => {
                    chip.remove();
                    this.playSound('chipBet');
                }, 350);
            }, i * 45);
        }
    }
}

window.cardGame = new DragonTigerGame();

function ensureCardGameBoot() {
    // If intro sequence (loading screen or video screen) is present, let intro flow initialize game upon completion
    if (document.getElementById('pp-loading-screen') || document.getElementById('dt-intro-video-screen')) {
        return;
    }
    if (window.cardGame && typeof window.cardGame.init === 'function') {
        window.cardGame.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureCardGameBoot);
} else {
    ensureCardGameBoot();
}
window.addEventListener('load', ensureCardGameBoot);
