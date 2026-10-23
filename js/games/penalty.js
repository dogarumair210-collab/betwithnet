/**
 * Bet With Net - Penalty Shootout Pro: Heavy Realistic Stadium Park Edition
 * Featuring Dynamic Goalkeeper AI & Animations, 3D Ball Physics, Procedural Crowd Audio & Cashout
 */

class PenaltyGamePro {
    constructor() {
        this.streak = 0;
        this.betAmount = 100;
        this.isPlaying = false;
        this.multipliers = [1.92, 3.84, 7.68, 15.36, 30.72];
        this.audioCtx = null;
        this.keeperSprite = null;
        this.keeperLayer = null;
        this.ballWrapper = null;
        this.ballSprite = null;
        this.ballShadow = null;
        this.announcer = null;
        this.rootPath = window.location.pathname.includes('/games/') ? '../' : './';
    }

    init() {
        this.keeperLayer = document.getElementById('penalty-keeper-layer');
        this.keeperSprite = document.getElementById('keeper-sprite-img');
        this.ballWrapper = document.getElementById('penalty-ball-wrapper');
        this.ballSprite = document.getElementById('penalty-ball-img');
        this.ballShadow = document.getElementById('ball-ground-shadow');
        this.announcer = document.getElementById('stadium-announcer');

        this.initAudio();
        this.updateUI();
        this.setIdleState();

        // Restore last valid bet or 100
        const input = document.getElementById('penalty-bet-input');
        if (input && !input.value) input.value = '100';
    }

    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch(e) {}
    }

    _resumeAudio() {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    // Procedural Audio Effects (Stadium Crowd, Boot Kick, Whistle, Net Hit)
    playWhistleSound() {
        this._resumeAudio();
        if (!this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(2800, now);
            osc.frequency.linearRampToValueAtTime(3200, now + 0.08);
            osc.frequency.setValueAtTime(3000, now + 0.12);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch(e) {}
    }

    playKickSound() {
        this._resumeAudio();
        if (!this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } catch(e) {}
    }

    playNetGoalSound() {
        this._resumeAudio();
        if (!this.audioCtx) return;
        try {
            // Net swish + crowd roar
            const now = this.audioCtx.currentTime;
            const bufferSize = this.audioCtx.sampleRate * 1.8;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(450, now);
            filter.frequency.linearRampToValueAtTime(1400, now + 0.4);
            filter.frequency.exponentialRampToValueAtTime(250, now + 1.8);
            const gain = this.audioCtx.createGain();
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.28, now + 0.25);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);
            noise.start(now);
            noise.stop(now + 1.8);
        } catch(e) {}
    }

    playCrowdGoalCheer() {
        this._resumeAudio();
        try {
            if (!this.crowdAudio) {
                this.crowdAudio = new Audio(`${this.rootPath}assets/games/penalty/crowd_goal.mp3`);
                this.crowdAudio.volume = 1.0;
            }
            this.crowdAudio.currentTime = 0;
            const p = this.crowdAudio.play();
            if (p !== undefined) p.catch(() => {});
        } catch(e) {}

        // Secondary rich crowd synthesis & net impact
        this.playNetGoalSound();
    }

    playSaveSound() {
        this._resumeAudio();
        if (!this.audioCtx) return;
        try {
            const now = this.audioCtx.currentTime;
            // Glove slap thud
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.2);

            // Crowd Groan "Awww"
            const bufferSize = this.audioCtx.sampleRate * 1.4;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(650, now + 0.1);
            filter.frequency.linearRampToValueAtTime(220, now + 0.9);
            const nGain = this.audioCtx.createGain();
            nGain.gain.setValueAtTime(0.001, now + 0.1);
            nGain.gain.linearRampToValueAtTime(0.25, now + 0.35);
            nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.audioCtx.destination);
            noise.start(now + 0.1);
            noise.stop(now + 1.4);
        } catch(e) {}
    }

    setIdleState() {
        if (!this.keeperSprite || !this.keeperLayer || !this.ballWrapper) return;
        
        // Reset keeper to idle bounce stance
        this.keeperSprite.src = `${this.rootPath}assets/games/penalty/keeper_idle.png`;
        this.keeperSprite.className = 'keeper-sprite keeper-idle-anim';
        this.keeperLayer.style.transform = 'translate(0px, 0px) scaleX(1)';
        this.keeperLayer.style.opacity = '1';

        // Reset ball to penalty spot
        this.ballWrapper.style.transform = 'translate(0px, 0px) scale(1)';
        if (this.ballSprite) this.ballSprite.style.transform = 'rotate(0deg)';
        if (this.ballShadow) {
            this.ballShadow.style.opacity = '1';
            this.ballShadow.style.transform = 'scale(1)';
        }

        // Hide announcer banner
        if (this.announcer) {
            this.announcer.className = 'stadium-event-announcer';
        }

        // Enable targets
        document.querySelectorAll('.penalty-target-zone').forEach(t => {
            t.style.pointerEvents = 'auto';
            t.style.opacity = '1';
        });
    }

    async shoot(zone) {
        if (this.isPlaying) return;
        this._resumeAudio();

        const betInput = document.getElementById('penalty-bet-input');
        const bet = parseFloat(betInput ? betInput.value : 100) || 100;

        if (this.streak === 0) {
            if (window.wallet && !window.wallet.placeBet(bet, 'Penalty Shootout')) {
                if (window.core && window.core.showToast) {
                    window.core.showToast('Khelne ke liye pehle balance deposit karein!', 'error');
                }
                return;
            }
            this.betAmount = bet;
            const hudBet = document.getElementById('hud-stake-val');
            if (hudBet) hudBet.innerText = `₨ ${this.betAmount.toFixed(0)}`;
        }

        this.isPlaying = true;
        document.querySelectorAll('.penalty-target-zone').forEach(t => {
            t.style.pointerEvents = 'none';
        });

        // Trigger turf kick particle & audio
        const burst = document.getElementById('turf-kick-burst');
        if (burst) {
            burst.classList.add('active');
            setTimeout(() => burst.classList.remove('active'), 450);
        }
        this.playKickSound();

        // 30% win probability for player (70% house save rate)
        const goalieZones = ['tl', 'tr', 'bl', 'br', 'm'];
        const isGoalAttempt = Math.random() < 0.30;
        let goalieDive;
        if (!isGoalAttempt) {
            goalieDive = zone; // Goalkeeper dives to player's chosen zone and saves
        } else {
            const otherZones = goalieZones.filter(z => z !== zone);
            goalieDive = otherZones[Math.floor(Math.random() * otherZones.length)];
        }

        // Dynamic Responsive Trajectory Math
        const arena = document.getElementById('stadium-arena');
        const arenaWidth = arena ? arena.offsetWidth : 800;
        const arenaHeight = arena ? arena.offsetHeight : 450;

        const cornerX = Math.round(arenaWidth * 0.32);
        const topY = -Math.round(arenaHeight * 0.53);
        const lowY = -Math.round(arenaHeight * 0.22);
        const midY = -Math.round(arenaHeight * 0.48);

        const targetOffsets = {
            'tl': { bx: -cornerX, by: topY, scale: 0.52, rot: -720 },
            'tr': { bx: cornerX,  by: topY, scale: 0.52, rot: 720 },
            'm':  { bx: 0,        by: midY, scale: 0.50, rot: 540 },
            'bl': { bx: -cornerX, by: lowY, scale: 0.55, rot: -540 },
            'br': { bx: cornerX,  by: lowY, scale: 0.55, rot: 540 }
        };

        const diveX = Math.round(arenaWidth * 0.22);
        const diveAnims = {
            'tl': { gx: -diveX, gy: -Math.round(arenaHeight * 0.14), flip: 1,  rot: -32, sprite: 'dive' },
            'tr': { gx: diveX,  gy: -Math.round(arenaHeight * 0.14), flip: -1, rot: 32,  sprite: 'dive' },
            'bl': { gx: -diveX, gy: -Math.round(arenaHeight * 0.03), flip: 1,  rot: -12, sprite: 'dive' },
            'br': { gx: diveX,  gy: -Math.round(arenaHeight * 0.03), flip: -1, rot: 12,  sprite: 'dive' },
            'm':  { gx: 0,      gy: -Math.round(arenaHeight * 0.10), flip: 1,  rot: 0,   sprite: 'idle' }
        };

        const bTraj = targetOffsets[zone];
        const gDive = diveAnims[goalieDive];

        // Animate Goalkeeper Dive
        this.keeperSprite.classList.remove('keeper-idle-anim');
        if (gDive.sprite === 'dive') {
            this.keeperSprite.src = `${this.rootPath}assets/games/penalty/keeper_dive.png`;
        } else {
            this.keeperSprite.src = `${this.rootPath}assets/games/penalty/keeper_idle.png`;
        }
        this.keeperLayer.style.transform = `translate(${gDive.gx}px, ${gDive.gy}px) scaleX(${gDive.flip}) rotate(${gDive.rot}deg)`;

        // Animate Ball Flight with 3D Depth
        this.ballWrapper.style.transform = `translate(${bTraj.bx}px, ${bTraj.by}px) scale(${bTraj.scale})`;
        this.ballSprite.style.transform = `rotate(${bTraj.rot}deg)`;
        if (this.ballShadow) {
            this.ballShadow.style.opacity = '0.15';
            this.ballShadow.style.transform = `translate(${bTraj.bx * 0.4}px, 0px) scale(0.4)`;
        }

        // Wait for ball to reach the goal line
        await new Promise(r => setTimeout(r, 480));

        const isGoal = (zone !== goalieDive);

        if (isGoal) {
            // GOAL SCORED! PLAY EXPLOSIVE CROWD ROAR!
            this.playCrowdGoalCheer();
            if (window.sound && window.sound.playWin) window.sound.playWin();

            this.streak++;
            const mult = this.multipliers[Math.min(this.streak - 1, this.multipliers.length - 1)];
            const winVal = this.betAmount * mult;

            // Show Dramatic In-Arena Announcement Banner
            if (this.announcer) {
                this.announcer.innerHTML = `
                    <h2 class="banner-text-primary banner-goal-style">GOAL! ⚽</h2>
                    <span class="banner-text-sub">${this.streak} In A Row! • Multiplier: ${mult.toFixed(2)}x</span>
                `;
                this.announcer.className = 'stadium-event-announcer show-goal';
            }

            this.updateUI();

            // Reveal and update Cashout Button
            const cashBtn = document.getElementById('btn-penalty-cashout');
            if (cashBtn) {
                cashBtn.style.display = 'flex';
                cashBtn.innerHTML = `<span>💰 TAKE CASH</span> <span>₨ ${winVal.toFixed(0)}</span>`;
            }

            // Ball drops down realistically in back of net
            setTimeout(() => {
                this.ballWrapper.style.transform = `translate(${bTraj.bx}px, ${bTraj.by + 35}px) scale(0.42)`;
            }, 100);

            // Auto-cashout if final 5th goal is achieved (Championship Jackpot!)
            if (this.streak >= 5) {
                setTimeout(() => this.cashOut(), 1400);
            } else {
                setTimeout(() => {
                    this.setIdleState();
                    this.isPlaying = false;
                }, 1300);
            }

        } else {
            // SAVED BY GOALKEEPER!
            this.playSaveSound();
            if (window.sound && window.sound.playLoss) window.sound.playLoss();

            // Ball deflects off keeper's gloves
            this.ballWrapper.style.transform = `translate(${bTraj.bx * 0.75}px, ${bTraj.by + 40}px) scale(0.55)`;
            this.ballSprite.style.transform = `rotate(${bTraj.rot * 0.4}deg)`;

            if (this.announcer) {
                this.announcer.innerHTML = `
                    <h2 class="banner-text-primary banner-saved-style">SAVED! 🧤</h2>
                    <span class="banner-text-sub">Shot Blocked by Keeper!</span>
                `;
                this.announcer.className = 'stadium-event-announcer show-saved';
            }

            if (window.wallet) {
                window.wallet.creditWin(this.betAmount, 0, 'Penalty Shootout', 0, 'Shot saved by keeper');
            }

            // Mark red miss on streak dots
            const dots = document.querySelectorAll('.streak-ball-dot');
            if (dots[this.streak]) {
                dots[this.streak].className = 'streak-ball-dot miss';
                dots[this.streak].innerHTML = '❌';
            }

            setTimeout(() => {
                this.resetRound();
                this.setIdleState();
                this.isPlaying = false;
            }, 1600);
        }
    }

    cashOut() {
        if (this.streak === 0 || this.isPlaying) return;
        const mult = this.multipliers[Math.min(this.streak - 1, this.multipliers.length - 1)];
        const win = this.betAmount * mult;

        if (window.wallet) {
            window.wallet.creditWin(this.betAmount, win, 'Penalty Shootout', mult, `Cashed out at Goal ${this.streak} (${mult.toFixed(2)}x)`);
        }
        if (window.core && window.core.updateAllBalances) {
            window.core.updateAllBalances();
        }
        if (window.core && window.core.showToast) {
            window.core.showToast(`🏆 WINNER! ₨ ${win.toFixed(0)} credited to your wallet!`, 'success');
        }

        this.playWhistleSound();
        if (window.sound && window.sound.playWin) window.sound.playWin();

        if (this.announcer) {
            this.announcer.innerHTML = `
                <h2 class="banner-text-primary banner-goal-style">WINNER! 🏆</h2>
                <span class="banner-text-sub">Cashed Out ₨ ${win.toFixed(0)} (${mult.toFixed(2)}x)</span>
            `;
            this.announcer.className = 'stadium-event-announcer show-goal';
        }

        setTimeout(() => {
            this.resetRound();
            this.setIdleState();
            this.isPlaying = false;
        }, 1800);
    }

    resetRound() {
        this.streak = 0;
        this.updateUI();
        const cashBtn = document.getElementById('btn-penalty-cashout');
        if (cashBtn) cashBtn.style.display = 'none';
        const hudBet = document.getElementById('hud-stake-val');
        if (hudBet) hudBet.innerText = `₨ 0`;
    }

    updateUI() {
        // Multiplier Step Ladder
        const ladder = document.getElementById('penalty-ladder-wrap');
        if (ladder) {
            ladder.innerHTML = '';
            this.multipliers.forEach((m, idx) => {
                const cell = document.createElement('div');
                const isCompleted = this.streak > idx;
                const isNext = this.streak === idx;
                cell.className = 'ladder-cell ' + (isCompleted ? 'completed' : '') + (isNext ? ' active-target' : '');
                cell.innerHTML = `
                    <span class="step-name">Goal ${idx + 1}</span>
                    <span class="step-mult">${m.toFixed(2)}x</span>
                `;
                ladder.appendChild(cell);
            });
        }

        // Scoreboard Streak Dots
        const dotsWrap = document.getElementById('scoreboard-streak-wrap');
        if (dotsWrap) {
            dotsWrap.innerHTML = '';
            for (let i = 0; i < 5; i++) {
                const dot = document.createElement('div');
                if (i < this.streak) {
                    dot.className = 'streak-ball-dot goal';
                    dot.innerHTML = '⚽';
                } else if (i === this.streak) {
                    dot.className = 'streak-ball-dot active';
                    dot.innerHTML = '🎯';
                } else {
                    dot.className = 'streak-ball-dot';
                    dot.innerHTML = '⚪';
                }
                dotsWrap.appendChild(dot);
            }
        }

        // Live Mult in Scoreboard
        const hudMult = document.getElementById('hud-mult-val');
        if (hudMult) {
            if (this.streak === 0) {
                hudMult.innerText = '1.00x';
            } else {
                const currentM = this.multipliers[Math.min(this.streak - 1, this.multipliers.length - 1)];
                hudMult.innerText = `${currentM.toFixed(2)}x`;
            }
        }
    }

    modifyBet(action) {
        if (this.isPlaying || this.streak > 0) return;
        const input = document.getElementById('penalty-bet-input');
        if (!input) return;
        let val = parseFloat(input.value) || 100;
        const userBal = (window.wallet && window.wallet.state) ? window.wallet.state.balancePKR : 10000;

        if (action === 'half') val = Math.max(10, Math.floor(val / 2));
        else if (action === 'double') val = Math.min(userBal, val * 2);
        else if (action === 'max') val = Math.max(10, Math.floor(userBal));
        input.value = Math.max(10, Math.floor(val));
    }

    setQuickBet(amt) {
        if (this.isPlaying || this.streak > 0) return;
        const input = document.getElementById('penalty-bet-input');
        if (input) input.value = amt;
    }
}

window.penaltyGame = new PenaltyGamePro();
