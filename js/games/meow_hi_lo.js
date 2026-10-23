/**
 * Meow Hi-Lo Game Engine
 * Authentic Funky Games replica for Bet With Net
 */

(function () {
  'use strict';

  // --- Sound & Voice Synthesizer & BGM Engine ---
  const AudioEngine = {
    ctx: null,
    enabled: true,
    bgm: null,
    bgmPlaying: false,

    init() {
      try {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      } catch (e) {}

      if (!this.bgm) {
        this.bgm = document.getElementById('bgmAudio') || new Audio('../assets/games/meow_hi_lo/hilo_bgm.mp3');
        this.bgm.loop = true;
        this.bgm.volume = 0.35;
      }
    },

    startBgm() {
      if (!this.enabled) return;
      this.init();
      if (this.bgm) {
        try {
          const promise = this.bgm.play();
          if (promise !== undefined) {
            promise.then(() => {
              this.bgmPlaying = true;
            }).catch(() => {
              this.bgmPlaying = false;
            });
          }
        } catch (e) {}
      }
    },

    stopBgm() {
      if (this.bgm) {
        this.bgm.pause();
        this.bgmPlaying = false;
      }
    },

    toggle() {
      this.enabled = !this.enabled;
      if (this.enabled) {
        this.startBgm();
      } else {
        this.stopBgm();
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      }
      return this.enabled;
    },

    autoUnlock() {
      this.init();
      this.startBgm();

      const unlockEvents = ['mousemove', 'pointermove', 'touchstart', 'touchend', 'pointerdown', 'wheel', 'scroll', 'keydown', 'click'];
      const triggerUnlock = () => {
        this.startBgm();
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (this.bgm && !this.bgm.paused) {
          unlockEvents.forEach(evt => window.removeEventListener(evt, triggerUnlock, { passive: true }));
        }
      };

      unlockEvents.forEach(evt => {
        window.addEventListener(evt, triggerUnlock, { passive: true, once: false });
      });
    },

    speak(text, pitch = 1.3, rate = 1.15) {
      if (!this.enabled) return;
      if (!('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = pitch;
        utter.rate = rate;
        utter.volume = 0.95;

        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => 
          (v.name.toLowerCase().includes('female') || 
           v.name.toLowerCase().includes('zira') || 
           v.name.toLowerCase().includes('natural') || 
           v.name.toLowerCase().includes('google') ||
           v.name.toLowerCase().includes('samantha')) && 
          v.lang.startsWith('en')
        ) || voices.find(v => v.lang.startsWith('en'));
        if (preferred) utter.voice = preferred;

        window.speechSynthesis.speak(utter);
      } catch (e) {}
    },

    playClick() {
      if (!this.enabled) return;
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    },

    playCardFlip() {
      if (!this.enabled) return;
      this.init();
      // White noise burst for card snap
      const bufferSize = this.ctx.sampleRate * 0.08;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1400;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start();
    },

    playMeow(isHappy = true) {
      if (!this.enabled) return;
      this.init();
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      if (isHappy) {
        // High pitch rising-falling meow: ~700 -> 1100 -> 800
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(1150, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else {
        // Sad droop meow: ~600 -> 350
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.31);
      }
    },

    playWinCoin() {
      if (!this.enabled) return;
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.26);
      });
    }
  };

  // --- Deck & Card Mechanics ---
  const SUITS = [
    { name: 'hearts', symbol: '♥', color: 'red' },
    { name: 'diamonds', symbol: '♦', color: 'red' },
    { name: 'clubs', symbol: '♣', color: 'black' },
    { name: 'spades', symbol: '♠', color: 'black' }
  ];

  const RANKS = [
    { value: 1, label: 'A' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
    { value: 11, label: 'J' },
    { value: 12, label: 'Q' },
    { value: 13, label: 'K' }
  ];

  function createFullDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          suit: suit.name,
          symbol: suit.symbol,
          color: suit.color,
          value: rank.value,
          label: rank.label
        });
      }
    }
    return shuffle(deck);
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // --- JILI Loading Screen Controller ---
  const LoadingScreen = {
    progress: 0,
    interval: null,

    start() {
      const bar = document.getElementById('jiliProgressBar');
      const text = document.getElementById('jiliProgressText');
      const status = document.getElementById('jiliStatusText');
      const screen = document.getElementById('jiliLoadingScreen');

      if (!screen) return;

      const steps = [
        { pct: 25, status: 'Connecting to JILI Server...' },
        { pct: 55, status: 'Verifying RNG Certificate...' },
        { pct: 85, status: 'Loading Game Assets...' },
        { pct: 100, status: 'Game Ready!' }
      ];

      let stepIdx = 0;
      this.interval = setInterval(() => {
        this.progress += Math.floor(Math.random() * 8) + 5;
        if (this.progress > 100) this.progress = 100;

        if (bar) bar.style.width = this.progress + '%';
        if (text) text.textContent = this.progress + '%';

        if (stepIdx < steps.length && this.progress >= steps[stepIdx].pct) {
          if (status) status.textContent = steps[stepIdx].status;
          stepIdx++;
        }

        // Auto trigger BGM playback while loading
        if (this.progress > 15 && !AudioEngine.bgmPlaying) {
          AudioEngine.startBgm();
        }

        if (this.progress >= 100) {
          clearInterval(this.interval);
          AudioEngine.startBgm();
          setTimeout(() => {
            screen.classList.add('fade-out');
            setTimeout(() => {
              screen.style.display = 'none';
            }, 650);
          }, 350);
        }
      }, 45);
    }
  };

  // --- Game State ---
  const Game = {
    deck: [],
    currentCard: null,
    previousCards: [],
    currentBet: 50,
    currentMultiplier: 1.0,
    roundActive: false,
    streakCount: 0,
    balance: 2000,

    init() {
      LoadingScreen.start();
      AudioEngine.autoUnlock();
      this.initWallet();
      this.bindDOM();
      this.startFreshGame();
    },

    getRealBalance() {
      if (typeof getRealWalletBalance === 'function') {
        return getRealWalletBalance();
      }
      if (window.wallet && typeof window.wallet.getBalance === 'function') {
        return window.wallet.getBalance();
      }
      try {
        const sess = localStorage.getItem('bwn_session_user');
        if (sess) {
          const u = JSON.parse(sess);
          if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
            return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
          }
        }
      } catch (e) {}
      const saved = localStorage.getItem('BETWITHNET_balance') || localStorage.getItem('bwn_wallet_balance') || localStorage.getItem('user_balance');
      if (saved) return parseFloat(saved);
      return 2000.00;
    },

    initWallet() {
      this.syncWallet();

      // Listen for Bet With Net wallet events
      window.addEventListener('storage', () => this.syncWallet());
      window.addEventListener('wallet:updated', () => this.syncWallet());
      if (window.wallet && typeof window.wallet.on === 'function') {
        window.wallet.on('balanceChanged', () => this.syncWallet());
      }
      setInterval(() => this.syncWallet(), 2500);
    },

    syncWallet() {
      this.balance = this.getRealBalance();
      this.updateBalanceUI();
    },

    updateBalanceUI() {
      const el = document.getElementById('walletBalance');
      if (el) el.textContent = 'PKR ' + this.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    bindDOM() {
      // Audio toggle
      document.getElementById('soundBtn').addEventListener('click', () => {
        const state = AudioEngine.toggle();
        document.getElementById('soundBtn').textContent = state ? '🔊' : '🔇';
      });

      // Bet controls
      document.getElementById('betMinus').addEventListener('click', () => this.adjustBet(-10));
      document.getElementById('betPlus').addEventListener('click', () => this.adjustBet(10));

      document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          const val = parseInt(e.target.dataset.value, 10);
          this.setBet(val);
        });
      });

      // Action buttons
      document.getElementById('dealBtn').addEventListener('click', () => this.startRound());
      document.getElementById('btnHi').addEventListener('click', () => this.makeGuess('hi'));
      document.getElementById('btnLo').addEventListener('click', () => this.makeGuess('lo'));
      document.getElementById('cashoutBtn').addEventListener('click', () => this.cashOut());
      document.getElementById('skipBtn').addEventListener('click', () => this.skipCard());
      document.getElementById('modalOkBtn').addEventListener('click', () => this.closeWinModal());

      // Side bet buttons (Red / Black, Even / Odd)
      document.getElementById('betRed').addEventListener('click', () => this.makeSideGuess('red'));
      document.getElementById('betBlack').addEventListener('click', () => this.makeSideGuess('black'));
      document.getElementById('betEqual').addEventListener('click', () => this.makeSideGuess('equal'));
    },

    adjustBet(delta) {
      if (this.roundActive) return;
      this.setBet(Math.max(10, Math.min(10000, this.currentBet + delta)));
    },

    setBet(val) {
      if (this.roundActive) return;
      this.currentBet = val;
      document.getElementById('betDisplay').textContent = 'PKR ' + this.currentBet.toLocaleString('en-US');
      this.calculateOdds();
    },

    startFreshGame() {
      this.deck = createFullDeck();
      this.currentCard = this.deck.pop();
      this.previousCards = [];
      this.currentMultiplier = 1.0;
      this.streakCount = 0;
      this.roundActive = false;

      this.renderCurrentCard(this.currentCard, false);
      this.updateHistoryUI();
      this.calculateOdds();
      this.setCatSpeech('Meow! Set your bet and tap DEAL to play! 🐾');

      document.getElementById('dealBtn').style.display = 'block';
      document.getElementById('actionControls').style.display = 'none';
      document.getElementById('streakBadge').classList.remove('active');
    },

    startRound() {
      const currentBal = this.getRealBalance();
      if (currentBal < this.currentBet) {
        alert('Balance kam hai! Please recharge your Bet With Net wallet.');
        return;
      }

      AudioEngine.playClick();

      // Deduct bet from Bet With Net wallet
      let deducted = false;
      if (typeof placeBet === 'function') {
        deducted = placeBet(this.currentBet, 'Meow Hi-Lo');
      } else if (window.wallet && typeof window.wallet.placeBet === 'function') {
        deducted = window.wallet.placeBet(this.currentBet, 'Meow Hi-Lo');
      } else {
        const newBal = Math.max(0, currentBal - this.currentBet);
        localStorage.setItem('BETWITHNET_balance', newBal.toString());
        localStorage.setItem('bwn_wallet_balance', newBal.toString());
        try {
          const sess = localStorage.getItem('bwn_session_user');
          if (sess) {
            const u = JSON.parse(sess);
            u.balance_pkr = newBal;
            u.balancePKR = newBal;
            localStorage.setItem('bwn_session_user', JSON.stringify(u));
          }
        } catch (e) {}
        deducted = true;
      }

      if (!deducted) return;

      this.syncWallet();

      this.roundActive = true;
      this.streakCount = 0;
      this.currentMultiplier = 1.0;
      this.deck = createFullDeck();
      this.currentCard = this.deck.pop();
      this.previousCards = [this.currentCard];

      AudioEngine.playCardFlip();
      this.renderCurrentCard(this.currentCard, true);
      this.updateHistoryUI();
      this.calculateOdds();

      document.getElementById('dealBtn').style.display = 'none';
      document.getElementById('actionControls').style.display = 'flex';
      this.updateCashoutButton();

      this.setCatSpeech('Will the next card be HIGHER or LOWER? Meow! 🐱');
      AudioEngine.startBgm();
      AudioEngine.speak('Good luck! Higher or lower?', 1.3, 1.15);
    },

    skipCard() {
      if (!this.roundActive) return;
      if (this.deck.length < 5) this.deck = createFullDeck();
      this.currentCard = this.deck.pop();
      AudioEngine.playCardFlip();
      this.renderCurrentCard(this.currentCard, true);
      this.calculateOdds();
      this.setCatSpeech('New card dealt! Pick HI or LO meow! 🐾');
      AudioEngine.speak('Next card!', 1.3, 1.25);
    },

    calculateOdds() {
      if (!this.currentCard) return;
      const v = this.currentCard.value; // 1 (Ace) to 13 (King)

      // In Meow Hi-Lo:
      // Higher means: value >= v (tie wins at reduced payout) or value > v
      // Count remaining in standard deck:
      // total remaining cards = 52 (theoretically independent trials per round)
      const countHigher = Math.max(1, 13 - v);
      const countLower = Math.max(1, v - 1);
      const rtp = 0.96; // 96% RTP

      const probHi = countHigher / 12.5;
      const probLo = countLower / 12.5;

      const multHi = Math.max(1.05, Math.min(12.5, (1 / probHi) * rtp));
      const multLo = Math.max(1.05, Math.min(12.5, (1 / probLo) * rtp));

      this.nextHiMult = parseFloat(multHi.toFixed(2));
      this.nextLoMult = parseFloat(multLo.toFixed(2));

      document.getElementById('hiMultiplier').textContent = this.nextHiMult + 'x';
      document.getElementById('loMultiplier').textContent = this.nextLoMult + 'x';

      const hiChance = Math.round(probHi * 100);
      const loChance = Math.round(probLo * 100);
      document.getElementById('hiChance').textContent = `${Math.min(95, Math.max(5, hiChance))}% Chance`;
      document.getElementById('loChance').textContent = `${Math.min(95, Math.max(5, loChance))}% Chance`;
    },

    makeGuess(type) {
      if (!this.roundActive) return;
      if (this.deck.length < 2) this.deck = createFullDeck();

      AudioEngine.startBgm();
      if (type === 'hi') {
        AudioEngine.speak('Higher!', 1.35, 1.25);
      } else {
        AudioEngine.speak('Lower!', 1.25, 1.25);
      }

      const nextCard = this.deck.pop();
      AudioEngine.playCardFlip();

      // Animate flip to next card
      const cardEl = document.getElementById('playingCard');
      cardEl.classList.add('flipped');

      setTimeout(() => {
        const prevCard = this.currentCard;
        this.currentCard = nextCard;
        this.previousCards.push(nextCard);
        this.renderCurrentCard(nextCard, false);
        cardEl.classList.remove('flipped');

        let won = false;
        let stepMult = 1.0;

        if (type === 'hi') {
          if (nextCard.value >= prevCard.value) {
            won = true;
            stepMult = this.nextHiMult;
          }
        } else if (type === 'lo') {
          if (nextCard.value <= prevCard.value) {
            won = true;
            stepMult = this.nextLoMult;
          }
        }

        if (won) {
          this.onGuessSuccess(stepMult);
        } else {
          this.onGuessFail(prevCard, nextCard);
        }
      }, 300);
    },

    makeSideGuess(side) {
      if (!this.roundActive) return;
      if (this.deck.length < 2) this.deck = createFullDeck();

      AudioEngine.startBgm();
      if (side === 'red') {
        AudioEngine.speak('Red!', 1.3, 1.2);
      } else if (side === 'black') {
        AudioEngine.speak('Black!', 1.2, 1.2);
      } else if (side === 'equal') {
        AudioEngine.speak('Equal!', 1.35, 1.2);
      }

      const nextCard = this.deck.pop();
      AudioEngine.playCardFlip();

      const cardEl = document.getElementById('playingCard');
      cardEl.classList.add('flipped');

      setTimeout(() => {
        const prevCard = this.currentCard;
        this.currentCard = nextCard;
        this.previousCards.push(nextCard);
        this.renderCurrentCard(nextCard, false);
        cardEl.classList.remove('flipped');

        let won = false;
        let stepMult = 1.92;

        if (side === 'red') {
          won = (nextCard.color === 'red');
        } else if (side === 'black') {
          won = (nextCard.color === 'black');
        } else if (side === 'equal') {
          won = (nextCard.value === prevCard.value);
          stepMult = 11.5;
        }

        if (won) {
          this.onGuessSuccess(stepMult);
        } else {
          this.onGuessFail(prevCard, nextCard);
        }
      }, 300);
    },

    onGuessSuccess(stepMult) {
      this.streakCount++;
      this.currentMultiplier = parseFloat((this.currentMultiplier * stepMult).toFixed(2));
      AudioEngine.playMeow(true);

      const streakBadge = document.getElementById('streakBadge');
      streakBadge.textContent = `STREAK x${this.streakCount} (${this.currentMultiplier.toFixed(2)}x)`;
      streakBadge.classList.add('active');

      this.updateHistoryUI();
      this.calculateOdds();
      this.updateCashoutButton();

      const msgs = [
        'Purrfect guess meow! 😻',
        'You are on fire! Meow! 🐾',
        'Such good luck! Keep going or cash out! ✨',
        'Meow-velous! Win is growing! 💰'
      ];
      this.setCatSpeech(msgs[Math.floor(Math.random() * msgs.length)]);
      const winPhrases = ['Winner!', 'Purrfect!', 'Nice streak!', 'Great guess!'];
      const phrase = winPhrases[Math.floor(Math.random() * winPhrases.length)];
      setTimeout(() => AudioEngine.speak(phrase, 1.35, 1.2), 350);
    },

    onGuessFail(prev, curr) {
      AudioEngine.playMeow(false);
      this.roundActive = false;
      this.streakCount = 0;
      this.currentMultiplier = 1.0;

      document.getElementById('streakBadge').classList.remove('active');
      document.getElementById('actionControls').style.display = 'none';
      document.getElementById('dealBtn').style.display = 'block';

      this.updateHistoryUI();
      this.setCatSpeech(`Ouch meow! Card was ${curr.label}${curr.symbol}. Try again! 😿`);
      setTimeout(() => AudioEngine.speak('Oh no! Try again!', 1.2, 1.1), 350);
    },

    cashOut() {
      if (!this.roundActive || this.currentMultiplier <= 1.0) return;

      const totalWin = parseFloat((this.currentBet * this.currentMultiplier).toFixed(2));
      AudioEngine.speak('Cash out! Congratulations!', 1.35, 1.15);

      // Credit win to Bet With Net real wallet
      if (typeof winBet === 'function') {
        winBet(this.currentBet, this.currentMultiplier);
      } else if (window.wallet && typeof window.wallet.creditWin === 'function') {
        window.wallet.creditWin(this.currentBet, totalWin, 'Meow Hi-Lo', this.currentMultiplier, 'Meow Hi-Lo Cashout');
      } else {
        const currentBal = this.getRealBalance();
        const newBal = currentBal + totalWin;
        localStorage.setItem('BETWITHNET_balance', newBal.toString());
        localStorage.setItem('bwn_wallet_balance', newBal.toString());
        try {
          const sess = localStorage.getItem('bwn_session_user');
          if (sess) {
            const u = JSON.parse(sess);
            u.balance_pkr = newBal;
            u.balancePKR = newBal;
            localStorage.setItem('bwn_session_user', JSON.stringify(u));
          }
        } catch (e) {}
      }

      this.syncWallet();

      AudioEngine.playWinCoin();
      AudioEngine.playMeow(true);
      this.triggerConfetti();

      // Show win modal
      document.getElementById('modalWinAmount').textContent = 'PKR ' + totalWin.toLocaleString('en-US', { minimumFractionDigits: 2 });
      document.getElementById('winModal').classList.add('show');

      this.roundActive = false;
      this.streakCount = 0;
      this.currentMultiplier = 1.0;
      document.getElementById('streakBadge').classList.remove('active');
      document.getElementById('actionControls').style.display = 'none';
      document.getElementById('dealBtn').style.display = 'block';
    },

    closeWinModal() {
      document.getElementById('winModal').classList.remove('show');
      this.startFreshGame();
    },

    updateCashoutButton() {
      const winVal = (this.currentBet * this.currentMultiplier).toFixed(2);
      document.getElementById('cashoutAmount').textContent = `PKR ${parseFloat(winVal).toLocaleString('en-US')}`;
    },

    renderCurrentCard(card, animated = false) {
      const front = document.getElementById('cardFront');
      front.className = `card-face card-front suit-${card.suit}`;

      document.getElementById('cardRankTop').textContent = card.label;
      document.getElementById('cardSuitTop').textContent = card.symbol;
      document.getElementById('cardRankBottom').textContent = card.label;
      document.getElementById('cardSuitBottom').textContent = card.symbol;
      document.getElementById('cardCenterSuit').textContent = card.symbol;
    },

    updateHistoryUI() {
      const container = document.getElementById('historyCards');
      container.innerHTML = '';
      const recent = this.previousCards.slice(-8);
      recent.forEach(c => {
        const span = document.createElement('span');
        span.className = `history-mini-card ${c.color}`;
        span.textContent = `${c.label}${c.symbol}`;
        container.appendChild(span);
      });
    },

    setCatSpeech(msg) {
      const bubble = document.getElementById('catSpeech');
      bubble.textContent = msg;
    },

    triggerConfetti() {
      const canvas = document.getElementById('confettiCanvas');
      const ctx = canvas.getContext('2d');
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;

      const particles = [];
      const colors = ['#ff3b68', '#a855f7', '#ffca28', '#10b981', '#3b82f6'];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.8) * 14,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 4,
          life: 1.0
        });
      }

      function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.4;
          p.life -= 0.02;
          if (p.life > 0) {
            alive = true;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        });
        if (alive) {
          requestAnimationFrame(render);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      render();
    }
  };

  // Launch on ready
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => Game.init());
  } else {
    Game.init();
  }
})();
