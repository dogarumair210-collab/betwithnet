/**
 * ============================================================
 * Bet With Net - Enterprise Hybrid Client API Bridge
 * Synchronizes Client State with PHP 8.2 + MySQL / SQLite Backend
 * Zero-Downtime Auto-Detection & Offline Fallback Protection
 * ============================================================
 */

(function(window) {
    'use strict';

    class APIBridge {
        constructor() {
            this.baseUrl = window.location.origin;
            // Detect if running on localhost or server
            this.isServerReachable = false;
            this.activeUser = null;
            this.init();
        }

        async init() {
            await this.checkHealth();
            this.bindWalletEvents();
        }

        async checkHealth() {
            try {
                const res = await fetch('/api/games.php?action=settings', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                });
                if (res.ok) {
                    const text = await res.text();
                    const data = text ? JSON.parse(text) : null;
                    if (data && data.success) {
                        this.isServerReachable = true;
                        console.log('[API Bridge] ✅ Enterprise PHP/SQL Backend Online');
                    }
                }
            } catch (e) {
                this.isServerReachable = false;
                console.log('[API Bridge] ℹ️ Local Offline / Static Mode Active');
            }
        }

        // -------------------------------------------------------------
        // Authentication Bridge
        // -------------------------------------------------------------
        async login(username, password) {
            if (!this.isServerReachable) {
                // Fallback to local user manager
                if (window.userManager && window.userManager.login) {
                    return window.userManager.login(username, password);
                }
                return { success: false, message: 'Offline mode' };
            }

            try {
                const res = await fetch('/api/auth.php?action=login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const text = await res.text();
                let data = null;
                try {
                    data = text ? JSON.parse(text) : null;
                } catch (pe) {
                    data = null;
                }

                if (!data) {
                    // Fallback to local user manager if backend returned unexpected payload
                    if (window.userManager && window.userManager.login) {
                        return window.userManager.login(username, password);
                    }
                    return { success: false, message: 'Invalid response from server.' };
                }

                if (data.success && data.data) {
                    this.activeUser = data.data;
                    if (window.userManager) {
                        window.userManager.currentUser = data.data;
                    }
                }
                return data;
            } catch (err) {
                console.warn('[API Bridge] Login request failed, attempting local fallback:', err);
                if (window.userManager && window.userManager.login) {
                    return window.userManager.login(username, password);
                }
                return { success: false, message: err.message };
            }
        }

        async register(userData) {
            if (!this.isServerReachable) {
                if (window.userManager && window.userManager.register) {
                    return window.userManager.register(userData);
                }
                return { success: false, message: 'Offline mode' };
            }

            try {
                const res = await fetch('/api/auth.php?action=register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(userData)
                });
                const text = await res.text();
                let data = null;
                try {
                    data = text ? JSON.parse(text) : null;
                } catch (pe) {
                    data = null;
                }

                if (!data) {
                    if (window.userManager && window.userManager.register) {
                        return window.userManager.register(userData);
                    }
                    return { success: false, message: 'Invalid response from server.' };
                }

                if (data.success && data.data) {
                    this.activeUser = data.data;
                }
                return data;
            } catch (err) {
                if (window.userManager && window.userManager.register) {
                    return window.userManager.register(userData);
                }
                return { success: false, message: err.message };
            }
        }

        async getSessionUser() {
            if (!this.isServerReachable) return null;
            try {
                const res = await fetch('/api/auth.php?action=me');
                if (res.ok) {
                    const text = await res.text();
                    const data = text ? JSON.parse(text) : null;
                    return data ? data.data : null;
                }
            } catch (e) {
                return null;
            }
            return null;
        }

        // -------------------------------------------------------------
        // Wallet & Bets Synchronization
        // -------------------------------------------------------------
        bindWalletEvents() {
            // window.wallet is created by wallet.js as: window.wallet = new WalletEngine()
            // Bind immediately if available, otherwise retry once after 500ms (script load order safety)
            const bind = () => {
                if (window.wallet && window.wallet.on) {
                    window.wallet.on('betCompleted', (bet) => {
                        // wallet.js already has authoritative syncBetToServer and syncWinToServer.
                        // Never trigger duplicate backend deductions from api_bridge!
                        if (!bet || bet._serverSynced || (window.wallet && typeof window.wallet.syncBetToServer === 'function')) {
                            return;
                        }
                        this.syncBetToDatabase(bet);
                    });
                    console.log('[API Bridge] ✅ Wallet bet sync listener attached.');
                } else {
                    console.warn('[API Bridge] wallet not ready, retrying in 500ms...');
                    setTimeout(bind, 500);
                }
            };
            bind();
        }

        async syncBetToDatabase(bet) {
            if (!this.isServerReachable) return;
            // Never duplicate bets that are managed by WalletEngine
            if (!bet || bet._serverSynced || (window.wallet && typeof window.wallet.syncBetToServer === 'function')) return;
            try {
                const user = (window.userManager && window.userManager.currentUser) || 
                             this.activeUser || 
                             (window.core && window.core.getLoggedInUser ? window.core.getLoggedInUser() : null);

                // Issue #123: Abort if no authenticated user session exists; never fallback to USR-1001
                if (!user || !user.id) {
                    console.warn('[API Bridge] Bet sync aborted: No authenticated user session active.');
                    return;
                }
                const userId = user.id;

                // Record Bet
                const betPayload = {
                    user_id: userId,
                    game: bet.game || 'Casino Game',
                    amount: bet.betUSD || bet.bet || 1.0
                };
                const betRes = await fetch('/api/wallet.php?action=bet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(betPayload)
                });
                const betText = await betRes.text();
                const betData = betText ? JSON.parse(betText) : null;

                // If Win, record win
                if (betData && betData.success && betData.data && (bet.status === 'WIN' || bet.payoutUSD > 0)) {
                    const winPayload = {
                        bet_id: betData.data.bet_id,
                        user_id: userId,
                        multiplier: parseFloat(bet.multiplier) || 1.0,
                        payout: bet.payoutUSD || bet.payout || 0,
                        profit: bet.profitUSD || bet.profit || 0
                    };
                    await fetch('/api/wallet.php?action=win', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(winPayload)
                    });
                }
            } catch (e) {
                console.warn('[API Bridge] Failed to sync bet to backend SQL database:', e);
            }
        }

        async getWalletBalance(userId) {
            if (!this.isServerReachable) return null;
            try {
                const res = await fetch(`/api/wallet.php?action=balance&user_id=${encodeURIComponent(userId)}`);
                if (res.ok) {
                    const text = await res.text();
                    const data = text ? JSON.parse(text) : null;
                    return data ? data.data : null;
                }
            } catch (e) {
                return null;
            }
            return null;
        }

        // -------------------------------------------------------------
        // P2P Marketplace Bridge
        // -------------------------------------------------------------
        async getP2PMerchants() {
            if (!this.isServerReachable) {
                return window.p2pManager ? window.p2pManager.merchants : [];
            }
            try {
                const res = await fetch('/api/p2p.php?action=merchants');
                if (res.ok) {
                    const text = await res.text();
                    const data = text ? JSON.parse(text) : null;
                    return (data && data.data) ? data.data : (window.p2pManager ? window.p2pManager.merchants : []);
                }
            } catch (e) {
                return window.p2pManager ? window.p2pManager.merchants : [];
            }
            return [];
        }

        async createP2POrder(orderData) {
            if (!this.isServerReachable) {
                if (window.p2pManager && window.p2pManager.createOrder) {
                    return window.p2pManager.createOrder(orderData);
                }
                return { success: false, message: 'Offline mode' };
            }
            try {
                const res = await fetch('/api/p2p.php?action=create_order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                const text = await res.text();
                return text ? JSON.parse(text) : { success: false, message: 'Empty response' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        }

        // -------------------------------------------------------------
        // Production Backup & Restore
        // -------------------------------------------------------------
        downloadServerBackup() {
            window.location.href = '/api/backup.php?action=export';
        }

        async uploadServerRestore(file) {
            const formData = new FormData();
            formData.append('backup_zip', file);
            try {
                const res = await fetch('/api/backup.php?action=restore', {
                    method: 'POST',
                    body: formData
                });
                const text = await res.text();
                return text ? JSON.parse(text) : { success: false, message: 'Empty response' };
            } catch (e) {
                return { success: false, message: e.message };
            }
        }
    }

    // Attach to global window — constructor calls init() once internally
    window.APIBridge = new APIBridge();

})(window);
