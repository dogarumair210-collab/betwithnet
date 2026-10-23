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

let realBalance = getRealWalletBalance();

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
    alert("Balance kam hai! Rs. " + currentBal.toFixed(2));
    return false;
  }

  let deducted = false;
  if(window.wallet && typeof window.wallet.placeBet === 'function') {
    deducted = window.wallet.placeBet(amount, 'Chicken Rush');
    if (!deducted) {
      alert("Balance kam hai! Rs. " + currentBal.toFixed(2));
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
// Bet With Net - Master App Controller & UI Router
// Navigation, Game Arena switcher, Modals, VIP, Live Ticker
// ============================================================

class AppManager {
    constructor() {
        this.activeGame = null;
        this.gamesList = [
            { id: 'crash', name: 'Crash Game', cat: 'originals', icon: '🚀', tag: 'HOT', rtp: '97.0%', cover: 'assets/covers/crash.png' },
            { id: 'card_game', name: 'Dragon vs Tiger', cat: 'card', icon: '🎴', tag: 'TRENDING', rtp: '96.5%', cover: 'assets/covers/card_game.png' },
            { id: 'roulette', name: 'European Roulette', cat: 'table', icon: '🎡', tag: 'CLASSIC', rtp: '97.3%', cover: 'assets/covers/roulette.png' },
            { id: 'slots', name: 'Deluxe Video Slots', cat: 'slots', icon: '🎰', tag: 'JACKPOT', rtp: '96.8%', cover: 'assets/covers/slots.png' },
            { id: 'dice', name: 'Dice Over/Under', cat: 'originals', icon: '🎲', tag: 'POPULAR', rtp: '99.0%', cover: 'assets/covers/dice.png' },
            { id: 'wheel', name: 'Aztec Sun Wheel', cat: 'arcade', icon: '🎡', tag: '100X', rtp: '97.2%', cover: 'assets/covers/wheel.png' },
            { id: 'plinko', name: 'Plinko Board', cat: 'originals', icon: '⚪', tag: 'HIGH WIN', rtp: '98.0%', cover: 'assets/covers/plinko.png' },
            { id: 'mines', name: 'Mines 5x5 Field', cat: 'originals', icon: '💣', tag: 'HOT', rtp: '97.5%', cover: 'assets/covers/dice.png' },
            { id: 'limbo', name: 'Limbo Rocket', cat: 'originals', icon: '⚡', tag: 'FAST', rtp: '98.0%', cover: 'assets/covers/crash.png' },
            { id: 'keno', name: 'Keno 80-Ball', cat: 'arcade', icon: '🎱', tag: '10,000X', rtp: '95.0%', cover: 'assets/covers/roulette.png' },
            { id: 'bingo', name: 'Bingo 75-Ball', cat: 'arcade', icon: '🎫', tag: 'LINES', rtp: '96.2%', cover: 'assets/covers/wheel.png' },
            { id: 'blackjack', name: 'Blackjack 21', cat: 'card', icon: '🃏', tag: '3:2 PAYS', rtp: '99.5%', cover: 'assets/covers/card_game.png' },
            { id: 'poker', name: 'Video Poker', cat: 'card', icon: '♠️', tag: 'ROYAL', rtp: '98.5%', cover: 'assets/covers/card_game.png' },
            { id: 'baccarat', name: 'Baccarat Punto Banco', cat: 'table', icon: '👑', tag: 'VIP', rtp: '98.9%', cover: 'assets/covers/card_game.png' },
            { id: 'hilo', name: 'Hi-Lo Card Streak', cat: 'card', icon: '📈', tag: 'STREAK', rtp: '97.5%', cover: 'assets/covers/card_game.png' },
            { id: 'coinflip', name: '3D Coin Flip', cat: 'arcade', icon: '🪙', tag: 'INSTANT', rtp: '98.0%', cover: 'assets/covers/wheel.png' },
            { id: 'scratchcard', name: 'Scratch VIP', cat: 'arcade', icon: '🎟️', tag: '100X', rtp: '96.5%', cover: 'assets/covers/scratch.png' },
            { id: 'tower', name: 'Tower Climb', cat: 'originals', icon: '🗼', tag: 'SKILL', rtp: '97.0%', cover: 'assets/covers/dice.png' },
            { id: 'color_prediction', name: 'Color Prediction', cat: 'arcade', icon: '🎨', tag: '30s LIVE', rtp: '97.5%', cover: 'assets/covers/wheel.png' }
        ];
    }

    init() {
        this.renderGamesGrid(this.gamesList);
        this.setupEventListeners();
        this.updateWalletUI();
        this.initTicker();

        // Wallet listener
        window.wallet.on('balanceChange', () => this.updateWalletUI());
        window.wallet.on('change', () => this.updateWalletUI());
    }

    setupEventListeners() {
        // Currency Selector
        const currSelect = document.getElementById('header-currency-select');
        if (currSelect) {
            currSelect.value = window.wallet.getCurrency();
            currSelect.onchange = (e) => {
                window.wallet.setCurrency(e.target.value);
                this.updateWalletUI();
                this.showToast(`Switched currency to ${e.target.value}`, 'info');
            };
        }

        // Sound Toggle
        const soundBtn = document.getElementById('header-sound-btn');
        if (soundBtn) {
            soundBtn.onclick = () => {
                const muted = window.sound.toggleMute();
                soundBtn.innerText = muted ? '🔇' : '🔊';
                this.showToast(muted ? 'Sound Muted' : 'Sound Enabled', 'info');
            };
        }

        // Search
        const searchInput = document.getElementById('game-search-input');
        if (searchInput) {
            searchInput.oninput = (e) => {
                const q = e.target.value.toLowerCase().trim();
                const filtered = this.gamesList.filter(g => g.name.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q));
                this.renderGamesGrid(filtered);
            };
        }
    }

    filterCategory(cat) {
        document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        const el = document.getElementById(`cat-pill-${cat}`);
        if (el) el.classList.add('active');

        if (cat === 'all') {
            this.renderGamesGrid(this.gamesList);
        } else {
            const filtered = this.gamesList.filter(g => g.cat === cat);
            this.renderGamesGrid(filtered);
        }
        if (window.sound) window.sound.playClick();
    }

    renderGamesGrid(games) {
        const grid = document.getElementById('games-grid');
        if (!grid) return;

        if (games.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1 / -1; text-align:center; padding: 40px; color:#8e9bb0;">No games found matching your search.</div>';
            return;
        }

        grid.innerHTML = games.map(g => `
            <div class="game-card" onclick="window.app.openGame('${g.id}')">
                <div class="game-card-img-wrap">
                    <img src="${g.cover}" alt="${g.name}" onerror="this.src='assets/covers/slots.png'">
                    <span class="game-badge-hot">${g.tag}</span>
                    <span class="game-badge-rtp">${g.rtp}</span>
                </div>
                <div class="game-card-info">
                    <div class="game-card-title">${g.icon} ${g.name}</div>
                    <div class="game-card-category">
                        <span>${g.cat.toUpperCase()}</span>
                        <span class="game-play-tag">PLAY ▶</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openGame(gameId) {
        this.activeGame = gameId;
        const overlay = document.getElementById('game-arena-overlay');
        const arenaBody = document.getElementById('arena-body');
        const titleEl = document.getElementById('arena-game-title');

        const game = this.gamesList.find(g => g.id === gameId);
        if (titleEl && game) {
            titleEl.innerHTML = `${game.icon} ${game.name} <span style="font-size:11px; color:#00e700; background:rgba(0,231,0,0.15); padding:2px 8px; border-radius:12px; margin-left:8px;">${game.rtp} RTP</span>`;
        }

        // Hide all game containers, show target game container
        document.querySelectorAll('.game-view-container').forEach(c => c.style.display = 'none');
        const targetView = document.getElementById(`view-${gameId}`);
        if (targetView) targetView.style.display = 'block';

        if (overlay) overlay.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Initialize specific game engine
        if (gameId === 'crash' && window.crashGame) window.crashGame.init();
        if (gameId === 'roulette' && window.rouletteGame) window.rouletteGame.init();
        if (gameId === 'slots' && window.slotsGame) window.slotsGame.init();
        if (gameId === 'dice' && window.diceGame) window.diceGame.init();
        if (gameId === 'wheel' && window.wheelGame) window.wheelGame.init();
        if (gameId === 'plinko' && window.plinkoGame) window.plinkoGame.init();
        if (gameId === 'mines' && window.minesGame) window.minesGame.init();
        if (gameId === 'card_game' && window.cardGame) window.cardGame.init();
        if (gameId === 'blackjack' && window.blackjackGame) window.blackjackGame.init();
        if (gameId === 'baccarat' && window.baccaratGame) window.baccaratGame.init();
        if (gameId === 'poker' && window.pokerGame) window.pokerGame.init();
        if (gameId === 'hilo' && window.hiloGame) window.hiloGame.init();
        if (gameId === 'limbo' && window.limboGame) window.limboGame.init();
        if (gameId === 'keno' && window.kenoGame) window.kenoGame.init();
        if (gameId === 'bingo' && window.bingoGame) window.bingoGame.init();
        if (gameId === 'coinflip' && window.coinFlipGame) window.coinFlipGame.init();
        if (gameId === 'scratchcard' && window.scratchCardGame) window.scratchCardGame.init();
        if (gameId === 'tower' && window.towerGame) window.towerGame.init();
        if (gameId === 'color_prediction' && window.colorPredictionGame) window.colorPredictionGame.init();

        if (window.sound) window.sound.playClick();
    }

    closeGame() {
        this.activeGame = null;
        const overlay = document.getElementById('game-arena-overlay');
        if (overlay) overlay.classList.remove('active');
        if (window.sound) window.sound.playClick();
    }

    // Quick Bet Modifier
    modifyBet(inputId, action) {
        const input = document.getElementById(inputId);
        if (!input) return;
        let current = parseFloat(input.value) || 10;
        const maxBal = window.wallet.getBalance();

        if (action === 'half') current = Math.max(1, Math.floor(current / 2));
        else if (action === 'double') current = Math.min(maxBal, Math.floor(current * 2));
        else if (action === 'min') current = window.wallet.getCurrency() === 'PKR' ? 10 : 0.1;
        else if (action === 'max') current = Math.max(1, maxBal);

        input.value = current;
        if (window.sound) window.sound.playClick();
    }

    // UI Updates
    updateWalletUI() {
        const balEls = document.querySelectorAll('.wallet-balance-display');
        const formatted = window.wallet.formatAmount(window.wallet.getBalance());
        balEls.forEach(el => el.innerText = formatted);

        const vipObj = window.wallet.getVIPTier();
        const vipTag = document.getElementById('vip-tier-badge');
        if (vipTag) vipTag.innerText = vipObj.name;
    }

    // Modal Handlers
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            if (modalId === 'profile-modal') this.renderProfileModal();
            if (modalId === 'deposit-modal') this.setupDepositModal();
            if (modalId === 'withdraw-modal') this.setupWithdrawModal();
            if (window.sound) window.sound.playClick();
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
        if (window.sound) window.sound.playClick();
    }

    // Deposit Logic
    setupDepositModal() {
        this.selectedDepositMethod = 'EasyPaisa';
        this.selectDepositMethod('EasyPaisa');
    }

    selectDepositMethod(method) {
        this.selectedDepositMethod = method;
        document.querySelectorAll('.deposit-method-card').forEach(c => c.classList.remove('active'));
        const card = document.getElementById(`dep-method-${method}`);
        if (card) card.classList.add('active');

        const detailsBox = document.getElementById('deposit-account-details');
        if (!detailsBox) return;

        if (method === 'EasyPaisa') {
            detailsBox.innerHTML = `
                <div class="account-info-row"><span class="account-info-label">Account Title:</span><span class="account-info-val">Muhammad Ijaz</span></div>
                <div class="account-info-row"><span class="account-info-label">EasyPaisa Mobile:</span><span class="account-info-val">03246533046</span></div>
                <div class="account-info-row"><span class="account-info-label">Processing Time:</span><span class="account-info-val" style="color:#00e700;">Instant (0-60s)</span></div>
            `;
        } else if (method === 'JazzCash') {
            detailsBox.innerHTML = `
                <div class="account-info-row"><span class="account-info-label">Account Title:</span><span class="account-info-val">Muhammad Ijaz</span></div>
                <div class="account-info-row"><span class="account-info-label">JazzCash Mobile:</span><span class="account-info-val">03246533046</span></div>
                <div class="account-info-row"><span class="account-info-label">Processing Time:</span><span class="account-info-val" style="color:#00e700;">Instant (0-60s)</span></div>
            `;
        } else if (method === 'NayaPay' || method === 'Bank') {
            detailsBox.innerHTML = `
                <div class="account-info-row"><span class="account-info-label">Account Title:</span><span class="account-info-val">Muhammad Ijaz</span></div>
                <div class="account-info-row"><span class="account-info-label">NayaPay Mobile:</span><span class="account-info-val">03246533046</span></div>
                <div class="account-info-row"><span class="account-info-label">Processing Time:</span><span class="account-info-val" style="color:#00e700;">Instant (0-60s)</span></div>
            `;
        } else if (method === 'USDT') {
            detailsBox.innerHTML = `
                <div class="account-info-row"><span class="account-info-label">Network:</span><span class="account-info-val">TRC-20 (Tron)</span></div>
                <div class="account-info-row"><span class="account-info-label">USDT Address:</span><span class="account-info-val" style="font-size:11px;">TX8mF94KkLq42sPzx900AbCdEf112233</span></div>
                <div class="account-info-row"><span class="account-info-label">Minimum Deposit:</span><span class="account-info-val">$ 10.00</span></div>
            `;
        }
    }

    setDepositAmount(val) {
        const input = document.getElementById('deposit-amount-input');
        if (input) input.value = val;
    }

    submitDeposit() {
        const input = document.getElementById('deposit-amount-input');
        const senderInput = document.getElementById('deposit-sender-input');
        const trxInput = document.getElementById('deposit-trx-input');
        const btn = document.getElementById('deposit-submit-btn');

        const amount = parseFloat(input ? input.value : 0);
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid deposit amount', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Verifying Gateway Transaction...';
        }

        window.wallet.simulateDeposit(this.selectedDepositMethod, amount, senderInput ? senderInput.value : '', trxInput ? trxInput.value : '').then((txn) => {
            if (btn) {
                btn.disabled = false;
                btn.innerText = 'CONFIRM DEPOSIT';
            }
            this.closeModal('deposit-modal');
            this.showToast(`Deposit Approved! Added ${window.wallet.formatAmount(amount)} to your wallet!`, 'success');
        });
    }

    // Withdraw Logic
    setupWithdrawModal() {
        this.selectedWithdrawMethod = 'EasyPaisa';
    }

    submitWithdraw() {
        const methodSelect = document.getElementById('withdraw-method-select');
        const titleInput = document.getElementById('withdraw-title-input');
        const accountInput = document.getElementById('withdraw-account-input');
        const amountInput = document.getElementById('withdraw-amount-input');
        const pinInput = document.getElementById('withdraw-pin-input');
        const btn = document.getElementById('withdraw-submit-btn');

        const method = methodSelect ? methodSelect.value : 'EasyPaisa';
        const title = titleInput ? titleInput.value.trim() : '';
        const account = accountInput ? accountInput.value.trim() : '';
        const amount = parseFloat(amountInput ? amountInput.value : 0);
        const pin = pinInput ? pinInput.value.trim() : '1234';

        if (!title || !account) {
            this.showToast('Please fill in Account Title and Account Number', 'error');
            return;
        }
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid withdrawal amount', 'error');
            return;
        }

        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Submitting Request to Banking Channel...';
        }

        window.wallet.simulateWithdraw(method, amount, title, account, pin)
            .then((txn) => {
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'CONFIRM WITHDRAWAL';
                }
                this.closeModal('withdraw-modal');
                this.showToast(`Withdrawal Submitted! ${window.wallet.formatAmount(amount)} is being transferred to ${account}.`, 'success');
            })
            .catch((err) => {
                if (btn) {
                    btn.disabled = false;
                    btn.innerText = 'CONFIRM WITHDRAWAL';
                }
                this.showToast(err.message, 'error');
            });
    }

    // Daily Faucet Claim
    claimFaucet() {
        const res = window.wallet.claimFaucet();
        if (res.success) {
            this.showToast(res.message, 'success');
        } else {
            this.showToast(res.message, 'info');
        }
    }

    // Render Profile & Bet History Modal
    renderProfileModal() {
        const stats = window.wallet.getStats();
        const content = document.getElementById('profile-stats-content');
        if (!content) return;

        content.innerHTML = `
            <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-bottom:16px;">
                <div style="background:#12161f; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:11px; color:#8e9bb0;">Total Wagered</div>
                    <div style="font-size:16px; font-weight:800; color:#f5a623;">${stats.totalWagered}</div>
                </div>
                <div style="background:#12161f; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:11px; color:#8e9bb0;">Total Won</div>
                    <div style="font-size:16px; font-weight:800; color:#00e700;">${stats.totalWon}</div>
                </div>
                <div style="background:#12161f; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:11px; color:#8e9bb0;">Net Profit</div>
                    <div style="font-size:16px; font-weight:800; color:${stats.isProfitPositive ? '#00e700' : '#ff3b30'};">${stats.netProfit}</div>
                </div>
                <div style="background:#12161f; padding:12px; border-radius:10px; border:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:11px; color:#8e9bb0;">Total Bets / Win Rate</div>
                    <div style="font-size:16px; font-weight:800; color:#ffffff;">${stats.totalBets} (${stats.winRate})</div>
                </div>
            </div>

            <div style="background:#12161f; padding:14px; border-radius:10px; margin-bottom:16px; border:1px solid rgba(245,166,35,0.2);">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px;">
                    <span style="font-weight:700; color:#f5a623;">⭐ ${stats.vip.name}</span>
                    <span style="color:#8e9bb0;">Next: ${stats.vip.next} (${stats.vip.progress}%)</span>
                </div>
                <div style="width:100%; height:8px; background:#1e2532; border-radius:4px; overflow:hidden;">
                    <div style="width:${stats.vip.progress}%; height:100%; background:linear-gradient(90deg, #f5a623, #00e700);"></div>
                </div>
            </div>

            <div style="font-size:13px; font-weight:700; margin-bottom:8px;">Recent Bets & Transactions</div>
            <div style="max-height:220px; overflow-y:auto; display:flex; flex-direction:column; gap:6px;">
                ${window.wallet.state.betHistory.slice(0, 20).map(b => `
                    <div style="background:#12161f; padding:8px 12px; border-radius:6px; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                        <div>
                            <span style="font-weight:700; color:#ffffff;">${b.game}</span>
                            <span style="color:#8e9bb0; margin-left:6px;">${b.time}</span>
                        </div>
                        <div style="font-weight:800; color:${b.status === 'WIN' ? '#00e700' : (b.status === 'PUSH' ? '#f5a623' : '#ff3b30')};">
                            ${b.status === 'WIN' ? '+' : ''}${window.wallet.formatAmount(b.profit)} (${b.multiplier})
                        </div>
                    </div>
                `).join('') || '<div style="color:#8e9bb0; font-size:12px; text-align:center; padding:16px;">No bets recorded yet.</div>'}
            </div>
        `;
    }

    // Live Big Wins Ticker
    initTicker() {
        const track = document.getElementById('live-ticker-track');
        if (!track) return;

        const fakeUsers = ['Ali_Khan', 'Hamza_786', 'Zeeshan_K', 'Malik_VIP', 'CryptoKing', 'Tariq_M', 'Babar_Pro', 'Fatima_99', 'Usman_9', 'Rizwan_L'];
        const games = ['Crash', 'Roulette', 'Deluxe Slots', 'Dragon vs Tiger', 'Plinko', 'Mines', 'Tower', 'Color Prediction'];

        const generateItem = () => {
            const u = fakeUsers[Math.floor(Math.random() * fakeUsers.length)];
            const g = games[Math.floor(Math.random() * games.length)];
            const mult = (1.5 + Math.random() * 25).toFixed(2);
            const win = Math.floor(1000 + Math.random() * 85000);
            return `
                <div class="ticker-item">
                    <span class="ticker-user">👤 ${u}</span>
                    <span class="ticker-game">${g}</span>
                    <span class="ticker-win">+${window.wallet.formatAmount(win)}</span>
                    <span class="ticker-mult">${mult}x</span>
                </div>
            `;
        };

        let items = '';
        for (let i = 0; i < 20; i++) items += generateItem();
        track.innerHTML = items + items; // Duplicate for smooth continuous scroll
    }

    // Toast Notification System
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
}

window.app = new AppManager();
document.addEventListener('DOMContentLoaded', () => {
    window.app.init();
});
