// ============================================================
// Bet With Net - Authentic SPRIBE Aviator Pro Engine (1:1 Replica)
// Infinite Continuous Autonomous Flight Loops, Propeller Plane
// Provably Fair Simulation, Dual Betting & Multiplayer Community
// ============================================================

class CrashGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.animId = null;
        this.state = 'waiting'; // 'waiting', 'flying', 'crashed'
        this.currentMultiplier = 1.00;
        this.crashPoint = 1.00;

        // Player Dual Bet State (Panel 1 and Panel 2 Hedge)
        // Default bet amounts matching official Spribe reference (16.00 PKR)
        this.bets = {
            1: { amount: 16, hasBet: false, cashedOut: false, queuedNextBet: false, queuedBetId: null, activeBetId: null, autoCashout: 2.00, mode: 'manual' },
            2: { amount: 16, hasBet: false, cashedOut: false, queuedNextBet: false, queuedBetId: null, activeBetId: null, autoCashout: 1.50, mode: 'manual' }
        };
        this.panel2Collapsed = false;
        this.clientId = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);

        // Timing & Global Round Sync
        this.currentRoundId = 0;
        this._lastCrashedRoundId = -1;
        this.isSyncing = false;
        this.startTime = 0;
        this.countdownTimer = 5.0;
        this.waitingStartTime = 0;
        this.crashedTime = 0;

        // Force Loss Rig Isolation State (Keeps rigged user's early crash private without affecting other players)
        this._localCrashedRoundId = null;
        this._localRigCrashPoint = null;
        this._isLocalLossRigActive = false;
        this._forceLossCrashPoint = null;

        // Multiplier History (Dynamically loaded and persisted)
        this.history = [];

        // Multiplayer Community Ledger simulation & Genuine Bets
        this.communityPlayers = [];
        this.previousRoundPlayers = [];
        this.serverActiveBets = [];
        this.serverPrevBets = [];
        this.activeLedgerTab = 'all';
        this.propellerAngle = 0;
        this.radarAngle = 0;
        this.smokeParticles = [];

        this.lastSyncTime = 0;
        this.lastWaitingSync = 0;
        this.lastCrashSync = 0;
        this.serverNextCrash = null;

        // Online players simulation count
        this.onlinePlayers = 337;
        this.lastPlayerCountUpdate = 0;

        // Crash fly-off position
        this.crashFlyOffX = 0;
        this.crashFlyOffY = 0;
        this.crashFlyOffAngle = 0;

        // Exact user uploaded plane image asset
        this.planeImg = new Image();
        this.planeImg.src = '../assets/aviator_plane_clean.png?v=4';
        this.planeImgLoaded = false;
        this.planeImg.onload = () => { this.planeImgLoaded = true; };
    }

    isRiggedUser() {
        try {
            let u = null;
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                try { u = JSON.parse(sess); } catch(e) {}
            }
            if (!u && window.userManager && window.userManager.currentUser) {
                u = window.userManager.currentUser;
            }
            if (!u && window.core && window.core.getLoggedInUser) {
                try { u = window.core.getLoggedInUser(); } catch(e) {}
            }
            if (!u) {
                const act = localStorage.getItem('bwn_active_user') || localStorage.getItem('user_data');
                if (act) {
                    try { u = JSON.parse(act); } catch(e) {}
                }
            }
            if (!u) return false;
            const bias = String(u.outcome_bias || u.outcomeBias || 'fair').toLowerCase().trim();
            return bias === 'force_loss' || bias === 'force_stop' || bias === 'stop' || bias === 'loss';
        } catch (e) {
            return false;
        }
    }

    seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    init() {
        this.canvas = document.getElementById('crash-canvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.initHistory();
        this.initCommunityPlayers(1);
        this.updateTopBalance();

        // Update button sub-texts
        this.updateBtnSubText(1);
        this.updateBtnSubText(2);

        // Enforce minimum bet on manual typing/blur
        [1, 2].forEach(panel => {
            const input = document.getElementById(panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2');
            if (input) {
                const enforceMin = () => {
                    const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
                    const minVal = (curr === 'USD') ? 0.10 : 16;
                    let v = parseFloat(input.value);
                    if (isNaN(v) || v < minVal) {
                        v = minVal;
                        input.value = v.toFixed(2);
                    }
                    this.bets[panel].amount = v;
                    this.updateBtnSubText(panel);
                };
                input.addEventListener('change', enforceMin);
                input.addEventListener('blur', enforceMin);
            }
        });

        // Listen for Admin Force Crash Trigger & Auto Reset across browser tabs
        window.addEventListener('storage', (e) => {
            if (this.isRiggedUser()) return;
            if (e.key === 'bwn_admin_force_crash_trigger') {
                this.forceCrash();
            }
            if (e.key === 'bwn_admin_crash_auto_trigger') {
                this.serverNextCrash = null;
                localStorage.removeItem('bwn_admin_next_crash');
                localStorage.removeItem('bwn_admin_force_crash_now');
                localStorage.removeItem('bwn_admin_force_crash_trigger');
            }
            if (e.key === 'bwn_admin_next_crash' && e.newValue) {
                const pt = parseFloat(e.newValue);
                if (!isNaN(pt) && pt >= 1.01) {
                    this.serverNextCrash = pt;
                    if (this.state === 'waiting') {
                        this.crashPoint = pt;
                    }
                }
            }
        });

        // Listen for wallet balance changes
        if (window.wallet) {
            window.wallet.on('change', () => this.updateTopBalance());
            window.wallet.on('balanceChange', () => this.updateTopBalance());
        }

        // Auto-resume audio on user interactions and keep continuous BGM alive
        const ensureCrashBgm = () => {
            if (window.sound) {
                window.sound.init();
                if (!window.sound.aviatorBgmAudio || window.sound.aviatorBgmAudio.paused) {
                    window.sound.startAviatorBGM();
                }
            }
        };
        ['pointerdown', 'touchstart', 'mousedown', 'click', 'keydown'].forEach(evt => {
            window.addEventListener(evt, ensureCrashBgm, { passive: true });
        });

        // Real-time Cross-Tab Genuine Bet Sync
        window.addEventListener('storage', (e) => {
            if (this.isRiggedUser()) return;
            if (e.key === 'bwn_crash_live_bet' && e.newValue) {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data && data.type === 'new_bet' && data.bet) {
                        const existing = this.communityPlayers.find(p => p.betId === data.bet.betId);
                        if (!existing) {
                            this.communityPlayers.unshift({ ...data.bet, isMe: false, isGenuine: true, avatarColor: '#f5a623' });
                            this.renderCommunityTable();
                        }
                    } else if (data && data.type === 'cashout_bet') {
                        const existing = this.communityPlayers.find(p => p.betId === data.betId);
                        if (existing && !existing.cashedOut) {
                            existing.cashedOut = true;
                            existing.cashoutMult = data.mult;
                            existing.winPKR = data.win;
                            this.renderCommunityTable();
                        }
                    } else if (data && data.type === 'cancel_bet' && data.betId) {
                        this.communityPlayers = this.communityPlayers.filter(p => p.betId !== data.betId);
                        this.renderCommunityTable();
                    }
                } catch(err) {}
            }
        });

        // Start autonomous loop (rigged user starts independent game; normal user syncs with server)
        if (this.isRiggedUser()) {
            this.currentRoundId = Math.floor(1000 + Math.random() * 8000);
            this.startWaitingPhase(0, this.currentRoundId, true);
        } else {
            this.startWaitingPhase(0, 0, true);
            this.syncWithServer();
        }
        this.mainLoop();
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
        this.displayW = rect.width;
        this.displayH = rect.height || 220;
        this.canvas.width = Math.round(this.displayW * dpr);
        this.canvas.height = Math.round(this.displayH * dpr);
        this.canvas.style.width = this.displayW + 'px';
        this.canvas.style.height = this.displayH + 'px';
        this.ctx = this.canvas.getContext('2d');
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    updateTopBalance() {
        const numEl = document.getElementById('top-balance-display');
        const currEl = document.getElementById('top-currency-display');
        if (!window.wallet) return;

        const curr = window.wallet.getCurrency ? window.wallet.getCurrency() : 'PKR';
        const bal = window.wallet.getBalance ? window.wallet.getBalance() : 0;

        if (numEl) numEl.innerText = Number(bal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        if (currEl) currEl.innerText = curr;
    }

    initHistory() {
        let saved = [];
        try {
            const key = this.isRiggedUser() ? 'bwn_crash_rig_history' : 'bwn_crash_round_history';
            const raw = localStorage.getItem(key);
            if (raw) saved = JSON.parse(raw);
        } catch(e) {}

        if (Array.isArray(saved) && saved.length >= 5) {
            this.history = saved.slice(-25);
        } else {
            // Natural baseline distribution
            this.history = this.isRiggedUser()
                ? [1.04, 1.07, 1.03, 1.05, 1.08, 1.04, 1.06, 1.03, 1.07, 1.05, 1.08, 1.04]
                : [1.32, 2.14, 1.15, 3.40, 1.08, 1.85, 4.20, 1.25, 2.70, 1.60, 5.80, 2.05, 1.45, 3.10];
            this.saveHistory();
        }
        this.renderHistory();
    }

    saveHistory() {
        try {
            const key = this.isRiggedUser() ? 'bwn_crash_rig_history' : 'bwn_crash_round_history';
            localStorage.setItem(key, JSON.stringify(this.history.slice(-30)));
        } catch(e) {}
    }

    renderHistory() {
        const bar = document.getElementById('crash-history-bar');
        if (!bar) return;

        // Spribe coloring: Blue (<2x), Purple (2-9.99x), Pink (10x+)
        bar.innerHTML = this.history.slice(-14).reverse().map(h => {
            const val = parseFloat(h) || 1.00;
            const cls = val >= 10 ? 'pill-pink' : (val >= 2 ? 'pill-purple' : 'pill-blue');
            return `<span class="spribe-pill ${cls}">${val.toFixed(2)}x</span>`;
        }).join('');
    }

    toggleHistoryModal() {
        if (window.core && window.core.showToast) {
            window.core.showToast(`Recent Rounds: ${this.history.slice(-8).map(h => parseFloat(h).toFixed(2) + 'x').join(', ')}`, 'info');
        }
    }

    // -------------------------------------------------------------
    // MULTIPLAYER COMMUNITY BETS & GENUINE PLAYER INTEGRATION
    // -------------------------------------------------------------
    getMyPlayerInfo() {
        let username = null;
        if (window.core && window.core.getLoggedInUser) {
            const u = window.core.getLoggedInUser();
            if (u && (u.username || u.phone || u.name)) {
                username = u.username || u.phone || u.name;
            }
        }
        if (!username && window.userManager && window.userManager.currentUser) {
            username = window.userManager.currentUser.username;
        }
        if (!username) {
            for (const key of ['bwn_session_user', 'bwn_active_user', 'user_data']) {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && (parsed.username || parsed.phone || parsed.name)) {
                            username = parsed.username || parsed.phone || parsed.name;
                            break;
                        }
                    }
                } catch(e) {}
            }
        }
        if (!username) {
            let storedGuest = localStorage.getItem('bwn_crash_guest_id');
            if (!storedGuest) {
                storedGuest = 'u' + Math.floor(100000000 + Math.random() * 900000000);
                localStorage.setItem('bwn_crash_guest_id', storedGuest);
            }
            username = storedGuest;
        }
        return username;
    }

    mergeServerBets(shouldRender = true) {
        if (!Array.isArray(this.serverActiveBets)) return false;
        let updated = false;

        const myBetIds = new Set([
            this.bets[1].activeBetId,
            this.bets[2].activeBetId,
            this.bets[1].queuedBetId,
            this.bets[2].queuedBetId
        ].filter(Boolean));
        const myOwnerKeys = new Set([
            this.clientId + '_1',
            this.clientId + '_2'
        ]);

        const serverIds = new Set();
        this.serverActiveBets.forEach(sBet => {
            if (!sBet || !sBet.betId) return;
            // Skip our own tab's bets since they are already managed locally with isMe: true
            if (myBetIds.has(sBet.betId) || (sBet.ownerKey && myOwnerKeys.has(sBet.ownerKey))) {
                return;
            }
            serverIds.add(sBet.betId);

            const existing = this.communityPlayers.find(p => p.betId === sBet.betId);
            if (!existing) {
                this.communityPlayers.unshift({
                    id: sBet.id || 'Player',
                    avatarColor: sBet.avatarColor || '#f5a623',
                    betPKR: parseFloat(sBet.betPKR || sBet.amount || 16),
                    targetCashout: sBet.targetCashout ? parseFloat(sBet.targetCashout) : null,
                    cashedOut: !!sBet.cashedOut,
                    cashoutMult: sBet.cashoutMult ? parseFloat(sBet.cashoutMult) : null,
                    winPKR: sBet.winPKR ? parseFloat(sBet.winPKR) : 0,
                    isMe: false,
                    isGenuine: true,
                    queued: !!sBet.queued,
                    panel: sBet.panel || 1,
                    ownerKey: sBet.ownerKey || null,
                    betId: sBet.betId
                });
                updated = true;
            } else {
                const newCashed = !!sBet.cashedOut;
                const newMult = sBet.cashoutMult ? parseFloat(sBet.cashoutMult) : null;
                const newWin = sBet.winPKR ? parseFloat(sBet.winPKR) : 0;
                const newAmt = parseFloat(sBet.betPKR || existing.betPKR);
                const newQueued = !!sBet.queued;
                if (newCashed !== !!existing.cashedOut || newMult !== existing.cashoutMult || newWin !== existing.winPKR || newAmt !== existing.betPKR || newQueued !== !!existing.queued) {
                    existing.cashedOut = newCashed;
                    existing.cashoutMult = newMult;
                    existing.winPKR = newWin;
                    existing.betPKR = newAmt;
                    existing.queued = newQueued;
                    updated = true;
                }
            }
        });

        // Remove any other-user genuine bets that were cancelled or expired on server
        const beforeLen = this.communityPlayers.length;
        this.communityPlayers = this.communityPlayers.filter(p => {
            if (p.isGenuine && !p.isMe) {
                return serverIds.has(p.betId);
            }
            return true;
        });
        if (this.communityPlayers.length !== beforeLen) {
            updated = true;
        }

        if (updated && shouldRender) {
            this.renderCommunityTable();
        }
        return updated;
    }

    initCommunityPlayers(roundId = 1) {
        this.resetCommunityRound(roundId);
    }

    resetCommunityRound(roundId = 1) {
        // Archive current round bets to previous round history
        if (this.communityPlayers && this.communityPlayers.length > 0) {
            this.previousRoundPlayers = JSON.parse(JSON.stringify(this.communityPlayers));
        }

        const sampleMasked = [
            'u446166303', 'u434598272', 'u648590831', 'u431334643', 'u342434909',
            'u308290192', 'u333100987', 'u363973410', 'u384247366', 'u277426393',
            'u525761181', 'u359294428', 'u4191696756', 'u884219904', 'u910248812',
            'u110948271', 'u772910482', 'u991204812', 'u551029481', 'u883920194'
        ];
        const avatarColors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
        const betOptions = [16, 64, 160, 320, 500, 1000, 1600, 2500];
        const seedBase = (parseInt(roundId) || 1) * 137;

        // Deterministic per roundId so every connected user sees the exact same community table
        this.communityPlayers = sampleMasked.map((uid, idx) => {
            const r1 = this.seededRandom(seedBase + idx * 17 + 1);
            const r2 = this.seededRandom(seedBase + idx * 31 + 2);
            const bet = betOptions[Math.floor(r1 * betOptions.length)];
            const targetCashout = parseFloat((1.10 + r2 * 2.8).toFixed(2));
            return {
                id: uid,
                avatarColor: avatarColors[idx % avatarColors.length],
                betPKR: bet,
                targetCashout: targetCashout,
                cashedOut: false,
                cashoutMult: null,
                winPKR: 0,
                isMe: false,
                isGenuine: false
            };
        });

        // Re-inject genuine active bets for this user
        for (const p of [1, 2]) {
            if (this.bets[p].hasBet) {
                const username = this.getMyPlayerInfo();
                const activeId = this.bets[p].activeBetId || ('bet_' + Date.now() + '_' + p);
                this.bets[p].activeBetId = activeId;
                this.communityPlayers.unshift({
                    id: username,
                    avatarColor: '#00e5ff',
                    betPKR: this.bets[p].amount,
                    targetCashout: (this.bets[p].mode === 'auto') ? parseFloat(this.bets[p].autoCashout) : null,
                    cashedOut: !!this.bets[p].cashedOut,
                    cashoutMult: null,
                    winPKR: 0,
                    isMe: true,
                    isGenuine: true,
                    panel: p,
                    ownerKey: this.clientId + '_' + p,
                    betId: activeId
                });
            }
        }

        // Preserve all active genuine bets from other real players on the server
        this.mergeServerBets(false);
        this.renderCommunityTable();
    }

    updateCommunityFlight() {
        let anyChange = false;
        let totalWin = 0;

        this.communityPlayers.forEach(p => {
            // Genuine players' cashouts (both You and other real players) are controlled strictly by real player cashouts
            if (p.isMe || p.isGenuine) {
                if (p.cashedOut) {
                    totalWin += (p.winPKR || 0);
                }
                return;
            }

            // Simulated community players auto-cashout at their target multiplier
            if (!p.cashedOut && typeof p.targetCashout === 'number' && p.targetCashout >= 1.01 && this.currentMultiplier >= p.targetCashout && p.targetCashout < this.crashPoint) {
                p.cashedOut = true;
                p.cashoutMult = p.targetCashout;
                p.winPKR = parseFloat((p.betPKR * p.cashoutMult).toFixed(2));
                anyChange = true;
            }
            if (p.cashedOut) {
                totalWin += (p.winPKR || 0);
            }
        });

        if (anyChange) {
            this.renderCommunityTable();
        }
    }

    switchLedgerTab(tab) {
        this.activeLedgerTab = tab;
        ['all', 'prev', 'top'].forEach(t => {
            const el = document.getElementById(`tab-${t}-bets`);
            if (el) el.classList.toggle('active', t === tab);
        });
        this.renderCommunityTable();
    }

    renderCommunityTable() {
        const body = document.getElementById('spribe-table-body');
        if (!body) return;

        let players = [];
        if (this.activeLedgerTab === 'prev') {
            const serverPrev = (this.serverPrevBets || []).map(sb => ({
                ...sb,
                isGenuine: true,
                isMe: false,
                avatarColor: sb.avatarColor || '#f5a623'
            }));
            const rawPrev = [...serverPrev, ...(this.previousRoundPlayers.length > 0 ? this.previousRoundPlayers : this.communityPlayers.filter(p => p.cashedOut))];
            const seenPrev = new Set();
            players = rawPrev.filter(p => {
                const k = p.betId || (p.id + '_' + p.betPKR);
                if (seenPrev.has(k)) return false;
                seenPrev.add(k);
                return true;
            });
        } else if (this.activeLedgerTab === 'top') {
            const serverPrev = (this.serverPrevBets || []).map(sb => ({
                ...sb,
                isGenuine: true,
                isMe: false,
                avatarColor: sb.avatarColor || '#f5a623'
            }));
            const pool = [...this.communityPlayers, ...serverPrev, ...(this.previousRoundPlayers || [])];
            const seen = new Set();
            players = pool.filter(p => {
                const k = p.betId || (p.id + '_' + p.betPKR);
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });
            players.sort((a, b) => (b.winPKR || b.betPKR) - (a.winPKR || a.betPKR));
        } else {
            // 'all': Genuine players always prioritized at the top (You first, then other real users, then bots)
            players = [...this.communityPlayers].sort((a, b) => {
                if (a.isMe && !b.isMe) return -1;
                if (!a.isMe && b.isMe) return 1;
                if (a.isGenuine && !b.isGenuine) return -1;
                if (!a.isGenuine && b.isGenuine) return 1;
                return 0;
            });
        }

        body.innerHTML = players.map(p => {
            const isMe = !!p.isMe;
            const isGenuine = !!p.isGenuine;
            const rowClass = `spribe-player-row ${p.cashedOut ? 'cashed-out' : ''} ${isMe ? 'my-genuine-bet' : (isGenuine ? 'other-genuine-bet' : '')}`;
            const avatar = isMe ? '👑' : (isGenuine ? '⭐' : '👤');
            const avatarBg = isMe ? '#00e5ff' : (isGenuine ? '#f5a623' : p.avatarColor);
            const nameColor = isMe ? '#00e5ff' : (isGenuine ? '#ffcc00' : '#cbd5e1');
            const nameDisplay = isMe ? `You (${p.id})` : p.id;
            const tag = isMe 
                ? '<span class="genuine-pill" style="background:#00e5ff; color:#05070a;">YOU</span>'
                : (isGenuine ? '<span class="genuine-pill" style="background:#2ecc71; color:#05070a;">LIVE</span>' : '');

            return `
            <div class="${rowClass}">
                <div class="player-info-cell">
                    <span class="player-avatar-circle" style="background:${avatarBg}; font-size:10.5px;">${avatar}</span>
                    <span class="player-name-text" style="color:${nameColor}; font-weight:${(isMe || isGenuine) ? '800' : '600'};">${nameDisplay}${tag}</span>
                </div>
                <div class="player-bet-text" style="${isMe ? 'color:#00e5ff; font-weight:900;' : (isGenuine ? 'color:#ffd700; font-weight:800;' : '')}">${Number(p.betPKR || 0).toLocaleString()} PKR</div>
                <div>
                    ${p.cashedOut && p.cashoutMult ? `<span class="player-mult-pill won">${Number(p.cashoutMult).toFixed(2)}x</span>` : `<span class="player-mult-pill">-</span>`}
                </div>
                <div class="player-win-text ${p.cashedOut ? 'won' : ''}" style="${(isMe || isGenuine) && p.cashedOut ? 'color:#00ff66; font-weight:900; text-shadow:0 0 10px rgba(0,255,102,0.5);' : ''}">
                    ${p.cashedOut && p.winPKR ? `${Number(p.winPKR).toLocaleString()} PKR` : '-'}
                </div>
            </div>
            `;
        }).join('');

        const countLabel = document.getElementById('ledger-count-label');
        if (countLabel) {
            const listToCount = this.activeLedgerTab === 'prev' ? players : this.communityPlayers;
            const cashed = listToCount.filter(p => p.cashedOut).length;
            countLabel.innerText = `${cashed}/${listToCount.length} Bets`;
        }

        const winLabel = document.getElementById('ledger-total-win');
        if (winLabel) {
            const totalWin = this.communityPlayers.reduce((sum, p) => sum + (p.cashedOut ? (parseFloat(p.winPKR) || 0) : 0), 0);
            winLabel.innerText = totalWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
    }

    // -------------------------------------------------------------
    // INPUT STEPPERS & CHIPS
    // -------------------------------------------------------------
    setMode(panel, mode) {
        panel = parseInt(panel) || 1;
        this.bets[panel].mode = mode;

        const tabBet = document.getElementById(`tab-bet-${panel}`);
        const tabAuto = document.getElementById(`tab-auto-${panel}`);
        const autoRow = document.getElementById(`auto-row-${panel}`);

        if (tabBet) tabBet.classList.toggle('active', mode === 'manual');
        if (tabAuto) tabAuto.classList.toggle('active', mode === 'auto');
        if (autoRow) autoRow.classList.toggle('visible', mode === 'auto');
    }

    adjustBet(panel, delta) {
        panel = parseInt(panel) || 1;
        const input = document.getElementById(panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2');
        if (!input) return;

        const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
        const minVal = (curr === 'USD') ? 0.10 : 16;
        let val = (parseFloat(input.value) || 0) + delta;
        val = Math.max(minVal, Math.round(val));
        input.value = val.toFixed(2);
        this.bets[panel].amount = val;
        this.updateBtnSubText(panel);
        if (window.sound && window.sound.playClick) window.sound.playClick();
    }

    setBetAmount(panel, amount) {
        panel = parseInt(panel) || 1;
        const input = document.getElementById(panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2');
        if (!input) return;

        const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
        const minVal = (curr === 'USD') ? 0.10 : 16;
        const finalAmt = Math.max(minVal, parseFloat(amount));
        input.value = finalAmt.toFixed(2);
        this.bets[panel].amount = finalAmt;
        this.updateBtnSubText(panel);
        if (window.sound && window.sound.playChip) window.sound.playChip();
    }

    updateBtnSubText(panel) {
        panel = parseInt(panel) || 1;
        const sub = document.getElementById(`btn-sub-text-${panel}`);
        const input = document.getElementById(panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2');
        if (sub && input) {
            const amt = parseFloat(input.value) || 0;
            if (this.state !== 'flying' || !this.bets[panel].hasBet) {
                sub.innerText = `${amt.toFixed(2)} PKR`;
            }
        }
    }

    togglePanel2() {
        this.panel2Collapsed = !this.panel2Collapsed;
        const body = document.getElementById('bet-body-2');
        const btn = document.getElementById('btn-minimize-2');
        if (body) body.style.display = this.panel2Collapsed ? 'none' : 'grid';
        if (btn) btn.innerText = this.panel2Collapsed ? '⊞' : '⊟';
    }

    // -------------------------------------------------------------
    // GLOBAL AUTHORITATIVE SERVER ENGINE SYNC (ALL USERS SEE EXACT SAME GAME)
    // -------------------------------------------------------------
    async syncWithServer(extra = {}) {
        if (this.isRiggedUser()) return;
        const hasAction = Object.keys(extra).length > 0;
        if (!hasAction && this.isSyncing) return;
        if (!hasAction) this.isSyncing = true;

        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

        try {
            const res = await fetch('/api/games.php?action=crash_sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extra),
                signal: controller ? controller.signal : undefined
            });
            if (timeoutId) clearTimeout(timeoutId);
            const json = await res.json();
            if (json && json.success && json.data) {
                const d = json.data;
                const now = performance.now();

                const srvRoundId = parseInt(d.round_id) || 1;
                const srvStatus = (d.status === 'running' ? 'flying' : d.status) || 'waiting';
                const srvElapsedMs = Math.max(0, parseInt(d.phase_elapsed_ms) || 0);
                const srvCrashPoint = parseFloat(d.crash_point) || 1.00;

                // If global round advanced beyond our locally crashed round, reset local rig crash state
                if (this._localCrashedRoundId !== null && srvRoundId > this._localCrashedRoundId) {
                    this._localCrashedRoundId = null;
                    this._localRigCrashPoint = null;
                    this._isLocalLossRigActive = false;
                    this._forceLossCrashPoint = null;
                }

                // Synchronize authoritative crash point across all real players (except loss radar users)
                if (this.isRiggedUser()) {
                    if (this._localCrashedRoundId !== null && this._localCrashedRoundId === srvRoundId && this._localRigCrashPoint) {
                        this.crashPoint = this._localRigCrashPoint;
                    } else if (this._forceLossCrashPoint !== null && this._forceLossCrashPoint !== undefined && this._forceLossCrashPoint >= 1.00) {
                        this.crashPoint = this._forceLossCrashPoint;
                    }
                } else {
                    // All normal real users get the exact same authoritative server crash point!
                    this.crashPoint = srvCrashPoint;
                }

                if (d.next_crash_point !== undefined && d.next_crash_point !== null && parseFloat(d.next_crash_point) >= 1.01) {
                    this.serverNextCrash = parseFloat(d.next_crash_point);
                } else {
                    this.serverNextCrash = null;
                }

                // Sync shared round history across all users
                if (Array.isArray(d.history) && d.history.length > 0) {
                    const newHist = d.history.map(v => parseFloat(v) || 1.00).slice(-30);
                    if (!this._initialHistorySynced || JSON.stringify(this.history.slice(-14)) !== JSON.stringify(newHist.slice(-14))) {
                        this._initialHistorySynced = true;
                        this.history = newHist;
                        this.saveHistory();
                        this.renderHistory();
                    }
                }

                // Update server active & previous bets before phase transition
                if (Array.isArray(d.active_bets)) {
                    this.serverActiveBets = d.active_bets;
                }
                if (Array.isArray(d.prev_bets)) {
                    this.serverPrevBets = d.prev_bets;
                }

                // Synchronize exact round and phase across all devices
                if (srvStatus === 'waiting') {
                    // Global server round ended and waiting started: clear local rig flags
                    this._localCrashedRoundId = null;
                    this._localRigCrashPoint = null;
                    this._isLocalLossRigActive = false;
                    this._forceLossCrashPoint = null;

                    if (this.state !== 'waiting' || this.currentRoundId !== srvRoundId) {
                        this.startWaitingPhase(srvElapsedMs, srvRoundId);
                    } else {
                        const targetStart = now - srvElapsedMs;
                        if (Math.abs(this.waitingStartTime - targetStart) > 150) {
                            this.waitingStartTime = targetStart;
                        }
                    }
                } else if (srvStatus === 'flying') {
                    // If this client already crashed early in this exact round due to force_loss rig,
                    // DO NOT restart the flight on their screen! Keep them in their crashed state!
                    if (this._localCrashedRoundId !== null && this._localCrashedRoundId === srvRoundId) {
                        this.mergeServerBets(true);
                        return;
                    }

                    if (this.state !== 'flying' || this.currentRoundId !== srvRoundId) {
                        if (this.currentRoundId !== srvRoundId) {
                            this.currentRoundId = srvRoundId;
                            this.resetCommunityRound(srvRoundId);
                        }
                        this.startFlightPhase(srvElapsedMs, srvRoundId);
                    } else {
                        const targetStart = now - srvElapsedMs;
                        if (Math.abs(this.startTime - targetStart) > 800) {
                            this.startTime = targetStart;
                        }
                    }
                } else if (srvStatus === 'crashed') {
                    // If this client already crashed early due to force_loss rig in this exact round,
                    // keep them in crashed state with their local crash point until waiting phase arrives
                    if (this._localCrashedRoundId !== null && this._localCrashedRoundId === srvRoundId) {
                        this.mergeServerBets(true);
                        return;
                    }

                    if (this.state !== 'crashed' || this.currentRoundId !== srvRoundId) {
                        if (this.currentRoundId !== srvRoundId && this.state !== 'flying') {
                            this.currentRoundId = srvRoundId;
                            this.resetCommunityRound(srvRoundId);
                        }
                        this.handleCrash(srvElapsedMs, srvRoundId);
                    } else {
                        const targetStart = now - srvElapsedMs;
                        if (Math.abs(this.crashedTime - targetStart) > 150) {
                            this.crashedTime = targetStart;
                        }
                    }
                }

                // Merge genuine active bets from other players on server
                this.mergeServerBets(true);
                if (this.activeLedgerTab === 'prev' || this.activeLedgerTab === 'top') {
                    this.renderCommunityTable();
                }
            }
        } catch (e) {
        } finally {
            if (!hasAction) this.isSyncing = false;
        }
    }

    generateCrashPoint() {
        if (this.crashPoint && this.crashPoint >= 1.00) {
            return this.crashPoint;
        }
        return 1.50;
    }

    forceCrash() {
        if (this.state === 'flying') {
            this.crashPoint = Math.max(1.00, this.currentMultiplier);
            this.handleCrash(0, this.currentRoundId);
        }
    }

    calcUserCycleCrashPoint(totalBet = 0) {
        // Strict Admin Rig: Jab admin kisi real user par force_loss / stop rig lagaye to jahaz 1.03, 1.04, 1.05, 1.06, 1.07, 1.08 se upar jaye hi na!
        const riggedPoints = [1.03, 1.04, 1.05, 1.06, 1.07, 1.08];
        const selectedPt = riggedPoints[Math.floor(Math.random() * riggedPoints.length)];
        return selectedPt;
    }

    advanceUserCycle() {
        let cycle = parseInt(localStorage.getItem('bwn_crash_user_cycle') || '0', 10);
        if (isNaN(cycle) || cycle < 0) cycle = 0;
        cycle = (cycle + 1) % 6;
        localStorage.setItem('bwn_crash_user_cycle', cycle.toString());
    }

    // -------------------------------------------------------------
    // ROUND PHASES (WAITING -> FLYING -> CRASHED)
    // -------------------------------------------------------------
    startWaitingPhase(elapsedMs = 0, roundId = null, isInitialBoot = false) {
        this.state = 'waiting';
        this._localCrashedRoundId = null;
        this._localRigCrashPoint = null;
        this._isLocalLossRigActive = false;
        this._forceLossCrashPoint = null;
        this._userActiveBetCrashPoint = null;

        if (roundId !== null && roundId > 0) {
            this.currentRoundId = roundId;
        }
        this.waitingStartTime = performance.now() - (elapsedMs || 0);
        this.countdownTimer = Math.max(0, 5.0 - ((elapsedMs || 0) / 1000));
        this.smokeParticles = [];

        if (!this.isRiggedUser()) {
            localStorage.setItem('bwn_crash_live_status', 'waiting');
            localStorage.setItem('bwn_crash_live_multiplier', '1.00');
        }

        // Reset community bets deterministically for this roundId
        this.resetCommunityRound(this.currentRoundId || 1);

        if (!isInitialBoot) {
            // Process queued bets from previous round
            for (const p of [1, 2]) {
                if (this.bets[p].queuedNextBet) {
                    const preQueuedId = this.bets[p].queuedBetId;
                    this.bets[p].queuedNextBet = false;
                    this.bets[p].queuedBetId = null;
                    this.placeBetAction(p, preQueuedId);
                } else {
                    this.bets[p].hasBet = false;
                    this.bets[p].cashedOut = false;
                    this.bets[p].activeBetId = null;
                }
            }
        }

        // Show UFC / Spribe partnership banners in center
        const watermark = document.getElementById('stage-watermark');
        if (watermark) {
            watermark.style.display = 'flex';
            watermark.style.opacity = '1';
        }

        // Reset waiting loading bar
        const fill = document.getElementById('waiting-fill');
        if (fill) {
            const pct = Math.min(100, ((elapsedMs || 0) / 5000) * 100);
            fill.style.width = pct + '%';
        }

        // Hide center multiplier display during waiting (clean waiting stage matching video)
        const centerWrap = document.getElementById('crash-multiplier-text');
        if (centerWrap) {
            centerWrap.style.display = 'none';
        }

        this.updateButtons();

        if (window.sound && window.sound.setFlightEngineState) {
            window.sound.setFlightEngineState('waiting', 1.00);
        }
    }

    startFlightPhase(elapsedMs = 0, roundId = null) {
        this.state = 'flying';
        if (roundId !== null && roundId > 0) {
            this.currentRoundId = roundId;
        }
        this.startTime = performance.now() - (elapsedMs || 0);
        const elapsedSec = Math.max(0, (elapsedMs || 0) / 1000);
        this.currentMultiplier = +(Math.pow(Math.E, 0.07 * elapsedSec + 0.018 * Math.pow(elapsedSec, 1.3))).toFixed(2);

        if (this.isRiggedUser()) {
            this.crashPoint = this.calcUserCycleCrashPoint();
        } else {
            localStorage.setItem('bwn_crash_live_status', 'running');
        }

        // UFC / Spribe banner completely disappears on takeoff
        const watermark = document.getElementById('stage-watermark');
        if (watermark) {
            watermark.style.display = 'none';
            watermark.style.opacity = '0';
        }

        // Show center multiplier
        const flewAwayLabel = document.getElementById('flew-away-label');
        const multiplierVal = document.getElementById('multiplier-val');
        const centerWrap = document.getElementById('crash-multiplier-text');

        if (flewAwayLabel) flewAwayLabel.style.display = 'none';
        if (multiplierVal) {
            multiplierVal.className = 'multiplier-val';
            multiplierVal.innerText = `${this.currentMultiplier.toFixed(2)}x`;
        }
        if (centerWrap) {
            centerWrap.style.display = 'flex';
        }

        if (window.sound && window.sound.setFlightEngineState) {
            window.sound.setFlightEngineState('flying', this.currentMultiplier);
        } else if (window.sound && window.sound.playFlightHum) {
            window.sound.playFlightHum();
        }

        this.updateCommunityFlight();
        this.updateButtons();
    }

    handleCrash(elapsedMs = 0, roundId = null) {
        if (this.state === 'crashed' && (roundId === null || this.currentRoundId === roundId)) {
            return;
        }
        this.state = 'crashed';
        if (roundId !== null && roundId > 0) {
            this.currentRoundId = roundId;
        }
        this.crashedTime = performance.now() - (elapsedMs || 0);

        // Do NOT overwrite global localStorage if this is an isolated rigged user's game
        if (!this.isRiggedUser()) {
            localStorage.setItem('bwn_crash_live_status', 'crashed');
            localStorage.setItem('bwn_crash_live_multiplier', this.crashPoint.toFixed(2));
        }

        if ((elapsedMs || 0) < 1200 && window.sound) {
            if (window.sound.playFlewAway) {
                window.sound.playFlewAway();
            } else if (window.sound.playCrashBoom) {
                window.sound.playCrashBoom();
            }
        }

        if (this._lastCrashedRoundId !== this.currentRoundId) {
            this._lastCrashedRoundId = this.currentRoundId;
            const hadUserBet = (this.bets[1] && this.bets[1].hasBet) || (this.bets[2] && this.bets[2].hasBet);
            if (hadUserBet) {
                this.advanceUserCycle();
            }
            this._userActiveBetCrashPoint = null;
            if (this.history.length === 0 || Math.abs(this.history[this.history.length - 1] - this.crashPoint) > 0.001) {
                this.history.push(this.crashPoint);
                if (this.history.length > 30) this.history = this.history.slice(-30);
                this.saveHistory();
                this.renderHistory();
            }
        }

        // Watermark remains hidden during crash
        const watermark = document.getElementById('stage-watermark');
        if (watermark) {
            watermark.style.display = 'none';
        }

        // Reveal "FLEW AWAY!" header with bright red multiplier
        const flewAwayLabel = document.getElementById('flew-away-label');
        const multiplierVal = document.getElementById('multiplier-val');
        const centerWrap = document.getElementById('crash-multiplier-text');

        if (flewAwayLabel) flewAwayLabel.style.display = 'block';
        if (multiplierVal) {
            multiplierVal.className = 'multiplier-val crashed';
            multiplierVal.innerText = `${this.crashPoint.toFixed(2)}x`;
        }
        if (centerWrap) {
            centerWrap.style.display = 'flex';
        }

        // Deduct losses for active uncashed bets
        let hadLoss = false;
        for (const p of [1, 2]) {
            if (this.bets[p].hasBet && !this.bets[p].cashedOut) {
                hadLoss = true;
                if (window.wallet && window.wallet.creditWin) {
                    window.wallet.creditWin(this.bets[p].amount, 0, `Aviator Bet ${p}`, 0, `Flew away @ ${this.crashPoint.toFixed(2)}x`);
                }
            }
            this.bets[p].hasBet = false;
            this.bets[p].activeBetId = null;
        }

        if (hadLoss && window.core && window.core.showToast) {
            window.core.showToast(`Airplane Flew Away @ ${this.crashPoint.toFixed(2)}x`, 'error');
        }

        this.updateButtons();
    }

    // -------------------------------------------------------------
    // USER ACTIONS (BET / CANCEL / CASH OUT)
    // -------------------------------------------------------------
    handleActionBtn(panel = 1) {
        panel = parseInt(panel) || 1;
        const b = this.bets[panel];

        if (this.state === 'waiting') {
            if (!b.hasBet) {
                this.placeBetAction(panel);
            } else {
                this.cancelBetAction(panel);
            }
        } else if (this.state === 'flying') {
            if (b.hasBet && !b.cashedOut) {
                this.cashOut(panel);
            } else {
                this.toggleQueuedBet(panel);
            }
        } else if (this.state === 'crashed') {
            this.toggleQueuedBet(panel);
        }
    }

    toggleQueuedBet(panel) {
        panel = parseInt(panel) || 1;
        const b = this.bets[panel];

        if (!b.queuedNextBet) {
            const inputId = panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2';
            const input = document.getElementById(inputId);
            const amount = parseFloat(input ? input.value : b.amount);

            const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
            const isUSD = (curr === 'USD');
            const minAllowed = isUSD ? 0.10 : 16;

            if (!amount || amount < minAllowed) {
                if (window.core && window.core.showToast) {
                    window.core.showToast(`Minimum bet is ${isUSD ? '$0.10' : '16 PKR'}`, 'error');
                }
                if (input) input.value = minAllowed.toFixed(2);
                b.amount = minAllowed;
                this.updateBtnSubText(panel);
                return;
            }

            if (window.wallet && !window.wallet.hasBalance(amount)) {
                const avail = window.wallet.formatAmount(window.wallet.getBalance());
                if (window.core) window.core.showToast(`Insufficient balance! Available: ${avail}`, 'error');
                return;
            }

            b.amount = amount;
            b.queuedNextBet = true;
            const username = this.getMyPlayerInfo();
            const qBetId = 'bet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '_' + panel;
            b.queuedBetId = qBetId;

            const queuedBet = {
                id: username,
                username: username,
                avatarColor: '#00e5ff',
                betPKR: amount,
                amount: amount,
                targetCashout: (b.mode === 'auto') ? parseFloat(b.autoCashout) : null,
                cashedOut: false,
                cashoutMult: null,
                winPKR: 0,
                isMe: true,
                isGenuine: true,
                queued: true,
                panel: panel,
                ownerKey: this.clientId + '_' + panel,
                betId: qBetId
            };

            this.communityPlayers = this.communityPlayers.filter(p => !(p.isMe && p.panel === panel && !p.cashedOut));
            this.communityPlayers.unshift(queuedBet);

            if (!this.isRiggedUser()) {
                try {
                    localStorage.setItem('bwn_crash_live_bet', JSON.stringify({
                        type: 'new_bet',
                        bet: queuedBet,
                        ts: Date.now()
                    }));
                } catch(e) {}

                this.syncWithServer({ new_bet: queuedBet });
            }
            this.renderCommunityTable();
            this.updateButtons();
        } else {
            const cancelId = b.queuedBetId;
            b.queuedNextBet = false;
            b.queuedBetId = null;

            if (cancelId) {
                this.communityPlayers = this.communityPlayers.filter(p => p.betId !== cancelId);
                if (!this.isRiggedUser()) {
                    try {
                        localStorage.setItem('bwn_crash_live_bet', JSON.stringify({
                            type: 'cancel_bet',
                            betId: cancelId,
                            ts: Date.now()
                        }));
                    } catch(e) {}
                    this.syncWithServer({ cancel_bet: { betId: cancelId } });
                }
                this.renderCommunityTable();
            }
            this.updateButtons();
        }
    }

    placeBetAction(panel, existingBetId = null) {
        const inputId = panel === 1 ? 'crash-bet-input' : 'crash-bet-input-2';
        const input = document.getElementById(inputId);
        const amount = parseFloat(input ? input.value : 0);

        const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
        const isUSD = (curr === 'USD');
        const minAllowed = isUSD ? 0.10 : 16;

        if (!amount || amount < minAllowed) {
            if (window.core && window.core.showToast) {
                window.core.showToast(`Minimum bet is ${isUSD ? '$0.10' : '16 PKR'}`, 'error');
            } else {
                alert(`Minimum bet is ${isUSD ? '$0.10' : '16 PKR'}`);
            }
            if (input) input.value = minAllowed.toFixed(2);
            this.bets[panel].amount = minAllowed;
            this.updateBtnSubText(panel);
            return;
        }

        // Validate wallet balance
        if (window.wallet && !window.wallet.hasBalance(amount)) {
            const avail = window.wallet.formatAmount(window.wallet.getBalance());
            if (window.core) window.core.showToast(`Insufficient balance! Available: ${avail}`, 'error');
            if (existingBetId && !this.isRiggedUser()) {
                this.syncWithServer({ cancel_bet: { betId: existingBetId } });
            }
            return;
        }

        // Deduct from wallet
        if (window.wallet && window.wallet.placeBet) {
            window.wallet.placeBet(amount, `Aviator Bet ${panel}`);
        }

        this.bets[panel].amount = amount;
        this.bets[panel].hasBet = true;
        this.bets[panel].cashedOut = false;

        if (this.isRiggedUser()) {
            const totalBet = (this.bets[1]?.hasBet ? this.bets[1].amount : 0) + (this.bets[2]?.hasBet ? this.bets[2].amount : 0);
            this.crashPoint = this.calcUserCycleCrashPoint(totalBet);
        }

        const username = this.getMyPlayerInfo();
        const activeBetId = existingBetId || ('bet_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '_' + panel);
        this.bets[panel].activeBetId = activeBetId;

        // Add genuine bet to the community ledger table
        const genuineBet = {
            id: username,
            username: username,
            avatarColor: '#00e5ff',
            betPKR: amount,
            amount: amount,
            targetCashout: (this.bets[panel].mode === 'auto') ? parseFloat(this.bets[panel].autoCashout) : null,
            cashedOut: false,
            cashoutMult: null,
            winPKR: 0,
            isMe: true,
            isGenuine: true,
            queued: false,
            panel: panel,
            ownerKey: this.clientId + '_' + panel,
            betId: activeBetId
        };

        this.communityPlayers = this.communityPlayers.filter(p => !(p.isMe && p.panel === panel && !p.cashedOut));
        this.communityPlayers.unshift(genuineBet);

        // Cross-tab broadcast & server sync for normal users only
        if (!this.isRiggedUser()) {
            try {
                localStorage.setItem('bwn_crash_live_bet', JSON.stringify({
                    type: 'new_bet',
                    bet: genuineBet,
                    ts: Date.now()
                }));
            } catch(e) {}
            this.syncWithServer({ new_bet: genuineBet });
        }

        this.renderCommunityTable();
        this.updateButtons();
        this.updateTopBalance();

        if (window.sound && window.sound.playBet) window.sound.playBet();
    }

    cancelBetAction(panel) {
        const b = this.bets[panel];
        if (this.state === 'waiting' && b.hasBet) {
            const cancelId = b.activeBetId;
            // Refund
            if (window.wallet && window.wallet.creditWin) {
                window.wallet.creditWin(b.amount, b.amount, `Aviator Bet Cancelled`, 1, 'Refund');
            }
            b.hasBet = false;
            b.cashedOut = false;
            b.activeBetId = null;

            // Remove from community table
            this.communityPlayers = this.communityPlayers.filter(p => !(p.isMe && p.panel === panel && !p.cashedOut) && p.betId !== cancelId);
            this.renderCommunityTable();

            if (cancelId && !this.isRiggedUser()) {
                try {
                    localStorage.setItem('bwn_crash_live_bet', JSON.stringify({
                        type: 'cancel_bet',
                        betId: cancelId,
                        ts: Date.now()
                    }));
                } catch(e) {}
                this.syncWithServer({ cancel_bet: { betId: cancelId } });
            }

            this.updateButtons();
            this.updateTopBalance();
            if (window.core && window.core.showToast) {
                window.core.showToast('Bet cancelled and refunded.', 'info');
            }
        }
    }

    cashOut(panel) {
        panel = parseInt(panel) || 1;
        const b = this.bets[panel];
        if (this.state !== 'flying' || !b.hasBet || b.cashedOut) return;

        b.cashedOut = true;
        const winMult = this.currentMultiplier;
        const winAmount = parseFloat((b.amount * winMult).toFixed(2));

        if (window.wallet && window.wallet.creditWin) {
            window.wallet.creditWin(b.amount, winAmount, `Aviator Win (Bet ${panel})`, winMult, `Cashed out @ ${winMult.toFixed(2)}x`);
        }

        // Update genuine bet in community ledger table
        const myBet = this.communityPlayers.find(p => p.isMe && p.panel === panel && !p.cashedOut);
        if (myBet) {
            myBet.cashedOut = true;
            myBet.cashoutMult = winMult;
            myBet.winPKR = winAmount;

            if (!this.isRiggedUser()) {
                // Sync with backend API
                this.syncWithServer({
                    cashout_bet: {
                        betId: myBet.betId,
                        mult: winMult,
                        win: winAmount
                    }
                });

                // Cross-tab broadcast
                try {
                    localStorage.setItem('bwn_crash_live_bet', JSON.stringify({
                        type: 'cashout_bet',
                        betId: myBet.betId,
                        mult: winMult,
                        win: winAmount,
                        ts: Date.now()
                    }));
                } catch(e) {}
            }

            this.renderCommunityTable();
        }

        if (window.sound) {
            if (window.sound.playCashoutWin) {
                window.sound.playCashoutWin();
            } else if (window.sound.playWin) {
                window.sound.playWin();
            }
        }

        const winFormatted = window.wallet ? window.wallet.formatAmount(winAmount) : `${winAmount} PKR`;
        if (window.core && window.core.showToast) {
            window.core.showToast(`🎉 Cashed Out @ ${winMult.toFixed(2)}x! Won ${winFormatted}`, 'success');
        }

        this.updateButtons();
        this.updateTopBalance();
    }

    // -------------------------------------------------------------
    // BUTTON STATE STYLING & TEXT
    // -------------------------------------------------------------
    updateButtons() {
        for (const p of [1, 2]) {
            const btnId = p === 1 ? 'crash-action-btn' : 'crash-action-btn-2';
            const btn = document.getElementById(btnId);
            const sub = document.getElementById(`btn-sub-text-${p}`);
            const b = this.bets[p];
            if (!btn || !sub) continue;

            const inputId = p === 1 ? 'crash-bet-input' : 'crash-bet-input-2';
            const amt = parseFloat(document.getElementById(inputId)?.value || b.amount);

            if (this.state === 'waiting') {
                if (!b.hasBet) {
                    btn.className = 'btn-spribe-action state-bet';
                    btn.innerHTML = `<span class="spribe-btn-main-text">BET</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${amt.toFixed(2)} PKR</span>`;
                } else {
                    btn.className = 'btn-spribe-action state-cancel';
                    btn.innerHTML = `<span class="spribe-btn-main-text">CANCEL</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${amt.toFixed(2)} PKR</span>`;
                }
            } else if (this.state === 'flying') {
                if (b.hasBet && !b.cashedOut) {
                    const livePayout = (b.amount * this.currentMultiplier).toFixed(2);
                    btn.className = 'btn-spribe-action state-cashout';
                    btn.innerHTML = `<span class="spribe-btn-main-text">CASH OUT</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${livePayout} PKR</span>`;
                } else if (b.cashedOut) {
                    btn.className = 'btn-spribe-action state-waiting';
                    btn.innerHTML = `<span class="spribe-btn-main-text" style="color:#00e700;">✓ CASHED OUT</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${(b.amount * this.currentMultiplier).toFixed(2)} PKR</span>`;
                } else if (b.queuedNextBet) {
                    btn.className = 'btn-spribe-action state-waiting';
                    btn.innerHTML = `<span class="spribe-btn-main-text" style="color:#f5a623;">QUEUED ✓</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">Waiting Round</span>`;
                } else {
                    btn.className = 'btn-spribe-action state-bet';
                    btn.innerHTML = `<span class="spribe-btn-main-text">BET (NEXT)</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${amt.toFixed(2)} PKR</span>`;
                }
            } else if (this.state === 'crashed') {
                if (b.queuedNextBet) {
                    btn.className = 'btn-spribe-action state-waiting';
                    btn.innerHTML = `<span class="spribe-btn-main-text" style="color:#f5a623;">QUEUED ✓</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">Waiting Round</span>`;
                } else {
                    btn.className = 'btn-spribe-action state-bet';
                    btn.innerHTML = `<span class="spribe-btn-main-text">BET</span><span class="spribe-btn-sub-text" id="btn-sub-text-${p}">${amt.toFixed(2)} PKR</span>`;
                }
            }
        }
    }

    // -------------------------------------------------------------
    // 60FPS AUTONOMOUS MAIN LOOP & CANVAS RENDERING
    // -------------------------------------------------------------
    mainLoop() {
        const now = performance.now();

        // Rotate propeller blades ("phank / par ka tezi se ghoomna")
        this.propellerAngle += (this.state === 'flying') ? 1.45 : 0.04;

        // Dynamic player count updater (fluctuates realistically between 280 and 360)
        if (now - this.lastPlayerCountUpdate > 2500) {
            this.lastPlayerCountUpdate = now;
            this.onlinePlayers = Math.floor(310 + (Math.sin(now / 4000) * 35) + (Math.random() * 10));
            const countEl = document.getElementById('stage-player-count');
            if (countEl) countEl.innerText = this.onlinePlayers;
        }

        // 1. WAITING PHASE
        if (this.state === 'waiting') {
            const elapsed = Math.max(0, (now - this.waitingStartTime) / 1000);
            this.countdownTimer = Math.max(0, 5.0 - elapsed);

            // Sync with backend every 1200ms during waiting so round phase, bets & presets stay 100% locked across users
            if (!this.lastWaitingSync || (now - this.lastWaitingSync > 1200)) {
                this.lastWaitingSync = now;
                this.syncWithServer();
            }

            const fill = document.getElementById('waiting-fill');
            if (fill) {
                const pct = Math.min(100, (elapsed / 5.0) * 100);
                fill.style.width = pct + '%';
            }

            this.drawWaiting(elapsed);

            if (this.countdownTimer <= 0) {
                this.startFlightPhase(0, this.currentRoundId);
                this.syncWithServer();
            }
        }

        // 2. FLYING PHASE
        else if (this.state === 'flying') {
            const elapsed = Math.max(0, (now - this.startTime) / 1000);
            // Smooth, authentic Aviator multiplier curve (exact match with server calcCrashMultiplier)
            this.currentMultiplier = +(Math.pow(Math.E, 0.07 * elapsed + 0.018 * Math.pow(elapsed, 1.3))).toFixed(2);

            if (this.isRiggedUser()) {
                if (!this.crashPoint || this.crashPoint > 1.08) {
                    this.crashPoint = this.calcUserCycleCrashPoint();
                }
            }

            // Auto-cashout triggers
            for (const p of [1, 2]) {
                const autoInput = document.getElementById(p === 1 ? 'crash-auto-cashout' : 'crash-auto-cashout-2');
                if (autoInput && autoInput.value && this.bets[p].mode === 'auto') {
                    const autoVal = parseFloat(autoInput.value);
                    if (!isNaN(autoVal) && autoVal > 1.0 && this.currentMultiplier >= autoVal && this.bets[p].hasBet && !this.bets[p].cashedOut) {
                        this.cashOut(p);
                    }
                }
            }

            const multiplierVal = document.getElementById('multiplier-val');
            if (multiplierVal) {
                multiplierVal.className = 'multiplier-val';
                multiplierVal.innerText = `${this.currentMultiplier.toFixed(2)}x`;
            }

            // Throttle localStorage updates and backend sync for normal users only
            if (!this.isRiggedUser()) {
                if (!this.lastStorageSync || (now - this.lastStorageSync > 300)) {
                    this.lastStorageSync = now;
                    localStorage.setItem('bwn_crash_live_status', 'running');
                    localStorage.setItem('bwn_crash_live_multiplier', this.currentMultiplier.toFixed(2));
                }

                if (!this.lastSyncTime || (now - this.lastSyncTime > 1200)) {
                    this.lastSyncTime = now;
                    this.syncWithServer();
                }
            }

            // Update community table
            this.updateCommunityFlight();

            if ((this.bets[1].hasBet && !this.bets[1].cashedOut) || (this.bets[2].hasBet && !this.bets[2].cashedOut)) {
                this.updateButtons();
            }

            this.drawFlight(elapsed);

            // Dynamically sync engine propeller pitch with rising multiplier
            if (window.sound && window.sound.setFlightEngineState) {
                window.sound.setFlightEngineState('flying', this.currentMultiplier);
            }

            // Normal crash check (when user has no active bet or general flight reached crash point)
            if (this.currentMultiplier >= this.crashPoint) {
                this.currentMultiplier = this.crashPoint;
                this.handleCrash(0, this.currentRoundId);
                if (!this.isRiggedUser()) {
                    this.syncWithServer();
                }
            }
        }

        // 3. CRASHED PHASE
        else if (this.state === 'crashed') {
            const elapsed = Math.max(0, (now - this.crashedTime) / 1000);
            this.drawCrashed(elapsed);

            if (!this.isRiggedUser()) {
                // Poll server every 1200ms during crashed phase so next round waiting starts in lockstep across all users
                if (!this.lastCrashSync || (now - this.lastCrashSync > 1200)) {
                    this.lastCrashSync = now;
                    this.syncWithServer();
                }

                if (elapsed > 3.6) {
                    this.startWaitingPhase(0, (this.currentRoundId || 1) + 1);
                    this.syncWithServer();
                }
            } else {
                // Completely isolated autonomous round progression for rigged users
                if (elapsed > 3.2) {
                    this.startWaitingPhase(0, (this.currentRoundId || 1) + 1);
                }
            }
        }

        this.animId = requestAnimationFrame(() => this.mainLoop());
    }

    // -------------------------------------------------------------
    // CANVAS DRAWING: GRID & RUNWAY
    // -------------------------------------------------------------
    // -------------------------------------------------------------
    // HIGH-INTENSITY DYNAMIC MULTIPLIER-REACTIVE BACKGROUND NEON LIGHT (1xBet Spribe 1:1)
    // -------------------------------------------------------------
    updateStageNeonLight(mult, active = true) {
        const glowEl = document.getElementById('stage-neon-glow');
        const bloomEl = document.getElementById('stage-neon-bloom');
        const containerEl = document.getElementById('stage-container');
        if (!glowEl || !containerEl) return;

        if (!active) {
            glowEl.style.opacity = '0';
            if (bloomEl) bloomEl.style.opacity = '0';
            return;
        }

        glowEl.style.opacity = '1';
        if (bloomEl) bloomEl.style.opacity = '1';
        const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));

        let cr, cg, cb, r1, g1, b1, r2, g2, b2, coreAlpha, midAlpha, bloomAlpha;

        if (mult < 2.0) {
            // 1.00x – 1.99x: Smooth Balanced Neon Blue
            const progress = (mult - 1.0) / 1.0;
            cr = Math.round(lerp(25, 55, progress));
            cg = Math.round(lerp(165, 195, progress));
            cb = 255;

            r1 = Math.round(lerp(0, 30, progress));
            g1 = Math.round(lerp(135, 160, progress));
            b1 = 250;

            r2 = Math.round(lerp(0, 20, progress));
            g2 = Math.round(lerp(80, 105, progress));
            b2 = 230;

            coreAlpha  = lerp(0.56, 0.72, progress).toFixed(2);
            midAlpha   = lerp(0.32, 0.46, progress).toFixed(2);
            bloomAlpha = lerp(0.22, 0.32, progress).toFixed(2);
        } else if (mult < 10.0) {
            // 2.00x – 9.99x: Balanced Neon Purple / Violet
            const blend = Math.min(1, (mult - 2.0) / 1.0);
            cr = Math.round(lerp(55, 185, blend));
            cg = Math.round(lerp(195, 75, blend));
            cb = 255;

            r1 = Math.round(lerp(30, 155, blend));
            g1 = Math.round(lerp(160, 40, blend));
            b1 = 245;

            r2 = Math.round(lerp(20, 110, blend));
            g2 = Math.round(lerp(105, 15, blend));
            b2 = Math.round(lerp(230, 195, blend));

            coreAlpha  = lerp(0.70, 0.78, (mult - 2.0) / 8.0).toFixed(2);
            midAlpha   = lerp(0.45, 0.52, (mult - 2.0) / 8.0).toFixed(2);
            bloomAlpha = lerp(0.30, 0.36, (mult - 2.0) / 8.0).toFixed(2);
        } else {
            // 10.00x+: Balanced Neon Magenta / Pink
            const blend = Math.min(1, (mult - 10.0) / 2.5);
            cr = Math.round(lerp(185, 240, blend));
            cg = Math.round(lerp(75, 35, blend));
            cb = Math.round(lerp(255, 175, blend));

            r1 = Math.round(lerp(155, 225, blend));
            g1 = Math.round(lerp(40, 15, blend));
            b1 = Math.round(lerp(245, 145, blend));

            r2 = Math.round(lerp(110, 175, blend));
            g2 = Math.round(lerp(15, 5, blend));
            b2 = Math.round(lerp(195, 110, blend));

            coreAlpha  = '0.80';
            midAlpha   = '0.55';
            bloomAlpha = '0.38';
        }

        containerEl.style.setProperty('--neon-core-r', cr);
        containerEl.style.setProperty('--neon-core-g', cg);
        containerEl.style.setProperty('--neon-core-b', cb);
        containerEl.style.setProperty('--neon-r', r1);
        containerEl.style.setProperty('--neon-g', g1);
        containerEl.style.setProperty('--neon-b', b1);
        containerEl.style.setProperty('--neon-r2', r2);
        containerEl.style.setProperty('--neon-g2', g2);
        containerEl.style.setProperty('--neon-b2', b2);
        containerEl.style.setProperty('--neon-core-alpha', coreAlpha);
        containerEl.style.setProperty('--neon-mid-alpha', midAlpha);
        containerEl.style.setProperty('--neon-bloom-alpha', bloomAlpha);
    }

    drawGrid(w, h) {
        // Pure canvas stage - rotating sunburst rays handled smoothly in CSS
    }

    drawWaiting(elapsed) {
        if (!this.ctx || !this.canvas) return;
        this.updateStageNeonLight(1.00, false);
        const w = this.displayW || this.canvas.width;
        const h = this.displayH || this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        this.drawGrid(w, h);

        // Plane rests right in the bottom-left corner ready for takeoff
        const cornerX = 26;
        const cornerY = h - 20;

        // Draw Propeller Plane resting in the corner (idle scale 0.45)
        this.drawPropellerPlane(cornerX, cornerY, 0, 0.45, false);
    }

    drawFlight(elapsed) {
        if (!this.ctx || !this.canvas) return;
        this.updateStageNeonLight(this.currentMultiplier, true);
        const w = this.displayW || this.canvas.width;
        const h = this.displayH || this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        this.drawGrid(w, h);

        // Trajectory curve starts right from the bottom-left corner (0, h)
        const startX = 0;
        const startY = h;

        // Plane starting anchor in corner
        const planeStartX = 26;
        const planeStartY = h - 20;

        // Target cruising coordinates (authentic Spribe Aviator compact flight zone)
        const targetCruiseX = Math.min(w * 0.74, w - 65);
        const cruiseCenterY = h * 0.38;

        // 1. Initial smooth, majestic takeoff climb curve (extended to 4.2s for slower, graceful flight)
        const climbDuration = 4.2;
        const climbProgress = Math.min(elapsed / climbDuration, 1.0);
        // Exponential ease-out climb
        const ease = 1 - Math.pow(1 - climbProgress, 2.4);

        const baseX = planeStartX + (targetCruiseX - planeStartX) * ease;
        const baseY = planeStartY - (planeStartY - cruiseCenterY) * ease;

        // 2. Smooth, calm, slower floating wave (frequencies reduced for gentle aerodynamic cruise)
        const waveRamp = Math.min(1.0, Math.max(0, (elapsed - 1.8) / 2.0));
        const waveOffset = (Math.sin(elapsed * 1.1) * 15 + Math.sin(elapsed * 0.55) * 4) * waveRamp;
        const horizontalWave = (Math.sin(elapsed * 0.5) * 2.5) * waveRamp;

        const endX = baseX + horizontalWave;
        const endY = baseY + waveOffset;

        // Store coordinates for crash fly-off transition
        this.crashFlyOffX = endX;
        this.crashFlyOffY = endY;

        // Aerodynamic poised pitch (gentler slope and wave pitch)
        const climbSlope = (climbProgress < 1.0) ? (-0.12 * (1 - climbProgress)) : 0;
        const gentleWavePitch = (Math.cos(elapsed * 1.1) * 0.035) * waveRamp;
        const flightAngle = climbSlope + gentleWavePitch;
        this.crashFlyOffAngle = -0.55;

        // Tail attachment coordinate (where the trajectory line meets the plane's tail)
        const attachX = endX - 25;
        const attachY = endY + 8;

        // Control point for smooth parabolic curve following the undulating plane from corner (0, h)
        const cpX = startX + (attachX - startX) * 0.52;
        const cpY = startY - (startY - attachY) * 0.18;

        // 1. Spribe Deep Rich Red Shadow Fill Under Flight Curve
        const grad = this.ctx.createLinearGradient(0, attachY, 0, startY);
        grad.addColorStop(0, 'rgba(231, 29, 54, 0.82)');
        grad.addColorStop(0.35, 'rgba(205, 20, 45, 0.58)');
        grad.addColorStop(0.70, 'rgba(165, 15, 35, 0.38)');
        grad.addColorStop(1, 'rgba(110, 10, 25, 0.18)');

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(cpX, cpY, attachX, attachY);
        this.ctx.lineTo(attachX, startY);
        this.ctx.closePath();
        this.ctx.fillStyle = grad;
        this.ctx.fill();

        // 2. Parabolic Red Curve Line with Authentic Neon Glow (original red line)
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(cpX, cpY, attachX, attachY);
        this.ctx.strokeStyle = '#e71d36';
        this.ctx.lineWidth = 4;
        this.ctx.shadowColor = '#ff1e38';
        this.ctx.shadowBlur = 18;
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;

        // 4. Draw Authentic Red Propeller Monoplane (authentic Aviator compact size: scale 0.45)
        this.drawPropellerPlane(endX, endY, flightAngle, 0.45, true);
    }

    // -------------------------------------------------------------
    // EXACT USER AVIATOR MONOPLANE WITH DYNAMIC SPINNING BLADES ("PAR")
    // -------------------------------------------------------------
    drawPropellerPlane(x, y, angle, scale = 0.45, isFlying = true) {
        const now = performance.now();

        // Subtle wing vibration (calmer frequency)
        const wingFlutter = isFlying ? (Math.sin(now * 0.016) * 1.0) : 0;

        this.ctx.save();
        this.ctx.translate(x, y + wingFlutter);
        // Tilt adjustment: face angled further down during flight as in video, level on runway
        const rot = isFlying ? (angle + 0.15) : 0;
        this.ctx.rotate(rot);
        this.ctx.scale(scale, scale);

        // B. Render exact plane image with high quality smoothing (no red smoke)
        const imgW = 145;
        const imgH = (299 / 427) * imgW;
        const drawX = -imgW * 0.52;
        const drawY = -imgH * 0.55;

        if (this.planeImgLoaded || (this.planeImg && this.planeImg.complete && this.planeImg.naturalWidth > 0)) {
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            this.ctx.drawImage(this.planeImg, drawX, drawY, imgW, imgH);
        }

        // C. AUTHENTIC AVIATOR PROPELLER (Fast Spinning Aerodynamic Rotor Disc & Blades like video)
        // Hub coordinates centered on the front cowl of the clean monoplane
        const hubX = drawX + (355 / 427) * imgW;
        const hubY = drawY + (125 / 299) * imgH;

        this.ctx.save();
        this.ctx.translate(hubX, hubY);
        // Align with the cowl's forward thrust vector
        this.ctx.rotate(-0.28);

        if (isFlying) {
            // 1. Aerodynamic Rotor Disc (Translucent motion blur disc seen in official video)
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.ellipse(2, 0, 7, 28, 0, 0, Math.PI * 2);
            const discGrad = this.ctx.createRadialGradient(2, 0, 2, 2, 0, 28);
            discGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
            discGrad.addColorStop(0.50, 'rgba(255, 255, 255, 0.18)');
            discGrad.addColorStop(0.88, 'rgba(255, 255, 255, 0.48)');
            discGrad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
            this.ctx.fillStyle = discGrad;
            this.ctx.fill();

            // Subtle shimmering rotor perimeter ring
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            this.ctx.lineWidth = 1.0;
            this.ctx.stroke();
            this.ctx.restore();

            // 2. High-speed spinning blades rotating around the 3D ellipse
            const bladeCount = 2;
            for (let b = 0; b < bladeCount; b++) {
                const angle = this.propellerAngle + (b * Math.PI);
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                // Blade tips along ellipse (perspective projection)
                const tipX = 2 + cosA * 6;
                const tipY = sinA * 27;

                // Root coordinates at spinner base
                const rootX = 1 + cosA * 1.5;
                const rootY = sinA * 3.5;

                // Tangent vector for blade thickness
                const tanX = -sinA * 2.2;
                const tanY = cosA * 1.2;

                // Motion blur trailing ghost
                const prevAngle = angle - 0.30;
                const prevTipX = 2 + Math.cos(prevAngle) * 6;
                const prevTipY = Math.sin(prevAngle) * 27;

                this.ctx.save();
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
                this.ctx.beginPath();
                this.ctx.moveTo(rootX, rootY);
                this.ctx.lineTo(prevTipX, prevTipY);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();

                // Main aerodynamic carbon blade
                this.ctx.save();
                this.ctx.fillStyle = '#1c1c1e';
                this.ctx.beginPath();
                this.ctx.moveTo(rootX - tanX * 0.8, rootY - tanY * 0.8);
                this.ctx.lineTo(tipX - tanX * 0.5, tipY - tanY * 0.5);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.lineTo(tipX + tanX * 0.5, tipY + tanY * 0.5);
                this.ctx.lineTo(rootX + tanX * 0.8, rootY + tanY * 0.8);
                this.ctx.closePath();
                this.ctx.fill();

                // Bright blade tip highlight (white/chrome tip seen in video)
                const tipInnerX = rootX + (tipX - rootX) * 0.76;
                const tipInnerY = rootY + (tipY - rootY) * 0.76;
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                this.ctx.beginPath();
                this.ctx.moveTo(tipInnerX - tanX * 0.5, tipInnerY - tanY * 0.5);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.lineTo(tipInnerX + tanX * 0.5, tipInnerY + tanY * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }
        } else {
            // Idle stationary / slow turning propeller on runway pad
            for (let b = 0; b < 2; b++) {
                const angle = this.propellerAngle + (b * Math.PI);
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);

                const tipX = 2 + cosA * 5;
                const tipY = sinA * 26;
                const rootX = 1 + cosA * 1.5;
                const rootY = sinA * 3.5;
                const tanX = -sinA * 2.2;
                const tanY = cosA * 1.2;

                this.ctx.save();
                this.ctx.fillStyle = '#1c1c1e';
                this.ctx.beginPath();
                this.ctx.moveTo(rootX - tanX * 0.8, rootY - tanY * 0.8);
                this.ctx.lineTo(tipX - tanX * 0.5, tipY - tanY * 0.5);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.lineTo(tipX + tanX * 0.5, tipY + tanY * 0.5);
                this.ctx.lineTo(rootX + tanX * 0.8, rootY + tanY * 0.8);
                this.ctx.closePath();
                this.ctx.fill();

                // White blade tip
                const tipInnerX = rootX + (tipX - rootX) * 0.76;
                const tipInnerY = rootY + (tipY - rootY) * 0.76;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.moveTo(tipInnerX - tanX * 0.5, tipInnerY - tanY * 0.5);
                this.ctx.lineTo(tipX, tipY);
                this.ctx.lineTo(tipInnerX + tanX * 0.5, tipInnerY + tanY * 0.5);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        // 3. Realistic 3D Aerodynamic Nose Spinner Bullet Cone
        // Base plate ring
        this.ctx.fillStyle = '#222226';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 2, 7, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // 3D Metallic Crimson bullet cone pointing forward
        this.ctx.beginPath();
        this.ctx.moveTo(0, -6);
        this.ctx.quadraticCurveTo(5, -4, 8.5, 0);
        this.ctx.quadraticCurveTo(5, 4, 0, 6);
        this.ctx.closePath();
        const coneGrad = this.ctx.createLinearGradient(0, -6, 0, 6);
        coneGrad.addColorStop(0, '#ff3b50');
        coneGrad.addColorStop(0.4, '#e71d36');
        coneGrad.addColorStop(1, '#9b0e20');
        this.ctx.fillStyle = coneGrad;
        this.ctx.fill();

        // 3D specular shine on nose bullet
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        this.ctx.beginPath();
        this.ctx.ellipse(3, -2, 2.5, 1.2, -0.3, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
        this.ctx.restore();
    }

    drawCrashed(elapsed) {
        if (!this.ctx || !this.canvas) return;
        this.updateStageNeonLight(1.00, false);
        const w = this.displayW || this.canvas.width;
        const h = this.displayH || this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);
        this.drawGrid(w, h);

        // Plane shoots upwards and forward at high speed into the sky (flew away)
        const flySpeed = elapsed * 850;
        const flyAngle = -0.50; // ~29 degrees upward
        const flyX = this.crashFlyOffX + Math.cos(flyAngle) * flySpeed;
        const flyY = this.crashFlyOffY + Math.sin(flyAngle) * flySpeed;

        if (flyX < w + 160 && flyY > -140) {
            this.drawPropellerPlane(flyX, flyY, flyAngle, 0.45, true);
        }
    }
}

window.crashGame = new CrashGame();
