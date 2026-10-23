// ============================================================
// Royal Derby Championship - Master Racing Engine
// Real Racetrack Ground, Real Photorealistic Animated Galloping Horses,
// Turf Clod Particles, Web Audio Fanfare & Hoofbeats, and Wallet Sync
// ============================================================

class DerbyRacingGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.dpr = 1;
        this.width = 0;
        this.height = 0;

        // Game State: 'BETTING', 'RACING', 'RESULTS'
        this.state = 'BETTING';
        this.raceStartTime = 0;
        this.raceDuration = 10500; // 10.5 seconds of thrilling sprint
        this.animFrameId = null;

        // Image Assets
        this.trackBgImg = new Image();
        this.trackBgImg.src = '../assets/games/derby/derby_track_bg.jpg';

        this.horseImg1 = new Image();
        this.horseImg1.src = '../assets/games/derby/horse_frame1.png';

        this.horseImg2 = new Image();
        this.horseImg2.src = '../assets/games/derby/horse_frame2.png';

        this.imagesLoaded = false;
        this.preloadAssets();

        // Horses Definition (Royal Ascot & Dubai World Cup Thoroughbreds)
        this.horses = [
            { id: 1, name: 'Red Thunder', odds: 2.40, color: '#e74c3c', hueFilter: 'hue-rotate(0deg)', form: '1-1-2', stars: 5, jockey: 'R. Moore' },
            { id: 2, name: 'Golden Stallion', odds: 3.50, color: '#f1c40f', hueFilter: 'sepia(1) saturate(5) hue-rotate(5deg)', form: '2-1-1', stars: 5, jockey: 'F. Dettori' },
            { id: 3, name: 'Emerald King', odds: 5.00, color: '#2ecc71', hueFilter: 'hue-rotate(90deg)', form: '3-2-1', stars: 4, jockey: 'W. Buick' },
            { id: 4, name: 'Royal Pegasus', odds: 7.50, color: '#3498db', hueFilter: 'hue-rotate(190deg)', form: '1-4-2', stars: 4, jockey: 'C. Soumillon' },
            { id: 5, name: 'Shadow Phantom', odds: 12.00, color: '#9b59b6', hueFilter: 'hue-rotate(270deg)', form: '4-3-2', stars: 3, jockey: 'J. Spencer' },
            { id: 6, name: 'Diamond Comet', odds: 25.00, color: '#00e5ff', hueFilter: 'hue-rotate(160deg) brightness(1.2)', form: '5-2-6', stars: 3, jockey: 'O. Murphy' }
        ];

        // Selected Bet
        this.selectedHorseId = 1;
        this.betAmount = 100;

        // Dynamic Race Track Variables
        this.runners = [];
        this.dirtParticles = [];
        this.flashAlpha = 0;
        this.winner = null;

        // Sound System
        this.isMuted = false;
        this.audioCtx = null;
        this.gallopTimer = null;
        this.gallopAudio = null;

        // History
        this.history = [
            { id: 1, name: 'Red Thunder', odds: 2.40 },
            { id: 2, name: 'Golden Stallion', odds: 3.50 },
            { id: 1, name: 'Red Thunder', odds: 2.40 },
            { id: 4, name: 'Royal Pegasus', odds: 7.50 },
            { id: 3, name: 'Emerald King', odds: 5.00 }
        ];
    }

    preloadAssets() {
        let count = 0;
        const total = 3;
        const onLoad = () => {
            count++;
            if (count >= total) {
                this.imagesLoaded = true;
            }
        };
        this.trackBgImg.onload = onLoad;
        this.horseImg1.onload = onLoad;
        this.horseImg2.onload = onLoad;
    }

    init() {
        this.canvas = document.getElementById('derby-canvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
        }

        this.initAudio();
        this.initRunners();
        this.renderHorseBetCards();
        this.renderHistory();
        this.syncWallet();
        this.startLoop();
    }

    /* -------------------------------------------------------------
       AUDIO CONTROLLER & GALLOPING SOUND ENGINE
       Strict Enforcement:
       1. Zero Background Music (killAllBGM completely stops any BGM)
       2. Real Galloping Hoofbeats Audio (Loud, stereo thoroughbred sprint)
       ------------------------------------------------------------- */
    initAudio() {
        try {
            this.isMuted = localStorage.getItem('bwn_sound_muted') === '1';
        } catch (e) {
            this.isMuted = false;
        }
        this.updateSoundIcon();

        // 1. Completely disable / suppress any background music
        this.killAllBGM();

        // 2. Initialize realistic thoroughbred galloping audio track
        try {
            this.gallopAudio = new Audio('../assets/audio/derby_gallop.wav');
            this.gallopAudio.loop = true;
            this.gallopAudio.volume = 1.0;
            this.gallopAudio.preload = 'auto';
        } catch (e) {}

        const unlock = () => {
            this.killAllBGM();
            if (!this.audioCtx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.audioCtx = new AudioCtx();
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            // Prime galloping audio silently for instant responsive start
            if (this.gallopAudio) {
                this.gallopAudio.play().then(() => {
                    if (this.state !== 'RACING') {
                        this.gallopAudio.pause();
                        this.gallopAudio.currentTime = 0;
                    }
                }).catch(() => {});
            }
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('pointerdown', unlock, { passive: true });
        document.addEventListener('touchstart', unlock, { passive: true });
    }

    killAllBGM() {
        const suppress = (obj) => {
            if (!obj) return;
            try {
                if (typeof obj.stopBGM === 'function') obj.stopBGM();
                if (typeof obj.stopCasinoThemeBGM === 'function') obj.stopCasinoThemeBGM();
                if (typeof obj.stopAviatorBGM === 'function') obj.stopAviatorBGM();
                if (typeof obj.stopAviatorLoadingMusic === 'function') obj.stopAviatorLoadingMusic();
                if (typeof obj.stopLoadingMusic === 'function') obj.stopLoadingMusic();
                if (obj.casinoThemeAudio) {
                    obj.casinoThemeAudio.pause();
                    obj.casinoThemeAudio.currentTime = 0;
                }
                if (obj.aviatorBgmAudio) {
                    obj.aviatorBgmAudio.pause();
                    obj.aviatorBgmAudio.currentTime = 0;
                    obj.aviatorBgmAudio.src = '';
                }
                obj.startBGM = () => {};
                obj.startCasinoThemeBGM = () => {};
                obj.startAviatorBGM = () => {};
                obj.startAviatorLoadingMusic = () => {};
                obj.startLoadingMusic = () => {};
                obj.startGenreBGM = () => {};
            } catch (e) {}
        };

        suppress(window.sound);
        suppress(window.soundManager);

        try {
            document.querySelectorAll('audio').forEach(a => {
                if (a && a.src && !a.src.includes('derby_gallop') && !a.src.includes('victory_fanfare')) {
                    a.pause();
                    a.currentTime = 0;
                }
            });
        } catch (e) {}
    }

    toggleSound() {
        this.isMuted = !this.isMuted;
        try {
            localStorage.setItem('bwn_sound_muted', this.isMuted ? '1' : '0');
        } catch (e) {}
        this.updateSoundIcon();

        if (this.isMuted) {
            if (this.gallopAudio) this.gallopAudio.pause();
        } else if (this.state === 'RACING') {
            if (this.gallopAudio) this.gallopAudio.play().catch(() => {});
        }
    }

    updateSoundIcon() {
        const btn = document.getElementById('derby-sound-toggle');
        if (btn) {
            btn.innerHTML = this.isMuted ? '🔇' : '🔊';
            btn.style.color = this.isMuted ? '#ff5252' : '#ffd700';
        }
    }

    playGateBell() {
        if (this.isMuted || !this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        [1760, 2489].forEach(freq => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 1.2);
        });
    }

    startGallopAudio() {
        if (this.isMuted) return;

        // 1. Play realistic stereo galloping WAV loop
        if (this.gallopAudio) {
            try {
                this.gallopAudio.currentTime = 0;
                this.gallopAudio.volume = 1.0;
                const p = this.gallopAudio.play();
                if (p && typeof p.catch === 'function') {
                    p.catch(() => {});
                }
            } catch (e) {}
        }

        // 2. High-impact Web Audio synthesis layer (guarantees loud, clear, punchy hoofbeats)
        if (!this.audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        if (this.gallopTimer) clearInterval(this.gallopTimer);

        let beat = 0;
        this.gallopTimer = setInterval(() => {
            if (this.state !== 'RACING') {
                clearInterval(this.gallopTimer);
                return;
            }
            if (!this.isMuted) {
                this.playAcousticHoofGallop(beat);
            }
            beat++;
        }, 110);
    }

    playAcousticHoofGallop(beat) {
        if (!this.audioCtx || this.isMuted) return;
        const ctx = this.audioCtx;
        const now = ctx.currentTime;
        const isLeading = (beat % 2 === 0);

        // A. Heavy Turf Sub Thump (65Hz - 110Hz deep punch)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const oscFilter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        const startPitch = isLeading ? 110 : 85;
        osc.frequency.setValueAtTime(startPitch, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.07);

        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(320, now);

        oscGain.gain.setValueAtTime(0.65, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);

        // B. Crisp Resonant Horseshoe Clop (550Hz - 750Hz metallic / turf contact snap)
        const clopOsc = ctx.createOscillator();
        const clopGain = ctx.createGain();
        const clopFilter = ctx.createBiquadFilter();

        clopOsc.type = 'sine';
        const clopFreq = isLeading ? 640 : 540;
        clopOsc.frequency.setValueAtTime(clopFreq, now);
        clopOsc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

        clopFilter.type = 'bandpass';
        clopFilter.frequency.setValueAtTime(clopFreq, now);
        clopFilter.Q.setValueAtTime(3.5, now);

        clopGain.gain.setValueAtTime(0.55, now);
        clopGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        clopOsc.connect(clopFilter);
        clopFilter.connect(clopGain);
        clopGain.connect(ctx.destination);

        clopOsc.start(now);
        clopOsc.stop(now + 0.06);
    }

    stopGallopAudio() {
        if (this.gallopAudio) {
            try {
                this.gallopAudio.pause();
                this.gallopAudio.currentTime = 0;
            } catch (e) {}
        }
        if (this.gallopTimer) {
            clearInterval(this.gallopTimer);
            this.gallopTimer = null;
        }
    }

    playWinFanfare() {
        if (this.isMuted) return;
        try {
            const snd = new Audio('../assets/audio/victory_fanfare.wav');
            snd.volume = 0.85;
            snd.play().catch(() => {});
        } catch (e) {}
    }

    /* -------------------------------------------------------------
       WALLET SYNC
       ------------------------------------------------------------- */
    syncWallet() {
        this.updateWalletUI();
        if (window.wallet && typeof window.wallet.on === 'function') {
            window.wallet.on('change', () => this.updateWalletUI());
            window.wallet.on('balanceChange', () => this.updateWalletUI());
        }
    }

    updateWalletUI() {
        const el = document.getElementById('derby-wallet-balance');
        if (!el) return;
        let bal = 0;
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            bal = window.wallet.getBalance('PKR');
        }
        el.innerText = bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    /* -------------------------------------------------------------
       CANVAS SIZING
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

    /* -------------------------------------------------------------
       RUNNERS SETUP
       ------------------------------------------------------------- */
    initRunners() {
        this.runners = this.horses.map((h, i) => ({
            ...h,
            lane: i,
            progress: 0,
            baseSpeed: 0,
            animFrame: 0,
            animCounter: i * 2,
            x: 0,
            y: 0
        }));
    }

    renderHorseBetCards() {
        const container = document.getElementById('derby-horses-list');
        if (!container) return;
        container.innerHTML = '';

        this.horses.forEach(h => {
            const card = document.createElement('div');
            card.className = 'derby-horse-card ' + (h.id === this.selectedHorseId ? 'selected' : '');
            card.id = `horse-card-${h.id}`;
            card.onclick = () => this.selectHorse(h.id);

            card.innerHTML = `
                <div class="card-lane-badge" style="background:${h.color};">#${h.id}</div>
                <div class="card-info-col">
                    <div class="card-horse-name">${h.name}</div>
                    <div class="card-meta">
                        <span class="card-jockey">${h.jockey}</span>
                        <span class="card-stars">${'★'.repeat(h.stars)}</span>
                    </div>
                </div>
                <div class="card-odds-pill">${h.odds.toFixed(2)}x</div>
            `;
            container.appendChild(card);
        });
    }

    selectHorse(id) {
        if (this.state === 'RACING') return;
        this.selectedHorseId = id;
        document.querySelectorAll('.derby-horse-card').forEach(c => c.classList.remove('selected'));
        const el = document.getElementById(`horse-card-${id}`);
        if (el) el.classList.add('selected');

        const horse = this.horses.find(h => h.id === id);
        this.updateHUDStatus(`Selected: #${horse.id} ${horse.name} (${horse.odds.toFixed(2)}x)`);
    }

    renderHistory() {
        const bar = document.getElementById('derby-history-bar');
        if (!bar) return;
        bar.innerHTML = '';
        this.history.forEach(item => {
            const h = this.horses.find(x => x.id === item.id) || item;
            const tag = document.createElement('span');
            tag.className = 'history-horse-pill';
            tag.style.borderLeft = `3px solid ${h.color}`;
            tag.innerHTML = `<b>#${h.id}</b> ${h.name.split(' ')[0]} <span class="pill-odds">${h.odds.toFixed(1)}x</span>`;
            bar.appendChild(tag);
        });
    }

    updateHUDStatus(txt) {
        const el = document.getElementById('derby-status-hud');
        if (el) el.innerHTML = txt;
    }

    adjustBet(action) {
        const input = document.getElementById('derby-bet-input');
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
        else if (action === '+1000') val = Math.min(bal, val + 1000);
        else if (action === 'max') val = Math.max(10, Math.floor(bal));

        input.value = Math.max(10, Math.floor(val));
    }

    /* -------------------------------------------------------------
       RACE EXECUTION
       ------------------------------------------------------------- */
    startRace() {
        if (this.state === 'RACING') return;

        const input = document.getElementById('derby-bet-input');
        const bet = parseFloat(input ? input.value : 100) || 100;

        const selectedHorse = this.horses.find(h => h.id === this.selectedHorseId);
        if (!selectedHorse) return;

        if (window.wallet && typeof window.wallet.placeBet === 'function') {
            const ok = window.wallet.placeBet(bet, `Derby #${selectedHorse.id} ${selectedHorse.name}`);
            if (!ok) {
                this.shakeBetInput();
                return;
            }
        }

        this.betAmount = bet;
        this.winner = null;
        this.dirtParticles = [];
        this.flashAlpha = 0;
        this.hideResultModal();

        // Weighted Winner Selection based on Odds
        const weights = this.horses.map(h => (1 / h.odds));
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        const rand = Math.random() * totalWeight;

        let acc = 0;
        let chosenWinnerId = 1;
        for (let i = 0; i < this.horses.length; i++) {
            acc += weights[i];
            if (rand <= acc) {
                chosenWinnerId = this.horses[i].id;
                break;
            }
        }

        this.runners.forEach(r => {
            r.progress = 0;
            r.baseSpeed = 0.088 + (Math.random() * 0.012);
            r.isPredeterminedWinner = (r.id === chosenWinnerId);
        });

        this.killAllBGM();
        this.playGateBell();

        this.state = 'RACING';
        this.raceStartTime = performance.now();
        this.startGallopAudio();

        const btn = document.getElementById('derby-action-btn');
        if (btn) {
            btn.disabled = true;
            btn.className = 'derby-start-btn running';
            btn.innerHTML = `<span>RACE IN PROGRESS...</span> <span>🏇</span>`;
        }

        this.updateHUDStatus(`🏁 THEY'RE OFF! REAL DERBY SPRINT`);
    }

    shakeBetInput() {
        const box = document.querySelector('.derby-bet-box');
        if (!box) return;
        box.style.borderColor = '#ff3366';
        box.style.boxShadow = '0 0 12px rgba(255, 51, 102, 0.6)';
        setTimeout(() => {
            box.style.borderColor = 'rgba(255, 215, 0, 0.3)';
            box.style.boxShadow = 'none';
        }, 800);
    }

    finishRace(winner) {
        this.state = 'RESULTS';
        this.winner = winner;
        this.stopGallopAudio();

        this.flashAlpha = 0.9;

        this.history.unshift({ id: winner.id, name: winner.name, odds: winner.odds });
        if (this.history.length > 8) this.history.pop();
        this.renderHistory();

        const won = (winner.id === this.selectedHorseId);
        const winPayout = parseFloat((this.betAmount * winner.odds).toFixed(2));

        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            if (won) {
                window.wallet.creditWin(this.betAmount, winPayout, `Derby #${winner.id} ${winner.name}`, winner.odds, `1st Place Win @ ${winner.odds.toFixed(2)}x`);
                this.playWinFanfare();
            } else {
                window.wallet.creditWin(this.betAmount, 0, `Derby Bet`, 0, `Placed behind winner #${winner.id}`);
            }
        }

        const btn = document.getElementById('derby-action-btn');
        if (btn) {
            btn.disabled = false;
            btn.className = 'derby-start-btn';
            btn.innerHTML = `<span>START DERBY SPRINT</span> <span>🏇</span>`;
        }

        this.showResultModal(winner, won, winPayout);
    }

    showResultModal(winner, won, winPayout) {
        const modal = document.getElementById('derby-result-overlay');
        const titleEl = document.getElementById('result-title');
        const badgeEl = document.getElementById('result-winner-badge');
        const nameEl = document.getElementById('result-winner-name');
        const payoutEl = document.getElementById('result-payout-val');

        if (modal) {
            modal.style.display = 'flex';
            if (badgeEl) {
                badgeEl.style.background = winner.color;
                badgeEl.innerText = `#${winner.id}`;
            }
            if (nameEl) nameEl.innerText = `${winner.name} (${winner.odds.toFixed(2)}x)`;

            if (won) {
                if (titleEl) {
                    titleEl.innerText = '🏆 YOU WON THE DERBY!';
                    titleEl.style.color = '#00e676';
                }
                if (payoutEl) {
                    payoutEl.innerText = `+ ₨ ${winPayout.toLocaleString()}`;
                    payoutEl.style.color = '#00e676';
                }
            } else {
                if (titleEl) {
                    titleEl.innerText = 'RACE FINISHED';
                    titleEl.style.color = '#ffd700';
                }
                if (payoutEl) {
                    payoutEl.innerText = `Winner: #${winner.id} ${winner.name}`;
                    payoutEl.style.color = '#b0c4de';
                }
            }
        }
    }

    hideResultModal() {
        const modal = document.getElementById('derby-result-overlay');
        if (modal) modal.style.display = 'none';
    }

    /* -------------------------------------------------------------
       MAIN DRAW & UPDATE PIPELINE
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
        const now = performance.now();

        if (this.state === 'RACING') {
            const elapsed = now - this.raceStartTime;
            const raceT = Math.min(1.0, elapsed / this.raceDuration);

            let anyFinished = false;
            let maxProg = -1;

            this.runners.forEach(r => {
                let currentSpeed = r.baseSpeed;
                const jitter = (Math.sin(now * 0.005 + r.lane) * 0.012) + (Math.random() * 0.006 - 0.003);

                if (r.isPredeterminedWinner && raceT > 0.60) {
                    currentSpeed += 0.024 * ((raceT - 0.60) / 0.40);
                } else if (!r.isPredeterminedWinner && raceT > 0.75) {
                    currentSpeed -= 0.010 * ((raceT - 0.75) / 0.25);
                }

                r.progress += (currentSpeed + jitter) * 0.014;

                // Alternate galloping stride frames
                r.animCounter++;
                if (r.animCounter % 6 === 0) {
                    r.animFrame = (r.animFrame === 0) ? 1 : 0;
                }

                if (r.progress > maxProg) {
                    maxProg = r.progress;
                }

                if (r.progress >= 1.0) {
                    r.progress = 1.0;
                    anyFinished = true;
                }
            });

            // Live Leaderboard HUD
            const sorted = [...this.runners].sort((a, b) => b.progress - a.progress);
            this.updateHUDStatus(`🔥 1st: #${sorted[0].id} ${sorted[0].name.split(' ')[0]} | 2nd: #${sorted[1].id} | 3rd: #${sorted[2].id}`);

            if (anyFinished) {
                const winner = sorted[0];
                this.finishRace(winner);
            }
        }

        // Camera flash fade
        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - 0.04);
        }

        // Particles update
        for (let i = this.dirtParticles.length - 1; i >= 0; i--) {
            const p = this.dirtParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            p.radius *= 0.96;
            if (p.alpha <= 0 || p.radius <= 0.2) {
                this.dirtParticles.splice(i, 1);
            }
        }
    }

    render() {
        if (!this.ctx || !this.width || !this.height) return;
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        // 1. Draw Real Photorealistic Racetrack Ground & Stadium
        this.drawRealTurfTrack(ctx, w, h);

        // 2. Draw Checkered Finish Line & Markers
        this.drawFinishLine(ctx, w, h);

        // 3. Draw Turf Dirt Clods Flying from Hooves
        this.drawDirtParticles(ctx);

        // 4. Draw Real Photorealistic Running Horses with Jockeys
        this.drawRealHorses(ctx, w, h);

        // 5. Draw Photo-Finish Camera Flash
        if (this.flashAlpha > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha.toFixed(2)})`;
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawRealTurfTrack(ctx, w, h) {
        ctx.save();

        const groundTop = 30;
        const groundHeight = h - groundTop;
        const laneH = groundHeight / 6;

        // 1. Top Grandstand Stadium & Sky Horizon (0 to 30px)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, groundTop);
        skyGrad.addColorStop(0, '#5b9bd5');
        skyGrad.addColorStop(0.6, '#87ceeb');
        skyGrad.addColorStop(1, '#cce7f5');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, groundTop);

        // Distant grandstand silhouette & cheering spectators
        ctx.fillStyle = '#2d4734';
        ctx.beginPath();
        ctx.moveTo(0, groundTop);
        for (let bx = 0; bx < w; bx += 22) {
            const bh = 12 + Math.sin(bx * 0.08) * 5;
            ctx.lineTo(bx, groundTop - bh);
            ctx.lineTo(bx + 16, groundTop - bh);
        }
        ctx.lineTo(w, groundTop);
        ctx.closePath();
        ctx.fill();

        // Cheering spectator dots on stands
        for (let sx = 10; sx < w; sx += 12) {
            ctx.fillStyle = (sx % 3 === 0) ? '#ffcc00' : (sx % 2 === 0 ? '#ffffff' : '#ff4444');
            ctx.fillRect(sx, groundTop - 10 - (sx % 3), 2.5, 2.5);
        }

        // White Running Rail Fence along top of track
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(0, groundTop);
        ctx.lineTo(w, groundTop);
        ctx.stroke();

        // Vertical fence posts
        ctx.lineWidth = 1.6;
        for (let px = 15; px < w; px += 35) {
            ctx.beginPath();
            ctx.moveTo(px, groundTop);
            ctx.lineTo(px, groundTop - 9);
            ctx.stroke();
        }

        // 2. Main Turf Ground: 6 Dedicated Running Lanes
        for (let i = 0; i < 6; i++) {
            const laneStartY = groundTop + i * laneH;
            const laneLineY = laneStartY + laneH - 2;

            // Alternating lush emerald turf grass mower stripes
            ctx.fillStyle = (i % 2 === 0) ? '#1f7a3a' : '#17652f';
            ctx.fillRect(0, laneStartY, w, laneH);

            // Grass texture noise lines
            ctx.strokeStyle = (i % 2 === 0) ? '#248f44' : '#1a7035';
            ctx.lineWidth = 1;
            for (let ty = laneStartY + 3; ty < laneStartY + laneH - 3; ty += 8) {
                ctx.beginPath();
                ctx.moveTo(0, ty);
                ctx.lineTo(w, ty);
                ctx.stroke();
            }

            // Dedicated running track line for every horse!
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(46, laneLineY);
            ctx.lineTo(w - 46, laneLineY);
            ctx.stroke();

            // Distance hash tick marks along the line
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.lineWidth = 1.2;
            for (let dx = 80; dx < w - 60; dx += 55) {
                ctx.beginPath();
                ctx.moveTo(dx, laneLineY - 3);
                ctx.lineTo(dx, laneLineY + 3);
                ctx.stroke();
            }

            // Starting Gate Stall Box on the left
            const horse = this.horses[i];
            ctx.fillStyle = '#1c281e';
            ctx.fillRect(2, laneStartY + 2, 42, laneH - 4);
            ctx.strokeStyle = '#d4af37';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(2, laneStartY + 2, 42, laneH - 4);

            // Numbered Stall Badge
            ctx.fillStyle = horse ? horse.color : '#e74c3c';
            ctx.beginPath();
            ctx.roundRect(7, laneStartY + (laneH * 0.5) - 9, 30, 18, 4);
            ctx.fill();

            ctx.font = '900 11.5px "JetBrains Mono", monospace';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, 22, laneStartY + (laneH * 0.5));
        }

        ctx.restore();
    }

    drawFinishLine(ctx, w, h) {
        ctx.save();
        const finishX = w - 46;
        const groundTop = 30;
        const groundBottom = h - 2;

        // Checkered finish line crossing all 6 horse lines
        const squareSize = 6;
        for (let y = groundTop; y < groundBottom; y += squareSize) {
            const isBlack = (Math.floor(y / squareSize) % 2 === 0);
            ctx.fillStyle = isBlack ? '#000000' : '#ffffff';
            ctx.fillRect(finishX - 3, y, 6, squareSize);
        }

        // Finish Sign Post Arch
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.font = '900 9px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(finishX + 15, (groundTop + groundBottom) * 0.5);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('FINISH LINE', 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawRealHorses(ctx, w, h) {
        const groundTop = 30;
        const groundHeight = h - groundTop;
        const laneH = groundHeight / 6;
        const startX = 48;
        const trackW = w - 104;
        const now = performance.now();

        this.runners.forEach((r, i) => {
            const laneLineY = groundTop + (i + 1) * laneH - 3;
            const currentX = startX + r.progress * trackW;
            r.x = currentX;
            r.y = laneLineY;

            // Gallop cycle calculation
            const speedFactor = (this.state === 'RACING') ? 1.0 : 0;
            const cycle = (now * 0.016 * (1 + (r.id * 0.05)) + i * 1.2) * speedFactor;
            const isGatherPhase = Math.sin(cycle) > 0;

            const bobY = (this.state === 'RACING') ? (isGatherPhase ? 0 : -3.5) : 0;
            const pitchAngle = (this.state === 'RACING') ? (isGatherPhase ? 0.04 : -0.02) : 0;

            // Spawn grass & dirt particles directly from the contact point on the lane line!
            if (this.state === 'RACING' && Math.random() < 0.45) {
                this.dirtParticles.push({
                    x: currentX - 16,
                    y: laneLineY + (Math.random() * 2),
                    vx: -(Math.random() * 3.5 + 2.2),
                    vy: -(Math.random() * 2.4 + 0.7),
                    radius: Math.random() * 2.2 + 1.2,
                    color: Math.random() > 0.45 ? '#3d2614' : '#27ae60',
                    alpha: 0.95,
                    decay: 0.06
                });
            }

            // Draw Real Running Horse planted on the lane line
            if (this.imagesLoaded && this.horseImg1.complete && this.horseImg2.complete) {
                const img = isGatherPhase ? this.horseImg2 : this.horseImg1;

                ctx.save();
                ctx.translate(currentX, laneLineY);

                // 1. Authentic Ground Shadow planted directly ON the lane line
                const shadowAlpha = isGatherPhase ? 0.60 : 0.30;
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
                ctx.beginPath();
                ctx.ellipse(0, 1, 24, 4.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // 2. Pitch and Stride bobbing
                ctx.translate(0, bobY);
                ctx.rotate(pitchAngle);

                // Scaled larger for grand view (height up to ~46px, width up to ~79px)
                const horseH = Math.min(46, Math.floor(laneH * 0.90));
                const horseW = Math.round(horseH * 1.72);

                // Anchored to hooves at bottom: hooves touch laneLineY exactly!
                ctx.drawImage(img, -horseW * 0.5, -horseH, horseW, horseH);

                // Colored Jockey Saddle Badge & Number
                const badgeW = Math.round(horseH * 0.46);
                const badgeH = Math.round(horseH * 0.38);
                const badgeY = -horseH + Math.round(horseH * 0.26);
                ctx.fillStyle = r.color;
                ctx.beginPath();
                ctx.roundRect(-badgeW * 0.5, badgeY, badgeW, badgeH, 2.5);
                ctx.fill();

                ctx.font = '900 ' + Math.max(8, Math.round(horseH * 0.28)) + 'px "JetBrains Mono", monospace';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${r.id}`, 0, badgeY + badgeH * 0.5);

                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(currentX, laneLineY);
                ctx.font = '26px sans-serif';
                ctx.fillText('🏇', -12, 0);
                ctx.restore();
            }
        });
    }

    drawDirtParticles(ctx) {
        ctx.save();
        for (let i = 0; i < this.dirtParticles.length; i++) {
            const p = this.dirtParticles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

window.derbyGame = new DerbyRacingGame();
