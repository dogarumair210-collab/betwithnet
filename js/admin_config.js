// ============================================================
// Bet With Net - Master Admin Control Configuration Engine
// Manages RTP & Win/Loss %, Game Min/Max Betting Limits,
// Instant Crash Triggers, Rigging Modes & Cashier Switches
// ============================================================

class AdminConfig {
    constructor() {
        this.STORAGE_KEY = 'bwn_admin_config';
        this.config = this.load();
        this.syncFinancialFlags();
    }

    getDefaultConfig() {
        return {
            rigMode: 'normal', // 'normal' | 'force_win' | 'force_loss'
            globalWinRate: 48, // 0 to 100%
            globalMinBet: 0.50, // Default USD $0.50
            globalMaxBet: 1000.00, // Default USD $1,000.00
            autoApproveDeposits: false,
            autoApproveWithdrawals: false,
            adminPin: '9824',
            adminPinHash: 'e6962f979727453eb5a43588dae09ec4e3d93822ee4cf4d6bb0e0ab77db594a5',
            masterPin: '8391',
            masterPinHash: 'f4fbc5218d6a6c0b3967d1ab31aa9ca5a0f2b3b0d2fe851214fcbcbebbab7f06',
            games: {
                crash: { winRate: 35, minBet: 0.50, maxBet: 2500.00, houseEdge: 8 },
                card: { winRate: 48, minBet: 1.00, maxBet: 1500.00 },
                roulette: { winRate: 48, minBet: 1.00, maxBet: 2000.00, forceOutcome: null },
                slots: { winRate: 45, minBet: 0.20, maxBet: 500.00, forceJackpot: false },
                dice: { winRate: 49, minBet: 0.50, maxBet: 1500.00 },
                wheel: { winRate: 45, minBet: 1.00, maxBet: 1000.00, forceJackpot: false },
                plinko: { winRate: 48, minBet: 0.50, maxBet: 1000.00 },
                limbo: { winRate: 6, minBet: 0.50, maxBet: 2500.00 },
                mines: { winRate: 48, minBet: 0.50, maxBet: 1000.00 },
                keno: { winRate: 45, minBet: 0.50, maxBet: 500.00 },
                bingo: { winRate: 45, minBet: 1.00, maxBet: 500.00 },
                blackjack: { winRate: 8, minBet: 2.00, maxBet: 5000.00 },
                poker: { winRate: 45, minBet: 1.00, maxBet: 1000.00 },
                lucky: { winRate: 48, minBet: 0.50, maxBet: 500.00 },
                scratch: { winRate: 45, minBet: 1.00, maxBet: 500.00 },
                coinflip: { winRate: 49, minBet: 0.50, maxBet: 2000.00 },
                hilo: { winRate: 48, minBet: 1.00, maxBet: 1500.00 }
            }
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const def = this.getDefaultConfig();
                const mergedGames = { ...def.games, ...(parsed.games || {}) };
                if (mergedGames.limbo && mergedGames.limbo.winRate > 6) {
                    mergedGames.limbo.winRate = 6;
                }
                if (mergedGames.blackjack && mergedGames.blackjack.winRate > 10) {
                    mergedGames.blackjack.winRate = 8;
                }
                return {
                    ...def,
                    ...parsed,
                    games: mergedGames
                };
            }
        } catch (e) {
            console.warn('Failed to load admin config, using defaults');
        }
        return this.getDefaultConfig();
    }

    save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.config));
            this.syncFinancialFlags();
        } catch (e) {
            console.error('Failed to save admin config:', e);
        }
    }

    syncFinancialFlags() {
        localStorage.setItem('bwn_admin_auto_approve_dep', this.config.autoApproveDeposits ? 'true' : 'false');
        localStorage.setItem('bwn_admin_auto_approve_wth', this.config.autoApproveWithdrawals ? 'true' : 'false');
    }

    // Win Rate Queries
    normalizeGameId(gameId) {
        if (!gameId) return 'crash';
        const lower = gameId.toLowerCase();
        if (lower.includes('crash')) return 'crash';
        if (lower.includes('card') || lower.includes('dragon')) return 'card';
        if (lower.includes('roulette')) return 'roulette';
        if (lower.includes('slot')) return 'slots';
        if (lower.includes('dice')) return 'dice';
        if (lower.includes('wheel')) return 'wheel';
        if (lower.includes('plinko')) return 'plinko';
        if (lower.includes('limbo')) return 'limbo';
        if (lower.includes('mine')) return 'mines';
        if (lower.includes('keno')) return 'keno';
        if (lower.includes('bingo')) return 'bingo';
        if (lower.includes('blackjack') || lower.includes('21')) return 'blackjack';
        if (lower.includes('poker')) return 'poker';
        if (lower.includes('lucky') || lower.includes('777')) return 'lucky';
        if (lower.includes('scratch')) return 'scratch';
        if (lower.includes('coin')) return 'coinflip';
        if (lower.includes('hilo') || lower.includes('hi-lo')) return 'hilo';
        return lower;
    }

    getGameWinRate(gameId) {
        const id = this.normalizeGameId(gameId);
        if (this.config.rigMode === 'force_win') return 100;
        if (this.config.rigMode === 'force_loss') return 0;
        if (this.config.games && this.config.games[id] && this.config.games[id].winRate !== undefined) {
            return this.config.games[id].winRate;
        }
        return this.config.globalWinRate || 48;
    }

    setGameWinRate(gameId, rate) {
        const id = this.normalizeGameId(gameId);
        rate = Math.max(0, Math.min(100, parseInt(rate, 10) || 0));
        if (!this.config.games) this.config.games = {};
        if (!this.config.games[id]) this.config.games[id] = {};
        this.config.games[id].winRate = rate;
        this.save();
    }

    // Min & Max Betting Limits
    getGameMinBet(gameId) {
        const id = this.normalizeGameId(gameId);
        if (this.config.games && this.config.games[id] && this.config.games[id].minBet !== undefined) {
            return parseFloat(this.config.games[id].minBet);
        }
        return this.config.globalMinBet || 0.50;
    }

    getGameMaxBet(gameId) {
        const id = this.normalizeGameId(gameId);
        if (this.config.games && this.config.games[id] && this.config.games[id].maxBet !== undefined) {
            return parseFloat(this.config.games[id].maxBet);
        }
        return this.config.globalMaxBet || 1000.00;
    }

    setGameBetLimits(gameId, minBet, maxBet) {
        const id = this.normalizeGameId(gameId);
        if (!this.config.games) this.config.games = {};
        if (!this.config.games[id]) this.config.games[id] = {};
        this.config.games[id].minBet = Math.max(0.10, parseFloat(minBet) || 0.50);
        this.config.games[id].maxBet = Math.max(this.config.games[id].minBet, parseFloat(maxBet) || 1000.00);
        this.save();
    }

    setGlobalBetLimits(minBet, maxBet) {
        this.config.globalMinBet = Math.max(0.10, parseFloat(minBet) || 0.50);
        this.config.globalMaxBet = Math.max(this.config.globalMinBet, parseFloat(maxBet) || 1000.00);
        this.save();
    }

    setRigMode(mode) {
        if (['normal', 'force_win', 'force_loss'].includes(mode)) {
            this.config.rigMode = mode;
            this.save();
        }
    }

    shouldWin(gameId, betAmount = 0) {
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                if (u && (u.outcome_bias === 'force_loss' || u.outcomeBias === 'force_loss')) {
                    if (typeof window.checkLossRigOutcome === 'function') {
                        const res = window.checkLossRigOutcome(betAmount, u);
                        if (res !== null) return res;
                    }
                    return false;
                }
                if (u && (u.outcome_bias === 'force_win' || u.outcomeBias === 'force_win')) {
                    return true;
                }
            }
        } catch(e) {}
        if (this.config.rigMode === 'force_win') return true;
        if (this.config.rigMode === 'force_loss') {
            if (typeof window.checkLossRigOutcome === 'function') {
                const res = window.checkLossRigOutcome(betAmount);
                if (res !== null) return res;
            }
            return false;
        }
        const rate = this.getGameWinRate(gameId);
        return (Math.random() * 100) < rate;
    }

    // Force Crash Triggers
    triggerForceCrash() {
        localStorage.removeItem('bwn_admin_next_crash');
        localStorage.setItem('bwn_admin_force_crash_now', 'true');
        localStorage.setItem('bwn_admin_force_crash_trigger', Date.now().toString());
        return fetch('/api/games.php?action=crash_control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            body: JSON.stringify({ command: 'force_crash', admin_pin: '9824' })
        }).catch(() => {});
    }

    setNextCrashPoint(multiplier) {
        const pt = parseFloat(multiplier);
        if (!isNaN(pt) && pt >= 1.01) {
            localStorage.setItem('bwn_admin_next_crash', pt.toFixed(2));
            localStorage.removeItem('bwn_admin_force_crash_now');
            localStorage.removeItem('bwn_admin_force_crash_trigger');
            localStorage.removeItem('bwn_admin_crash_mode');
            return fetch('/api/games.php?action=crash_control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Pin': '9824'
                },
                body: JSON.stringify({ command: 'set_next_crash', target: pt, admin_pin: '9824' })
            }).catch(() => {});
        }
        return false;
    }

    resetCrashToAuto() {
        localStorage.removeItem('bwn_admin_next_crash');
        localStorage.removeItem('bwn_admin_force_crash_now');
        localStorage.removeItem('bwn_admin_force_crash_trigger');
        localStorage.setItem('bwn_admin_crash_mode', 'auto');
        localStorage.setItem('bwn_admin_crash_auto_trigger', Date.now().toString());
        return fetch('/api/games.php?action=crash_control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            body: JSON.stringify({ command: 'reset_auto', admin_pin: '9824' })
        }).catch(() => {});
    }
}

window.adminConfig = new AdminConfig();
