/**
 * Bet With Net - Fortune Gems 2 (Official JILI #223 Aztec 4-Reel & Lucky Wheel Engine)
 * Direct In-Game Bet & Spin Connected to Website Real Wallet + MySQL Sync
 */

(function () {
  'use strict';

  // 1. SYMBOLS & PAYTABLE CONFIGURATION (5 Fixed Paylines, Line Bet = BaseBet / 5)
  const SYMBOLS = {
    WILD:     { id: 'WILD',     name: 'Garuda Wild', payout: 25, src: '../assets/games/fortunegems/sym_wild.png' },
    RUBY:     { id: 'RUBY',     name: 'Red Ruby',    payout: 20, src: '../assets/games/fortunegems/sym_ruby.png' },
    SAPPHIRE: { id: 'SAPPHIRE', name: 'Blue Gem',    payout: 15, src: '../assets/games/fortunegems/sym_sapphire.png' },
    EMERALD:  { id: 'EMERALD',  name: 'Green Gem',   payout: 10, src: '../assets/games/fortunegems/sym_emerald.png' },
    A:        { id: 'A',        name: 'Royal A',     payout: 8,  src: '../assets/games/fortunegems/sym_a.png' },
    K:        { id: 'K',        name: 'Royal K',     payout: 6,  src: '../assets/games/fortunegems/sym_k.png' },
    Q:        { id: 'Q',        name: 'Royal Q',     payout: 4,  src: '../assets/games/fortunegems/sym_q.png' },
    J:        { id: 'J',        name: 'Royal J',     payout: 2.5, src: '../assets/games/fortunegems/sym_j.png' }
  };

  // Weighted reel strips for authentic hit frequency (~42% win rate)
  const MAIN_KEYS = [
    'WILD',
    'RUBY', 'RUBY',
    'SAPPHIRE', 'SAPPHIRE',
    'EMERALD', 'EMERALD', 'EMERALD',
    'A', 'A', 'A',
    'K', 'K', 'K', 'K',
    'Q', 'Q', 'Q', 'Q',
    'J', 'J', 'J', 'J', 'J'
  ];

  const MULTIPLIERS = [
    { id: '1X',    mult: 1,  weight: 34, src: '../assets/games/fortunegems/multiplier_1x.svg' },
    { id: '2X',    mult: 2,  weight: 28, src: '../assets/games/fortunegems/multiplier_2x.svg' },
    { id: '3X',    mult: 3,  weight: 16, src: '../assets/games/fortunegems/multiplier_3x.svg' },
    { id: '5X',    mult: 5,  weight: 9,  src: '../assets/games/fortunegems/multiplier_5x.svg' },
    { id: '10X',   mult: 10, weight: 5,  src: '../assets/games/fortunegems/multiplier_10x.svg' },
    { id: '15X',   mult: 15, weight: 3,  src: '../assets/games/fortunegems/multiplier_15x.svg' },
    { id: 'WHEEL', mult: 1,  weight: 5,  isWheel: true, src: '../assets/games/fortunegems/sym_wheel.png' }
  ];

  const PAYLINES = [
    { id: 1, coords: [[1,0], [1,1], [1,2]], color: '#ffd700' }, // Middle row
    { id: 2, coords: [[0,0], [0,1], [0,2]], color: '#00e5ff' }, // Top row
    { id: 3, coords: [[2,0], [2,1], [2,2]], color: '#ff1744' }, // Bottom row
    { id: 4, coords: [[0,0], [1,1], [2,2]], color: '#00e676' }, // Diagonal TL-BR
    { id: 5, coords: [[2,0], [1,1], [0,2]], color: '#d500f9' }  // Diagonal BL-TR
  ];

  const BET_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

  // 2. GAME STATE
  let baseBet = 50;
  let isExtraBet = false;
  let isTurbo = false;
  let isAuto = false;
  let autoCount = 0;
  let isSpinning = false;
  let soundEnabled = true;

  let currentGrid = [
    ['RUBY', 'WILD', 'SAPPHIRE'],
    ['EMERALD', 'WILD', 'EMERALD'],
    ['A', 'K', 'RUBY']
  ];
  let currentSpecial = MULTIPLIERS[1]; // default 2X

  // DOM References
  let userBalanceEl, topWalletBalanceEl, betAmountEl, baseBetDisplayEl, lastWinAmountEl;
  let spinButtonEl, extraBetToggleEl, turboToggleEl, autoSpinToggleEl, autoBtnTextEl, muteIconEl;
  let floatingDeltaEl, laserCanvas, loadingScreen, progressBar, progressText;
  let audioSpin, audioStop, audioWin, audioJackpot, audioCoins, audioChip, audioWheelSpin, audioWheelTick, audioBgm;

  function bindElements() {
    userBalanceEl = document.getElementById('userBalance');
    topWalletBalanceEl = document.getElementById('topWalletBalance');
    betAmountEl = document.getElementById('betAmount');
    baseBetDisplayEl = document.getElementById('baseBetDisplay');
    lastWinAmountEl = document.getElementById('lastWinAmount');
    spinButtonEl = document.getElementById('spinButton');
    extraBetToggleEl = document.getElementById('extraBetToggle');
    turboToggleEl = document.getElementById('turboToggle');
    autoSpinToggleEl = document.getElementById('autoSpinToggle');
    autoBtnTextEl = document.getElementById('autoBtnText');
    muteIconEl = document.getElementById('muteIcon');
    floatingDeltaEl = document.getElementById('floatingDelta');
    laserCanvas = document.getElementById('laserCanvas');
    loadingScreen = document.getElementById('jiliLoadingScreen');
    progressBar = document.getElementById('jiliProgressBar');
    progressText = document.getElementById('jiliProgressText');

    audioSpin = document.getElementById('audioSpin');
    audioStop = document.getElementById('audioStop');
    audioWin = document.getElementById('audioWin');
    audioJackpot = document.getElementById('audioJackpot');
    audioCoins = document.getElementById('audioCoins');
    audioChip = document.getElementById('audioChip');
    audioWheelSpin = document.getElementById('audioWheelSpin');
    audioWheelTick = document.getElementById('audioWheelTick');
    audioBgm = document.getElementById('audioBgm');
  }

  function playSound(el) {
    if (!soundEnabled || !el) return;
    try {
      el.currentTime = 0;
      el.play().catch(() => {});
    } catch (e) {}
  }

  function ensureBgmPlaying() {
    if (!soundEnabled || !audioBgm) return;
    if (audioBgm.paused) {
      audioBgm.volume = 0.32;
      audioBgm.play().catch(() => {});
    }
  }

  // 3. INITIALIZATION
  window.addEventListener('DOMContentLoaded', () => {
    bindElements();
    initLoader();
    initGrid();
    syncWalletFromServer();
    syncUI();
    initLaserCanvas();
    initCoinRain();

    // Unlock audio on first interaction
    ['click', 'touchstart'].forEach(ev => {
      document.addEventListener(ev, ensureBgmPlaying, { once: true, passive: true });
    });

    // Periodic wallet sync
    setInterval(syncWallet, 2500);
  });

  function initLoader() {
    if (!loadingScreen) return;
    let progress = 0;
    const dismiss = () => {
      if (!loadingScreen || loadingScreen.classList.contains('fade-out')) return;
      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.innerText = '100%';
      loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        if (loadingScreen) loadingScreen.style.display = 'none';
      }, 550);
    };

    loadingScreen.addEventListener('click', dismiss, { once: true });
    loadingScreen.addEventListener('touchstart', dismiss, { once: true, passive: true });

    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 14) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(dismiss, 220);
      }
      if (progressBar) progressBar.style.width = progress + '%';
      if (progressText) progressText.innerText = progress + '%';
    }, 75);
  }

  // 4. REAL WALLET INTEGRATION
  function getActiveBalance() {
    try {
      if (window.wallet && window.wallet.state && window.wallet.state.balancePKR !== undefined) {
        return parseFloat(window.wallet.state.balancePKR) || 0;
      }
      if (typeof window.getRealWalletBalance === 'function') {
        const b = window.getRealWalletBalance();
        if (!isNaN(b) && b >= 0) return b;
      }
      const sess = localStorage.getItem('bwn_session_user');
      if (sess) {
        const u = JSON.parse(sess);
        if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
          const val = parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
          if (!isNaN(val)) return val;
        }
      }
    } catch (e) {}
    return 0.00;
  }

  async function syncWalletFromServer() {
    try {
      const sess = localStorage.getItem('bwn_session_user');
      if (!sess) return;
      const u = JSON.parse(sess);
      if (!u || !u.id) return;
      const res = await fetch(`/api/wallet.php?action=balance&user_id=${encodeURIComponent(u.id)}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data && json.data.balance_pkr !== undefined) {
          const balPkr = parseFloat(json.data.balance_pkr) || 0;
          if (window.wallet && typeof window.wallet.setBalancePKR === 'function') {
            window.wallet.setBalancePKR(balPkr);
          }
          syncWallet();
        }
      }
    } catch (e) {}
  }

  function formatMoney(amount) {
    return Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function syncWallet() {
    const bal = getActiveBalance();
    const str = 'PKR ' + formatMoney(bal);
    if (userBalanceEl) userBalanceEl.innerText = str;
    if (topWalletBalanceEl) topWalletBalanceEl.innerText = formatMoney(bal);
  }
  window.refreshWalletBalance = function () {
    syncWalletFromServer();
    syncWallet();
  };

  function showFloatingDelta(amount, type) {
    if (!floatingDeltaEl) return;
    floatingDeltaEl.innerText = (type === 'deduct' ? '-' : '+') + 'PKR ' + formatMoney(amount);
    floatingDeltaEl.className = 'wallet-floating-delta ' + type;
    setTimeout(() => {
      if (floatingDeltaEl) floatingDeltaEl.className = 'wallet-floating-delta';
    }, 1300);
  }

  function getEffectiveBet() {
    return isExtraBet ? Math.round(baseBet * 1.5) : baseBet;
  }

  function syncUI() {
    syncWallet();
    const cost = getEffectiveBet();
    if (betAmountEl) betAmountEl.innerText = 'PKR ' + formatMoney(cost);
    if (baseBetDisplayEl) baseBetDisplayEl.innerText = 'PKR ' + cost.toLocaleString();
  }

  // 5. IN-GAME BET CONTROLS
  window.adjustBet = function (delta) {
    if (isSpinning) return;
    ensureBgmPlaying();
    playSound(audioChip);
    let idx = BET_STEPS.indexOf(baseBet);
    if (idx === -1) idx = 2;
    idx = Math.max(0, Math.min(BET_STEPS.length - 1, idx + delta));
    baseBet = BET_STEPS[idx];
    syncUI();
  };

  window.toggleExtraBet = function () {
    if (isSpinning) return;
    ensureBgmPlaying();
    playSound(audioChip);
    isExtraBet = !isExtraBet;
    if (extraBetToggleEl) extraBetToggleEl.classList.toggle('active', isExtraBet);
    syncUI();
  };

  window.toggleTurbo = function () {
    ensureBgmPlaying();
    playSound(audioChip);
    isTurbo = !isTurbo;
    if (turboToggleEl) turboToggleEl.classList.toggle('active', isTurbo);
  };

  window.toggleAutoSpin = function () {
    ensureBgmPlaying();
    if (isAuto) {
      stopAuto();
    } else {
      isAuto = true;
      autoCount = 25;
      if (autoSpinToggleEl) autoSpinToggleEl.classList.add('active');
      if (autoBtnTextEl) autoBtnTextEl.innerText = `STOP (${autoCount})`;
      if (!isSpinning) window.executeSpin();
    }
  };

  function stopAuto() {
    isAuto = false;
    autoCount = 0;
    if (autoSpinToggleEl) autoSpinToggleEl.classList.remove('active');
    if (autoBtnTextEl) autoBtnTextEl.innerText = 'AUTO';
  }

  window.toggleMute = function () {
    soundEnabled = !soundEnabled;
    if (muteIconEl) muteIconEl.innerText = soundEnabled ? '🔊' : '🔇';
    if (audioBgm) {
      if (soundEnabled) {
        audioBgm.play().catch(() => {});
      } else {
        audioBgm.pause();
      }
    }
  };

  // 6. INITIAL GRID SETUP
  function initGrid() {
    for (let r = 0; r < 3; r++) {
      populateReelTape(r, [currentGrid[0][r], currentGrid[1][r], currentGrid[2][r]], false);
    }
    populateReelTape(3, [MULTIPLIERS[0], currentSpecial, MULTIPLIERS[2]], true);
    syncUI();
  }

  function populateReelTape(reelIdx, syms, isSpecial = false) {
    const tape = document.getElementById(`tape${reelIdx}`);
    if (!tape) return;
    tape.innerHTML = '';
    syms.forEach((sym, row) => {
      const cell = document.createElement('div');
      cell.className = 'symbol-cell';
      cell.id = `cell_${row}_${reelIdx}`;
      const symObj = isSpecial ? sym : (SYMBOLS[sym] || SYMBOLS.RUBY);
      const src = symObj.src;
      const alt = isSpecial ? symObj.id : sym;
      cell.innerHTML = `<img src="${src}" alt="${alt}" draggable="false">`;
      tape.appendChild(cell);
    });
  }

  function getRandomMainSym() {
    return MAIN_KEYS[Math.floor(Math.random() * MAIN_KEYS.length)];
  }

  function getRandomSpecial() {
    // If Extra Bet active, 1X is eliminated from Reel 4, boosting high payouts & wheel chance!
    const pool = isExtraBet ? MULTIPLIERS.filter(m => m.id !== '1X') : MULTIPLIERS;
    const totalWeight = pool.reduce((sum, m) => sum + (m.weight || 10), 0);
    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      r -= (pool[i].weight || 10);
      if (r <= 0) return pool[i];
    }
    return pool[0];
  }

  // 7. IN-GAME SPIN BUTTON EXECUTION (Connected to Real Wallet)
  window.executeSpin = async function () {
    if (isSpinning) return;
    ensureBgmPlaying();

    const cost = getEffectiveBet();
    const currentBal = getActiveBalance();

    // Verify Wallet Balance
    if (currentBal < cost) {
      stopAuto();
      if (window.core && typeof window.core.showToast === 'function') {
        window.core.showToast(`Balance kam hai! Available: PKR ${formatMoney(currentBal)} (Required: PKR ${formatMoney(cost)})`, 'error');
      } else {
        alert(`⚠️ Balance kam hai!\nAap ka balance: PKR ${formatMoney(currentBal)}\nIs spin ke liye PKR ${formatMoney(cost)} darkar hain.`);
      }
      return;
    }

    // Deduct Bet from Website Real Wallet (in PKR)
    let betSuccess = false;
    if (window.wallet && typeof window.wallet.placeBet === 'function') {
      const prevCurr = window.wallet.getCurrency();
      if (prevCurr !== 'PKR') window.wallet.setCurrency('PKR');
      betSuccess = window.wallet.placeBet(cost, 'Fortune Gems 2');
    } else if (typeof window.placeBet === 'function') {
      betSuccess = window.placeBet(cost);
    } else {
      const newBal = Math.max(0, currentBal - cost);
      localStorage.setItem('BETWITHNET_balance', newBal.toString());
      betSuccess = true;
    }

    if (!betSuccess) {
      stopAuto();
      return;
    }

    // Wallet Deducted Successfully!
    isSpinning = true;
    syncWallet();
    showFloatingDelta(cost, 'deduct');
    if (lastWinAmountEl) lastWinAmountEl.innerText = 'PKR 0.00';
    if (spinButtonEl) spinButtonEl.classList.add('spinning');
    clearWinHighlights();
    playSound(audioSpin);

    // 1. Generate Target Reel Outcomes
    const nextGrid = [
      [getRandomMainSym(), getRandomMainSym(), getRandomMainSym()],
      [getRandomMainSym(), getRandomMainSym(), getRandomMainSym()],
      [getRandomMainSym(), getRandomMainSym(), getRandomMainSym()]
    ];

    // Balanced 30% win / 70% loss hit chance
    if (Math.random() < 0.30) {
      const winLine = PAYLINES[Math.floor(Math.random() * PAYLINES.length)];
      const symPool = ['J', 'J', 'Q', 'Q', 'K', 'K', 'A', 'EMERALD', 'SAPPHIRE', 'RUBY', 'WILD'];
      const chosenSym = symPool[Math.floor(Math.random() * symPool.length)];
      winLine.coords.forEach(([row, col]) => {
        nextGrid[row][col] = (Math.random() < 0.22) ? 'WILD' : chosenSym;
      });
    }

    const nextSpecial = getRandomSpecial();

    // 2. Animate Reels with Authentic Rolling Physics
    const promises = [
      spinTapeWithPhysics(0, [nextGrid[0][0], nextGrid[1][0], nextGrid[2][0]], false, isTurbo ? 260 : 560),
      spinTapeWithPhysics(1, [nextGrid[0][1], nextGrid[1][1], nextGrid[2][1]], false, isTurbo ? 360 : 740),
      spinTapeWithPhysics(2, [nextGrid[0][2], nextGrid[1][2], nextGrid[2][2]], false, isTurbo ? 460 : 920),
      spinTapeWithPhysics(3, [getRandomSpecial(), nextSpecial, getRandomSpecial()], true, isTurbo ? 560 : 1120)
    ];

    await Promise.all(promises);

    currentGrid = nextGrid;
    currentSpecial = nextSpecial;
    if (spinButtonEl) spinButtonEl.classList.remove('spinning');

    // 3. Evaluate Paylines and Win Payout
    await evaluatePayout(cost);

    isSpinning = false;

    // Auto Spin Continuation
    if (isAuto && autoCount > 0) {
      autoCount--;
      if (autoBtnTextEl) autoBtnTextEl.innerText = `STOP (${autoCount})`;
      if (autoCount <= 0) {
        stopAuto();
      } else {
        setTimeout(() => {
          if (isAuto && !isSpinning) window.executeSpin();
        }, isTurbo ? 280 : 650);
      }
    }
  };

  function spinTapeWithPhysics(reelIdx, finalSyms, isSpecial, duration) {
    return new Promise(resolve => {
      const tape = document.getElementById(`tape${reelIdx}`);
      if (!tape) return resolve();

      const firstCell = tape.querySelector('.symbol-cell');
      const cellH = (firstCell && firstCell.offsetHeight > 20)
        ? firstCell.offsetHeight
        : (window.innerWidth < 600 ? 80 : 110);

      const dummyCount = isTurbo ? 6 : 12;
      const tapeList = [];

      // Keep current 3 symbols at top so motion starts seamlessly
      for (let r = 0; r < 3; r++) {
        if (isSpecial) {
          tapeList.push(r === 1 ? currentSpecial : MULTIPLIERS[r % 3]);
        } else {
          tapeList.push(currentGrid[r][reelIdx]);
        }
      }

      for (let i = 0; i < dummyCount - 3; i++) {
        tapeList.push(isSpecial ? getRandomSpecial() : getRandomMainSym());
      }
      finalSyms.forEach(s => tapeList.push(s));

      tape.innerHTML = '';
      tape.style.transition = 'none';
      tape.style.transform = 'translateY(0px)';

      tapeList.forEach((sym, idx) => {
        const cell = document.createElement('div');
        cell.className = 'symbol-cell';
        if (idx >= tapeList.length - 3) {
          cell.id = `cell_${idx - (tapeList.length - 3)}_${reelIdx}`;
        }
        const symObj = isSpecial ? sym : (SYMBOLS[sym] || SYMBOLS.RUBY);
        const src = symObj.src;
        const alt = isSpecial ? symObj.id : sym;
        cell.innerHTML = `<img src="${src}" alt="${alt}" draggable="false">`;
        tape.appendChild(cell);
      });

      // Force layout reflow before starting CSS transition
      void tape.offsetHeight;

      const totalScrollCells = tapeList.length - 3;
      const targetY = -(totalScrollCells * cellH);

      tape.style.transition = `transform ${duration}ms cubic-bezier(0.15, 0.85, 0.25, 1.03)`;
      tape.style.transform = `translateY(${targetY}px)`;

      setTimeout(() => {
        playSound(audioStop);
        tape.style.transition = 'none';
        tape.style.transform = 'translateY(0px)';
        populateReelTape(reelIdx, finalSyms, isSpecial);
        resolve();
      }, duration);
    });
  }

  // 8. PAYLINE EVALUATION & WALLET CREDIT
  async function evaluatePayout(cost) {
    let totalWin = 0;
    const hits = [];
    const lineBet = baseBet / 5; // 5 fixed paylines

    // Check 5 fixed paylines
    PAYLINES.forEach(line => {
      const s0 = currentGrid[line.coords[0][0]][line.coords[0][1]];
      const s1 = currentGrid[line.coords[1][0]][line.coords[1][1]];
      const s2 = currentGrid[line.coords[2][0]][line.coords[2][1]];

      const match = checkLineMatch(s0, s1, s2);
      if (match && SYMBOLS[match]) {
        hits.push({ line, symbol: match, payout: Math.round(SYMBOLS[match].payout * lineBet) });
      }
    });

    // Highlight Reel 4 Center Multiplier / Wheel Cell
    const specialCenterCell = document.getElementById('cell_1_3');
    if (specialCenterCell) specialCenterCell.classList.add('win-hit');

    // Check if Center Position of Reel 4 hit the Giant Lucky Wheel!
    if (currentSpecial && currentSpecial.isWheel) {
      playSound(audioJackpot);
      await triggerLuckyWheel(cost, hits);
      return;
    }

    const mult = (currentSpecial && currentSpecial.mult) ? currentSpecial.mult : 1;

    if (hits.length > 0) {
      drawPaylines(hits);

      hits.forEach(h => {
        totalWin += h.payout * mult;
        h.line.coords.forEach(([r, c]) => {
          const el = document.getElementById(`cell_${r}_${c}`);
          if (el) el.classList.add('win-hit');
        });
      });

      totalWin = Math.round(totalWin);
      const effectiveMult = parseFloat((totalWin / cost).toFixed(2));

      // Credit Win to Bet With Net Real Wallet
      creditPlayerWin(cost, totalWin, effectiveMult);

      // Update UI & Float Win Amount
      syncWallet();
      showFloatingDelta(totalWin, 'credit');
      if (lastWinAmountEl) lastWinAmountEl.innerText = 'PKR ' + formatMoney(totalWin);

      if (totalWin >= cost * 8) {
        playSound(audioJackpot);
        playSound(audioCoins);
        emitCoins(80);
        showBigWinModal(totalWin, mult);
      } else {
        playSound(audioWin);
        emitCoins(25);
      }
    } else {
      // Record loss in wallet history
      if (window.wallet && typeof window.wallet.recordLoss === 'function') {
        window.wallet.recordLoss(cost, 'Fortune Gems 2');
      }
    }
  }

  function creditPlayerWin(cost, totalWin, mult) {
    if (window.wallet && typeof window.wallet.creditWin === 'function') {
      window.wallet.creditWin(cost, totalWin, 'Fortune Gems 2', mult);
    } else if (typeof window.winBet === 'function') {
      window.winBet(cost, totalWin / cost);
    } else {
      const cur = getActiveBalance();
      localStorage.setItem('BETWITHNET_balance', (cur + totalWin).toString());
    }
  }

  function checkLineMatch(s0, s1, s2) {
    const naturals = [s0, s1, s2].filter(s => s !== 'WILD');
    if (naturals.length === 0) return 'WILD';
    const target = naturals[0];
    const ok = [s0, s1, s2].every(s => s === 'WILD' || s === target);
    return ok ? target : null;
  }

  function clearWinHighlights() {
    document.querySelectorAll('.symbol-cell').forEach(c => c.classList.remove('win-hit'));
    clearPaylineCanvas();
  }

  // 9. LASER PAYLINE CANVAS
  let lCtx = null;
  function initLaserCanvas() {
    if (!laserCanvas) return;
    lCtx = laserCanvas.getContext('2d');
    resizeLaserCanvas();
    window.addEventListener('resize', resizeLaserCanvas);
  }

  function resizeLaserCanvas() {
    if (!laserCanvas) return;
    laserCanvas.width = laserCanvas.offsetWidth;
    laserCanvas.height = laserCanvas.offsetHeight;
  }

  function clearPaylineCanvas() {
    if (!lCtx || !laserCanvas) return;
    lCtx.clearRect(0, 0, laserCanvas.width, laserCanvas.height);
  }

  function drawPaylines(hits) {
    if (!lCtx || !laserCanvas) return;
    resizeLaserCanvas();
    clearPaylineCanvas();

    hits.forEach(h => {
      lCtx.save();
      lCtx.strokeStyle = h.line.color;
      lCtx.lineWidth = 4;
      lCtx.lineCap = 'round';
      lCtx.lineJoin = 'round';
      lCtx.shadowColor = h.line.color;
      lCtx.shadowBlur = 12;
      lCtx.beginPath();

      h.line.coords.forEach(([r, c], idx) => {
        const el = document.getElementById(`cell_${r}_${c}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const parentRect = laserCanvas.getBoundingClientRect();
          const x = rect.left - parentRect.left + rect.width / 2;
          const y = rect.top - parentRect.top + rect.height / 2;
          if (idx === 0) lCtx.moveTo(x, y);
          else lCtx.lineTo(x, y);
        }
      });

      lCtx.stroke();
      lCtx.restore();
    });
  }

  // 10. AZTEC SUN STONE LUCKY WHEEL BONUS
  function triggerLuckyWheel(cost, lineHits) {
    return new Promise(resolve => {
      const modal = document.getElementById('wheelModal');
      if (modal) modal.classList.add('show');
      window._wheelContext = { cost, lineHits, resolve };
    });
  }

  window.spinBonusWheel = function () {
    const btn = document.getElementById('wheelSpinBtn');
    const disc = document.getElementById('wheelDisc');
    if (btn) btn.disabled = true;
    playSound(audioWheelSpin);

    const prizes = [5, 10, 15, 20, 30, 50, 100, 200];
    const weights = [30, 25, 18, 12, 7, 4, 3, 1];
    let r = Math.random() * 100;
    let chosen = 10;
    for (let i = 0; i < prizes.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        chosen = prizes[i];
        break;
      }
    }

    const rot = 1800 + Math.floor(Math.random() * 360);

    if (disc) {
      disc.style.transition = 'transform 3.6s cubic-bezier(0.15, 0.9, 0.25, 1)';
      disc.style.transform = `rotate(${rot}deg)`;
    }

    setTimeout(() => {
      const ctx = window._wheelContext || { cost: getEffectiveBet(), lineHits: [] };
      const cost = ctx.cost || getEffectiveBet();
      let lineWin = 0;
      if (ctx.lineHits && ctx.lineHits.length > 0) {
        ctx.lineHits.forEach(h => { lineWin += h.payout; });
      }
      const win = Math.round((cost * chosen) + lineWin);

      creditPlayerWin(cost, win, chosen);

      syncWallet();
      showFloatingDelta(win, 'credit');
      if (lastWinAmountEl) lastWinAmountEl.innerText = 'PKR ' + formatMoney(win);

      const modal = document.getElementById('wheelModal');
      if (modal) modal.classList.remove('show');
      if (btn) btn.disabled = false;
      if (disc) {
        disc.style.transition = 'none';
        disc.style.transform = 'rotate(0deg)';
      }

      playSound(audioJackpot);
      playSound(audioCoins);
      emitCoins(110);
      showBigWinModal(win, chosen);

      if (ctx.resolve) ctx.resolve();
    }, 3900);
  };

  // 11. BIG WIN CELEBRATION MODAL
  function showBigWinModal(amount, mult) {
    const m = document.getElementById('bigWinModal');
    const amtEl = document.getElementById('bigWinAmount');
    const multEl = document.getElementById('bigWinMult');
    const titleEl = document.getElementById('bigWinTitle');

    if (amtEl) amtEl.innerText = 'PKR ' + formatMoney(amount);
    if (multEl) multEl.innerText = mult + 'X MULTIPLIER';
    if (titleEl) {
      if (mult >= 50) titleEl.innerText = '⚡ MEGA JACKPOT WIN! ⚡';
      else if (mult >= 15) titleEl.innerText = '👑 SUPER AZTEC WIN! 👑';
      else titleEl.innerText = '🎉 FORTUNE GEMS BIG WIN! 🎉';
    }

    if (m) m.classList.add('show');
  }

  window.closeBigWin = function () {
    const m = document.getElementById('bigWinModal');
    if (m) m.classList.remove('show');
  };

  // 12. 3D GOLD COIN RAIN ENGINE
  let cCtx = null;
  let cW = 0, cH = 0;
  const coins = [];

  function initCoinRain() {
    const coinCanvas = document.getElementById('coinRainCanvas');
    if (!coinCanvas) return;
    cCtx = coinCanvas.getContext('2d');
    cW = coinCanvas.width = window.innerWidth;
    cH = coinCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      cW = coinCanvas.width = window.innerWidth;
      cH = coinCanvas.height = window.innerHeight;
    });

    requestAnimationFrame(coinRainLoop);
  }

  function emitCoins(count = 60) {
    for (let i = 0; i < count; i++) {
      coins.push({
        x: Math.random() * cW,
        y: -30 - Math.random() * 200,
        size: 11 + Math.random() * 9,
        vy: 4 + Math.random() * 6,
        vx: (Math.random() - 0.5) * 3,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.22
      });
    }
  }

  function coinRainLoop() {
    if (!cCtx) return;
    cCtx.clearRect(0, 0, cW, cH);
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.y += c.vy;
      c.x += c.vx;
      c.rot += c.vrot;
      const sy = Math.cos(c.rot);

      cCtx.save();
      cCtx.translate(c.x, c.y);
      cCtx.scale(1, Math.max(0.15, Math.abs(sy)));
      cCtx.beginPath();
      cCtx.arc(0, 0, c.size, 0, Math.PI * 2);
      cCtx.fillStyle = '#ffd700';
      cCtx.fill();
      cCtx.lineWidth = 2;
      cCtx.strokeStyle = '#b8860b';
      cCtx.stroke();
      cCtx.restore();

      if (c.y > cH + 50) coins.splice(i, 1);
    }
    requestAnimationFrame(coinRainLoop);
  }

  // 13. GLOBAL NAVIGATION
  window.goBack = function () {
    if (document.referrer && document.referrer.includes('betwithnet')) {
      window.history.back();
    } else {
      window.location.href = '../index.html';
    }
  };

  window.openDeposit = function () {
    window.location.href = '../deposit.html?v=2.7';
  };

  window.toggleFullscreen = function () {
    const elem = document.documentElement;
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
      else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
  };

})();
