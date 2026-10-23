// ============================================================
// Bet With Net - Core Multi-Page App Engine
// Universal Header, Drawer, Bottom Nav, Language & Storage Sync
// ============================================================

// Universal Admin Configuration Fallback
if (!window.adminConfig) {
    window.adminConfig = {
        getGameWinRate: function(gameId) {
            try {
                const conf = JSON.parse(localStorage.getItem('bwn_admin_config') || '{}');
                if (conf.rigMode === 'force_win') return 100;
                if (conf.rigMode === 'force_loss') return 0;
                if (conf.games && conf.games[gameId] && conf.games[gameId].winRate !== undefined) {
                    return conf.games[gameId].winRate;
                }
                return conf.globalWinRate || 48;
            } catch(e) { return 48; }
        },
        shouldWin: function(gameId, betAmount = 0) {
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
                const conf = JSON.parse(localStorage.getItem('bwn_admin_config') || '{}');
                if (conf.rigMode === 'force_win') return true;
                if (conf.rigMode === 'force_loss') {
                    if (typeof window.checkLossRigOutcome === 'function') {
                        const res = window.checkLossRigOutcome(betAmount);
                        if (res !== null) return res;
                    }
                    return false;
                }
                const rate = (conf.games && conf.games[gameId] && conf.games[gameId].winRate !== undefined) ? conf.games[gameId].winRate : (conf.globalWinRate || 48);
                return (Math.random() * 100) < rate;
            } catch(e) { return Math.random() < 0.48; }
        }
    };
}

class CoreApp {
    constructor() {
        this.lang = localStorage.getItem('bwn_lang') || 'en';
        this.translations = {
            en: {
                lobby: 'Home',
                casino: 'Casino',
                deposit: 'Deposit',
                withdraw: 'Withdraw',
                history: 'Betslip & History',
                bets: 'Bets',
                menu: 'Menu',
                promo: 'Promos',
                profile: 'Profile',
                vip: 'VIP Club',
                live_chat: '24/7 Live Support',
                faucet: 'Daily Bonus Faucet',
                simulation_badge: '👑 BET WITH NET • VIP CASINO'
            },
            ur: {
                lobby: 'ہوم',
                casino: 'کیسینو',
                deposit: 'ڈپازٹ',
                withdraw: 'نکلوائیں',
                history: 'بیٹ ہسٹری',
                bets: 'بیٹس',
                menu: 'مینو',
                promo: 'آفرز',
                profile: 'پروفائل',
                vip: 'وی آئی پی کلب',
                live_chat: 'لائیو سپورٹ 24/7',
                faucet: 'روزانہ فری بونس',
                simulation_badge: '👑 بیٹ ود نیٹ • وی آئی پی پورٹل'
            }
        };

        // Purge any legacy auto-created guest session immediately
        this._purgeGuestSession();

        // Arm game click interception immediately
        this.setupGameAuthInterceptor();
        this.sanitizePaymentNumbers();

        // Ensure any link to deposit.html inside the mobile app bypasses stale WebView disk cache
        if (!this._depositCacheBusterAttached) {
            this._depositCacheBusterAttached = true;
            document.addEventListener('click', (e) => {
                const a = e.target.closest('a[href*="deposit.html"]');
                if (a) {
                    const href = a.getAttribute('href');
                    if (href && !href.includes('v=3.5')) {
                        e.preventDefault();
                        const sep = href.includes('?') ? '&' : '?';
                        window.location.href = href + sep + 'v=3.5';
                    }
                }
            }, true);
        }
    }

    sanitizePaymentNumbers() {
        const defaultJc = {
            id: 'dep-jazzcash',
            name: 'JazzCash Wallet',
            type: 'Mobile Wallet',
            currency: 'PKR',
            exchangeRateToUSD: 280,
            icon: '⚡',
            accountTitle: 'Muhammad Ijaz',
            accountNumber: '03246533046',
            minDeposit: 500,
            maxDeposit: 100000,
            processingTime: 'Instant (0-60s)',
            instructions: 'Transfer via JazzCash to 03246533046 (Muhammad Ijaz). Upload the transaction screenshot below for immediate verification.',
            status: 'active'
        };

        try {
            const raw = localStorage.getItem('bwn_payment_methods_v1');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.depositMethods)) {
                    parsed.depositMethods = parsed.depositMethods.filter(m => m.id !== 'dep-easypaisa' && !(m.name && m.name.toLowerCase().includes('easypaisa')));

                    let jc = parsed.depositMethods.find(m => m.id === 'dep-jazzcash' || (m.name && m.name.toLowerCase().includes('jazzcash')));
                    if (!jc) {
                        parsed.depositMethods.unshift({ ...defaultJc });
                    } else {
                        jc.id = 'dep-jazzcash';
                        jc.name = jc.name || 'JazzCash Wallet';
                        jc.accountNumber = '03246533046';
                        jc.accountTitle = 'Muhammad Ijaz';
                        jc.status = 'active';
                        jc.instructions = defaultJc.instructions;
                    }

                    const jcItem = parsed.depositMethods.find(m => m.id === 'dep-jazzcash');
                    const npItem = parsed.depositMethods.find(m => m.id === 'dep-nayapay');
                    const bpItem = parsed.depositMethods.find(m => m.id === 'dep-binance');
                    parsed.depositMethods = [jcItem, npItem, bpItem].filter(Boolean);
                    localStorage.setItem('bwn_payment_methods_v1', JSON.stringify(parsed));
                }
            }
            if (window.paymentManager && window.paymentManager.data && Array.isArray(window.paymentManager.data.depositMethods)) {
                let list = window.paymentManager.data.depositMethods;
                list = list.filter(m => m.id !== 'dep-easypaisa' && !(m.name && m.name.toLowerCase().includes('easypaisa')));

                let jc = list.find(m => m.id === 'dep-jazzcash' || (m.name && m.name.toLowerCase().includes('jazzcash')));
                if (!jc) {
                    list.unshift({ ...defaultJc });
                } else {
                    jc.id = 'dep-jazzcash';
                    jc.accountNumber = '03246533046';
                    jc.accountTitle = 'Muhammad Ijaz';
                    jc.status = 'active';
                }
                const jcItem = list.find(m => m.id === 'dep-jazzcash');
                const npItem = list.find(m => m.id === 'dep-nayapay');
                const bpItem = list.find(m => m.id === 'dep-binance');
                window.paymentManager.data.depositMethods = [jcItem, npItem, bpItem].filter(Boolean);
            }
        } catch(e) {}
    }



    isNativeApp() {
        try {
            return navigator.userAgent.includes('BetWithNetApp') || 
                   Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
                   Boolean(window.navigator && window.navigator.standalone);
        } catch(e) {
            return false;
        }
    }

    isIOS() {
        try {
            return (/iPad|iPhone|iPod/.test(navigator.userAgent) || 
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
                   !window.MSStream;
        } catch(e) {
            return false;
        }
    }

    init(activeTab = 'home') {
        this.activeTab = activeTab;
        // Purge any legacy auto-created Guest_ / AppPlayer_ session BEFORE rendering header/drawer
        this._purgeGuestSession();
        this.sanitizePaymentNumbers();
        if (this.isNativeApp()) {
            document.body.classList.add('in-native-app');
        }
        this.renderHeader();
        this.renderDrawer();
        this.renderBottomNav();
        this.renderFooter();
        this.renderToastContainer();
        this.renderGameBalanceHUD();
        this.setupSync();
        this.initDailyBonusWidget();
        this.initWhatsAppFloatingWidget();
        this.initLiveTransactionNotifier();

        // Setup Auth Interceptor & Protection for all Casino Games
        this._injectAuthModalStyles();
        this.setupGameAuthInterceptor();
        this.enforceGamePageAuth();
        this.checkAuthRedirectParam();

        // Sync live server balance for logged in user, or strictly 0 for guests
        const loggedUser = this.getLoggedInUser();
        if (loggedUser && loggedUser.id) {
            this.syncServerBalance(loggedUser.id);
        } else {
            const demoBalStr = localStorage.getItem('bwn_demo_balance');
            let dBal = (demoBalStr !== null && !isNaN(parseFloat(demoBalStr))) ? parseFloat(demoBalStr) : 10000;
            if (dBal <= 0) dBal = 10000;
            if (window.wallet) {
                window.wallet.state.balancePKR = dBal;
                window.wallet.state.balanceUSD = parseFloat((dBal / 280).toFixed(2));
                window.wallet.saveState();
            }
            // Auto-open Register popup immediately when user opens Web or App and is not logged in!
            setTimeout(() => {
                if (!this.isUserLoggedIn()) {
                    this.openAuthModal('register', 'Welcome to Bet With Net! Please Register your account or Sign In to play & claim bonuses.');
                }
            }, 350);
        }

        // Real-time live balance watchdog (checks database every 3.5s and on tab focus)
        if (!window._bwnBalanceWatchdogActive) {
            window._bwnBalanceWatchdogActive = true;
            const pollUserBalance = () => {
                const u = this.getLoggedInUser();
                if (u && u.id) {
                    this.syncServerBalance(u.id);
                }
            };
            setInterval(pollUserBalance, 3500);
            window.addEventListener('focus', pollUserBalance);
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) pollUserBalance();
            });
        }

        // Auto-inject api_bridge.js on every page that loads core.js
        // This ensures ALL game pages get SQL bet-sync without editing 60+ HTML files individually
        this._injectApiBridge();

        // Auto-inject game_launcher.js on all game pages for universal opening window & music
        this._injectGameLauncher();

        // Universal click & escape listeners for navbar dropdowns
        if (!this._dropdownListenerAttached) {
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.nav-dropdown')) {
                    document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
                }
            });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    document.querySelectorAll('.nav-dropdown.active').forEach(d => d.classList.remove('active'));
                }
            });
            this._dropdownListenerAttached = true;
        }

        // Universal click listener for all "Deposit Funds" buttons to open white modal
        if (!this._depositBtnListenerAttached) {
            document.addEventListener('click', (e) => {
                const depBtn = e.target.closest('[title="Deposit Funds"], .deposit-btn, .btn-deposit-quick, .btn-top-deposit, .btn-chip-deposit');
                if (depBtn && !window.location.pathname.includes('deposit.html')) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.openDepositModal();
                }
            });
            this._depositBtnListenerAttached = true;
        }

        // Check for App Update inside native app (lobby only, never interrupt games)
        if (this.isNativeApp() && !window.location.pathname.toLowerCase().includes('/games/')) {
            setTimeout(() => {
                this.checkForAppUpdate(false);
            }, 1500);
        }

        // Initialize Official Bet With Net Casino Background Music (Website & APK)
        this.initBackgroundMusic();

        // Setup Casino Maintenance Interceptor
        this.setupCasinoMaintenanceInterceptor();

        // Automatic Visit & User Tracking (Web & Native App)
        this.trackVisit();
    }

    _purgeGuestSession() {
        try {
            const raw = localStorage.getItem('bwn_session_user');
            if (raw) {
                const u = JSON.parse(raw);
                const uname = String((u && u.username) || '');
                if (u && (u.role === 'guest' || uname.startsWith('Guest_') || uname.startsWith('AppPlayer_') || uname.startsWith('VIP_') || uname.startsWith('demo_auto'))) {
                    localStorage.removeItem('bwn_session_user');
                    localStorage.removeItem('bwn_active_user');
                    localStorage.removeItem('bwn_active_user_id');
                    if (window.userManager) window.userManager._currentUser = null;
                    if (window.APIBridge) window.APIBridge.activeUser = null;
                }
            }
        } catch (e) {}
    }

    trackVisit() {
        try {
            const loggedUser = this.getLoggedInUser();
            if (!loggedUser || !loggedUser.id) return;
            const payload = {
                user_id: loggedUser.id,
                is_app: this.isNativeApp()
            };
            const apiPath = window.location.pathname.includes('/games/') ? '../api/auth.php?action=track_visit' : 'api/auth.php?action=track_visit';
            fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(() => {});
        } catch(e) {}
    }

    initBackgroundMusic() {
        if (!window.sound) return;

        const path = (window.location.pathname || '').toLowerCase();
        // STRICT RULE: Never play casino theme BGM in any game
        if (path.includes('/games/')) {
            if (window.sound) window.sound.stopCasinoThemeBGM();
            return;
        }

        // Always un-mute by default so music plays immediately without requiring button click
        if (window.sound) {
            window.sound.muted = false;
        }

        const startBgm = () => {
            if (!window.sound || window.sound.muted) return;
            const currentPath = (window.location.pathname || '').toLowerCase();
            if (currentPath.includes('/games/')) {
                window.sound.stopCasinoThemeBGM();
                return;
            }
            window.sound.startCasinoThemeBGM();
        };

        // 1. Immediate autoplay attempt
        try {
            startBgm();
        } catch (e) {}

        // 2. Window load autoplay attempt
        window.addEventListener('load', startBgm, { once: true });

        // 3. Fallback: on ANY touch, scroll, swipe anywhere on screen (zero button clicks required!)
        const autoUnlock = () => {
            startBgm();
            if (window.sound && window.sound.casinoThemeAudio && !window.sound.casinoThemeAudio.paused && !window.sound.casinoThemeAudio.muted) {
                ['touchstart', 'touchend', 'scroll', 'pointerdown', 'mousedown', 'wheel'].forEach(ev => {
                    window.removeEventListener(ev, autoUnlock);
                    document.removeEventListener(ev, autoUnlock);
                });
            }
        };

        ['touchstart', 'touchend', 'scroll', 'pointerdown', 'mousedown', 'wheel'].forEach(ev => {
            window.addEventListener(ev, autoUnlock, { passive: true });
            document.addEventListener(ev, autoUnlock, { passive: true });
        });

        // Immediately record audio position when user clicks any link to navigate
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a');
            if (a && window.sound && window.sound.casinoThemeAudio && !window.sound.casinoThemeAudio.paused) {
                try {
                    sessionStorage.setItem('bwn_bgm_pos', window.sound.casinoThemeAudio.currentTime.toFixed(2));
                    sessionStorage.setItem('bwn_bgm_ts', Date.now().toString());
                } catch(err) {}
            }
        }, { capture: true, passive: true });
    }

    ensureBGMPlaying() {
        if (!window.sound || window.sound.muted) return;
        const path = (window.location.pathname || '').toLowerCase();
        if (path.includes('/games/')) return;
        window.sound.startCasinoThemeBGM();
    }

    async syncServerBalance(userId) {
        if (!userId) return;
        try {
            // Detect active game name if player is on any game page
            let activeGameName = window._activeGameName || '';
            if (!activeGameName) {
                const path = (window.location.pathname || '').toLowerCase();
                if (path.includes('/games/')) {
                    const rawFile = path.split('/').pop().replace('.html', '').replace(/[-_]/g, ' ').trim();
                    if (path.includes('crash')) activeGameName = 'Aviator (Crash)';
                    else if (path.includes('mines')) activeGameName = 'Mines';
                    else if (path.includes('chicken')) activeGameName = 'Chicken Rush';
                    else if (path.includes('tower')) activeGameName = 'Tower Legend';
                    else if (path.includes('roulette')) activeGameName = 'Roulette';
                    else if (path.includes('andar')) activeGameName = 'Andar Bahar';
                    else if (path.includes('dragon')) activeGameName = 'Dragon Tiger';
                    else if (path.includes('gems')) activeGameName = 'Fortune Gems';
                    else if (path.includes('plinko')) activeGameName = 'Plinko';
                    else if (path.includes('dice')) activeGameName = 'Dice';
                    else if (path.includes('limbo')) activeGameName = 'Limbo';
                    else if (path.includes('hilo')) activeGameName = 'Hi-Lo';
                    else if (path.includes('baccarat')) activeGameName = 'Baccarat';
                    else if (path.includes('blackjack')) activeGameName = 'Blackjack';
                    else if (path.includes('teenpatti') || path.includes('teen_patti')) activeGameName = 'Teen Patti';
                    else if (path.includes('coinflip')) activeGameName = 'Coin Flip';
                    else if (rawFile) {
                        activeGameName = rawFile.charAt(0).toUpperCase() + rawFile.slice(1);
                    }
                }
            }
            const gameQuery = activeGameName ? `&game=${encodeURIComponent(activeGameName)}` : '';
            const res = await fetch(`/api/wallet.php?action=balance&user_id=${encodeURIComponent(userId)}${gameQuery}`, { cache: 'no-store', credentials: 'include' });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) {
                    if (json.data.id && String(json.data.id) !== String(userId)) {
                        return; // Discard mismatch to protect isolation
                    }
                    const balPkr = parseFloat(json.data.balance_pkr || 0);
                    const balUsd = parseFloat(json.data.balance_usd || (balPkr / (window.wallet ? window.wallet.exchangeRate : 280)));
                    if (window.wallet) {
                        const oldPkr = parseFloat(window.wallet.state.balancePKR || 0);
                        const lastBetTime = parseInt(localStorage.getItem('bwn_last_bet_time') || String(window.wallet._lastBetTime || 0), 10);
                        const lastWinTime = parseInt(localStorage.getItem('bwn_last_win_time') || String(window.wallet._lastWinTime || 0), 10);
                        const isRecentPlay = (Date.now() - lastBetTime) < 30000;
                        const isRecentWin = (Date.now() - lastWinTime) < 30000;
                        const hasPendingBets = (window.wallet._pendingBets && window.wallet._pendingBets.length > 0);
                        const isMidGameRound = (Date.now() - lastBetTime < 8000) || (Date.now() - lastWinTime < 8000) || hasPendingBets;

                        // If user is actively in a game round, do NOT stomp on in-flight game balance
                        if (isMidGameRound && this._hasInitialBalanceChecked) {
                            return;
                        }

                        const hasDiff = Math.abs(oldPkr - balPkr) >= 0.01;

                        window.wallet.state.balancePKR = balPkr;
                        window.wallet.state.balanceUSD = balUsd;
                        window.wallet.saveState();
                        this.updateAllBalances();

                        // Sync session user
                        try {
                            const sess = localStorage.getItem('bwn_session_user');
                            if (sess) {
                                const u = JSON.parse(sess);
                                u.balance_pkr = balPkr;
                                u.balancePKR = balPkr;
                                u.balance_usd = balUsd;
                                u.balanceUSD = balUsd;
                                if (json.data.outcome_bias !== undefined) {
                                    u.outcome_bias = json.data.outcome_bias;
                                    u.outcomeBias = json.data.outcome_bias;
                                }
                                if (json.data.custom_win_rate !== undefined) {
                                    u.custom_win_rate = json.data.custom_win_rate;
                                    u.customWinRate = json.data.custom_win_rate;
                                }
                                if (json.data.loss_rig_cycle_bets !== undefined && json.data.loss_rig_cycle_wins !== undefined) {
                                    const uid = u.id || u.username;
                                    localStorage.setItem(`bwn_loss_rig_${uid}`, JSON.stringify({
                                        cycleCount: parseInt(json.data.loss_rig_cycle_bets) || 0,
                                        winsInCycle: parseInt(json.data.loss_rig_cycle_wins) || 0
                                    }));
                                }
                                localStorage.setItem('bwn_session_user', JSON.stringify(u));
                            }
                        } catch(e) {}

                        // Emit live wallet changes for open games (Aviator, Roulette, Cards, etc.)
                        window.wallet.emit('change', window.wallet.state);
                        window.wallet.emit('balanceChange', balPkr);
                        if (typeof window.updateWalletUI === 'function') {
                            window.updateWalletUI();
                        }

                        // Notify user if Admin added or deducted balance (only if not from game round)
                        if (hasDiff && this._hasInitialBalanceChecked && !isRecentPlay) {
                            const diff = balPkr - oldPkr;
                            if (diff > 0) {
                                this.showToast(`💰 ₨ ${diff.toLocaleString('en-US', { minimumFractionDigits: 2 })} added to your wallet!`, 'success');
                                if (window.sound && typeof window.sound.playWin === 'function') {
                                    window.sound.playWin();
                                }
                            } else if (diff < 0) {
                                this.showToast(`💸 ₨ ${Math.abs(diff).toLocaleString('en-US', { minimumFractionDigits: 2 })} deducted from your wallet.`, 'info');
                            }
                        }
                        this._hasInitialBalanceChecked = true;
                    }
                }
            }
        } catch(e) {}
    }

    _injectApiBridge() {
        // Only inject once per page — skip if already loaded
        if (window.APIBridge || document.querySelector('script[data-bwn-bridge]')) return;
        const script = document.createElement('script');
        script.src = '/js/api_bridge.js';
        script.setAttribute('data-bwn-bridge', '1');
        script.onerror = () => console.warn('[Core] api_bridge.js not found — offline mode.');
        document.head.appendChild(script);
    }

    _injectGameLauncher() {
        // Only inject on /games/ pages and only once
        if (!window.location.pathname.toLowerCase().includes('/games/')) return;
        if (window.bwnGameLauncher || document.querySelector('script[data-bwn-launcher]')) return;
        const script = document.createElement('script');
        script.src = '../js/game_launcher.js';
        script.setAttribute('data-bwn-launcher', '1');
        document.head.appendChild(script);
    }

    _injectAuthModalStyles() {
        if (document.getElementById('bwn-auth-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'bwn-auth-modal-styles';
        style.textContent = `
            #auth-modal-root {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                height: 100dvh !important;
                z-index: 999999999 !important;
                pointer-events: none !important;
            }
            #auth-modal-root:empty { display: none !important; }
            .auth-modal-overlay {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                height: 100dvh !important;
                background: rgba(0, 0, 0, 0.85) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                z-index: 1 !important;
                pointer-events: auto !important;
            }
            .auth-modal-dialog {
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: min(420px, calc(100vw - 32px)) !important;
                max-height: min(92vh, 92dvh) !important;
                overflow-y: auto !important;
                -webkit-overflow-scrolling: touch !important;
                background: radial-gradient(circle at 50% 0%, #161e2e 0%, #0c121c 55%, #05080e 100%) !important;
                border: 2px solid rgba(0, 231, 0, 0.75) !important;
                border-radius: 24px !important;
                z-index: 2 !important;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.98), 0 0 45px rgba(0, 231, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
                font-family: 'Inter', -apple-system, sans-serif !important;
                pointer-events: auto !important;
                animation: vipTopPopupSlideDown 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupGameAuthInterceptor() {
        if (this._gameAuthInterceptorAttached) return;
        this._gameAuthInterceptorAttached = true;

        // Global capture listener on document for any click attempting to open a game
        document.addEventListener('click', (e) => {
            const target = e.target;
            const gameLink = target.closest('a[href*="games/"], a[href*="games\\\\"], .game-card, [data-game-url], [data-game-href]');
            if (!gameLink) return;

            // Resolve target destination URL
            let href = gameLink.getAttribute('href') || gameLink.getAttribute('data-game-url') || gameLink.getAttribute('data-game-href');
            if (!href && gameLink.tagName.toLowerCase() !== 'a') {
                const childLink = gameLink.querySelector('a');
                if (childLink) href = childLink.getAttribute('href');
            }

            if (!href || href === '#' || href.startsWith('javascript:')) return;
            
            // Check if this link points to a game
            const isGameLink = href.includes('games/') || href.includes('games\\') || gameLink.classList.contains('game-card');
            if (!isGameLink) return;

            // Check if user is logged in
            if (!this.isUserLoggedIn()) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Store intended destination so we can redirect after register/login
                try {
                    sessionStorage.setItem('bwn_redirect_after_auth', href);
                } catch(err) {}

                // Close drawer if open
                if (typeof this.closeDrawer === 'function') this.closeDrawer();

                // Open Register / Login popup
                this.openAuthModal('register', 'Account Required: Please Register or Sign In to play games!');
                this.showToast('Please Register or Sign In to play this game!', 'info');
                return false;
            }
        }, true); // true = capture phase so it runs BEFORE any other click listener!
    }

    enforceGamePageAuth() {
        const isGamePage = window.location.pathname.toLowerCase().includes('/games/');
        if (!isGamePage) return;

        if (!this.isUserLoggedIn()) {
            setTimeout(() => {
                if (!this.isUserLoggedIn()) {
                    this.openAuthModal('register', 'Account Required: Please Register or Sign In to play this game!');
                }
            }, 300);
        }
    }

    checkAuthRedirectParam() {
        try {
            const params = new URLSearchParams(window.location.search);
            if (params.get('auth') === 'required' && !this.isUserLoggedIn()) {
                setTimeout(() => {
                    if (!this.isUserLoggedIn()) {
                        this.openAuthModal('register', 'Please create an account or sign in to play games!');
                    }
                }, 400);
            }
        } catch(e) {}
    }

    t(key) {
        return (this.translations[this.lang] && this.translations[this.lang][key]) || key;
    }

    toggleLanguage() {
        this.lang = this.lang === 'en' ? 'ur' : 'en';
        localStorage.setItem('bwn_lang', this.lang);
        window.location.reload();
    }

    // Header Dropdown Navigation Toggle (Desktop & Laptop)
    toggleNavDropdown(e, btn) {
        if (e) {
            e.stopPropagation();
            e.preventDefault();
        }
        const dropdown = btn ? btn.closest('.nav-dropdown') : null;
        if (!dropdown) return;

        const isAlreadyActive = dropdown.classList.contains('active');

        // Close any other open dropdowns first
        document.querySelectorAll('.nav-dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });

        // Toggle this dropdown
        if (isAlreadyActive) {
            dropdown.classList.remove('active');
        } else {
            dropdown.classList.add('active');
        }
    }

    getLoggedInUser() {
        let u = null;
        if (window.userManager && window.userManager.currentUser) {
            u = window.userManager.currentUser;
        } else if (window.APIBridge && window.APIBridge.activeUser) {
            u = window.APIBridge.activeUser;
        } else {
            try {
                const sess = localStorage.getItem('bwn_session_user');
                if (sess) u = JSON.parse(sess);
            } catch (e) {}
        }
        if (u && (u.username || u.id)) {
            const uname = String(u.username || '');
            if (u.role === 'guest' || uname.startsWith('Guest_') || uname.startsWith('AppPlayer_') || uname.startsWith('VIP_')) {
                return null;
            }
            return u;
        }
        return null;
    }

    isUserLoggedIn() {
        return !!this.getLoggedInUser();
    }

    logout() {
        if (window.userManager && window.userManager.logout) {
            window.userManager.logout();
        }
        localStorage.removeItem('bwn_session_user');
        localStorage.removeItem('bwn_active_user');
        localStorage.removeItem('bwn_active_user_id');
        localStorage.removeItem('BETWITHNET_balance');
        localStorage.removeItem('bwn_wallet_balance');
        localStorage.removeItem('user_balance');
        localStorage.removeItem('bwn_wallet_state_v1');
        sessionStorage.removeItem('bwn_session_user');
        sessionStorage.removeItem('bwn_user_session');
        if (window.wallet) {
            window.wallet.state.balancePKR = 0.00;
            window.wallet.state.balanceUSD = 0.00;
        }
        if (window.APIBridge) {
            window.APIBridge.activeUser = null;
        }
        try {
            fetch('/api/auth.php?action=logout', { method: 'POST', credentials: 'include' }).catch(() => {});
        } catch(e) {}
        this.closeDrawer();
        this.renderHeader();
        this.renderDrawer();
        this.showToast('Account logged out successfully.', 'info');
        setTimeout(() => {
            const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
            window.location.href = rootPath + 'index.html';
        }, 400);
    }

    // Header Generator
    renderHeader() {
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        const headerPlaceholder = document.getElementById('app-header-slot');
        if (!headerPlaceholder) return;

        const loggedUser = this.getLoggedInUser();
        const balanceFormatted = window.wallet ? window.wallet.formatAmount(window.wallet.getBalance()) : '₨ 25,000.00';
        const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';

        headerPlaceholder.innerHTML = `
            <div class="disclaimer-banner">
                <div>
                    <span class="disclaimer-badge">👑 BET WITH NET</span>
                    <span>VIP Gaming Portal & Peer-to-Peer OTC Liquidity Desk</span>
                </div>
                <div style="cursor:pointer; font-weight:700; color:#00e700;" onclick="window.core.claimDailyBonus()">🎁 ${this.t('faucet')}</div>
            </div>

            <header class="app-header">
                <div class="header-left">
                    <button class="btn-icon-header mobile-menu-toggle" onclick="window.core.openDrawer()" title="Menu (⋮)" style="font-size:20px; font-weight:900;">⋮</button>
                    <a href="${rootPath}index.html" class="brand-area" style="text-decoration:none;">
                        <div class="brand-logo-icon">👑</div>
                        <div>
                            <div class="brand-title">BET WITH NET</div>
                            <span class="brand-sub">VIP CASINO</span>
                        </div>
                    </a>
                </div>

                <!-- Desktop & Laptop Main Navigation Bar with Luxury Dropdowns -->
                <nav class="desktop-nav-menu">
                    <a href="${rootPath}index.html" class="desktop-nav-link ${this.activeTab === 'home' ? 'active' : ''}">
                        <span class="nav-link-icon">🏠</span>
                        <span>${this.t('lobby')}</span>
                    </a>

                    <!-- Casino Studios Dropdown -->
                    <div class="nav-dropdown">
                        <button class="desktop-nav-link ${this.activeTab === 'casino' || this.activeTab === 'crash' ? 'active' : ''}" onclick="window.core.toggleNavDropdown(event, this)">
                            <span class="nav-link-icon">🎰</span>
                            <span>Studios</span>
                            <span style="font-size:9px; margin-left:2px; opacity:0.8;">▾</span>
                        </button>
                        <div class="nav-dropdown-menu">
                            <div class="dropdown-header-title">🔥 Multipliers & Turbo</div>
                            <a href="${rootPath}games/crash.html" class="dropdown-item">
                                <span>🚀 Aviator Crash</span>
                                <span class="dropdown-item-badge" style="background:#ff3b30;">HOT</span>
                            </a>
                            <a href="${rootPath}games/limbo.html" class="dropdown-item">
                                <span>🚀 Limbo Turbo</span>
                                <span class="dropdown-item-badge" style="background:#f5a623; color:#000;">10,000X</span>
                            </a>
                            <a href="${rootPath}games/mines.html" class="dropdown-item">
                                <span>💣 Mines Field</span>
                                <span class="dropdown-item-badge">97.5%</span>
                            </a>
                            <a href="${rootPath}games/coinflip.html" class="dropdown-item">
                                <span>🪙 Coin Flip VIP</span>
                                <span class="dropdown-item-badge">836X</span>
                            </a>
                            <a href="${rootPath}games/hilo.html" class="dropdown-item">
                                <span>🃏 Hi-Lo Streak</span>
                                <span class="dropdown-item-badge">1000X</span>
                            </a>
                            <a href="${rootPath}games/scratch.html" class="dropdown-item">
                                <span>🎟️ Lucky Scratch VIP</span>
                                <span class="dropdown-item-badge">VIP</span>
                            </a>

                            <div class="dropdown-header-title" style="margin-top:6px;">♠️ Live Tables & Cards</div>
                            <a href="${rootPath}games/roulette.html" class="dropdown-item">
                                <span>🎡 3D European Roulette</span>
                                <span class="dropdown-item-badge">36X</span>
                            </a>
                            <a href="${rootPath}games/blackjack.html" class="dropdown-item">
                                <span>♠️ Blackjack 21 VIP</span>
                                <span class="dropdown-item-badge">3:2</span>
                            </a>
                            <a href="${rootPath}games/poker.html" class="dropdown-item">
                                <span>🃏 Video Poker</span>
                                <span class="dropdown-item-badge">250X</span>
                            </a>
                            <a href="${rootPath}games/card.html" class="dropdown-item">
                                <span>🎴 Dragon vs Tiger</span>
                                <span class="dropdown-item-badge">LIVE</span>
                            </a>

                            <div class="dropdown-header-title" style="margin-top:6px;">🎰 Vegas Slots & Lottery</div>
                            <a href="javascript:void(0)" onclick="window.core.showUnderRepairModal('Deluxe Vegas Slots')" class="dropdown-item" style="opacity:0.8;">
                                <span>🎰 Deluxe Vegas Slots</span>
                                <span class="dropdown-item-badge" style="background:#e74c3c; color:#fff;">REPAIR</span>
                            </a>
                            <a href="${rootPath}games/keno.html" class="dropdown-item">
                                <span>🎱 Keno 80-Ball Lottery</span>
                                <span class="dropdown-item-badge">10,000X</span>
                            </a>
                            <a href="${rootPath}games/bingo.html" class="dropdown-item">
                                <span>🎫 Bingo 75-Ball Live</span>
                                <span class="dropdown-item-badge">VEGAS</span>
                            </a>
                            <a href="${rootPath}games/plinko.html" class="dropdown-item">
                                <span>⚪ Plinko Pegboard</span>
                                <span class="dropdown-item-badge">29X</span>
                            </a>
                            <a href="${rootPath}games/dice.html" class="dropdown-item">
                                <span>🎲 Over / Under Dice</span>
                                <span class="dropdown-item-badge">99% RTP</span>
                            </a>
                            
                            <div class="dropdown-header-title" style="margin-top:6px;">👑 High-Roller & Desi Favorites</div>
                            <a href="${rootPath}games/baccarat_squeeze.html" class="dropdown-item">
                                <span>🎴 Baccarat Squeeze VIP</span>
                                <span class="dropdown-item-badge" style="background:#8e44ad;">98.9%</span>
                            </a>
                            <a href="${rootPath}games/teenpatti.html" class="dropdown-item">
                                <span>🃏 Teen Patti Royal</span>
                                <span class="dropdown-item-badge" style="background:#c0392b;">FLASH</span>
                            </a>
                            <a href="${rootPath}games/andarbahar.html" class="dropdown-item">
                                <span>🎴 Andar Bahar Gold</span>
                                <span class="dropdown-item-badge">OTC</span>
                            </a>
                            <a href="${rootPath}games/space_xy.html" class="dropdown-item">
                                <span>🚀 Space XY Rocket</span>
                                <span class="dropdown-item-badge" style="background:#ff4b2b;">5,000X</span>
                            </a>
                            <a href="${rootPath}games/penalty.html" class="dropdown-item">
                                <span>⚽ Penalty Shootout</span>
                                <span class="dropdown-item-badge">32X</span>
                            </a>
                            <a href="${rootPath}games/derby.html" class="dropdown-item">
                                <span>🏇 Horse Racing Derby</span>
                                <span class="dropdown-item-badge">25X</span>
                            </a>
<a href="${rootPath}casino.html" class="dropdown-item" style="color:var(--primary-gold); font-weight:800; border-top:1px solid rgba(255,255,255,0.08); margin-top:4px; padding-top:8px;">
                                <span>🎮 View All 40 Studios →</span>
                            </a>
                        </div>
                    </div>

                    <!-- P2P Desk -->
                    <a href="${rootPath}p2p.html" class="desktop-nav-link ${this.activeTab === 'p2p' ? 'active' : ''}">
                        <span class="nav-link-icon">🔄</span>
                        <span>P2P Desk</span>
                        <span class="desktop-nav-badge" style="background:#00e700; color:#000;">LOCAL</span>
                    </a>

                    <!-- Betslip & Statement -->
                    <a href="${rootPath}history.html" class="desktop-nav-link ${this.activeTab === 'history' ? 'active' : ''}">
                        <span class="nav-link-icon">📋</span>
                        <span>Betslip Ledger</span>
                    </a>

                    <!-- More Services Dropdown -->
                    <div class="nav-dropdown">
                        <button class="desktop-nav-link" onclick="window.core.toggleNavDropdown(event, this)">
                            <span class="nav-link-icon">✨</span>
                            <span>More</span>
                            <span style="font-size:9px; margin-left:2px; opacity:0.8;">▾</span>
                        </button>
                        <div class="nav-dropdown-menu align-right">
                            <div class="dropdown-header-title">Banking & Cashier</div>
                            <a href="${rootPath}deposit.html" class="dropdown-item">
                                <span>📥 Cashier Deposit</span>
                                <span class="dropdown-item-badge" style="background:#00e700; color:#000;">INSTANT</span>
                            </a>
                            <a href="${rootPath}withdraw.html" class="dropdown-item">
                                <span>📤 Instant Cashout</span>
                                <span class="dropdown-item-badge">FAST</span>
                            </a>

                            <div class="dropdown-header-title" style="margin-top:6px;">Rewards & Support</div>
                            <a href="${rootPath}promo.html" class="dropdown-item">
                                <span>🎁 VIP Club & Promos</span>
                                <span class="dropdown-item-badge">VIP</span>
                            </a>
                            <a href="javascript:void(0)" onclick="window.core.claimDailyBonus()" class="dropdown-item">
                                <span>🎁 Daily Faucet Bonus</span>
                                <span class="dropdown-item-badge" style="background:#f5a623; color:#000;">FREE</span>
                            </a>
                            <a href="javascript:void(0)" onclick="window.core.showLiveSupport()" class="dropdown-item">
                                <span>💬 24/7 Live Support Chat</span>
                                <span class="dropdown-item-badge" style="background:#00e5ff; color:#000;">ONLINE</span>
                            </a>
                            <a href="javascript:void(0)" onclick="window.core.logout()" class="dropdown-item" style="color:#ff4757; font-weight:800; border-top:1px solid rgba(255, 71, 87, 0.2); margin-top:4px; padding-top:8px;">
                                <span>🚪 Logout Account</span>
                                <span class="dropdown-item-badge" style="background:rgba(255, 71, 87, 0.15); color:#ff4757; border:1px solid rgba(255, 71, 87, 0.4);">SIGN OUT</span>
                            </a>
                            <a href="${rootPath}admin/login.html" class="dropdown-item" style="color:#00e700; font-weight:800; border-top:1px solid rgba(255,255,255,0.08); margin-top:4px; padding-top:8px;">
                                <span>👑 Admin Back-Office Panel</span>
                            </a>
                        </div>
                    </div>
                </nav>

                <div class="header-actions">
                    <!-- Official Android & iOS App Download Luxury Badge (Hidden inside Native App) -->
                    ${!this.isNativeApp() ? `
                    <a href="javascript:void(0)" onclick="window.core.openAppDownloadModal(false)" class="header-app-download-badge" title="Download Bet With Net App (Android & iPhone)">
                        <span class="app-badge-icon">📲</span>
                        <span class="app-badge-text">App</span>
                        <span class="app-badge-tag" style="background:linear-gradient(90deg, #ffd700, #00e5ff); color:#000;">v1.4</span>
                    </a>
                    ` : ''}

                    <!-- Client Login & Sign Up / User Badge -->
                    ${loggedUser ? `
                        <div class="header-user-badge" onclick="window.location.href='${rootPath}profile.html'" title="My VIP Profile">
                            <img src="${rootPath}assets/icons/betwithnet_profile_4k.png" class="header-user-avatar-img" alt="Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; pointer-events:none;">
                        </div>

                        <div class="wallet-badge" onclick="window.core.toggleBalancePopup(event)" title="Click to open VIP Balance Vault" style="cursor:pointer;">
                            <select id="header-currency-select" class="wallet-currency-select" onclick="event.stopPropagation()" onchange="window.core.changeCurrency(this.value)">
                                <option value="PKR" ${curr === 'PKR' ? 'selected' : ''}>PKR ₨</option>
                                <option value="USD" ${curr === 'USD' ? 'selected' : ''}>USD $</option>
                            </select>
                            <span class="wallet-balance wallet-balance-display">${balanceFormatted}</span>
                            <span class="wallet-chevron" style="font-size:10px; color:#ffd700; margin-left:3px; opacity:0.85;">▾</span>
                        </div>

                        <a href="javascript:void(0)" onclick="window.core.openDepositModal(); return false;" class="btn-deposit-quick" style="text-decoration:none;" title="Deposit Funds (EasyPaisa & JazzCash)">
                            <span>➕</span> <span class="deposit-quick-text">${this.t('deposit')}</span>
                        </a>
                    ` : `
                        <div class="wallet-badge" onclick="window.core.toggleBalancePopup(event)" title="Click to open VIP Balance Vault" style="cursor:pointer;">
                            <select id="header-currency-select" class="wallet-currency-select" onclick="event.stopPropagation()" onchange="window.core.changeCurrency(this.value)">
                                <option value="PKR" ${curr === 'PKR' ? 'selected' : ''}>PKR ₨</option>
                                <option value="USD" ${curr === 'USD' ? 'selected' : ''}>USD $</option>
                            </select>
                            <span class="wallet-balance wallet-balance-display">${balanceFormatted}</span>
                            <span class="wallet-chevron" style="font-size:10px; color:#ffd700; margin-left:3px; opacity:0.85;">▾</span>
                        </div>

                        <a href="javascript:void(0)" onclick="window.core.openDepositModal(); return false;" class="btn-deposit-quick" style="text-decoration:none;" title="Deposit Funds (EasyPaisa & JazzCash)">
                            <span>➕</span> <span class="deposit-quick-text">${this.t('deposit')}</span>
                        </a>

                        <div class="auth-buttons-header">
                            <button class="btn-header-login" onclick="window.core.openAuthModal('login')">
                                <span>🔑</span> <span class="auth-btn-label">Sign In</span>
                            </button>
                            <button class="btn-header-register" onclick="window.core.openAuthModal('register')">
                                <span>✨</span> <span class="auth-btn-label">Register</span>
                            </button>
                        </div>
                    `}

                    <button id="header-sound-btn" class="btn-icon-header" onclick="window.core.toggleSound()" title="Sound">🔊</button>
                    <button class="btn-icon-header desktop-3dot-btn" onclick="window.core.openDrawer()" title="Menu (⋮)" style="font-size:18px; font-weight:900;">⋮</button>
                </div>
            </header>
        `;
    }

    // Slide-out Drawer Generator
    renderDrawer() {
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let drawer = document.getElementById('app-drawer-root');
        if (!drawer) {
            drawer = document.createElement('div');
            drawer.id = 'app-drawer-root';
            if (document.body.firstChild) {
                document.body.insertBefore(drawer, document.body.firstChild);
            } else {
                document.body.appendChild(drawer);
            }
        }

        const loggedUser = this.getLoggedInUser();
        const vip = window.wallet ? window.wallet.getVIPTier() : { name: 'Bronze VIP' };

        drawer.innerHTML = `
            <div id="drawer-overlay" class="app-drawer-overlay" onclick="window.core.closeDrawer(event)"></div>
            <div id="app-drawer" class="app-drawer">
                <div class="drawer-header">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:22px;">👑</span>
                        <b style="font-size:16px; color:#ffffff;">BET WITH NET</b>
                    </div>
                    <button class="modal-close-btn" onclick="window.core.closeDrawer(event)">✕</button>
                </div>

                ${loggedUser ? `
                    <div class="drawer-user-card">
                        <div class="drawer-avatar">👑</div>
                        <div style="flex:1;">
                            <div style="font-weight:800; font-size:14px; color:#ffffff;">${loggedUser.username || 'VIP Member'}</div>
                            <div style="font-size:11px; color:#f5a623; font-weight:700;">⭐ ${loggedUser.vip_tier || loggedUser.vipTier || vip.name}</div>
                            <div class="wallet-balance-display" onclick="window.core.closeDrawer(); window.core.openBalancePopup();" style="font-size:12px; font-weight:700; color:#00e700; margin-top:2px; cursor:pointer;" title="Open VIP Balance Vault">
                                ${window.wallet ? window.wallet.formatAmount(window.wallet.getBalance()) : ''}
                            </div>
                        </div>
                        <a href="${rootPath}deposit.html" class="btn-primary-gold" style="padding:4px 10px; font-size:11px; text-decoration:none;">+ Add</a>
                    </div>
                ` : `
                    <div class="drawer-user-card" style="display:flex; flex-direction:column; gap:10px; background:linear-gradient(135deg, rgba(0,231,0,0.08), rgba(245,166,35,0.08)); border:1px solid rgba(0,231,0,0.2);">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div class="drawer-avatar" style="background:#152238;">👤</div>
                            <div>
                                <div style="font-weight:800; font-size:14px; color:#ffffff;">Welcome to Bet With Net</div>
                                <div style="font-size:11px; color:#8e9bb0;">Sign in to access VIP wallet & games</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button class="btn-primary-gold" style="flex:1; padding:8px 10px; font-size:12px; font-weight:800; border-radius:8px; border:none; cursor:pointer;" onclick="window.core.closeDrawer(); window.core.openAuthModal('login');">
                                🔑 Sign In
                            </button>
                            <button class="btn-secondary" style="flex:1; padding:8px 10px; font-size:12px; font-weight:800; border-radius:8px; border-color:rgba(255,255,255,0.2); cursor:pointer;" onclick="window.core.closeDrawer(); window.core.openAuthModal('register');">
                                ✨ Register
                            </button>
                        </div>
                    </div>
                `}

                <ul class="drawer-nav-list">
                    ${!this.isNativeApp() ? `
                    <li class="drawer-nav-item apk-item" style="background:linear-gradient(135deg, rgba(224, 36, 195, 0.2), rgba(0, 229, 255, 0.2)); border:1px solid rgba(0, 229, 255, 0.45); border-radius:10px; margin:8px 12px 6px 12px;">
                        <a href="javascript:void(0)" onclick="window.core.openAppDownloadModal(false); window.core.closeDrawer();" style="color:#00e5ff; font-weight:900; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; text-decoration:none;">
                            <span>📲 Download App (Android & iOS)</span>
                            <span class="drawer-nav-badge" style="background:linear-gradient(90deg, #ffd700, #00e5ff); color:#000; font-weight:900;">GET APP</span>
                        </a>
                    </li>
                    ` : `
                    <li class="drawer-nav-item apk-item" style="background:linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 145, 0, 0.15)); border:1px solid rgba(255, 215, 0, 0.45); border-radius:10px; margin:8px 12px 6px 12px;">
                        <a href="javascript:void(0)" onclick="window.core.checkForAppUpdate(true)" style="color:#ffd700; font-weight:900; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; text-decoration:none;">
                            <span>🔄 Check for App Update</span>
                            <span class="drawer-nav-badge" style="background:linear-gradient(90deg, #ffd700, #ff9100); color:#000; font-weight:900;">${parseFloat(this.getAppVersion() || '1.1') < 1.4 ? '⚡ UPDATE v1.4' : 'v' + (this.getAppVersion() || '1.4')}</span>
                        </a>
                    </li>
                    `}
                    <li class="drawer-nav-item" style="background:linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 109, 0, 0.15)); border:1px solid rgba(255, 215, 0, 0.45); border-radius:10px; margin:0 12px 14px 12px;">
                        <a href="javascript:void(0)" onclick="window.core.openDailyBonusModal(false); window.core.closeDrawer();" style="color:#ffd700; font-weight:900; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; text-decoration:none;">
                            <span>🎁 7-Days Daily Login Bonus</span>
                            <span class="drawer-nav-badge" style="background:linear-gradient(90deg, #ffd700, #ff9100); color:#000; font-weight:900;">₨20 FREE</span>
                        </a>
                    </li>
                    <li class="drawer-nav-item"><a href="${rootPath}index.html">🏠 ${this.t('lobby')}</a></li>
                    <li class="drawer-nav-item"><a href="javascript:void(0)" onclick="window.core.showCasinoMaintenanceModal(event)">🎰 Official Game Studios <span class="drawer-nav-badge" style="background:#e74c3c; color:#fff;">MAINTENANCE</span></a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/crash.html">🚀 Aviator Crash Studio <span class="drawer-nav-badge" style="background:#ff3b30;">HOT</span></a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/limbo.html">🚀 Limbo Turbo Multiplier</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/mines.html">💣 Mines Field Simulator</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/card.html">🎴 Dragon vs Tiger (Cards)</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/roulette.html">🎡 3D European Roulette</a></li>
                    <li class="drawer-nav-item"><a href="javascript:void(0)" onclick="window.core.showUnderRepairModal('Deluxe Vegas Slots')" style="opacity:0.8;">🎰 Deluxe Vegas Slots <span class="drawer-nav-badge" style="background:#e74c3c; color:#fff;">REPAIR</span></a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/dice.html">🎲 Over / Under Dice</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/wheel.html">⚙️ Wheel Spin Game</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/plinko.html">⚪ Plinko Pegboard</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/keno.html">🎱 Keno Lottery</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/bingo.html">🎫 Bingo 75-Ball Live</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/blackjack.html">♠️ Blackjack 21 VIP</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/poker.html">🃏 Video Poker</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/lucky.html">🍀 Lucky Number 777</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/scratch.html">🎟️ Lucky Scratch VIP</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/coinflip.html">🪙 Coin Flip VIP</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}games/hilo.html">🃏 Hi-Lo Streak</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}deposit.html" style="color:#00e700; font-weight:700;">💳 Deposit Cashier <span class="drawer-nav-badge" style="background:#00e700; color:#000;">INSTANT</span></a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}withdraw.html">📤 Instant Withdrawal</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}p2p.html" style="color:var(--primary-gold); font-weight:700;">🔄 P2P Trading Desk <span class="drawer-nav-badge" style="background:var(--primary-gold); color:#000;">LOCAL PKR</span></a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}history.html">📋 Betslip & Statement Ledger</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}promo.html">🎁 VIP Club & Promotions</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}pages.html?slug=about">ℹ️ About Bet With Net</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}pages.html?slug=terms">⚖️ Terms & Conditions</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}pages.html?slug=privacy">🔒 Privacy Policy</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}pages.html?slug=fairness">🛡️ Provably Fair System</a></li>
                    <li class="drawer-nav-item"><a href="${rootPath}pages.html?slug=faq">❓ FAQ & Help Center</a></li>
                    <li class="drawer-nav-item" style="border-top:1px solid rgba(255, 71, 87, 0.25); margin-top:8px; padding-top:4px;">
                        <a href="javascript:void(0)" onclick="window.core.logout();" style="color:#ff4757; font-weight:800; display:flex; align-items:center; justify-content:space-between; text-decoration:none;">
                            <span style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:16px;">🚪</span>
                                <span>Logout Account</span>
                            </span>
                            <span class="drawer-nav-badge" style="background:rgba(255, 71, 87, 0.15); color:#ff4757; border:1px solid rgba(255, 71, 87, 0.4); font-weight:800;">SIGN OUT</span>
                        </a>
                    </li>
                    <li class="drawer-nav-item"><a href="${rootPath}admin/index.html" style="color:#00e700; font-weight:800;">👑 AdminLTE Master Panel <span class="drawer-nav-badge" style="background:#00e700; color:#000;">PRO</span></a></li>
                </ul>

                <div style="padding:16px; background:#111823; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                    <button class="btn-secondary" style="padding:6px 12px; font-size:11px;" onclick="window.core.toggleLanguage()">
                        🌐 Language: <b>${this.lang === 'en' ? 'English' : 'اردو'}</b>
                    </button>
                    <button class="btn-secondary" style="padding:6px 12px; font-size:11px;" onclick="window.core.showLiveSupport()">
                        💬 Support
                    </button>
                </div>
            </div>
        `;
    }

    // Bottom Navigation Generator
    renderBottomNav() {
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let nav = document.getElementById('app-bottom-nav-slot');
        if (!nav) {
            nav = document.createElement('nav');
            nav.id = 'app-bottom-nav-slot';
            nav.className = 'mobile-bottom-nav';
            document.body.appendChild(nav);
        }

        nav.innerHTML = `
            <a href="${rootPath}index.html" class="nav-item ${this.activeTab === 'home' ? 'active' : ''}">
                <span class="nav-icon">🏠</span>
                <span class="nav-label">${this.t('lobby')}</span>
            </a>
            <a href="javascript:void(0)" onclick="window.core.showCasinoMaintenanceModal(event)" class="nav-item ${this.activeTab === 'casino' ? 'active' : ''}" title="Casino (Under Maintenance)">
                <span class="nav-icon">🎮</span>
                <span class="nav-label">${this.t('casino')}</span>
            </a>
            <a href="${rootPath}deposit.html" class="nav-item nav-item-special ${this.activeTab === 'deposit' ? 'active' : ''}">
                <div class="nav-icon-circle">
                    <span>➕</span>
                </div>
                <span class="nav-label">${this.t('deposit')}</span>
            </a>
            <a href="${rootPath}history.html" class="nav-item ${this.activeTab === 'history' ? 'active' : ''}">
                <span class="nav-icon">📋</span>
                <span class="nav-label">${this.t('bets')}</span>
            </a>
            <button class="nav-item" onclick="window.core.openDrawer(event)">
                <span class="nav-icon" style="font-size:20px; font-weight:900;">⋮</span>
                <span class="nav-label">${this.t('menu')}</span>
            </button>
        `;
    }

    renderToastContainer() {
        if (!document.getElementById('toast-container')) {
            const tc = document.createElement('div');
            tc.id = 'toast-container';
            tc.className = 'toast-container';
            document.body.appendChild(tc);
        }
    }

    openDrawer(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        this.ensureBGMPlaying();
        this.renderDrawer();
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('app-drawer');
        if (overlay) {
            overlay.classList.add('active');
            overlay.style.display = 'block';
        }
        if (drawer) {
            drawer.scrollTop = 0;
            drawer.classList.add('active');
            drawer.style.transform = 'translateX(0)';
        }
        document.body.classList.add('drawer-open');
        if (window.sound && window.sound.playClick) window.sound.playClick();
    }

    closeDrawer(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const overlay = document.getElementById('drawer-overlay');
        const drawer = document.getElementById('app-drawer');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
        }
        if (drawer) {
            drawer.classList.remove('active');
            drawer.style.transform = 'translateX(-100%)';
        }
        document.body.classList.remove('drawer-open');
    }

    openAppDownloadModal(autoTrigger = false) {
        this.ensureBGMPlaying();
        if (this.isNativeApp()) return;
        if (autoTrigger) {
            try {
                if (localStorage.getItem('bwn_apk_downloaded_v1_2')) return;
                if (localStorage.getItem('bwn_apk_modal_closed_v1_2')) return;
                if (sessionStorage.getItem('bwn_apk_modal_closed')) return;
            } catch (e) {}
        }

        let modal = document.getElementById('apk-download-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'apk-download-modal-root';
            document.body.appendChild(modal);
        }

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        modal.innerHTML = `
            <div class="vip-apk-modal-overlay" onclick="window.core.closeAppDownloadModal(event)"></div>
            <div class="vip-apk-modal-dialog">
                <div class="vip-apk-top-badge">
                    <span>👑 OFFICIAL VIP APP (ANDROID & iOS)</span>
                </div>
                
                <button class="vip-apk-close-btn" onclick="window.core.closeAppDownloadModal(event)" title="Close">✕</button>

                <div class="vip-apk-content">
                    <div class="vip-apk-icon-glow-wrap">
                        <div class="vip-apk-pulse-ring"></div>
                        <img src="${rootPath}assets/icons/app_launcher.png?v=vip2" alt="Bet With Net App" class="vip-apk-app-icon">
                        <span class="vip-apk-micro-badge">VIP APP</span>
                    </div>

                    <h2 class="vip-apk-title">BET WITH NET</h2>
                    <p class="vip-apk-subtitle">Official Mobile App • Android & iPhone</p>

                    <div class="vip-apk-perks">
                        <div class="vip-apk-perk">
                            <span class="vip-perk-ico">🚀</span>
                            <div class="vip-perk-text">
                                <b>Smooth 60 FPS Gaming</b>
                                <span>Zero lag on Aviator, Limbo, Plinko & Slots</span>
                            </div>
                        </div>
                        <div class="vip-apk-perk">
                            <span class="vip-perk-ico">💰</span>
                            <div class="vip-perk-text">
                                <b>Instant 1-Tap Cashier</b>
                                <span>EasyPaisa, JazzCash & Auto-Wallet Sync</span>
                            </div>
                        </div>
                    </div>

                    <!-- App Download Buttons (Android & iOS) with clean gap -->
                    <div class="vip-modal-buttons-group">
                        <!-- Button 1: Android APK Download -->
                        <a href="${rootPath}download.php" download="betwithnet.apk" onclick="window.core.onAppDownloadClick(event)" class="vip-apk-download-btn">
                            <span class="btn-shine"></span>
                            <span class="btn-icon">🤖</span>
                            <div class="btn-text-group">
                                <span class="btn-main-text">Android APK Download</span>
                                <span class="btn-sub-text">100% Free • Safe & Fast (1.1 MB)</span>
                            </div>
                            <span class="btn-arrow">➔</span>
                        </a>

                        <!-- Button 2: iOS Version Download -->
                        <a href="${rootPath}ios.html" class="vip-apk-download-btn vip-ios-download-btn">
                            <span class="btn-shine"></span>
                            <span class="btn-icon">🍏</span>
                            <div class="btn-text-group">
                                <span class="btn-main-text">iOS Version Download</span>
                                <span class="btn-sub-text">Apple iPhone & iPad (Free VIP App)</span>
                            </div>
                            <span class="btn-arrow">➔</span>
                        </a>
                    </div>

                    <button class="vip-apk-skip-btn" onclick="window.core.closeAppDownloadModal(event)">
                        Continue on Website ➔
                    </button>
                </div>
            </div>
        `;
    }

    closeAppDownloadModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            sessionStorage.setItem('bwn_apk_modal_closed', 'true');
            localStorage.setItem('bwn_apk_modal_closed_v1_2', 'true');
        } catch (err) {}
        const modal = document.getElementById('apk-download-modal-root');
        if (modal) {
            modal.innerHTML = '';
        }
    }

    onAppDownloadClick(e) {
        try {
            localStorage.setItem('bwn_apk_downloaded_v1_2', 'true');
            localStorage.setItem('bwn_apk_modal_closed_v1_2', 'true');
        } catch (err) {}
        this.showToast('📲 Bet With Net APK download shuru ho gayi hai! Check notifications.', 'success');
        setTimeout(() => {
            this.closeAppDownloadModal();
        }, 2500);
    }

    // ============================================================
    // DRAGGABLE CIRCULAR WHATSAPP 24/7 SUPPORT WIDGET
    // ============================================================
    initWhatsAppFloatingWidget() {
        const rawPath = (window.location.pathname || '').toLowerCase().replace(/\\/g, '/');
        // Strictly only hide inside dedicated /games/ pages
        const isGame = rawPath.includes('/games/') || 
                       document.body.classList.contains('game-page') || 
                       document.body.classList.contains('in-game');

        if (isGame) {
            const existing = document.getElementById('whatsapp-floating-root');
            if (existing) existing.remove();
            return;
        }

        let widget = document.getElementById('whatsapp-floating-root');
        if (!widget) {
            widget = document.createElement('div');
            widget.id = 'whatsapp-floating-root';
            widget.className = 'whatsapp-floating-widget';
            widget.title = 'Chat on WhatsApp 24/7';

            widget.innerHTML = `
                <div class="whatsapp-btn-pulse"></div>
                <div class="whatsapp-btn-core">
                    <svg class="whatsapp-svg-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 175.216 175.552" width="100%" height="100%">
                        <defs>
                            <linearGradient id="bwnWaGrad" x1="85.915" x2="86.535" y1="32.567" y2="137.092" gradientUnits="userSpaceOnUse">
                                <stop offset="0" stop-color="#57d163"/>
                                <stop offset="1" stop-color="#23b33a"/>
                            </linearGradient>
                        </defs>
                        <path fill="#ffffff" d="m12.966 161.238 10.439-38.114a73.42 73.42 0 0 1-9.821-36.772c.017-40.556 33.021-73.55 73.578-73.55 19.681.01 38.154 7.669 52.047 21.572s21.537 32.383 21.53 52.037c-.018 40.553-33.027 73.553-73.578 73.553h-.032c-12.313-.005-24.412-3.094-35.159-8.954z"/>
                        <path fill="url(#bwnWaGrad)" d="M87.184 25.227c-33.733 0-61.166 27.423-61.178 61.13a60.98 60.98 0 0 0 9.349 32.535l1.455 2.313-6.179 22.558 23.146-6.069 2.235 1.324c9.387 5.571 20.15 8.517 31.126 8.523h.023c33.707 0 61.14-27.426 61.153-61.135a60.75 60.75 0 0 0-17.895-43.251 60.75 60.75 0 0 0-43.235-17.928z"/>
                        <path fill="#ffffff" fill-rule="evenodd" d="M68.772 55.603c-1.378-3.061-2.828-3.123-4.137-3.176l-3.524-.043c-1.226 0-3.218.46-4.902 2.3s-6.435 6.287-6.435 15.332 6.588 17.785 7.506 19.013 12.718 20.381 31.405 27.75c15.529 6.124 18.689 4.906 22.061 4.6s10.877-4.447 12.408-8.74 1.532-7.971 1.073-8.74-1.685-1.226-3.525-2.146-10.877-5.367-12.562-5.981-2.91-.919-4.137.921-4.746 5.979-5.819 7.206-2.144 1.381-3.984.462-7.76-2.861-14.784-9.124c-5.465-4.873-9.154-10.891-10.228-12.73s-.114-2.835.808-3.751c.825-.824 1.838-2.147 2.759-3.22s1.224-1.84 1.836-3.065.307-2.301-.153-3.22-4.032-10.011-5.666-13.647"/>
                    </svg>
                    <span class="whatsapp-status-dot"></span>
                </div>
            `;
            document.body.appendChild(widget);
        }

        // Always guarantee visible flex styling
        widget.style.setProperty('display', 'flex', 'important');
        widget.style.setProperty('visibility', 'visible', 'important');
        widget.style.setProperty('opacity', '1', 'important');

        // Restore saved position if within valid screen bounds
        try {
            const savedPos = JSON.parse(localStorage.getItem('bwn_wa_pos') || 'null');
            if (savedPos && typeof savedPos.left === 'number' && typeof savedPos.top === 'number') {
                const maxL = Math.max(10, window.innerWidth - 60);
                const maxT = Math.max(60, window.innerHeight - 70);
                if (savedPos.left >= 0 && savedPos.left <= maxL && savedPos.top >= 40 && savedPos.top <= maxT) {
                    widget.style.left = `${savedPos.left}px`;
                    widget.style.top = `${savedPos.top}px`;
                    widget.style.bottom = 'auto';
                    widget.style.right = 'auto';
                    if (savedPos.left > window.innerWidth / 2) widget.classList.add('right-side');
                } else {
                    widget.style.bottom = '82px';
                    widget.style.left = '16px';
                    widget.style.top = 'auto';
                    widget.style.right = 'auto';
                }
            } else {
                widget.style.bottom = '82px';
                widget.style.left = '16px';
                widget.style.top = 'auto';
                widget.style.right = 'auto';
            }
        } catch(e) {
            widget.style.bottom = '82px';
            widget.style.left = '16px';
            widget.style.top = 'auto';
            widget.style.right = 'auto';
        }

        // Sync latest settings from SQL in background
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        fetch(`${rootPath}api/games.php?action=settings`).then(r => r.json()).then(json => {
            if (json && json.success && json.data) {
                const s = json.data;
                if (s.whatsapp_group_link && s.whatsapp_group_link.trim().length > 0) {
                    localStorage.setItem('bwn_whatsapp_group_link', s.whatsapp_group_link.trim());
                }
                if (s.whatsapp_number) {
                    localStorage.setItem('bwn_support_whatsapp', s.whatsapp_number);
                }
            }
        }).catch(() => {});

        // Continuous Presence Guard on Main/Front Pages:
        // Automatically revives and reveals the widget if anything attempts to remove or hide it!
        if (!window._bwnWaGuardStarted && !isGame) {
            window._bwnWaGuardStarted = true;
            setInterval(() => {
                const p = (window.location.pathname || '').toLowerCase();
                if (!p.includes('/games/')) {
                    const el = document.getElementById('whatsapp-floating-root');
                    if (!el) {
                        this.initWhatsAppFloatingWidget();
                    } else if (el.style.display === 'none' || getComputedStyle(el).display === 'none' || getComputedStyle(el).visibility === 'hidden') {
                        el.style.setProperty('display', 'flex', 'important');
                        el.style.setProperty('visibility', 'visible', 'important');
                        el.style.setProperty('opacity', '1', 'important');
                        el.style.setProperty('pointer-events', 'auto', 'important');
                    }
                }
            }, 1500);
        }

        // Prevent attaching duplicate event listeners
        if (widget._hasWaListeners) return;
        widget._hasWaListeners = true;

        // Dragging & Click State
        let isDragging = false;
        let startX = 0, startY = 0;
        let startLeft = 0, startTop = 0;
        let hasMoved = false;

        const onPointerDown = (clientX, clientY) => {
            const rect = widget.getBoundingClientRect();
            startX = clientX;
            startY = clientY;
            startLeft = rect.left;
            startTop = rect.top;
            isDragging = true;
            hasMoved = false;
            widget.classList.add('dragging');
        };

        const onPointerMove = (clientX, clientY, e) => {
            if (!isDragging) return;
            const dx = clientX - startX;
            const dy = clientY - startY;
            if (!hasMoved && Math.hypot(dx, dy) > 5) {
                hasMoved = true;
            }
            if (hasMoved) {
                if (e && e.cancelable) e.preventDefault();
                let nextLeft = startLeft + dx;
                let nextTop = startTop + dy;
                const maxL = window.innerWidth - widget.offsetWidth - 8;
                const maxT = window.innerHeight - widget.offsetHeight - 65;
                nextLeft = Math.max(8, Math.min(nextLeft, maxL));
                nextTop = Math.max(60, Math.min(nextTop, maxT));

                widget.style.left = `${nextLeft}px`;
                widget.style.top = `${nextTop}px`;
                widget.style.bottom = 'auto';
                widget.style.right = 'auto';

                if (nextLeft > window.innerWidth / 2) {
                    widget.classList.add('right-side');
                } else {
                    widget.classList.remove('right-side');
                }
            }
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            widget.classList.remove('dragging');

            if (hasMoved) {
                const rect = widget.getBoundingClientRect();
                try {
                    localStorage.setItem('bwn_wa_pos', JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) }));
                } catch(e) {}
            } else {
                // It was a tap / click! Open WhatsApp!
                this.openWhatsAppSupport();
            }
        };

        // Ultra-Performant Dynamic Touch Listeners (Mobile & APK)
        // Only attached while dragging so normal page touch scrolling runs at full 120 FPS!
        const handleTouchMove = (e) => {
            if (isDragging && e.touches && e.touches.length === 1) {
                onPointerMove(e.touches[0].clientX, e.touches[0].clientY, e);
            }
        };

        const handleTouchEnd = () => {
            if (isDragging) onPointerUp();
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
            window.removeEventListener('touchcancel', handleTouchEnd);
        };

        widget.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length === 1) {
                onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
                window.addEventListener('touchmove', handleTouchMove, { passive: false });
                window.addEventListener('touchend', handleTouchEnd, { passive: true });
                window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
            }
        }, { passive: true });

        // Dynamic Mouse Listeners (Desktop)
        const handleMouseMove = (e) => {
            if (isDragging) {
                onPointerMove(e.clientX, e.clientY, e);
            }
        };

        const handleMouseUp = () => {
            if (isDragging) onPointerUp();
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        widget.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                onPointerDown(e.clientX, e.clientY);
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
            }
        });
    }

    openWhatsAppSupport() {
        this.ensureBGMPlaying();
        if (window.sound && window.sound.playClick) window.sound.playClick();
        
        // Priority 1: Custom WhatsApp Community Group Link / Channel (Default: Official Channel)
        let groupLink = localStorage.getItem('bwn_whatsapp_group_link');
        if (!groupLink || groupLink.trim().length < 6) {
            groupLink = window.BWN_WHATSAPP_GROUP_LINK || 'https://whatsapp.com/channel/0029VbDhwXK35fLwCwVkNJ0Q';
        }
        if (groupLink && groupLink.trim().length > 6) {
            let finalUrl = groupLink.trim();
            if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
                finalUrl = 'https://' + finalUrl;
            }
            window.open(finalUrl, '_blank');
            return;
        }

        // Priority 2: Direct 1-on-1 Support Chat
        const waNum = localStorage.getItem('bwn_support_whatsapp') || window.BWN_SUPPORT_WHATSAPP || '923000000000';
        const msg = encodeURIComponent(localStorage.getItem('bwn_support_whatsapp_msg') || 'Assalam-o-Alaikum Bet With Net Support! Mujhe help chahiye.');
        const cleanNum = String(waNum).replace(/\D/g, '');
        window.open(`https://wa.me/${cleanNum}?text=${msg}`, '_blank');
    }

    // ============================================================
    // LIVE DEPOSIT & WITHDRAWAL POPUP NOTIFICATION ENGINE
    // ============================================================
    _injectTransactionPopupStyles() {
        if (document.getElementById('bwn-live-tx-styles')) return;
        const style = document.createElement('style');
        style.id = 'bwn-live-tx-styles';
        style.textContent = `
            #bwn-live-tx-container {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 10000000 !important;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 380px;
                width: calc(100% - 48px);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }
            @media (max-width: 768px) {
                #bwn-live-tx-container {
                    bottom: 76px;
                    left: 12px;
                    right: 12px;
                    width: auto;
                    max-width: calc(100% - 24px);
                }
            }
            .bwn-live-tx-card {
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.96));
                border: 1px solid rgba(255, 255, 255, 0.14);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-radius: 14px;
                padding: 12px 14px;
                box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.06);
                display: flex;
                align-items: center;
                gap: 12px;
                pointer-events: auto;
                cursor: pointer;
                transform: translateX(-35px) scale(0.94);
                opacity: 0;
                transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
                user-select: none;
                position: relative;
                overflow: hidden;
            }
            .bwn-live-tx-card.active {
                transform: translateX(0) scale(1);
                opacity: 1;
            }
            .bwn-live-tx-card.hiding {
                transform: translateX(-40px) scale(0.92);
                opacity: 0;
            }
            .bwn-live-tx-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                bottom: 0;
                width: 4px;
            }
            .bwn-live-tx-card.type-deposit::before {
                background: linear-gradient(180deg, #10b981, #059669);
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.85);
            }
            .bwn-live-tx-card.type-withdraw::before {
                background: linear-gradient(180deg, #f59e0b, #d97706);
                box-shadow: 0 0 12px rgba(245, 158, 11, 0.85);
            }
            .bwn-tx-icon-wrap {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                flex-shrink: 0;
            }
            .type-deposit .bwn-tx-icon-wrap {
                background: rgba(16, 185, 129, 0.18);
                border: 1px solid rgba(16, 185, 129, 0.4);
                box-shadow: 0 0 16px rgba(16, 185, 129, 0.25);
            }
            .type-withdraw .bwn-tx-icon-wrap {
                background: rgba(245, 158, 11, 0.18);
                border: 1px solid rgba(245, 158, 11, 0.4);
                box-shadow: 0 0 16px rgba(245, 158, 11, 0.25);
            }
            .bwn-tx-body {
                flex: 1;
                min-width: 0;
            }
            .bwn-tx-header-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 6px;
                margin-bottom: 2px;
            }
            .bwn-tx-badge {
                font-size: 10px;
                font-weight: 800;
                letter-spacing: 0.6px;
                padding: 2px 7px;
                border-radius: 4px;
                text-transform: uppercase;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            .type-deposit .bwn-tx-badge {
                background: rgba(16, 185, 129, 0.22);
                color: #10b981;
                border: 1px solid rgba(16, 185, 129, 0.45);
            }
            .type-withdraw .bwn-tx-badge {
                background: rgba(245, 158, 11, 0.22);
                color: #fbbf24;
                border: 1px solid rgba(245, 158, 11, 0.45);
            }
            .bwn-tx-time {
                font-size: 10px;
                color: #94a3b8;
                font-weight: 500;
            }
            .bwn-tx-main-text {
                font-size: 13px;
                color: #f8fafc;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                margin-top: 1px;
            }
            .bwn-tx-main-text .bwn-tx-user {
                color: #38bdf8;
                font-weight: 700;
            }
            .bwn-tx-main-text .bwn-tx-amt {
                font-weight: 800;
            }
            .type-deposit .bwn-tx-amt {
                color: #10b981;
            }
            .type-withdraw .bwn-tx-amt {
                color: #fbbf24;
            }
            .bwn-tx-sub-text {
                font-size: 11px;
                color: #94a3b8;
                margin-top: 2px;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .bwn-tx-pulse-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                display: inline-block;
            }
            .type-deposit .bwn-tx-pulse-dot {
                background: #10b981;
                box-shadow: 0 0 8px #10b981;
            }
            .type-withdraw .bwn-tx-pulse-dot {
                background: #fbbf24;
                box-shadow: 0 0 8px #fbbf24;
            }
            .bwn-tx-close-btn {
                background: none;
                border: none;
                color: #64748b;
                font-size: 16px;
                cursor: pointer;
                padding: 4px;
                line-height: 1;
                transition: color 0.2s;
                align-self: flex-start;
            }
            .bwn-tx-close-btn:hover {
                color: #f8fafc;
            }

            /* Dedicated Transaction Celebration Modal */
            #bwn-tx-celebrate-modal {
                position: fixed;
                inset: 0;
                z-index: 10000001 !important;
                background: rgba(0, 0, 0, 0.82);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 16px;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            #bwn-tx-celebrate-modal.active {
                opacity: 1;
                pointer-events: auto;
            }
            .bwn-tx-modal-box {
                background: linear-gradient(135deg, #0f172a, #1e293b);
                border: 1.5px solid rgba(255, 255, 255, 0.15);
                border-radius: 20px;
                padding: 28px 24px;
                max-width: 440px;
                width: 100%;
                text-align: center;
                box-shadow: 0 25px 70px rgba(0, 0, 0, 0.85);
                transform: scale(0.9);
                transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                position: relative;
                color: #f8fafc;
            }
            #bwn-tx-celebrate-modal.active .bwn-tx-modal-box {
                transform: scale(1);
            }
            .bwn-tx-modal-icon {
                font-size: 50px;
                margin-bottom: 12px;
                display: inline-block;
                animation: bwnPopBounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            @keyframes bwnPopBounce {
                0% { transform: scale(0.4); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
            }
            .bwn-tx-modal-title {
                font-size: 20px;
                font-weight: 900;
                margin-bottom: 6px;
            }
            .bwn-tx-modal-desc {
                font-size: 13px;
                color: #94a3b8;
                line-height: 1.5;
                margin-bottom: 18px;
            }
            .bwn-tx-modal-details {
                background: rgba(15, 23, 42, 0.65);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 14px;
                margin-bottom: 20px;
                text-align: left;
                font-size: 13px;
            }
            .bwn-tx-modal-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 6px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }
            .bwn-tx-modal-row:last-child {
                border-bottom: none;
            }
            .bwn-tx-modal-label {
                color: #94a3b8;
            }
            .bwn-tx-modal-val {
                font-weight: 700;
                color: #f8fafc;
            }
            .bwn-tx-modal-btn {
                background: linear-gradient(135deg, #059669, #10b981);
                color: #ffffff;
                border: none;
                font-weight: 800;
                font-size: 15px;
                padding: 13px 20px;
                border-radius: 10px;
                width: 100%;
                cursor: pointer;
                box-shadow: 0 4px 18px rgba(16, 185, 129, 0.4);
                transition: all 0.2s;
            }
            .bwn-tx-modal-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 6px 22px rgba(16, 185, 129, 0.5);
            }
        `;
        document.head.appendChild(style);
    }

    _ensureTransactionPopupDOM() {
        if (!document.getElementById('bwn-live-tx-container')) {
            const container = document.createElement('div');
            container.id = 'bwn-live-tx-container';
            document.body.appendChild(container);
        }
    }

    _playTxChime(isDeposit = true) {
        try {
            if (window.sound && typeof window.sound.playClick === 'function') {
                window.sound.playClick();
            }
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isDeposit ? 587.33 : 523.25, now);
            osc.frequency.exponentialRampToValueAtTime(isDeposit ? 880 : 783.99, now + 0.15);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } catch(e) {}
    }

    showTransactionPopup(data) {
        if (!data) return;
        this._injectTransactionPopupStyles();
        this._ensureTransactionPopupDOM();

        const container = document.getElementById('bwn-live-tx-container');
        if (!container) return;

        const isDeposit = (data.type === 'deposit');
        const amount = parseFloat(data.amount || 0);
        const amountStr = '₨ ' + amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        const user = data.user || 'Player***';
        const method = data.method || (isDeposit ? 'EasyPaisa' : 'JazzCash');
        const timeAgo = data.timeAgo || 'Just now';

        // Play gentle chime
        if (data.isSelf || data.sound !== false) {
            this._playTxChime(isDeposit);
        }

        // If this transaction was submitted by the current user, show the central celebration modal as well!
        if (data.isSelf) {
            this.showTransactionCelebrationModal(data);
            // Broadcast to other open tabs
            try {
                localStorage.setItem('bwn_latest_tx_broadcast', JSON.stringify({
                    type: data.type,
                    amount: amount,
                    user: user,
                    method: method,
                    timestamp: Date.now()
                }));
            } catch(e) {}
        }

        const card = document.createElement('div');
        card.className = `bwn-live-tx-card ${isDeposit ? 'type-deposit' : 'type-withdraw'}`;

        const icon = isDeposit ? '📥' : '💸';
        const badgeText = isDeposit ? '🟢 LIVE DEPOSIT' : '⚡ INSTANT CASHOUT';
        const actionWord = isDeposit ? 'deposited' : 'withdrew';

        card.innerHTML = `
            <div class="bwn-tx-icon-wrap">${icon}</div>
            <div class="bwn-tx-body">
                <div class="bwn-tx-header-row">
                    <span class="bwn-tx-badge">${badgeText}</span>
                    <span class="bwn-tx-time">${timeAgo}</span>
                </div>
                <div class="bwn-tx-main-text">
                    <span class="bwn-tx-user">${user}</span> ${actionWord} <span class="bwn-tx-amt">${amountStr}</span>
                </div>
                <div class="bwn-tx-sub-text">
                    <span class="bwn-tx-pulse-dot"></span> via <b>${method}</b> • Verified
                </div>
            </div>
            <button class="bwn-tx-close-btn" title="Dismiss">✕</button>
        `;

        let hideTimer = null;
        const hideCard = () => {
            if (hideTimer) clearTimeout(hideTimer);
            card.classList.remove('active');
            card.classList.add('hiding');
            setTimeout(() => card.remove(), 450);
        };

        const closeBtn = card.querySelector('.bwn-tx-close-btn');
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            hideCard();
        };

        card.onclick = () => {
            const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
            if (isDeposit) {
                window.location.href = rootPath + 'deposit.html';
            } else {
                window.location.href = rootPath + 'withdraw.html';
            }
        };

        container.appendChild(card);
        requestAnimationFrame(() => {
            card.classList.add('active');
        });

        hideTimer = setTimeout(hideCard, 5500);

        card.addEventListener('mouseenter', () => {
            if (hideTimer) clearTimeout(hideTimer);
        });
        card.addEventListener('mouseleave', () => {
            hideTimer = setTimeout(hideCard, 3000);
        });
    }

    showTransactionCelebrationModal(data) {
        if (!data) return;
        this._injectTransactionPopupStyles();
        let modal = document.getElementById('bwn-tx-celebrate-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'bwn-tx-celebrate-modal';
            document.body.appendChild(modal);
        }

        const isDeposit = (data.type === 'deposit');
        const icon = isDeposit ? '🎉' : '💸';
        const title = isDeposit ? 'Deposit Request Submitted!' : 'Withdrawal Request Submitted!';
        const color = isDeposit ? '#10b981' : '#fbbf24';
        const amount = parseFloat(data.amount || 0);
        const amountStr = '₨ ' + amount.toLocaleString('en-US');
        const method = data.method || (isDeposit ? 'EasyPaisa' : 'JazzCash');
        const trxId = data.trxId || ('TRX' + Date.now().toString().slice(-6));
        const status = isDeposit ? '⏳ Pending Verification' : '⚡ Processing Payout';

        modal.innerHTML = `
            <div class="bwn-tx-modal-box">
                <div class="bwn-tx-modal-icon">${icon}</div>
                <div class="bwn-tx-modal-title" style="color:${color};">${title}</div>
                <div class="bwn-tx-modal-desc">
                    ${isDeposit 
                        ? 'Aap ki deposit request admin team ko bhej di gayi hai. Verification ke baad balance foran credit kar diya jaye ga.'
                        : 'Aap ki withdrawal request process ho rahi hai. Admin approval ke baad funds aapke account mein transfer ho jayen ge.'}
                </div>
                <div class="bwn-tx-modal-details">
                    <div class="bwn-tx-modal-row">
                        <span class="bwn-tx-modal-label">Amount:</span>
                        <span class="bwn-tx-modal-val" style="color:${color}; font-size:16px;">${amountStr}</span>
                    </div>
                    <div class="bwn-tx-modal-row">
                        <span class="bwn-tx-modal-label">Payment Method:</span>
                        <span class="bwn-tx-modal-val">${method}</span>
                    </div>
                    <div class="bwn-tx-modal-row">
                        <span class="bwn-tx-modal-label">Reference ID:</span>
                        <span class="bwn-tx-modal-val" style="font-family:monospace;">${trxId}</span>
                    </div>
                    <div class="bwn-tx-modal-row">
                        <span class="bwn-tx-modal-label">Status:</span>
                        <span class="bwn-tx-modal-val" style="color:#ffd700;">${status}</span>
                    </div>
                </div>
                <button class="bwn-tx-modal-btn" onclick="document.getElementById('bwn-tx-celebrate-modal').classList.remove('active')">
                    THEEK HAI / CONTINUE PLAYING ✓
                </button>
            </div>
        `;

        modal.classList.add('active');
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('active');
        };
    }

    initLiveTransactionNotifier() {
        if (window._bwnLiveTxNotifierStarted) return;
        window._bwnLiveTxNotifierStarted = true;

        this._injectTransactionPopupStyles();
        this._ensureTransactionPopupDOM();

        // Public popups disabled per user instruction ('yaha nhi admin panel par popup ana chye aprove ka or decline ka')
        // Cross-tab broadcast is consumed exclusively by admin panel (js/admin.js)
    }

    // ============================================================
    // 7-DAYS VIP DAILY CHECK-IN BONUS ENGINE
    // ============================================================
    isBonusClaimedToday() {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const utcDate = now.toISOString().slice(0, 10);

        const user = this.getLoggedInUser();
        const uid = user ? (user.id || user.username || '') : '';

        const localClaimedDate = localStorage.getItem('bwn_daily_claimed_date');
        const userClaimedDate = uid ? localStorage.getItem(`bwn_daily_claimed_${uid}`) : null;
        const lastClaimTs = localStorage.getItem('bwn_daily_last_claimed_timestamp');

        // Check 1: Date string matches today (local or UTC)
        if (localClaimedDate === localDate || localClaimedDate === utcDate) return true;
        if (userClaimedDate === localDate || userClaimedDate === utcDate) return true;

        // Check 2: Timestamp was recorded after today's local midnight
        if (lastClaimTs) {
            const claimTime = parseInt(lastClaimTs, 10);
            if (!isNaN(claimTime)) {
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                if (claimTime >= todayMidnight.getTime()) {
                    return true;
                }
            }
        }

        return false;
    }

    markBonusClaimedToday(userId = null) {
        const now = new Date();
        const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const user = this.getLoggedInUser();
        const uid = userId || (user ? (user.id || user.username || '') : '');

        try {
            localStorage.setItem('bwn_daily_claimed_date', localDate);
            if (uid) localStorage.setItem(`bwn_daily_claimed_${uid}`, localDate);
            localStorage.setItem('bwn_daily_last_claimed_timestamp', Date.now().toString());

            const floatingBadge = document.getElementById('daily-bonus-floating-trigger');
            if (floatingBadge) {
                floatingBadge.innerHTML = '🎁 <span style="font-size:11px; color:#00e700;">Bonus Claimed</span>';
            }
        } catch(e) {}
    }

    initDailyBonusWidget() {
        const isGamePage = window.location.pathname.toLowerCase().includes('/games/');
        // Inside casino game pages, never auto-popup or inject floating bonus trigger
        if (isGamePage) return;

        const claimed = this.isBonusClaimedToday();

        // Floating gift badge in all lobby/content pages
        if (!document.getElementById('daily-bonus-floating-trigger')) {
            const badge = document.createElement('div');
            badge.id = 'daily-bonus-floating-trigger';
            badge.className = 'daily-floating-badge';
            if (claimed) {
                badge.innerHTML = '🎁 <span style="font-size:11px; color:#00e700;">Bonus Claimed</span>';
            } else {
                badge.innerHTML = '🎁 <span>Daily ₨20 Bonus</span>';
            }
            badge.title = '7-Days Daily Login Bonus';
            badge.onclick = () => this.openDailyBonusModal(false);
            document.body.appendChild(badge);
        }

        // Auto-popup when opening website or APK: ONLY IF LOGGED IN, NOT CLAIMED TODAY, AND NOT IN A GAME
        if (!claimed && !isGamePage && this.isUserLoggedIn()) {
            setTimeout(() => {
                if (this.isUserLoggedIn()) {
                    this.openDailyBonusModal(true);
                }
            }, 700);
        }
    }

    async openDailyBonusModal(autoTrigger = false) {
        // Fast-path guard: if autoTrigger inside game page, abort immediately (no annoying game popups!)
        if (autoTrigger && window.location.pathname.toLowerCase().includes('/games/')) {
            return;
        }

        this.ensureBGMPlaying();
        // Fast-path guard: if autoTrigger and already claimed today, exit immediately!
        if (autoTrigger && this.isBonusClaimedToday()) {
            return;
        }

        const user = this.getLoggedInUser();
        const uid = user ? (user.id || user.username || '') : '';
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        let status = {
            is_logged_in: !!user,
            can_claim: true,
            already_claimed: false,
            streak_day: 1,
            reward_today: 5,
            claimed_days: []
        };

        try {
            const res = await fetch(`${rootPath}api/daily_bonus.php?action=status&user_id=${encodeURIComponent(uid)}`, {
                cache: 'no-store',
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.success) {
                    status = data;
                }
            }
        } catch (err) {}

        // Check 2: If server confirms bonus was already claimed today:
        if (status.already_claimed || !status.can_claim) {
            this.markBonusClaimedToday(uid);

            // Once claimed today, auto-popup will NEVER appear until the next day!
            if (autoTrigger) {
                return;
            }
        }

        let modal = document.getElementById('daily-bonus-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'daily-bonus-modal-root';
            document.body.appendChild(modal);
        }

        const days = [
            { day: 1, reward: 5, icon: '💰' },
            { day: 2, reward: 5, icon: '💰' },
            { day: 3, reward: 5, icon: '💰' },
            { day: 4, reward: 5, icon: '💰' },
            { day: 5, reward: 5, icon: '💰' },
            { day: 6, reward: 5, icon: '💰' },
            { day: 7, reward: 20, icon: '👑', isMega: true }
        ];

        const claimedSet = new Set(status.claimed_days || []);

        let gridHtml = '';
        days.forEach(d => {
            const isClaimed = claimedSet.has(d.day);
            const isActive = !isClaimed && (d.day === status.streak_day) && status.can_claim;
            const isLocked = !isClaimed && !isActive;

            let cardClass = 'daily-day-card';
            if (d.isMega) cardClass += ' day-7-card';
            if (isClaimed) cardClass += ' claimed';
            else if (isActive) cardClass += ' active';
            else cardClass += ' locked';

            let statusLabel = '🔒 Locked';
            if (isClaimed) statusLabel = '✅ CLAIMED';
            else if (isActive) statusLabel = '🎁 TODAY';

            let cardClick = '';
            if (isActive) {
                cardClick = 'onclick="window.core.claimDailyBonus(event)" style="cursor:pointer;"';
            }

            const imgAsset = d.isMega ? `${rootPath}assets/icons/daily_chest_hd.jpg` : `${rootPath}assets/icons/daily_coin_stack_hd.jpg`;

            gridHtml += `
                <div class="${cardClass}" ${cardClick}>
                    <div class="daily-day-label">${d.isMega ? '⭐ DAY 7 (MEGA)' : `DAY ${d.day}`}</div>
                    <div class="daily-day-img-wrap">
                        <img src="${imgAsset}" class="daily-day-hd-img" alt="Day ${d.day} Reward">
                    </div>
                    <div class="daily-day-amount">₨ ${d.reward}${d.isMega ? '.00' : ''}</div>
                    <div class="daily-day-status-pill">${statusLabel}</div>
                </div>
            `;
        });

        let actionButtonHtml = '';
        if (status.can_claim) {
            actionButtonHtml = `
                <button type="button" class="daily-claim-action-btn" id="btn-claim-daily-bonus" onclick="window.core.claimDailyBonus(event)">
                    <span class="btn-shine"></span>
                    <span style="font-size:18px;">🎁</span>
                    <span>CLAIM DAY ${status.streak_day} (₨ ${status.reward_today}) NOW!</span>
                    <span style="font-weight:900;">➔</span>
                </button>
            `;
        } else {
            actionButtonHtml = `
                <button type="button" class="daily-claim-action-btn claimed-btn" disabled>
                    <span>✅</span>
                    <span>CLAIMED</span>
                </button>
            `;
        }

        modal.innerHTML = `
            <div class="daily-bonus-overlay" onclick="window.core.closeDailyBonusModal(event)"></div>
            <div class="daily-bonus-dialog">
                <div class="daily-bonus-banner">
                    <div class="daily-bonus-banner-bg" style="background-image: url('${rootPath}assets/banners/daily_bonus_hd_banner.jpg');"></div>
                    <div class="daily-bonus-banner-overlay"></div>
                    <button class="daily-bonus-close-btn" onclick="window.core.closeDailyBonusModal(event)" title="Close">✕</button>
                    <div class="daily-bonus-banner-content">
                        <div class="daily-bonus-vip-tag">👑 VIP CASINO ROYALE</div>
                        <h2 class="daily-bonus-headline">7-DAYS VIP LOGIN BONUS</h2>
                        <p class="daily-bonus-subline">Days 1–6: <b>₨5 Daily</b> • Day 7: <b>₨20 MEGA BONUS!</b></p>
                    </div>
                </div>

                <div class="daily-bonus-body">
                    <div class="daily-bonus-streak-indicator">
                        <div style="display:flex; align-items:center; gap:6px;">
                            <span>🔥</span>
                            <span>Streak: <b>Day ${status.streak_day} / 7</b> ${status.can_claim ? '' : '<span style="color:#00e700; font-weight:900; margin-left:4px;">[✅ CLAIMED]</span>'}</span>
                        </div>
                        <div style="color:#ffd700; font-weight:800;">
                            <span>🎁 Total Pool: <b>₨ 50 PKR</b></span>
                        </div>
                    </div>

                    <div class="daily-bonus-grid">
                        ${gridHtml}
                    </div>

                    ${actionButtonHtml}

                    <div style="font-size:10.5px; color:#8fa3c0; margin-top:12px; text-align:center;">
                        💡 Har roz website ya APK kholne par bonus barhta hai! Streak tootne par Day 1 se reset hoga.
                    </div>
                </div>
            </div>
        `;

        // Event binding to guarantee click registration across all mobile browsers & webviews
        const claimBtn = modal.querySelector('#btn-claim-daily-bonus');
        if (claimBtn) {
            claimBtn.onclick = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                this.claimDailyBonus(e);
            };
        }
        const activeCardEl = modal.querySelector('.daily-day-card.active');
        if (activeCardEl) {
            activeCardEl.onclick = (e) => {
                if (e && e.stopPropagation) e.stopPropagation();
                this.claimDailyBonus(e);
            };
        }
    }

    async claimDailyBonus(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();

        // If user is not logged in / has no registered account, open Register/Sign In modal!
        if (!this.isUserLoggedIn()) {
            this.closeDailyBonusModal();
            this.openAuthModal('register', 'Account Required: Bonus claim karne ke liye pehle Register ya Sign In karein!');
            this.showToast('Daily Bonus claim karne ke liye pehle apna Account Register ya Sign In karein!', 'info');
            return;
        }

        if (this._isClaimingBonus) return;
        this._isClaimingBonus = true;

        const btn = document.getElementById('btn-claim-daily-bonus');
        if (btn) {
            btn.disabled = true;
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<span>⏳ Claiming Bonus...</span>';
        }

        const user = this.getLoggedInUser();
        const userId = user ? (user.id || user.username || '') : '';
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let rewardPkr = 5;
        let serverResponse = null;

        try {
            const res = await fetch(`${rootPath}api/daily_bonus.php?action=claim&user_id=${encodeURIComponent(userId)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ user_id: userId })
            });

            if (res.ok) {
                serverResponse = await res.json();
                if (serverResponse && serverResponse.success) {
                    if (serverResponse.reward_pkr) rewardPkr = parseFloat(serverResponse.reward_pkr);
                }
            } else {
                const errJson = await res.json().catch(() => null);
                if (errJson && errJson.auth_required) {
                    this._isClaimingBonus = false;
                    this.closeDailyBonusModal();
                    this.openAuthModal('register', errJson.message || 'Bonus claim karne ke liye pehle Register ya Sign In karein!');
                    this.showToast(errJson.message || 'Daily Bonus claim karne ke liye pehle apna Account Register ya Sign In karein!', 'info');
                    return;
                }
                if (errJson && errJson.already_claimed) {
                    this.showToast(errJson.message || 'Aap aaj ka bonus pehle hi claim kar chuke hain! Kal agla bonus milega.', 'info');
                    this.markBonusClaimedToday(userId);
                    if (btn) {
                        btn.disabled = true;
                        btn.classList.add('claimed-btn');
                        btn.innerHTML = '<span>✅</span><span>CLAIMED TODAY • NEXT REWARD TOMORROW</span>';
                    }
                    this._isClaimingBonus = false;
                    setTimeout(() => this.closeDailyBonusModal(), 1200);
                    return;
                }
                this._isClaimingBonus = false;
                if (btn) {
                    btn.disabled = false;
                    btn.style.pointerEvents = 'auto';
                    btn.innerHTML = '<span>CLAIM NOW</span>';
                }
                this.showToast((errJson && errJson.message) || 'Bonus claim karne mein masla aya.', 'warning');
                return;
            }
        } catch (e) {
            console.warn('[Daily Bonus] Network notice:', e);
        }

        if (!serverResponse || !serverResponse.success) {
            this._isClaimingBonus = false;
            if (btn) {
                btn.disabled = false;
                btn.style.pointerEvents = 'auto';
                btn.innerHTML = '<span>CLAIM NOW</span>';
            }
            this.showToast('Bonus server se connect nahi ho saka. Barah-e-karam apna internet check karein.', 'warning');
            return;
        }

        // Guaranteed User & Session Persistence
        if (serverResponse && serverResponse.user) {
            try {
                localStorage.setItem('bwn_session_user', JSON.stringify(serverResponse.user));
            } catch (e) {}
            if (window.userManager) {
                window.userManager.currentUser = serverResponse.user;
                if (serverResponse.user.id) window.userManager.setActiveUser(serverResponse.user.id);
            }
            if (window.APIBridge) {
                window.APIBridge.activeUser = serverResponse.user;
            }
            this.renderHeader();
            this.renderDrawer();
        }

        // Guaranteed Live Bonus Wallet Balance Update
        if (window.wallet) {
            if (serverResponse && serverResponse.bonus_balance_pkr !== undefined) {
                window.wallet.state.bonusPKR = parseFloat(serverResponse.bonus_balance_pkr);
                window.wallet.state.bonusUSD = parseFloat(serverResponse.bonus_balance_usd || (serverResponse.bonus_balance_pkr / 280));
            } else {
                window.wallet.state.bonusPKR = parseFloat(((window.wallet.state.bonusPKR || 0) + rewardPkr).toFixed(2));
            }
            if (serverResponse && serverResponse.balance_pkr !== undefined) {
                window.wallet.state.balancePKR = parseFloat(serverResponse.balance_pkr);
                window.wallet.state.balanceUSD = parseFloat(serverResponse.balance_usd);
            }
            window.wallet.saveState();
        }
        this.updateAllBalances();
        if (user && user.id) this.syncServerBalance(user.id);

        if (window.sound && typeof window.sound.playWin === 'function') {
            window.sound.playWin();
        }

        // Update button inside dialog to shiny claimed green with "CLAIMED"
        if (btn) {
            btn.disabled = true;
            btn.classList.add('claimed-btn');
            btn.style.background = 'linear-gradient(135deg, #00e700, #009900)';
            btn.style.boxShadow = '0 0 30px rgba(0, 231, 0, 0.85)';
            btn.style.color = '#000000';
            btn.style.fontWeight = '900';
            btn.innerHTML = `<span>✅</span><span>CLAIMED</span>`;
        }

        // Update active day card in the dialog to claimed
        const activeCard = document.querySelector('.daily-day-card.active');
        if (activeCard) {
            activeCard.classList.remove('active');
            activeCard.classList.add('claimed');
            const pill = activeCard.querySelector('.daily-day-status-pill');
            if (pill) {
                pill.textContent = '✅ CLAIMED';
                pill.style.background = '#00e700';
                pill.style.color = '#000000';
                pill.style.fontWeight = '900';
            }
        }

        // Update streak banner indicator
        const streakEl = document.querySelector('.daily-bonus-streak-indicator');
        if (streakEl) {
            const streakDay = (serverResponse && serverResponse.streak_day) ? serverResponse.streak_day : 1;
            streakEl.innerHTML = `<span>🔥 Streak: <b>Day ${streakDay} / 7</b> <span style="color:#00e700; font-weight:900; margin-left:6px;">[✅ CLAIMED]</span></span> <span style="color:#ffd700;">🎁 Total Pool: <b>₨ 50 PKR</b></span>`;
        }

        // Show Grand Celebration VIP Animation!
        this.showCelebrationCoins(rewardPkr);
        this.showToast(`🎉 Mubarak ho! ₨${rewardPkr} Daily Bonus claim ho gaya! (Games khelne ke liye real deposit zaroori hai).`, 'success');

        // Mark today as claimed in localStorage so auto-popup never shows again today
        this.markBonusClaimedToday(userId);

        this._isClaimingBonus = false;

        // Gracefully auto-close popup dialog after 1.8 seconds!
        setTimeout(() => {
            const dialog = document.querySelector('.daily-bonus-dialog');
            if (dialog) dialog.classList.add('closing');
            setTimeout(() => {
                this.closeDailyBonusModal();
            }, 350);
        }, 1800);
    }

    showCelebrationCoins(rewardAmount = 5) {
        // 1. Center Banner Badge with glowing sunburst
        const container = document.createElement('div');
        container.className = 'daily-celebration-container';
        container.innerHTML = `
            <div class="daily-celebration-banner-badge">
                <div class="daily-celebration-sunburst"></div>
                <div style="font-size:38px; line-height:1; margin-bottom:6px;">👑💰🎉</div>
                <div style="font-size:24px; font-weight:900; color:#ffd700; text-shadow:0 0 20px rgba(255,215,0,0.85); letter-spacing:1px;">+₨ ${rewardAmount}.00 PKR</div>
                <div style="font-size:13px; font-weight:800; color:#00e700; margin-top:4px;">BONUS ADDED TO WALLET!</div>
            </div>
        `;
        document.body.appendChild(container);
        setTimeout(() => container.remove(), 2100);

        // 2. Flying celebration particles (Coins, crowns, gems, stars)
        const count = 36;
        const icons = ['👑', '💰', '🪙', '💎', '⭐', '✨'];
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'daily-coin-particle';
            el.textContent = icons[i % icons.length];
            el.style.left = (window.innerWidth / 2) + 'px';
            el.style.top = (window.innerHeight / 2) + 'px';

            const angle = (Math.PI * 2 / count) * i + (Math.random() * 0.5 - 0.25);
            const dist = 140 + Math.random() * 220;
            const tx = Math.cos(angle) * dist;
            const ty = Math.sin(angle) * dist - (Math.random() * 80);

            el.style.setProperty('--tx', `${tx}px`);
            el.style.setProperty('--ty', `${ty}px`);

            document.body.appendChild(el);
            setTimeout(() => el.remove(), 1900);
        }
    }

    closeDailyBonusModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const modal = document.getElementById('daily-bonus-modal-root');
        if (modal) {
            modal.innerHTML = '';
        }
    }

    getAppVersion() {
        try {
            const ua = navigator.userAgent;
            const match = ua.match(/BetWithNetApp\/([0-9.]+)/);
            if (match && match[1]) {
                return match[1];
            }
            if (ua.includes('BetWithNetApp')) return '1.1';
        } catch(e) {}
        return null;
    }

    checkForAppUpdate(manualTrigger = false) {
        if (!this.isNativeApp()) {
            if (manualTrigger) {
                this.openAppDownloadModal(false);
            }
            return;
        }

        const currentVer = this.getAppVersion() || '1.1';
        const LATEST_VER = '1.5';

        // If user already on v1.5+, they already have the latest build!
        if (parseFloat(currentVer) >= parseFloat(LATEST_VER)) {
            if (manualTrigger) {
                this.showToast('✅ Bet With Net App pehle se updated hai (v' + currentVer + ')!', 'success');
            }
            return;
        }

        // For automatic prompt, do NOT show if user already clicked update or dismissed in this version
        if (!manualTrigger) {
            try {
                if (localStorage.getItem('bwn_app_updated_v1_5')) return;
                if (sessionStorage.getItem('bwn_app_update_dismissed_v1_5')) return;
            } catch(e) {}
        }

        this.openAppUpdateModal(currentVer, LATEST_VER);
    }

    openAppUpdateModal(currentVer, latestVer) {
        this.ensureBGMPlaying();
        let modal = document.getElementById('apk-update-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'apk-update-modal-root';
            document.body.appendChild(modal);
        }

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        modal.innerHTML = `
            <div class="vip-apk-modal-overlay" onclick="window.core.closeAppUpdateModal(event)"></div>
            <div class="vip-apk-modal-dialog">
                <div class="vip-apk-top-badge" style="background: linear-gradient(90deg, #ff9100, #ffd700, #ff9100); color:#000;">
                    <span>⚡ NEW ULTRA-SMOOTH UPDATE AVAILABLE • v${latestVer}</span>
                </div>
                
                <button class="vip-apk-close-btn" onclick="window.core.closeAppUpdateModal(event)" title="Close">✕</button>

                <div class="vip-apk-content">
                    <div class="vip-apk-icon-glow-wrap">
                        <div class="vip-apk-pulse-ring" style="border-color: #ffd700;"></div>
                        <img src="${rootPath}assets/icons/app_launcher.png?v=vip2" alt="Bet With Net App" class="vip-apk-app-icon">
                        <span class="vip-apk-micro-badge" style="background: #ffd700; color: #000;">ULTRA 60FPS</span>
                    </div>

                    <h2 class="vip-apk-title">UPDATE BET WITH NET</h2>
                    <p class="vip-apk-subtitle">Ultra-Smooth Version ${latestVer} is ready! (Current: v${currentVer})</p>

                    <div class="vip-apk-perks">
                        <div class="vip-apk-perk">
                            <span class="vip-perk-ico">⚡</span>
                            <div class="vip-perk-text">
                                <b>120 FPS Ultra-Smooth Scrolling</b>
                                <span>Hardware GPU Acceleration & Zero-Lag Touch</span>
                            </div>
                        </div>
                        <div class="vip-apk-perk">
                            <span class="vip-perk-ico">🎵</span>
                            <div class="vip-perk-text">
                                <b>Official Background Music</b>
                                <span>Continuous High-Fidelity Casino Soundtrack</span>
                            </div>
                        </div>
                        <div class="vip-apk-perk">
                            <span class="vip-perk-ico">🚪</span>
                            <div class="vip-perk-text">
                                <b>Easy Logout & WhatsApp Community</b>
                                <span>1-Tap Account Switch & Official WhatsApp Link</span>
                            </div>
                        </div>
                    </div>

                    <a href="${rootPath}download.php" download="betwithnet.apk" onclick="window.core.onAppUpdateClick(event)" class="vip-apk-download-btn" style="background: linear-gradient(135deg, #ff9100, #ffd700, #ff6d00);">
                        <span class="btn-shine"></span>
                        <span class="btn-icon">📲</span>
                        <div class="btn-text-group">
                            <span class="btn-main-text">UPDATE APP NOW</span>
                            <span class="btn-sub-text">1-Click Install • Only 1.1 MB</span>
                        </div>
                        <span class="btn-arrow">➔</span>
                    </a>

                    <button class="vip-apk-skip-btn" onclick="window.core.closeAppUpdateModal(event)">
                        Baad Mein Karein (Skip)
                    </button>
                </div>
            </div>
        `;
    }

    closeAppUpdateModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        try {
            sessionStorage.setItem('bwn_app_update_dismissed_v1_5', 'true');
        } catch (err) {}
        const modal = document.getElementById('apk-update-modal-root');
        if (modal) {
            modal.innerHTML = '';
        }
    }

    onAppUpdateClick(e) {
        try {
            localStorage.setItem('bwn_app_updated_v1_5', 'true');
        } catch(err) {}
        this.showToast('📲 Bet With Net v1.5 Ultra-Smooth APK download ho rahi hai! Download hone ke baad Install karein.', 'success');
        setTimeout(() => {
            const modal = document.getElementById('apk-update-modal-root');
            if (modal) modal.innerHTML = '';
        }, 2500);
    }

    openAuthModal(tab = 'register', notice = '') {
        this.ensureBGMPlaying();
        this._injectAuthModalStyles();
        let modal = document.getElementById('auth-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'auth-modal-root';
            document.body.appendChild(modal);
        }
        const isLogin = tab === 'login';
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        modal.innerHTML = `
            <div class="auth-modal-overlay" onclick="window.core.closeAuthModal()"></div>
            <div class="auth-modal-dialog">
                <div style="background:linear-gradient(135deg, #152238, #0e1624); padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:20px;">👑</span>
                        <b style="color:#fff; font-size:15px; letter-spacing:0.5px;">BET WITH NET VIP</b>
                    </div>
                    <button onclick="window.core.closeAuthModal()" style="background:transparent; border:none; color:#8e9bb0; font-size:22px; cursor:pointer; padding:4px 8px; line-height:1;">✕</button>
                </div>
                ${notice ? `
                <div style="background:rgba(245,166,35,0.12); border:1px solid rgba(245,166,35,0.35); border-radius:10px; padding:10px 14px; margin:14px 20px 0 20px; display:flex; align-items:center; gap:10px;">
                    <span style="font-size:22px; line-height:1;">🔒</span>
                    <div style="font-size:12px; font-weight:700; color:#ffd700; line-height:1.4;">${notice}</div>
                </div>` : ''}
                <div style="display:flex; border-bottom:1px solid rgba(255,255,255,0.08);">
                    <button id="auth-tab-btn-reg" onclick="window.core.switchAuthTab('register')" style="flex:1; padding:12px; background:${!isLogin ? 'rgba(0,231,0,0.08)' : 'transparent'}; border:none; border-bottom:2px solid ${!isLogin ? '#00e700' : 'transparent'}; color:${!isLogin ? '#00e700' : '#8e9bb0'}; font-weight:800; font-size:13px; cursor:pointer;">✨ Register</button>
                    <button id="auth-tab-btn-login" onclick="window.core.switchAuthTab('login')" style="flex:1; padding:12px; background:${isLogin ? 'rgba(0,231,0,0.08)' : 'transparent'}; border:none; border-bottom:2px solid ${isLogin ? '#00e700' : 'transparent'}; color:${isLogin ? '#00e700' : '#8e9bb0'}; font-weight:800; font-size:13px; cursor:pointer;">🔑 Sign In</button>
                </div>
                <div style="padding:20px;">
                    <div id="auth-form-reg" style="display:${!isLogin ? 'block' : 'none'};">
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">USERNAME</label>
                            <input id="reg-username" type="text" placeholder="Choose a username" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                        </div>
                        <div style="margin-bottom:12px;">
                            <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">EMAIL OR MOBILE</label>
                            <input id="reg-email" type="text" placeholder="Email or Mobile (e.g. 03001234567)" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px;">
                            <div>
                                <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">PASSWORD</label>
                                <input id="reg-password" type="password" placeholder="Password" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                            </div>
                            <div>
                                <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">4-DIGIT PIN</label>
                                <input id="reg-pin" type="password" maxlength="4" placeholder="1234" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                            </div>
                        </div>
                        <button id="reg-submit-btn" onclick="window.core.submitRegister()" style="width:100%; padding:12px; background:linear-gradient(135deg, #f5a623, #ffd700); border:none; border-radius:6px; color:#000; font-weight:800; font-size:14px; cursor:pointer; box-shadow:0 4px 15px rgba(245,166,35,0.3); margin-top:4px;">
                            CREATE VIP ACCOUNT →
                        </button>
                        <div style="margin-top:14px; font-size:11.5px; color:#8e9bb0; text-align:center;">
                            Already have an account? <a href="javascript:void(0)" onclick="window.core.switchAuthTab('login')" style="color:#00e700; font-weight:700; text-decoration:none;">Sign In here</a>
                        </div>
                    </div>
                    <div id="auth-form-login" style="display:${isLogin ? 'block' : 'none'};">
                        <div style="margin-bottom:14px;">
                            <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">USERNAME OR EMAIL</label>
                            <input id="login-username" type="text" placeholder="Enter username or email" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                        </div>
                        <div style="margin-bottom:16px;">
                            <label style="display:block; font-size:11px; font-weight:700; color:#8e9bb0; margin-bottom:5px;">PASSWORD</label>
                            <input id="login-password" type="password" placeholder="Enter password" style="width:100%; padding:10px 12px; background:#070b12; border:1px solid rgba(255,255,255,0.12); border-radius:6px; color:#fff; font-size:13px; outline:none;">
                        </div>
                        <button id="login-submit-btn" onclick="window.core.submitLogin()" style="width:100%; padding:12px; background:linear-gradient(135deg, #00e700, #00b300); border:none; border-radius:6px; color:#000; font-weight:800; font-size:14px; cursor:pointer; box-shadow:0 4px 15px rgba(0,231,0,0.3);">
                            LOG IN TO CASINO →
                        </button>
                        <div style="margin-top:14px; font-size:11.5px; color:#8e9bb0; text-align:center;">
                            Don't have an account? <a href="javascript:void(0)" onclick="window.core.switchAuthTab('register')" style="color:#f5a623; font-weight:700; text-decoration:none;">Register Now</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const attachEnter = (ids, fn) => {
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.addEventListener('keydown', (e) => { if (e.key === 'Enter') fn(); });
                });
            };
            attachEnter(['reg-username', 'reg-email', 'reg-password', 'reg-pin'], () => window.core.submitRegister());
            attachEnter(['login-username', 'login-password'], () => window.core.submitLogin());
        }, 50);
    }

    closeAuthModal() {
        const isGamePage = window.location.pathname.toLowerCase().includes('/games/');
        if (isGamePage && !this.isUserLoggedIn()) {
            // Guest tried to close auth modal on game page without logging in -> redirect to lobby
            window.location.href = '../index.html?auth=required';
            return;
        }
        const modal = document.getElementById('auth-modal-root');
        if (modal) modal.innerHTML = '';
    }

    switchAuthTab(tab) {
        const isLogin = tab === 'login';
        const loginBtn = document.getElementById('auth-tab-btn-login');
        const regBtn = document.getElementById('auth-tab-btn-reg');
        const loginForm = document.getElementById('auth-form-login');
        const regForm = document.getElementById('auth-form-reg');

        if (loginBtn && regBtn && loginForm && regForm) {
            loginBtn.style.color = isLogin ? '#00e700' : '#8e9bb0';
            loginBtn.style.borderBottom = isLogin ? '2px solid #00e700' : 'transparent';
            loginBtn.style.background = isLogin ? 'rgba(0,231,0,0.08)' : 'transparent';

            regBtn.style.color = !isLogin ? '#00e700' : '#8e9bb0';
            regBtn.style.borderBottom = !isLogin ? '2px solid #00e700' : 'transparent';
            regBtn.style.background = !isLogin ? 'rgba(0,231,0,0.08)' : 'transparent';

            loginForm.style.display = isLogin ? 'block' : 'none';
            regForm.style.display = !isLogin ? 'block' : 'none';
        }
    }

    async submitLogin() {
        const uEl = document.getElementById('login-username');
        const pEl = document.getElementById('login-password');
        const btn = document.getElementById('login-submit-btn');
        const u = uEl ? uEl.value.trim() : '';
        const p = pEl ? pEl.value : '';

        if (!u || !p) {
            this.showToast('Please enter username and password.', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.innerHTML = '⏳ SIGNING IN...';
        }

        let res = null;
        try {
            const apiPath = window.location.pathname.includes('/games/') ? '../api/auth.php?action=login' : 'api/auth.php?action=login';
            const r = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p, is_app: this.isNativeApp() })
            });
            const text = await r.text();
            res = text ? JSON.parse(text) : null;
        } catch (err) {
            if (window.APIBridge && window.APIBridge.login) {
                res = await window.APIBridge.login(u, p);
            } else if (window.userManager && window.userManager.login) {
                res = window.userManager.login(u, p);
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = 'LOG IN TO CASINO →';
        }

        if (res && res.success) {
            const user = (res.data && res.data.username) ? res.data : { username: u };
            const name = user.username || u;
            try { localStorage.setItem('bwn_session_user', JSON.stringify(user)); } catch (e) {}
            if (window.userManager) {
                window.userManager.currentUser = user;
                if (user.id) window.userManager.setActiveUser(user.id);
            }
            if (window.APIBridge) {
                window.APIBridge.activeUser = user;
            }

            // Sync wallet balance from server user data
            if (window.wallet) {
                const balPKR = parseFloat(user.balance_pkr !== undefined ? user.balance_pkr : (user.balancePKR || 0));
                const balUSD = parseFloat(user.balance_usd !== undefined ? user.balance_usd : (balPKR / (window.wallet.exchangeRate || 280)));
                window.wallet.state.balancePKR = balPKR;
                window.wallet.state.balanceUSD = balUSD;
                window.wallet.saveState();
                this.updateAllBalances();
            }

            this.showToast(`Welcome back, ${name}!`, 'success');
            this.closeAuthModal();
            this.renderHeader();
            this.renderDrawer();
            if (user.id) this.syncServerBalance(user.id);

            // If user clicked a game earlier, redirect immediately to that game!
            const redirectUrl = sessionStorage.getItem('bwn_redirect_after_auth');
            if (redirectUrl) {
                sessionStorage.removeItem('bwn_redirect_after_auth');
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 500);
            } else if (window.location.pathname.toLowerCase().includes('/games/')) {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Open 7-days bonus modal right after login so user can claim (only if not claimed today)!
                setTimeout(() => {
                    this.openDailyBonusModal(true);
                }, 500);
            }
        } else {
            this.showToast((res && res.message) ? res.message : 'Invalid login credentials.', 'error');
        }
    }

    async submitRegister() {
        const uEl = document.getElementById('reg-username');
        const eEl = document.getElementById('reg-email');
        const pEl = document.getElementById('reg-password');
        const pinEl = document.getElementById('reg-pin');
        const btn = document.getElementById('reg-submit-btn');

        const u = uEl ? uEl.value.trim() : '';
        const e = eEl ? eEl.value.trim() : '';
        const p = pEl ? pEl.value : '';
        const pin = pinEl ? pinEl.value.trim() : '';

        if (!u || !e || !p) {
            this.showToast('Username, email/mobile and password are required.', 'error');
            return;
        }
        if (p.length < 4) {
            this.showToast('Password must be at least 4 characters long.', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.innerHTML = '⏳ CREATING ACCOUNT...';
        }

        let res = null;
        const payload = { username: u, email: e, password: p, security_pin: pin || '1234', is_app: this.isNativeApp() };
        try {
            const apiPath = window.location.pathname.includes('/games/') ? '../api/auth.php?action=register' : 'api/auth.php?action=register';
            const r = await fetch(apiPath, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const text = await r.text();
            res = text ? JSON.parse(text) : null;
        } catch (err) {
            if (window.APIBridge && window.APIBridge.register) {
                res = await window.APIBridge.register(payload);
            } else if (window.userManager && window.userManager.register) {
                res = window.userManager.register(payload);
            }
        }

        if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.innerHTML = 'CREATE VIP ACCOUNT →';
        }

        if (res && res.success) {
            const user = (res.data && res.data.username) ? res.data : { username: u, role: 'user' };
            try { localStorage.setItem('bwn_session_user', JSON.stringify(user)); } catch (e) {}
            if (window.userManager) {
                window.userManager.currentUser = user;
                if (user.id) window.userManager.setActiveUser(user.id);
            }
            if (window.APIBridge) {
                window.APIBridge.activeUser = user;
            }

            // Clean 0 balance and empty history for fresh registration
            if (window.wallet) {
                window.wallet.state.balanceUSD = 0.00;
                window.wallet.state.balancePKR = 0.00;
                window.wallet.state.transactions = [];
                window.wallet.state.betHistory = [];
                window.wallet.state.totalWageredUSD = 0;
                window.wallet.state.totalWonUSD = 0;
                window.wallet.state.totalWageredPKR = 0;
                window.wallet.state.totalWonPKR = 0;
                window.wallet.state.totalBetsCount = 0;
                window.wallet.saveState();
                this.updateAllBalances();
            }

            this.showToast('Account created successfully! Welcome to Bet With Net!', 'success');
            this.closeAuthModal();
            this.renderHeader();
            this.renderDrawer();

            // If user clicked a game earlier, redirect immediately to that game!
            const redirectUrl = sessionStorage.getItem('bwn_redirect_after_auth');
            if (redirectUrl) {
                sessionStorage.removeItem('bwn_redirect_after_auth');
                setTimeout(() => {
                    window.location.href = redirectUrl;
                }, 500);
            } else if (window.location.pathname.toLowerCase().includes('/games/')) {
                setTimeout(() => {
                    window.location.reload();
                }, 500);
            } else {
                // Open 7-days bonus modal right after registration so user can claim (only if not claimed today)!
                setTimeout(() => {
                    this.openDailyBonusModal(true);
                }, 500);
            }
        } else {
            this.showToast((res && res.message) ? res.message : 'Registration failed. Please check your details.', 'error');
        }
    }

    toggleNavDropdown(event, btn) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const dropdown = btn ? btn.closest('.nav-dropdown') : null;
        if (!dropdown) return;

        const wasActive = dropdown.classList.contains('active');
        // Close all other dropdowns
        document.querySelectorAll('.nav-dropdown.active').forEach(d => {
            if (d !== dropdown) d.classList.remove('active');
        });
        dropdown.classList.toggle('active', !wasActive);
        if (window.sound && window.sound.playClick) window.sound.playClick();
    }

    toggleSound() {
        if (window.sound) {
            const muted = window.sound.toggleMute();
            const btn = document.getElementById('header-sound-btn');
            if (btn) btn.innerText = muted ? '🔇' : '🔊';
            this.showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'info');
        }
    }

    changeCurrency(curr) {
        if (window.wallet) {
            window.wallet.setCurrency(curr);
            this.updateAllBalances();
            this.showToast(`Switched currency to ${curr}`, 'info');
        }
    }

    showLiveSupport() {
        this.ensureBGMPlaying();
        this.closeDrawer();
        this.showToast('24/7 Agent Connected: Welcome to Bet With Net VIP Support! How can we assist you today?', 'success');
    }

    showUnderRepairModal(gameName = 'Slot Game') {
        this.closeDrawer();
        this.showToast(`🛠️ ${gameName} is currently under repair & maintenance. Access is locked.`, 'error');
    }

    setupCasinoMaintenanceInterceptor() {
        // Intercept any click on links to casino.html across all pages (capture phase)
        document.addEventListener('click', (e) => {
            const casinoLink = e.target.closest('a[href*="casino.html"]');
            if (casinoLink) {
                e.preventDefault();
                e.stopPropagation();
                this.showCasinoMaintenanceModal(e);
                return;
            }

            const fortuneGemsLink = e.target.closest('a[href*="fortunegems2"], a[href*="fortune-gems-2"], a[href*="fortune_gems_2"]');
            if (fortuneGemsLink) {
                e.preventDefault();
                e.stopPropagation();
                this.showGameMaintenanceModal('Fortune Gems 2 (JILI Slot)', e);
                return;
            }
        }, true);

        // If current page is casino.html, show locked maintenance modal immediately
        if (window.location.pathname.toLowerCase().includes('casino.html')) {
            setTimeout(() => {
                this.showCasinoMaintenanceModal(null, true);
            }, 100);
        }

        // If current page is Fortune Gems 2, show locked maintenance modal immediately
        const path = window.location.pathname.toLowerCase();
        if (path.includes('fortunegems2') || path.includes('fortune-gems-2') || path.includes('fortune_gems_2')) {
            setTimeout(() => {
                this.showGameMaintenanceModal('Fortune Gems 2 (JILI Slot)', null, true);
            }, 100);
        }
    }

    showCasinoMaintenanceModal(e, isLockedPage = false) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        this.ensureBGMPlaying();
        this.closeDrawer();

        let modal = document.getElementById('casino-maintenance-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'casino-maintenance-modal-root';
            document.body.appendChild(modal);
        }

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        modal.innerHTML = `
            <div class="casino-maint-overlay" onclick="${isLockedPage ? '' : 'window.core.closeCasinoMaintenanceModal(event)'}"></div>
            <div class="casino-maint-dialog">
                <div class="casino-maint-top-badge">
                    <span>⚠️ SCHEDULED SYSTEM MAINTENANCE</span>
                </div>
                
                ${!isLockedPage ? `
                <button class="casino-maint-close-btn" onclick="window.core.closeCasinoMaintenanceModal(event)" title="Close">✕</button>
                ` : ''}

                <div class="casino-maint-content">
                    <div class="casino-maint-icon-wrap">
                        <div class="casino-maint-pulse-ring"></div>
                        <div class="casino-maint-icon-inner">🛠️</div>
                        <span class="casino-maint-status-tag">OFFLINE</span>
                    </div>

                    <h2 class="casino-maint-title">Casino Under Maintenance</h2>
                    <p class="casino-maint-urdu">کیسینو سرور پر مینٹیننس کا کام جاری ہے</p>
                    <p class="casino-maint-desc">
                        The <b>Casino Gaming Hall & Studio Servers</b> are currently undergoing essential maintenance, security upgrades, and game engine optimization. Access is temporarily locked and will be restored shortly.
                    </p>

                    <div class="casino-maint-perks">
                        <div class="casino-maint-perk">
                            <span class="maint-perk-ico">🛡️</span>
                            <div class="maint-perk-text">
                                <b>Funds & Balances Safe</b>
                                <span>Your wallet balance & active bets are 100% secure</span>
                            </div>
                        </div>
                        <div class="casino-maint-perk">
                            <span class="maint-perk-ico">⚡</span>
                            <div class="maint-perk-text">
                                <b>Upgrading 60+ Studio Engines</b>
                                <span>High-speed servers & enhanced payout algorithms</span>
                            </div>
                        </div>
                    </div>

                    <div class="casino-maint-actions">
                        <a href="${rootPath}index.html" class="casino-maint-btn-lobby">
                            <span>🏠 Return to Lobby</span>
                        </a>
                        ${!isLockedPage ? `
                        <button class="casino-maint-btn-close" onclick="window.core.closeCasinoMaintenanceModal(event)">
                            <span>Close Notice</span>
                        </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';

        if (this.showToast) {
            this.showToast('🛠️ Casino is currently under maintenance. Access is locked.', 'warning');
        }
    }

    closeCasinoMaintenanceModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const modal = document.getElementById('casino-maintenance-modal-root');
        if (modal) {
            modal.innerHTML = '';
        }
        document.body.style.overflow = '';
    }

    showGameMaintenanceModal(gameName = 'Fortune Gems 2', e = null, isLockedPage = false) {
        if (e) {
            if (e.preventDefault) e.preventDefault();
            if (e.stopPropagation) e.stopPropagation();
        }
        this.ensureBGMPlaying();
        this.closeDrawer();

        let modal = document.getElementById('game-maintenance-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'game-maintenance-modal-root';
            document.body.appendChild(modal);
        }

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        modal.innerHTML = `
            <div class="casino-maint-overlay" style="z-index:99999998 !important;" onclick="${isLockedPage ? '' : 'window.core.closeGameMaintenanceModal(event)'}"></div>
            <div class="casino-maint-dialog" style="z-index:99999999 !important;">
                <div class="casino-maint-top-badge" style="background:linear-gradient(90deg, #ff4757, #ff6b81);">
                    <span>⚠️ OFFICIAL GAME MAINTENANCE</span>
                </div>
                
                ${!isLockedPage ? `
                <button class="casino-maint-close-btn" onclick="window.core.closeGameMaintenanceModal(event)" title="Close">✕</button>
                ` : ''}

                <div class="casino-maint-content">
                    <div class="casino-maint-icon-wrap">
                        <div class="casino-maint-pulse-ring" style="border-color:#ff4757;"></div>
                        <div class="casino-maint-icon-inner">💎</div>
                        <span class="casino-maint-status-tag" style="background:#ff4757;">MAINTENANCE</span>
                    </div>

                    <h2 class="casino-maint-title">${gameName} Under Maintenance</h2>
                    <p class="casino-maint-urdu">اس گیم پر مینٹیننس کا کام جاری ہے</p>
                    <p class="casino-maint-desc">
                        <b>${gameName}</b> is currently undergoing essential server maintenance, payout verification, and system upgrades. Access is temporarily locked and will be back online shortly.
                    </p>

                    <div class="casino-maint-perks">
                        <div class="casino-maint-perk">
                            <span class="maint-perk-ico">🛡️</span>
                            <div class="maint-perk-text">
                                <b>Player Balance 100% Safe</b>
                                <span>Your wallet funds and balance remain completely secure</span>
                            </div>
                        </div>
                        <div class="casino-maint-perk">
                            <span class="maint-perk-ico">🚀</span>
                            <div class="maint-perk-text">
                                <b>Play Other Live Studios</b>
                                <span>Crash, 3D Roulette, Blackjack 21 & Mines are active!</span>
                            </div>
                        </div>
                    </div>

                    <div class="casino-maint-actions">
                        <a href="${rootPath}index.html" class="casino-maint-btn-lobby">
                            <span>🏠 Return to Lobby</span>
                        </a>
                        ${!isLockedPage ? `
                        <button class="casino-maint-btn-close" onclick="window.core.closeGameMaintenanceModal(event)">
                            <span>Close Notice</span>
                        </button>
                        ` : `
                        <a href="${rootPath}games/crash.html" class="casino-maint-btn-lobby" style="background:linear-gradient(135deg, #00ff87 0%, #00b862 100%); color:#002e0c;">
                            <span>🚀 Play Aviator Crash</span>
                        </a>
                        `}
                    </div>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';

        if (this.showToast) {
            this.showToast(`🛠️ ${gameName} is currently under maintenance.`, 'warning');
        }
    }

    closeGameMaintenanceModal(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const modal = document.getElementById('game-maintenance-modal-root');
        if (modal) {
            modal.innerHTML = '';
        }
        document.body.style.overflow = '';
    }

    updateAllBalances() {
        if (!window.wallet) return;
        const formatted = window.wallet.formatAmount(window.wallet.getBalance());
        document.querySelectorAll('.wallet-balance-display').forEach(el => el.innerText = formatted);

        // Sync currency prefixes across game bet inputs
        const curr = window.wallet.getCurrency();
        const symbol = (curr === 'USD') ? '$' : '₨';
        document.querySelectorAll('.bet-currency-prefix').forEach(el => {
            el.innerText = symbol;
        });

        // Sync header currency select dropdown if present
        const sel = document.getElementById('header-currency-select');
        if (sel && sel.value !== curr) {
            sel.value = curr;
        }

        this.updateGameBalanceHUD();
        this.updateBalancePopupUI();
    }

    renderGameBalanceHUD() {
        // Only render on game studio pages or pages with a main game container
        const isGamePage = window.location.pathname.includes('/games/') || 
                           document.querySelector('.game-stage-wrapper') || 
                           document.querySelector('.game-control-panel') || 
                           document.querySelector('#crash-canvas');
        if (!isGamePage) return;

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let hud = document.getElementById('premium-game-balance-hud');

        if (!hud) {
            const mainContainer = document.querySelector('.main-container');
            if (!mainContainer) return;

            hud = document.createElement('div');
            hud.className = 'premium-game-balance-hud';
            hud.id = 'premium-game-balance-hud';

            // Insert after top studio bar or at top of main container
            const firstChild = mainContainer.firstElementChild;
            if (firstChild && (firstChild.style.display === 'flex' || firstChild.classList.contains('game-history-bar'))) {
                firstChild.insertAdjacentElement('afterend', hud);
            } else {
                mainContainer.insertBefore(hud, mainContainer.firstChild);
            }
        }

        hud.innerHTML = `
            <div class="pg-hud-left">
                <div class="pg-hud-badge">
                    <span class="pg-hud-dot"></span>
                    <span>VIP LIVE</span>
                </div>
                <div class="pg-hud-balance-info">
                    <span class="pg-hud-balance-label">ACCOUNT BALANCE:</span>
                    <span class="pg-hud-balance-val" id="pg-hud-balance-val">₨ 0.00</span>
                    <span class="pg-hud-dual-val" id="pg-hud-dual-val">($0.00)</span>
                </div>
            </div>
            <div class="pg-hud-right">
                <button class="pg-hud-curr-btn" onclick="window.core.toggleCurrencyHUD()" title="Switch Currency (PKR / USD)">
                    <span id="pg-hud-curr-code">PKR</span> ⇄
                </button>
                <a href="${rootPath}deposit.html" class="pg-hud-deposit-btn" title="Quick Cashier Deposit">
                    <span>⚡</span> <span>DEPOSIT</span>
                </a>
            </div>
        `;

        this.updateGameBalanceHUD();
    }

    updateGameBalanceHUD() {
        if (!window.wallet) return;
        const hud = document.getElementById('premium-game-balance-hud');
        if (!hud) return;

        const curr = window.wallet.getCurrency();
        const bal = window.wallet.getBalance();
        const formatted = window.wallet.formatAmount(bal);

        const balEl = document.getElementById('pg-hud-balance-val');
        if (balEl) {
            balEl.innerText = formatted;
        }

        const currCodeEl = document.getElementById('pg-hud-curr-code');
        if (currCodeEl) {
            currCodeEl.innerText = curr;
        }

        const dualEl = document.getElementById('pg-hud-dual-val');
        if (dualEl) {
            const exRate = window.wallet.exchangeRate || 280;
            if (curr === 'PKR') {
                const usdEquiv = (bal / exRate).toFixed(2);
                dualEl.innerText = `($${Number(usdEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })})`;
            } else {
                const pkrEquiv = (bal * exRate).toFixed(2);
                dualEl.innerText = `(₨ ${Number(pkrEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })})`;
            }
        }
    }

    toggleCurrencyHUD() {
        if (!window.wallet) return;
        const current = window.wallet.getCurrency();
        const next = current === 'PKR' ? 'USD' : 'PKR';
        this.changeCurrency(next);
    }

    // =========================================================================
    // HD VIP BALANCE VAULT POPUP SYSTEM (ULTRA-LUXURY CASINO EDITION)
    // =========================================================================
    openBalancePopup(e) {
        if (e && e.preventDefault) e.preventDefault();
        if (e && e.stopPropagation) e.stopPropagation();

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let root = document.getElementById('balance-vault-modal-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'balance-vault-modal-root';
            document.body.appendChild(root);
        }

        const loggedUser = this.getLoggedInUser();
        const curr = window.wallet ? window.wallet.getCurrency() : 'PKR';
        const bal = window.wallet ? window.wallet.getBalance() : 0;
        const balanceFormatted = window.wallet ? window.wallet.formatAmount(bal) : '₨ 25,000.00';
        const exRate = (window.wallet && window.wallet.exchangeRate) || 280;

        let dualFormatted = '';
        if (curr === 'PKR') {
            const usdEquiv = (bal / exRate).toFixed(2);
            dualFormatted = `≈ $${Number(usdEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
        } else {
            const pkrEquiv = (bal * exRate).toFixed(2);
            dualFormatted = `≈ ₨ ${Number(pkrEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })} PKR`;
        }

        const realCashFormatted = balanceFormatted;
        const bonusVal = (window.wallet && window.wallet.state) ? (window.wallet.state.bonusPKR || 0) : 0;
        const bonusCashFormatted = window.wallet ? window.wallet.formatAmount(bonusVal) : '₨ 0.00';
        const vip = window.wallet ? window.wallet.getVIPTier() : { name: 'Bronze VIP', color: '#ffd700', multiplier: 1.0 };

        root.innerHTML = `
            <div id="hd-balance-popup-overlay" class="hd-balance-popup-overlay active" onclick="window.core.closeBalancePopup(event)" style="z-index:99999998 !important; opacity:1 !important; pointer-events:auto !important; display:block !important;"></div>
            <div id="hd-balance-popup-dialog" class="hd-balance-popup-dialog active" onclick="event.stopPropagation()" style="z-index:99999999 !important; opacity:1 !important; pointer-events:auto !important; display:block !important;">
                <!-- Ambient Top Shimmer Bar -->
                <div class="hd-vault-glow-header"></div>

                <!-- Header Section -->
                <div class="hd-vault-header">
                    <div class="hd-vault-brand-info">
                        <span class="hd-vault-crown-icon">👑</span>
                        <div>
                            <div class="hd-vault-brand-title">BET WITH NET</div>
                            <div class="hd-vault-brand-subtitle">VIP WALLET VAULT</div>
                        </div>
                    </div>
                    <div class="hd-vault-header-actions">
                        <div class="hd-vault-live-pill">
                            <span class="hd-vault-pulse-dot"></span>
                            <span>LIVE SYNC</span>
                        </div>
                        <button class="hd-vault-close-btn" onclick="window.core.closeBalancePopup(event)" title="Close Vault (Esc)">✕</button>
                    </div>
                </div>

                <!-- User VIP Status Banner -->
                <div class="hd-vault-user-strip">
                    <div class="hd-vault-user-avatar">
                        ${loggedUser ? '👑' : '👤'}
                    </div>
                    <div class="hd-vault-user-meta">
                        <div class="hd-vault-username">
                            ${loggedUser ? (loggedUser.username || 'VIP Member') : 'Demo Guest Player'}
                        </div>
                        <div class="hd-vault-user-rank" style="color:${vip.color || '#ffd700'};">
                            ${loggedUser ? `⭐ ${vip.name} • 0.25% Rakeback` : '🎮 Demo Mode • Sign in to keep winnings'}
                        </div>
                    </div>
                    ${!loggedUser ? `
                        <button class="hd-vault-auth-shortcut-btn" onclick="window.core.closeBalancePopup(); window.core.openAuthModal('login');">
                            Sign In
                        </button>
                    ` : `
                        <a href="${rootPath}profile.html" class="hd-vault-profile-link" onclick="window.core.closeBalancePopup()">
                            Profile ⚙️
                        </a>
                    `}
                </div>

                <!-- Grand HD Balance Showcase Card -->
                <div class="hd-vault-balance-card">
                    <div class="hd-vault-balance-top">
                        <span class="hd-vault-bal-label">TOTAL AVAILABLE BALANCE</span>
                        <button class="hd-vault-sync-btn" id="hd-vault-sync-btn" onclick="window.core.refreshBalance(this)" title="Sync Balance Live">
                            <span class="hd-sync-icon">🔄</span>
                            <span>Sync</span>
                        </button>
                    </div>

                    <div class="hd-vault-main-val-wrap">
                        <div class="hd-vault-main-val" id="hd-vault-main-val">${balanceFormatted}</div>
                    </div>

                    <div class="hd-vault-dual-wrap">
                        <span class="hd-vault-dual-label">Live Equivalent:</span>
                        <span class="hd-vault-dual-val" id="hd-vault-dual-val">${dualFormatted}</span>
                    </div>

                    <!-- Luxury Currency Switcher Tabs -->
                    <div class="hd-vault-currency-tabs">
                        <button id="hd-tab-pkr" class="hd-curr-tab ${curr === 'PKR' ? 'active' : ''}" onclick="window.core.switchPopupCurrency('PKR')">
                            <span class="hd-curr-flag">🇵🇰</span>
                            <span>PKR ₨</span>
                        </button>
                        <button id="hd-tab-usd" class="hd-curr-tab ${curr === 'USD' ? 'active' : ''}" onclick="window.core.switchPopupCurrency('USD')">
                            <span class="hd-curr-flag">🇺🇸</span>
                            <span>USD $</span>
                        </button>
                    </div>
                </div>

                <!-- 3 Detailed Breakdown Glass Cards -->
                <div class="hd-vault-breakdown-grid">
                    <div class="hd-breakdown-card">
                        <div class="hd-bd-header">
                            <span class="hd-bd-icon">💵</span>
                            <span class="hd-bd-title">Real Cash</span>
                        </div>
                        <div class="hd-bd-value" id="hd-vault-real-cash" style="color:#00ff87;">${realCashFormatted}</div>
                        <div class="hd-bd-note">Withdrawable 100%</div>
                    </div>

                    <div class="hd-breakdown-card">
                        <div class="hd-bd-header">
                            <span class="hd-bd-icon">🎁</span>
                            <span class="hd-bd-title">Bonus / Faucet</span>
                        </div>
                        <div class="hd-bd-value" id="hd-vault-bonus-cash" style="color:#f5a623;">${bonusCashFormatted}</div>
                        <div class="hd-bd-note">Play in 40+ Studios</div>
                    </div>

                    <div class="hd-breakdown-card">
                        <div class="hd-bd-header">
                            <span class="hd-bd-icon">⚡</span>
                            <span class="hd-bd-title">VIP Rakeback</span>
                        </div>
                        <div class="hd-bd-value" style="color:#00e5ff;">${vip.multiplier ? (vip.multiplier * 0.25).toFixed(2) + '%' : '0.25%'}</div>
                        <div class="hd-bd-note">Auto Instant Cashback</div>
                    </div>
                </div>

                <!-- Quick Action Casino Cashier Buttons -->
                <div class="hd-vault-actions-grid">
                    <a href="javascript:void(0)" class="hd-vault-btn-deposit" onclick="window.core.closeBalancePopup(); window.core.openDepositModal(); return false;">
                        <span class="hd-btn-icon">⚡</span>
                        <div class="hd-btn-text-wrap">
                            <span class="hd-btn-main-title">DEPOSIT CASHIER</span>
                            <span class="hd-btn-sub">EasyPaisa • JazzCash • Instant</span>
                        </div>
                        <span class="hd-btn-arrow">→</span>
                    </a>

                    <a href="${rootPath}withdraw.html" class="hd-vault-btn-withdraw" onclick="window.core.closeBalancePopup()">
                        <span class="hd-btn-icon">📤</span>
                        <div class="hd-btn-text-wrap">
                            <span class="hd-btn-main-title">INSTANT CASHOUT</span>
                            <span class="hd-btn-sub">Fast 2-Min OTC Cashout</span>
                        </div>
                        <span class="hd-btn-arrow">→</span>
                    </a>
                </div>

                <div class="hd-vault-secondary-actions">
                    <button class="hd-vault-btn-subaction" onclick="window.core.closeBalancePopup(); window.core.claimDailyBonus();">
                        <span>🎁</span> <span>Claim Faucet Bonus</span>
                    </button>
                    <a href="${rootPath}history.html" class="hd-vault-btn-subaction" onclick="window.core.closeBalancePopup()">
                        <span>📋</span> <span>Betslip Ledger</span>
                    </a>
                </div>

                <!-- Trust & Security Strip -->
                <div class="hd-vault-security-strip">
                    <span>🛡️ 256-Bit SSL Vault</span>
                    <span>•</span>
                    <span>⚡ Instant OTC Settlement</span>
                    <span>•</span>
                    <span>👑 24/7 Support</span>
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            const overlay = document.getElementById('hd-balance-popup-overlay');
            const dialog = document.getElementById('hd-balance-popup-dialog');
            if (overlay) overlay.classList.add('active');
            if (dialog) dialog.classList.add('active');
        });

        // Register Esc key handler
        if (!this._vaultEscHandler) {
            this._vaultEscHandler = (evt) => {
                if (evt.key === 'Escape') this.closeBalancePopup();
            };
            window.addEventListener('keydown', this._vaultEscHandler);
        }
    }

    closeBalancePopup(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const overlay = document.getElementById('hd-balance-popup-overlay');
        const dialog = document.getElementById('hd-balance-popup-dialog');
        if (overlay) overlay.classList.remove('active');
        if (dialog) dialog.classList.remove('active');
        setTimeout(() => {
            const root = document.getElementById('balance-vault-modal-root');
            if (root) root.innerHTML = '';
        }, 220);
    }

    toggleBalancePopup(e) {
        if (e && e.stopPropagation) e.stopPropagation();
        const dialog = document.getElementById('hd-balance-popup-dialog');
        if (dialog && dialog.classList.contains('active')) {
            this.closeBalancePopup(e);
        } else {
            this.openBalancePopup(e);
        }
    }

    refreshBalance(btnEl) {
        if (btnEl) {
            btnEl.classList.add('hd-spin-anim');
            setTimeout(() => btnEl.classList.remove('hd-spin-anim'), 800);
        }
        if (window.audio && typeof window.audio.play === 'function') {
            try { window.audio.play('click'); } catch(e) {}
        }
        if (window.wallet) {
            const user = this.getLoggedInUser();
            if (user && typeof window.wallet.syncWithUser === 'function') {
                window.wallet.syncWithUser(user);
            }
        }
        this.updateAllBalances();
        this.updateBalancePopupUI();
        this.showToast('⚡ Balance Synced Live!', 'success');
    }

    switchPopupCurrency(curr) {
        this.changeCurrency(curr);
        this.updateBalancePopupUI();
    }

    updateBalancePopupUI() {
        const dialog = document.getElementById('hd-balance-popup-dialog');
        if (!dialog) return;
        if (!window.wallet) return;

        const curr = window.wallet.getCurrency();
        const bal = window.wallet.getBalance();
        const formatted = window.wallet.formatAmount(bal);
        const exRate = window.wallet.exchangeRate || 280;

        let dualFormatted = '';
        if (curr === 'PKR') {
            const usdEquiv = (bal / exRate).toFixed(2);
            dualFormatted = `≈ $${Number(usdEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`;
        } else {
            const pkrEquiv = (bal * exRate).toFixed(2);
            dualFormatted = `≈ ₨ ${Number(pkrEquiv).toLocaleString('en-US', { minimumFractionDigits: 2 })} PKR`;
        }

        const mainValEl = document.getElementById('hd-vault-main-val');
        if (mainValEl) mainValEl.innerText = formatted;

        const dualValEl = document.getElementById('hd-vault-dual-val');
        if (dualValEl) dualValEl.innerText = dualFormatted;

        const realCashEl = document.getElementById('hd-vault-real-cash');
        if (realCashEl) realCashEl.innerText = formatted;

        const bonusVal = (window.wallet.state && window.wallet.state.bonusPKR) ? window.wallet.state.bonusPKR : 0;
        const bonusFormatted = window.wallet.formatAmount(bonusVal);
        const bonusCashEl = document.getElementById('hd-vault-bonus-cash');
        if (bonusCashEl) bonusCashEl.innerText = bonusFormatted;

        const tabPKR = document.getElementById('hd-tab-pkr');
        const tabUSD = document.getElementById('hd-tab-usd');
        if (tabPKR && tabUSD) {
            if (curr === 'PKR') {
                tabPKR.classList.add('active');
                tabUSD.classList.remove('active');
            } else {
                tabUSD.classList.add('active');
                tabPKR.classList.remove('active');
            }
        }
    }

    setupSync() {
        window.addEventListener('storage', (e) => {
            if ((e.key === 'bwn_wallet_state_v1' || (e.key && e.key.startsWith('bwn_wallet_state')) || e.key === 'bwn_session_user') && window.wallet) {
                window.wallet.state = window.wallet.loadState();
                this.updateAllBalances();
            }
        });
        if (window.wallet) {
            window.wallet.on('balanceChange', () => this.updateAllBalances());
        }
    }

    showToast(msg, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
        toast.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(50px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    modifyBet(inputId, action) {
        const input = document.getElementById(inputId);
        if (!input) return;
        let current = parseFloat(input.value) || 10;
        const maxBal = window.wallet ? window.wallet.getBalance() : 10000;

        if (action === 'half') current = Math.max(1, Math.floor(current / 2));
        else if (action === 'double') current = Math.min(maxBal, Math.floor(current * 2));
        else if (action === 'min') current = (window.wallet && window.wallet.getCurrency() === 'PKR') ? 10 : 0.1;
        else if (action === 'max') current = Math.max(1, maxBal);

        input.value = current;
        if (typeof updateCalculations === 'function') updateCalculations();
        if (window.sound) window.sound.playClick();
    }

    // Luxury 4-Column Responsive Footer
    renderFooter() {
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        let footer = document.getElementById('app-luxury-footer');
        if (!footer) {
            footer = document.createElement('footer');
            footer.id = 'app-luxury-footer';
            footer.className = 'luxury-casino-footer';
            const bottomNav = document.getElementById('app-bottom-nav-slot');
            if (bottomNav && bottomNav.parentNode) {
                bottomNav.parentNode.insertBefore(footer, bottomNav);
            } else {
                document.body.appendChild(footer);
            }
        }

        footer.innerHTML = `
            <!-- Top Stats & Social Proof Bar -->
            <div class="footer-stats-bar">
                <div class="footer-stat-item">
                    <span class="stat-pulse-dot"></span>
                    <span class="stat-label">Active Players:</span>
                    <b class="stat-val" id="footer-online-count">14,892 Online</b>
                </div>
                <div class="footer-stat-item">
                    <span class="stat-icon">💰</span>
                    <span class="stat-label">24h Payouts:</span>
                    <b class="stat-val" style="color:var(--accent-emerald);">$ 1,842,900 USD (₨ 516M)</b>
                </div>
                <div class="footer-stat-item">
                    <span class="stat-icon">⚡</span>
                    <span class="stat-label">Avg. Cashout:</span>
                    <b class="stat-val" style="color:var(--primary-gold);">45 Seconds Instant</b>
                </div>
                <div class="footer-stat-item">
                    <span class="stat-icon">🛡️</span>
                    <span class="stat-label">RNG Security:</span>
                    <b class="stat-val" style="color:#00e5ff;">Provably Fair Audited</b>
                </div>
            </div>

            <!-- 4 Main Navigation Columns -->
            <div class="footer-main-grid">
                <!-- Col 1: Brand & Licensing -->
                <div class="footer-col footer-col-brand">
                    <div class="footer-brand-header">
                        <div class="brand-logo-icon">👑</div>
                        <div>
                            <div class="brand-title">BET WITH NET</div>
                            <span class="brand-sub">VIP CASINO & P2P DESK</span>
                        </div>
                    </div>
                    <p class="footer-brand-desc">
                        Pakistan's premier high-roller gaming portal and peer-to-peer liquidity desk. Play 17 official studios including Aviator Crash, 3D Roulette, Vegas Slots, Blackjack 21, and live Dragon Tiger with instant EasyPaisa, JazzCash, and USDT settlement.
                    </p>
                    <div class="footer-trust-badges">
                        <span class="trust-badge">🔞 18+ Only</span>
                        <span class="trust-badge">🎲 RNG Certified</span>
                        <span class="trust-badge">🛡️ AML / KYC Protected</span>
                        <span class="trust-badge">🔒 256-Bit SSL</span>
                    </div>
                </div>

                <!-- Col 2: Casino Game Studios -->
                <div class="footer-col">
                    <h4 class="footer-col-title">🎰 Casino Studios</h4>
                    <ul class="footer-links">
                        <li><a href="${rootPath}games/crash.html">🚀 Aviator Crash <span class="badge-mini-hot">HOT</span></a></li>
                        <li><a href="${rootPath}games/limbo.html">🚀 Limbo Turbo (10,000x)</a></li>
                        <li><a href="${rootPath}games/mines.html">💣 Mines Field Studio</a></li>
                        <li><a href="${rootPath}games/roulette.html">🎡 European 3D Roulette</a></li>
                        <li><a href="${rootPath}games/blackjack.html">♠️ Blackjack 21 VIP</a></li>
                        <li><a href="${rootPath}games/poker.html">🃏 Video Poker (250x)</a></li>
                        <li><a href="javascript:void(0)" onclick="window.core.showUnderRepairModal('Deluxe Vegas Slots')">🎰 Deluxe Vegas Slots (Under Repair)</a></li>
                        <li><a href="${rootPath}games/dice.html">🎲 Over / Under Dice</a></li>
                        <li><a href="${rootPath}games/plinko.html">⚪ Plinko Pegboard</a></li>
                        <li><a href="${rootPath}games/keno.html">🎱 Keno 80-Ball Lottery</a></li>
                        <li><a href="${rootPath}games/bingo.html">🎫 Bingo 75-Ball Live</a></li>
                        <li><a href="${rootPath}games/coinflip.html">🪙 Coin Flip VIP (836x)</a></li>
                        <li><a href="${rootPath}games/hilo.html">🃏 Hi-Lo VIP Streak</a></li>
                        <li><a href="${rootPath}games/scratch.html">🎟️ Lucky Scratch Card</a></li>
                    </ul>
                </div>

                <!-- Col 3: Legal, Fair Play & Policies -->
                <div class="footer-col">
                    <h4 class="footer-col-title">⚖️ Legal & Compliance</h4>
                    <ul class="footer-links">
                        <li><a href="${rootPath}pages.html?slug=terms">📜 Terms & Conditions</a></li>
                        <li><a href="${rootPath}pages.html?slug=privacy">🔒 Privacy Policy</a></li>
                        <li><a href="${rootPath}pages.html?slug=responsible-gaming">🛡️ Responsible Gaming</a></li>
                        <li><a href="${rootPath}pages.html?slug=aml-kyc">🔍 AML & KYC Policy</a></li>
                        <li><a href="${rootPath}pages.html?slug=fair-play">⚖️ Provably Fair & RNG Audits</a></li>
                        <li><a href="${rootPath}pages.html?slug=faq">❓ FAQ & Help Center</a></li>
                        <li><a href="${rootPath}pages.html?slug=self-exclusion">⛔ Self-Exclusion Program</a></li>
                        <li><a href="javascript:void(0)" onclick="window.core.logout();" style="color:#ff4757; font-weight:700;">🚪 Logout Account</a></li>
                        <li><a href="${rootPath}admin/index.html" style="color:var(--accent-emerald); font-weight:800;">👑 Admin Back-Office Panel</a></li>
                    </ul>
                </div>

                <!-- Col 4: Banking, P2P & Support -->
                <div class="footer-col">
                    <h4 class="footer-col-title">💳 Banking & P2P Desk</h4>
                    <ul class="footer-links">
                        <li><a href="${rootPath}deposit.html">📥 Cashier Deposit Portal</a></li>
                        <li><a href="${rootPath}withdraw.html">📤 Instant Cashout Portal</a></li>
                        <li><a href="${rootPath}p2p.html">🔄 P2P Trading Desk (Local) <span class="badge-mini-p2p">P2P</span></a></li>
                        <li><a href="${rootPath}history.html">📋 Betslip & Statement Ledger</a></li>
                        <li><a href="${rootPath}promo.html">🎁 VIP Club & Promotions</a></li>
                        <li><a href="javascript:void(0)" onclick="window.core.showLiveSupport()">💬 24/7 Live Support Chat</a></li>
                        <li><a href="javascript:void(0)" onclick="window.core.openDailyBonusModal(false)">🎁 7-Days VIP Daily Bonus</a></li>
                    </ul>
                </div>
            </div>

            <!-- Payment Gateways Accepted Badges Row -->
            <div class="footer-gateways-wrap">
                <span class="footer-gateways-label">Supported Official Currencies & Instant Payment Channels:</span>
                <div class="footer-gateway-badges">
                    <span class="gw-badge">📱 EasyPaisa VIP</span>
                    <span class="gw-badge">⚡ JazzCash Direct</span>
                    <span class="gw-badge">💳 NayaPay Instant</span>
                    <span class="gw-badge">🪙 Tether USDT (TRC-20)</span>
                    <span class="gw-badge">🟡 Binance Pay</span>
                    <span class="gw-badge">💳 Visa / Mastercard</span>
                    <span class="gw-badge">🔄 Local P2P Escrow</span>
                </div>
            </div>

            <!-- Footer Bottom Disclaimer & Copyright -->
            <div class="footer-bottom-bar">
                <div>
                    © 2026 <b>Bet With Net</b>. All rights reserved. High-Fidelity VIP Casino & P2P Simulation Platform.
                </div>
                <div class="footer-bottom-disclaimer">
                    Gambling can be addictive. Play responsibly. Strictly 18+ only.
                </div>
            </div>
        `;
    }

    // Live Multiplayer Social Proof & Big Win Alerts
    initSocialProof() {
        const players = ['Hamza_VIP', 'Ali_Khan786', 'Zeeshan_Pro', 'Malik_Whale', 'CryptoKing_PK', 'Tariq_M', 'Babar_Azam', 'Fatima_99', 'Usman_Highroller', 'Bilal_K', 'Sikandar_99', 'Kamran_Akmal'];
        const games = [
            { name: 'Aviator Crash', mult: '4.82x', winPKR: 48200 },
            { name: 'Limbo Turbo', mult: '12.50x', winPKR: 125000 },
            { name: 'Blackjack 21', mult: '2.50x', winPKR: 50000 },
            { name: 'European Roulette', mult: '36.0x', winPKR: 180000 },
            { name: 'Deluxe Slots', mult: '25.0x', winPKR: 75000 },
            { name: 'Mines Field', mult: '8.14x', winPKR: 40700 },
            { name: 'Coin Flip VIP', mult: '15.6x', winPKR: 62400 },
            { name: 'Hi-Lo VIP', mult: '10.0x', winPKR: 50000 }
        ];

        // Random live win notifications popping up every 14 seconds
        setInterval(() => {
            if (document.hidden) return;
            const p = players[Math.floor(Math.random() * players.length)];
            const g = games[Math.floor(Math.random() * games.length)];
            const winText = window.wallet ? window.wallet.formatAmount(window.wallet.fromPKR ? window.wallet.fromPKR(g.winPKR) : g.winPKR) : `₨ ${g.winPKR.toLocaleString()}`;
            this.showSocialWinToast(`🎉 @${p} cashed out ${winText} on ${g.name} (${g.mult})!`);
        }, 14000);

        // Dynamic player count fluctuation
        setInterval(() => {
            const el = document.getElementById('footer-online-count');
            if (el) {
                const count = 14800 + Math.floor(Math.random() * 450);
                el.innerText = `${count.toLocaleString()} Online`;
            }
        }, 6000);
    }

    showSocialWinToast(msg) {
        let sc = document.getElementById('social-toast-container');
        if (!sc) {
            sc = document.createElement('div');
            sc.id = 'social-toast-container';
            sc.className = 'social-toast-container';
            document.body.appendChild(sc);
        }

        const toast = document.createElement('div');
        toast.className = 'social-win-toast';
        toast.innerHTML = `<span class="social-toast-fire">🔥</span><span class="social-toast-text">${msg}</span>`;
        sc.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.4s ease';
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    }

    // ============================================================
    // OFFICIAL 1x CARD GAMES COLLECTION POPUP MODAL (20 GAMES)
    // ============================================================
    openCardGamesModal() {
        this.ensureBGMPlaying();
        let modal = document.getElementById('card-games-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'card-games-modal-root';
            document.body.appendChild(modal);
        }

        const inGames = window.location.pathname.includes('/games/');
        const gPath = inGames ? '' : 'games/';
        const aPath = inGames ? '../' : './';

        const cardGames = [
            { id: 158, title: "Solitaire", tag: "POPULAR", mult: "2.00x", poster: `${aPath}assets/covers/card_games/game-158.webp`, url: `${gPath}solitaire.html`, cat: "solitaire" },
            { id: 58,  title: "21 (Twenty-One)", tag: "HOT 🔥", mult: "2.00x", poster: `${aPath}assets/covers/card_games/game-58.webp`, url: `${gPath}twenty_one.html`, cat: "21" },
            { id: 184, title: "Indian Poker", tag: "75X WIN", mult: "75.0x", poster: `${aPath}assets/covers/card_games/game-184.webp`, url: `${gPath}indian_poker.html`, cat: "poker" },
            { id: 270, title: "Killer Clubs", tag: "JACKPOT", mult: "1782x", poster: `${aPath}assets/covers/card_games/game-270.webp`, url: `${gPath}killer_clubs.html`, cat: "table" },
            { id: 569, title: "Solitaire Battle Arena", tag: "ARENA", mult: "PvP", poster: `${aPath}assets/covers/card_games/game-569.webp`, url: `${gPath}solitaire_arena.html`, cat: "solitaire" },
            { id: 90,  title: "Card Odds", tag: "ODDS", mult: "17.0x", poster: `${aPath}assets/covers/card_games/game-90.webp`, url: `${gPath}card_odds.html`, cat: "table" },
            { id: 122, title: "Lucky Card", tag: "LUCKY", mult: "4.00x", poster: `${aPath}assets/covers/card_games/game-122.webp`, url: `${gPath}lucky_card.html`, cat: "table" },
            { id: 71,  title: "PF Poker Light", tag: "1000X", mult: "1000x", poster: `${aPath}assets/covers/card_games/game-71.webp`, url: `${gPath}pf_poker.html`, cat: "poker" },
            { id: 207, title: "Royal Hi-Lo", tag: "ROYAL", mult: "12.5x", poster: `${aPath}assets/covers/card_games/game-207.webp`, url: `${gPath}royal_hilo.html`, cat: "table" },
            { id: 195, title: "Truth or Lie", tag: "BLUFF", mult: "3.90x", poster: `${aPath}assets/covers/card_games/game-195.webp`, url: `${gPath}truth_or_lie.html`, cat: "table" },
            { id: 345, title: "Deluxe Cards", tag: "DELUXE", mult: "100x", poster: `${aPath}assets/covers/card_games/game-345.webp`, url: `${gPath}deluxe_cards.html`, cat: "table" },
            { id: 517, title: "Flip Card", tag: "FAST", mult: "10.0x", poster: `${aPath}assets/covers/card_games/game-517.webp`, url: `${gPath}flip_card.html`, cat: "table" },
            { id: 432, title: "Heroes of the Storm 21", tag: "HOTS", mult: "2.00x", poster: `${aPath}assets/covers/card_games/game-432.webp`, url: `${gPath}twenty_one_hots.html`, cat: "21" },
            { id: 431, title: "DOTA 21", tag: "DOTA", mult: "2.00x", poster: `${aPath}assets/covers/card_games/game-431.webp`, url: `${gPath}twenty_one_dota.html`, cat: "21" },
            { id: 265, title: "Card War", tag: "WAR", mult: "12.0x", poster: `${aPath}assets/covers/card_games/game-265.webp`, url: `${gPath}card_war.html`, cat: "table" },
            { id: 377, title: "Triple Pocket Holdem Poker", tag: "HOLDEM", mult: "50.0x", poster: `${aPath}assets/covers/card_games/game-377.webp`, url: `${gPath}triple_pocket_holdem.html`, cat: "poker" },
            { id: 363, title: "Andar Bahar", tag: "TOP VIP", mult: "12.0x", poster: `${aPath}assets/covers/card_games/game-363.webp`, url: `${gPath}andar_bahar.html`, cat: "table" },
            { id: 210, title: "Red Dog", tag: "CLASSIC", mult: "12.0x", poster: `${aPath}assets/covers/card_games/game-210.webp`, url: `${gPath}red_dog.html`, cat: "table" },
            { id: 519, title: "Circus Poker", tag: "250X", mult: "250x", poster: `${aPath}assets/covers/card_games/game-519.webp`, url: `${gPath}circus_poker.html`, cat: "poker" },
            { id: 362, title: "Wonderland", tag: "MAGIC", mult: "12.5x", poster: `${aPath}assets/covers/card_games/game-362.webp`, url: `${gPath}wonderland.html`, cat: "table" }
        ];

        window._bwnCardGamesList = cardGames;

        let cardsHtml = cardGames.map(g => `
            <a href="${g.url}" class="card-game-hub-card" data-cat="${g.cat}" data-title="${g.title.toLowerCase()}" data-id="${g.id}">
                <div class="card-game-hub-thumb">
                    <img src="${g.poster}" alt="${g.title}" loading="lazy" onerror="this.src='${rootPath}assets/covers/card.png'">
                    <span class="card-game-hub-badge">${g.tag}</span>
                    <span class="card-game-hub-mult">${g.mult}</span>
                </div>
                <div class="card-game-hub-info">
                    <div class="card-game-hub-title" title="${g.title}">${g.title}</div>
                    <div class="card-game-hub-footer">
                        <span class="card-game-hub-id">#${g.id}</span>
                        <span class="card-game-hub-play-btn">PLAY ▶</span>
                    </div>
                </div>
            </a>
        `).join('');

        modal.innerHTML = `
            <div class="card-games-modal-overlay" onclick="window.core.closeCardGamesModal(event)"></div>
            <div class="card-games-modal-dialog" id="cardGamesModalDialog">
                <div class="card-modal-header">
                    <div class="card-modal-title-wrap">
                        <div class="card-modal-icon">🃏</div>
                        <div>
                            <div class="card-modal-title">
                                1x Card Games Collection
                                <span class="card-modal-badge">20 OFFICIAL GAMES</span>
                            </div>
                            <div class="card-modal-sub">Explore Solitaire, 21, Indian Poker, Card War & Table Classics</div>
                        </div>
                    </div>
                    <button class="card-modal-close" onclick="window.core.closeCardGamesModal(event)" title="Close">&times;</button>
                </div>

                <div class="card-modal-toolbar">
                    <div class="card-modal-search">
                        <span class="card-modal-search-icon">🔍</span>
                        <input type="text" id="cardModalSearchInput" placeholder="Search 20 card games..." oninput="window.core.searchCardGamesModal(this.value)">
                    </div>
                    <div class="card-modal-filters">
                        <button class="card-filter-btn active" onclick="window.core.filterCardGamesModal('all', this)">All (20)</button>
                        <button class="card-filter-btn" onclick="window.core.filterCardGamesModal('poker', this)">Poker (4)</button>
                        <button class="card-filter-btn" onclick="window.core.filterCardGamesModal('21', this)">21 & Blackjack (3)</button>
                        <button class="card-filter-btn" onclick="window.core.filterCardGamesModal('solitaire', this)">Solitaire (2)</button>
                        <button class="card-filter-btn" onclick="window.core.filterCardGamesModal('table', this)">Table & Hi-Lo (11)</button>
                    </div>
                </div>

                <div class="card-modal-body">
                    <div class="card-games-hub-grid" id="cardGamesHubGrid">
                        ${cardsHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.style.overflow = 'hidden';
    }

    closeCardGamesModal(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        const dialog = document.getElementById('cardGamesModalDialog');
        if (dialog) {
            dialog.classList.add('closing');
            setTimeout(() => {
                const modal = document.getElementById('card-games-modal-root');
                if (modal) modal.innerHTML = '';
                document.body.style.overflow = '';
            }, 200);
        } else {
            const modal = document.getElementById('card-games-modal-root');
            if (modal) modal.innerHTML = '';
            document.body.style.overflow = '';
        }
    }

    filterCardGamesModal(cat, btn) {
        const btns = document.querySelectorAll('.card-filter-btn');
        btns.forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');

        const searchVal = (document.getElementById('cardModalSearchInput')?.value || '').toLowerCase().trim();
        this._updateCardGamesModalDisplay(cat, searchVal);
    }

    searchCardGamesModal(query) {
        const activeBtn = document.querySelector('.card-filter-btn.active');
        let cat = 'all';
        if (activeBtn) {
            const m = activeBtn.getAttribute('onclick')?.match(/'([^']+)'/);
            if (m && m[1]) cat = m[1];
        }
        this._updateCardGamesModalDisplay(cat, (query || '').toLowerCase().trim());
    }

    _updateCardGamesModalDisplay(cat, search) {
        const grid = document.getElementById('cardGamesHubGrid');
        if (!grid) return;
        const items = grid.querySelectorAll('.card-game-hub-card');
        items.forEach(card => {
            const cardCat = card.getAttribute('data-cat');
            const title = card.getAttribute('data-title') || '';
            const id = card.getAttribute('data-id') || '';

            const catMatch = (cat === 'all' || cardCat === cat);
            const searchMatch = (!search || title.includes(search) || id.includes(search));

            card.style.display = (catMatch && searchMatch) ? '' : 'none';
        });
    }

    // ============================================================
    // UNIVERSAL WHITE "DEPOSIT FUNDS" POPUP MODAL (JAZZCASH / NAYAPAY / BINANCE)
    // ============================================================
    openDepositModal(defaultGw = 'dep-jazzcash') {
        this.ensureBGMPlaying();
        if (window.sound) window.sound.playClick();

        let modal = document.getElementById('deposit-funds-modal-root');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'deposit-funds-modal-root';
            document.body.appendChild(modal);
        }

        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';
        const balFormatted = window.wallet ? window.wallet.formatAmount(window.wallet.getBalance()) : 'Rs. 25,000.00';
        window._depositModalCurrentGw = 'dep-jazzcash';
        window._depositModalProofBase64 = null;

        modal.innerHTML = `
            <div class="deposit-modal-overlay" onclick="window.core.closeDepositModal(event)" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.72); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); z-index:99999998 !important; display:flex; align-items:center; justify-content:center; padding:14px; box-sizing:border-box;">
                <div class="deposit-modal-dialog" onclick="event.stopPropagation()" style="background:#ffffff !important; color:#0f172a !important; border-radius:22px; width:100%; max-width:480px; max-height:92vh; overflow-y:auto; box-shadow:0 25px 70px rgba(0,0,0,0.6), 0 0 35px rgba(16,185,129,0.25); border:2px solid rgba(16,185,129,0.5); font-family:'Inter', -apple-system, BlinkMacSystemFont, sans-serif; position:relative; box-sizing:border-box; z-index:99999999 !important; animation:vipModalTopDrop 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
                    
                    <!-- Header -->
                    <div style="background:#f8fafc; border-bottom:1.5px solid #e2e8f0; padding:16px 20px; display:flex; justify-content:space-between; align-items:center; border-radius:18px 18px 0 0;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="font-size:22px;">💳</span>
                            <div>
                                <div style="font-size:16px; font-weight:800; color:#0f172a; line-height:1.2;">Deposit Funds</div>
                                <div style="font-size:11px; color:#64748b; font-weight:600;">Official Fast Payment Cashier</div>
                            </div>
                        </div>
                        <button onclick="window.core.closeDepositModal(event)" style="background:#e2e8f0; border:none; color:#475569; font-size:18px; cursor:pointer; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; transition:all 0.15s;" title="Close">&times;</button>
                    </div>

                    <!-- Modal Body -->
                    <div style="padding:18px 20px;">
                        
                        <!-- Current Balance Bar -->
                        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:10px 14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="font-size:12px; font-weight:700; color:#64748b; text-transform:uppercase;">Current Balance:</span>
                            <span class="wallet-balance-display" style="font-size:17px; font-weight:900; color:#059669; font-family:monospace;">${balFormatted}</span>
                        </div>

                        <!-- Gateway Selector Tabs (JazzCash, NayaPay, Binance) -->
                        <div style="margin-bottom:14px;">
                            <label style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:8px; display:block;">Select Payment Method:</label>
                            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
                                <button type="button" id="dep-gw-btn-jazzcash" onclick="window.core.switchDepositModalGw('dep-jazzcash')" style="padding:8px 4px; border-radius:10px; border:2px solid #10b981; background:#f0fdf4; cursor:pointer; text-align:center; transition:all 0.15s; display:flex; flex-direction:column; align-items:center;">
                                    <div style="font-size:9px; font-weight:800; color:#dc2626; background:#fee2e2; border-radius:4px; padding:1px 4px; margin-bottom:4px;">FAST</div>
                                    <img src="${rootPath}assets/jazzcash.png" alt="JazzCash" style="width:28px; height:28px; object-fit:contain; border-radius:5px; margin-bottom:3px;">
                                    <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.1;">JazzCash</div>
                                </button>
                                <button type="button" id="dep-gw-btn-nayapay" onclick="window.core.switchDepositModalGw('dep-nayapay')" style="padding:8px 4px; border-radius:10px; border:1.5px solid #e2e8f0; background:#ffffff; cursor:pointer; text-align:center; transition:all 0.15s; display:flex; flex-direction:column; align-items:center;">
                                    <div style="font-size:9px; font-weight:800; color:#00875a; background:#e6fcf5; border-radius:4px; padding:1px 4px; margin-bottom:4px;">INSTANT</div>
                                    <img src="${rootPath}assets/nayapay.png" alt="NayaPay" style="width:28px; height:28px; object-fit:contain; border-radius:5px; margin-bottom:3px;">
                                    <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.1;">NayaPay</div>
                                </button>
                                <button type="button" id="dep-gw-btn-binance" onclick="window.core.switchDepositModalGw('dep-binance')" style="padding:8px 4px; border-radius:10px; border:1.5px solid #e2e8f0; background:#ffffff; cursor:pointer; text-align:center; transition:all 0.15s; display:flex; flex-direction:column; align-items:center;">
                                    <div style="font-size:9px; font-weight:800; color:#b45309; background:#fef3c7; border-radius:4px; padding:1px 4px; margin-bottom:4px;">CRYPTO</div>
                                    <div style="background:#181a20; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; margin-bottom:3px;">
                                        <img src="${rootPath}assets/binance.svg" alt="Binance" style="width:18px; height:18px; object-fit:contain;">
                                    </div>
                                    <div style="font-size:11px; font-weight:800; color:#0f172a; line-height:1.1;">Binance</div>
                                </button>
                            </div>
                        </div>

                        <!-- Account Voucher Card -->
                        <div id="dep-modal-voucher-box" style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:12px; padding:14px; margin-bottom:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;">
                                <span style="color:#64748b; font-weight:600;">Account Title (Name):</span>
                                <b id="dep-modal-acc-title" style="color:#0f172a; font-size:15px; font-weight:800;"><img src="${rootPath}assets/jazzcash.png" alt="JazzCash" style="width:18px; height:18px; vertical-align:middle; object-fit:contain; border-radius:3px; margin-right:4px;">Muhammad Ijaz</b>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:13px;">
                                <span id="dep-modal-num-label" style="color:#64748b; font-weight:600;">Account Number:</span>
                                <div style="display:flex; align-items:center; gap:8px;">
                                    <span id="dep-modal-acc-num" style="font-family:monospace; font-weight:800; color:#059669; font-size:17px;">03246533046</span>
                                    <button type="button" onclick="window.core.copyDepositText(document.getElementById('dep-modal-acc-num').innerText.trim())" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#0f172a; padding:3px 10px; border-radius:5px; font-size:11px; font-weight:800; cursor:pointer;">COPY</button>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px; margin-bottom:8px;">
                                <span style="color:#64748b; font-weight:600;">Deposit Limits:</span>
                                <b id="dep-modal-limits" style="color:#0f172a;">Rs. 500 - Rs. 100,000</b>
                            </div>
                            <div id="dep-modal-instructions" style="font-size:11.5px; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; padding:9px 12px; border-radius:6px; line-height:1.4;">
                                Transfer funds to <b>03246533046 (Muhammad Ijaz)</b> via JazzCash and attach screenshot below for instant verification.
                            </div>
                        </div>

                        <!-- Transaction Screenshot Upload Card -->
                        <div style="margin-bottom:16px;">
                            <label style="display:flex; align-items:center; justify-content:space-between; font-size:12.5px; font-weight:800; color:#059669; margin-bottom:6px;">
                                <span>Transaction Screenshot:</span>
                                <span style="font-size:10px; background:#d1fae5; color:#059669; padding:2px 6px; border-radius:4px; border:1px solid #10b981;">REQUIRED</span>
                            </label>
                            <label for="dep-modal-ss-input" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; padding:14px 10px; background:#f0fdf4; border:2px dashed #10b981; border-radius:10px; cursor:pointer; text-align:center; transition:all 0.2s;">
                                <span style="font-size:24px;">📤</span>
                                <span style="font-size:13px; font-weight:800; color:#0f172a;">Tap to Upload Screenshot</span>
                                <span id="dep-modal-proof-sub" style="font-size:11px; color:#64748b;">Attach payment proof screenshot</span>
                            </label>
                            <input type="file" id="dep-modal-ss-input" accept="image/*" onchange="window.core.handleDepositModalProof(this)" style="display:none;">
                            <div id="dep-modal-ss-preview-wrap" style="display:none; margin-top:10px; background:#ffffff; padding:10px; border-radius:10px; border:1.5px solid #10b981; text-align:center;">
                                <div style="font-size:11.5px; color:#059669; margin-bottom:6px; font-weight:800;">Screenshot Attached:</div>
                                <img id="dep-modal-ss-preview-img" style="max-height:160px; max-width:100%; border-radius:6px; display:inline-block; border:1px solid #e2e8f0;" />
                            </div>
                        </div>

                        <!-- Amount Input -->
                        <div style="margin-bottom:14px;">
                            <label style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:6px; display:block;">Deposit Amount (PKR):</label>
                            <input type="number" id="dep-modal-amount-input" value="5000" min="500" step="500" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; font-weight:800; font-size:16px; border-radius:8px; padding:10px 12px; width:100%; box-sizing:border-box; outline:none;">
                            <div style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;">
                                <button type="button" onclick="window.core.setDepositModalAmount(1000)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-weight:700; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Rs. 1,000</button>
                                <button type="button" onclick="window.core.setDepositModalAmount(2500)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-weight:700; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Rs. 2,500</button>
                                <button type="button" onclick="window.core.setDepositModalAmount(5000)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-weight:700; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Rs. 5,000</button>
                                <button type="button" onclick="window.core.setDepositModalAmount(10000)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-weight:700; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Rs. 10,000</button>
                                <button type="button" onclick="window.core.setDepositModalAmount(25000)" style="background:#f1f5f9; border:1px solid #cbd5e1; color:#1e293b; font-weight:700; border-radius:6px; padding:5px 10px; font-size:11.5px; cursor:pointer;">Rs. 25,000</button>
                            </div>
                        </div>

                        <!-- Sender Mobile Number -->
                        <div style="margin-bottom:14px;">
                            <label style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:5px; display:block;">Your Sender Mobile Number:</label>
                            <input type="text" id="dep-modal-sender-input" placeholder="03XXXXXXXXX" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; font-weight:700; border-radius:8px; padding:10px 12px; width:100%; box-sizing:border-box; outline:none; font-size:13px;">
                        </div>

                        <!-- Optional TID -->
                        <div style="margin-bottom:18px;">
                            <label style="font-size:12px; font-weight:700; color:#0f172a; margin-bottom:5px; display:block;">Transaction ID / TID (Optional):</label>
                            <input type="text" id="dep-modal-trx-input" placeholder="e.g. 11-digit TID / Trx ID" style="background:#f8fafc; border:1.5px solid #cbd5e1; color:#0f172a; font-weight:700; border-radius:8px; padding:10px 12px; width:100%; box-sizing:border-box; outline:none; font-size:13px;">
                        </div>

                        <!-- Confirm Button -->
                        <button type="button" id="dep-modal-submit-btn" onclick="window.core.submitDepositModal()" style="background:linear-gradient(135deg, #059669, #10b981); color:#ffffff; font-weight:900; font-size:15px; border:none; border-radius:10px; padding:13px; width:100%; cursor:pointer; box-shadow:0 4px 18px rgba(16,185,129,0.35); display:flex; align-items:center; justify-content:center; gap:8px;">
                            <span>CONFIRM & SUBMIT DEPOSIT</span>
                        </button>

                        <a href="${rootPath}deposit.html" style="display:block; text-align:center; margin-top:14px; font-size:12px; color:#059669; font-weight:700; text-decoration:none;">Open Full Cashier Portal &rarr;</a>

                    </div>
                </div>
            </div>
        `;

        if (!this._depositModalEscAttached) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeDepositModal();
            });
            this._depositModalEscAttached = true;
        }
    }

    closeDepositModal(e) {
        if (e) e.stopPropagation();
        const modal = document.getElementById('deposit-funds-modal-root');
        if (modal) modal.remove();
        if (window.sound) window.sound.playClick();
    }

    switchDepositModalGw(gwId) {
        if (!['dep-jazzcash', 'dep-nayapay', 'dep-binance'].includes(gwId)) {
            gwId = 'dep-jazzcash';
        }
        window._depositModalCurrentGw = gwId;
        const rootPath = window.location.pathname.includes('/games/') ? '../' : './';

        const btns = {
            'dep-jazzcash': document.getElementById('dep-gw-btn-jazzcash'),
            'dep-nayapay': document.getElementById('dep-gw-btn-nayapay'),
            'dep-binance': document.getElementById('dep-gw-btn-binance')
        };
        Object.keys(btns).forEach(k => {
            const btn = btns[k];
            if (!btn) return;
            if (k === gwId) {
                btn.style.border = '2px solid #10b981';
                btn.style.background = '#f0fdf4';
            } else {
                btn.style.border = '1.5px solid #e2e8f0';
                btn.style.background = '#ffffff';
            }
        });

        const titleEl = document.getElementById('dep-modal-acc-title');
        const numEl = document.getElementById('dep-modal-acc-num');
        const instrEl = document.getElementById('dep-modal-instructions');
        const numLabelEl = document.getElementById('dep-modal-num-label');
        const limitsEl = document.getElementById('dep-modal-limits');
        const proofSub = document.getElementById('dep-modal-proof-sub');

        if (gwId === 'dep-jazzcash') {
            if (titleEl) titleEl.innerHTML = `<img src="${rootPath}assets/jazzcash.png" alt="JazzCash" style="width:18px; height:18px; vertical-align:middle; object-fit:contain; border-radius:3px; margin-right:4px;">Muhammad Ijaz`;
            if (numEl) numEl.textContent = '03246533046';
            if (numLabelEl) numLabelEl.textContent = 'Account Number:';
            if (limitsEl) limitsEl.textContent = 'Rs. 500 - Rs. 100,000';
            if (instrEl) instrEl.innerHTML = `Transfer funds to <b>03246533046 (Muhammad Ijaz)</b> via JazzCash and attach screenshot below for instant verification.`;
            if (proofSub) proofSub.textContent = 'Attach JazzCash payment proof';
        } else if (gwId === 'dep-nayapay') {
            if (titleEl) titleEl.innerHTML = `<img src="${rootPath}assets/nayapay.png" alt="NayaPay" style="width:18px; height:18px; vertical-align:middle; object-fit:contain; border-radius:3px; margin-right:4px;">Muhammad Ijaz`;
            if (numEl) numEl.textContent = '03246533046';
            if (numLabelEl) numLabelEl.textContent = 'Account Number:';
            if (limitsEl) limitsEl.textContent = 'Rs. 500 - Rs. 100,000';
            if (instrEl) instrEl.innerHTML = `Transfer funds to <b>03246533046 (Muhammad Ijaz)</b> via NayaPay and attach screenshot below for instant verification.`;
            if (proofSub) proofSub.textContent = 'Attach NayaPay payment proof';
        } else if (gwId === 'dep-binance') {
            if (titleEl) titleEl.innerHTML = `<img src="${rootPath}assets/binance.svg" alt="Binance" style="width:18px; height:18px; vertical-align:middle; object-fit:contain; border-radius:3px; margin-right:4px;">BetWithNet VIP PayID`;
            if (numEl) numEl.textContent = '987654321';
            if (numLabelEl) numLabelEl.textContent = 'Binance Pay ID:';
            if (limitsEl) limitsEl.textContent = '$10 - $25,000 (Rs. 2,800 - Rs. 7,000,000)';
            if (instrEl) instrEl.innerHTML = `Send via Binance App -> Pay -> Send to Pay ID <b>987654321</b> and attach screenshot below.`;
            if (proofSub) proofSub.textContent = 'Attach Binance Pay payment proof';
        }

        if (window.sound) window.sound.playClick();
    }

    copyDepositText(txt) {
        navigator.clipboard.writeText(txt);
        this.showToast('Copied: ' + txt, 'success');
        if (window.sound) window.sound.playChip();
    }

    setDepositModalAmount(amt) {
        const input = document.getElementById('dep-modal-amount-input');
        if (input) input.value = amt;
        if (window.sound) window.sound.playClick();
    }

    handleDepositModalProof(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const rawDataUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const maxDim = 900;
                        let w = img.width;
                        let h = img.height;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) {
                                h = Math.round((h * maxDim) / w);
                                w = maxDim;
                            } else {
                                w = Math.round((w * maxDim) / h);
                                h = maxDim;
                            }
                        }
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        window._depositModalProofBase64 = canvas.toDataURL('image/jpeg', 0.78);
                    } catch (err) {
                        window._depositModalProofBase64 = rawDataUrl;
                    }
                    const preview = document.getElementById('dep-modal-ss-preview-img');
                    const wrap = document.getElementById('dep-modal-ss-preview-wrap');
                    if (preview && wrap) {
                        preview.src = window._depositModalProofBase64;
                        wrap.style.display = 'block';
                    }
                };
                img.src = rawDataUrl;
            };
            reader.readAsDataURL(file);
        }
    }

    async submitDepositModal() {
        const user = this.getLoggedInUser();
        if (!user || !user.id) {
            this.showToast('Please sign in or create an account before depositing!', 'error');
            this.closeDepositModal();
            this.openAuthModal('login');
            return;
        }

        const amtInput = document.getElementById('dep-modal-amount-input');
        const amount = parseFloat(amtInput ? amtInput.value : 0);
        const senderInputVal = document.getElementById('dep-modal-sender-input')?.value.trim() || '';
        const sender = senderInputVal || user.phone || user.username || 'Via Screenshot';
        const trx = document.getElementById('dep-modal-trx-input')?.value.trim() || ('TID' + Date.now().toString().slice(-8));
        const btn = document.getElementById('dep-modal-submit-btn');

        if (!amount || amount < 500) {
            this.showToast('Minimum deposit amount is ₨ 500', 'error');
            return;
        }

        if (!window._depositModalProofBase64) {
            this.showToast('Please upload your Transaction Screenshot first!', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Submitting Deposit Request...';
        }

        const rate = window.wallet ? window.wallet.exchangeRate : 280;
        const amountUsd = parseFloat((amount / rate).toFixed(2));
        const gwName = (window._depositModalCurrentGw === 'dep-jazzcash') ? 'JazzCash' : 
                       (window._depositModalCurrentGw === 'dep-nayapay') ? 'NayaPay' : 'Binance';

        let serverTxId = 'trx_' + Date.now().toString().slice(-8);
        try {
            const res = await fetch('/api/wallet.php?action=deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    amount: amount,
                    amount_pkr: amount,
                    amount_usd: amountUsd,
                    currency: 'PKR',
                    method: gwName,
                    sender_account: sender,
                    sender: sender,
                    trx_id: trx,
                    proof_image: window._depositModalProofBase64
                })
            });
            const json = await res.json();
            if (json && json.data && json.data.transaction_id) {
                serverTxId = json.data.transaction_id;
            }
        } catch (e) {
            console.warn('[Deposit Modal] Server fetch warning:', e);
        }

        if (window.wallet) {
            if (!window.wallet.state.transactions) window.wallet.state.transactions = [];
            window.wallet.state.transactions.unshift({
                id: serverTxId,
                type: 'deposit',
                method: gwName,
                currency: 'PKR',
                amountPKR: amount,
                amountUSD: amountUsd,
                sender: sender,
                trxId: trx,
                proofImage: window._depositModalProofBase64,
                status: 'Pending',
                date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                timestamp: new Date().toISOString()
            });
            window.wallet.saveState();
        }

        if (btn) {
            btn.disabled = false;
            btn.innerText = 'CONFIRM & SUBMIT DEPOSIT';
        }
        // Broadcast to Admin Panel for instantaneous modal alert
        try {
            localStorage.setItem('bwn_latest_tx_broadcast', JSON.stringify({
                id: serverTxId,
                type: 'deposit',
                amount: amount,
                amount_pkr: amount,
                amount_usd: amountUsd,
                method: gwName,
                sender_account: sender,
                user_id: user.username,
                trx_id: trx,
                proof_image: window._depositModalProofBase64,
                timestamp: Date.now()
            }));
        } catch(e) {}

        this.showToast(`Deposit of ₨ ${amount.toLocaleString()} submitted! Status: Pending Admin Approval.`, 'success');
        this.updateAllBalances();
        setTimeout(() => {
            this.closeDepositModal();
        }, 1200);
    }
}

window.core = new CoreApp();
if (!window.app) window.app = window.core;
window.claimDailyBonus = (e) => window.core.claimDailyBonus(e);
window.openDailyBonusModal = (auto) => window.core.openDailyBonusModal(auto);
window.openDepositModal = (gw) => window.core.openDepositModal(gw);
window.closeDepositModal = (e) => window.core.closeDepositModal(e);
window.openDeposit = (gw) => window.core.openDepositModal(gw);
window.openCardGamesModal = () => window.core.openCardGamesModal();
window.closeCardGamesModal = (e) => window.core.closeCardGamesModal(e);
window.openWhatsAppSupport = () => window.core.openWhatsAppSupport();
window.showCasinoMaintenanceModal = (e, locked) => window.core.showCasinoMaintenanceModal(e, locked);
window.closeCasinoMaintenanceModal = (e) => window.core.closeCasinoMaintenanceModal(e);
window.openBalancePopup = (e) => window.core.openBalancePopup(e);
window.closeBalancePopup = (e) => window.core.closeBalancePopup(e);
window.toggleBalancePopup = (e) => window.core.toggleBalancePopup(e);
window.showGameMaintenanceModal = (name, e, locked) => window.core.showGameMaintenanceModal(name, e, locked);
window.closeGameMaintenanceModal = (e) => window.core.closeGameMaintenanceModal(e);


