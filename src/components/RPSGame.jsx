import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import PragmaticLoader from './PragmaticLoader';
import { Flame, Sparkles, TrendingUp, HelpCircle, X, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

const MULTIPLIERS = [1.96, 3.84, 7.50, 15.00, 30.00];

const HANDS = {
  rock: { img: '../assets/games/rps/rock.jpg', icon: '✊', name: 'ROCK', color: 'from-amber-500/20 to-yellow-600/20', border: 'border-amber-500/50', beats: 'scissors' },
  paper: { img: '../assets/games/rps/paper.jpg', icon: '✋', name: 'PAPER', color: 'from-cyan-500/20 to-blue-600/20', border: 'border-cyan-500/50', beats: 'rock' },
  scissors: { img: '../assets/games/rps/scissors.jpg', icon: '✌️', name: 'SCISSORS', color: 'from-red-500/20 to-pink-600/20', border: 'border-red-500/50', beats: 'paper' }
};

export default function RPSGame() {
  const [balance, setBalance] = useState(10000);
  const [betAmount, setBetAmount] = useState(100);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerHand, setPlayerHand] = useState('rock');
  const [dealerHand, setDealerHand] = useState('paper');
  const [isShaking, setIsShaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Choose ROCK, PAPER, or SCISSORS to start');
  const [winnerSide, setWinnerSide] = useState(null); // 'player', 'dealer', 'draw'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [history, setHistory] = useState([]);
  const audioCtxRef = useRef(null);
  const bgmRef = useRef(null);
  const hasInteractedRef = useRef(false);

  const AUDIO_FILES = {
    bgm: '../assets/games/rps/audio/bgm.mp3',
    clash: '../assets/games/rps/audio/clash.mp3',
    win: '../assets/games/rps/audio/win.mp3',
    cashout: '../assets/games/rps/audio/cashout.mp3',
    chip: '../assets/games/rps/audio/chip.mp3',
    countdown: '../assets/games/rps/audio/countdown.mp3'
  };

  // Background Music Controls
  const initBGM = () => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio(AUDIO_FILES.bgm);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.35;
    }
  };

  const playBGM = () => {
    initBGM();
    if (bgmRef.current) {
      bgmRef.current.play().catch(() => {});
    }
  };

  const stopBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause();
    }
  };

  const toggleMusic = () => {
    unlockAudio();
    if (musicEnabled) {
      stopBGM();
      setMusicEnabled(false);
    } else {
      setMusicEnabled(true);
      playBGM();
    }
  };

  const unlockAudio = () => {
    if (!hasInteractedRef.current) {
      hasInteractedRef.current = true;
      if (musicEnabled) {
        playBGM();
      }
    }
  };

  // Auto-start on first user interaction anywhere
  useEffect(() => {
    const handleGesture = () => unlockAudio();
    ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
      window.addEventListener(evt, handleGesture, { once: true, passive: true });
    });
    return () => {
      ['click', 'touchstart', 'pointerdown', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, handleGesture);
      });
      stopBGM();
    };
  }, []);

  // Sync real wallet balance on mount and focus
  useEffect(() => {
    syncWalletBalance();
    const interval = setInterval(syncWalletBalance, 4000);
    return () => clearInterval(interval);
  }, []);

  const syncWalletBalance = () => {
    try {
      if (window.wallet && typeof window.wallet.getBalance === 'function') {
        const b = window.wallet.getBalance();
        if (!isNaN(b) && b >= 0) setBalance(b);
        return;
      }
      const u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
      if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
        setBalance(parseFloat(u.balance_pkr || u.balancePKR));
        return;
      }
      const localBal = localStorage.getItem("BETWITHNET_balance");
      if (localBal !== null) setBalance(parseFloat(localBal));
    } catch (e) {}
  };

  // Audio Playback with Audio Files + Synthesizer Fallback
  const playSound = (type) => {
    if (!soundEnabled) return;

    const fileSrc = AUDIO_FILES[type];
    if (fileSrc) {
      try {
        const audio = new Audio(fileSrc);
        audio.volume = type === 'clash' ? 0.8 : (type === 'countdown' ? 0.5 : 0.65);
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => playSynthFallback(type));
        }
        return;
      } catch (e) {}
    }
    playSynthFallback(type);
  };

  const playSynthFallback = (type) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'clash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        osc.frequency.setValueAtTime(783.99, now + 0.2);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'loss') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'cashout') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'chip' || type === 'countdown') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } catch (e) {}
  };

  const handlePlayMove = async (moveKey) => {
    if (isPlaying) return;
    unlockAudio();

    // Deduct bet if start of streak
    if (streak === 0) {
      if (betAmount > balance) {
        setStatusMessage('⚠️ Insufficient Balance in Wallet!');
        return;
      }
      if (window.wallet && typeof window.wallet.placeBet === 'function') {
        if (!window.wallet.placeBet(betAmount, 'RPS VIP')) return;
      } else {
        const nextBal = Math.max(0, balance - betAmount);
        setBalance(nextBal);
        localStorage.setItem("BETWITHNET_balance", nextBal.toString());
      }
    }

    setIsPlaying(true);
    setWinnerSide(null);
    setPlayerHand('rock');
    setDealerHand('rock');
    setIsShaking(true);
    setStatusMessage('ROCK... PAPER... SCISSORS...');
    playSound('countdown');

    // Showdown Countdown animation (650ms)
    await new Promise(r => setTimeout(r, 650));

    setIsShaking(false);
    const moves = ['rock', 'paper', 'scissors'];
    const dealerMove = moves[Math.floor(Math.random() * moves.length)];
    
    setPlayerHand(moveKey);
    setDealerHand(dealerMove);
    playSound('clash');

    // Determine Outcome
    if (moveKey === dealerMove) {
      // DRAW
      setWinnerSide('draw');
      setStatusMessage(`🤝 DRAW! Both picked ${moveKey.toUpperCase()}`);
      playSound('clash');
      setHistory(prev => [{ result: 'DRAW', pMove: moveKey, dMove: dealerMove }, ...prev.slice(0, 7)]);
    } else if (HANDS[moveKey].beats === dealerMove) {
      // PLAYER WINS
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setWinnerSide('player');
      const mult = MULTIPLIERS[Math.min(nextStreak - 1, MULTIPLIERS.length - 1)];
      const winPayout = betAmount * mult;

      setStatusMessage(`🎉 YOU WIN ROUND ${nextStreak}! Multiplier: ${mult.toFixed(2)}× (₨ ${winPayout.toFixed(0)})`);
      playSound('win');
      setHistory(prev => [{ result: 'WIN', pMove: moveKey, dMove: dealerMove, mult }, ...prev.slice(0, 7)]);

      if (nextStreak === 5) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        await new Promise(r => setTimeout(r, 800));
        handleCashOut(nextStreak);
      }
    } else {
      // DEALER WINS
      setWinnerSide('dealer');
      setStatusMessage(`💥 DEALER WINS! ${dealerMove.toUpperCase()} beats ${moveKey.toUpperCase()}`);
      playSound('loss');
      if (window.wallet && typeof window.wallet.creditWin === 'function') {
        window.wallet.creditWin(betAmount, 0, 'RPS VIP', 0, 'Lost streak');
      }
      setHistory(prev => [{ result: 'LOSS', pMove: moveKey, dMove: dealerMove }, ...prev.slice(0, 7)]);
      setStreak(0);
    }

    setIsPlaying(false);
    syncWalletBalance();
  };

  const handleCashOut = (overrideStreak = null) => {
    const activeStreak = overrideStreak || streak;
    if (activeStreak === 0) return;

    const mult = MULTIPLIERS[Math.min(activeStreak - 1, MULTIPLIERS.length - 1)];
    const winAmt = betAmount * mult;

    if (window.wallet && typeof window.wallet.creditWin === 'function') {
      window.wallet.creditWin(betAmount, winAmt, 'RPS VIP', mult, `Cashed out streak ${activeStreak} (${mult.toFixed(2)}x)`);
    } else {
      const nextBal = balance + winAmt;
      setBalance(nextBal);
      localStorage.setItem("BETWITHNET_balance", nextBal.toString());
    }

    setStatusMessage(`💰 CASHED OUT! Won ₨ ${winAmt.toFixed(0)} (${mult.toFixed(2)}×)`);
    playSound('cashout');
    confetti({ particleCount: 80, spread: 60 });
    setStreak(0);
    setWinnerSide(null);
    syncWalletBalance();
  };

  const currentMult = streak > 0 ? MULTIPLIERS[streak - 1] : 1;
  const currentCashoutValue = streak > 0 ? betAmount * currentMult : 0;

  return (
    <div className="min-h-screen bg-[#07030d] text-white flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Pragmatic Play Official Loading Screen */}
      <PragmaticLoader onLoaded={() => unlockAudio()} />

      {/* Background Ambient Glow Nebulas */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-900/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-cyan-900/20 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <Header
        balance={balance}
        currentStreak={streak}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onToggleMusic={toggleMusic}
        onOpenRules={() => setShowRulesModal(true)}
      />

      {/* MAIN GAME CONTAINER */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center items-center gap-4">
        
        {/* Multiplier Streak Ladder */}
        <div className="w-full max-w-xl flex items-center justify-between gap-1.5 sm:gap-2">
          {MULTIPLIERS.map((m, idx) => {
            const isCompleted = streak > idx + 1;
            const isActive = streak === idx + 1;
            return (
              <div
                key={idx}
                className={`rps-ladder-step ${
                  isActive ? 'active' : isCompleted ? 'completed' : ''
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  R{idx + 1}
                </span>
                <span className={`font-mono font-black text-xs sm:text-sm ${
                  isActive ? 'text-yellow-300' : isCompleted ? 'text-emerald-300' : 'text-gray-300'
                }`}>
                  {m.toFixed(2)}×
                </span>
              </div>
            );
          })}
        </div>

        {/* 3D Battle Arena */}
        <div className="rps-battle-stage w-full max-w-2xl relative">
          <div className="rps-stage-grid" />

          {/* Arena Pedestals (Player vs Dealer) */}
          <div className="w-full flex items-center justify-around z-10 py-3 sm:py-6">
            
            {/* Player Hand */}
            <div className="rps-pedestal">
              <span className="text-[11px] font-black uppercase tracking-widest text-cyan-400 mb-2 drop-shadow">
                YOU
              </span>
              <div 
                className={`rps-hand-circle player ${
                  isShaking ? 'shaking' : ''
                } ${winnerSide === 'player' ? 'winner' : ''}`}
              >
                {HANDS[playerHand]?.icon || '✊'}
              </div>
              <span className="text-xs font-mono font-bold text-gray-300 mt-2">
                {HANDS[playerHand]?.name || 'ROCK'}
              </span>
            </div>

            {/* VS Center Badge */}
            <div className="rps-vs-emblem">
              <div className="rps-vs-badge">
                VS
              </div>
              {streak > 0 && (
                <div className="mt-2 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-black text-amber-300">
                  {currentMult.toFixed(2)}×
                </div>
              )}
            </div>

            {/* Dealer Hand */}
            <div className="rps-pedestal">
              <span className="text-[11px] font-black uppercase tracking-widest text-red-400 mb-2 drop-shadow">
                DEALER
              </span>
              <div 
                className={`rps-hand-circle dealer ${
                  isShaking ? 'shaking' : ''
                } ${winnerSide === 'dealer' ? 'winner' : ''}`}
              >
                {isShaking ? '❓' : (HANDS[dealerHand]?.icon || '✋')}
              </div>
              <span className="text-xs font-mono font-bold text-gray-300 mt-2">
                {isShaking ? 'THINKING...' : (HANDS[dealerHand]?.name || 'PAPER')}
              </span>
            </div>

          </div>

          {/* Status Message Announcement */}
          <div className="relative z-10 mt-2 px-4 py-2 rounded-xl bg-black/60 border border-purple-500/30 text-center font-bold text-xs sm:text-sm drop-shadow max-w-md">
            <span className={
              winnerSide === 'player' ? 'text-emerald-400' :
              winnerSide === 'dealer' ? 'text-red-400' :
              winnerSide === 'draw' ? 'text-amber-400' : 'text-yellow-300'
            }>
              {statusMessage}
            </span>
          </div>

          {/* Cash Out Button (Visible during streak) */}
          {streak > 0 && (
            <button
              onClick={() => handleCashOut()}
              disabled={isPlaying}
              className="btn-cashout-glow relative z-10 w-full max-w-sm mt-3 py-3 px-6 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={18} />
              <span>CASH OUT ₨ {currentCashoutValue.toFixed(0)}</span>
              <span className="font-mono text-xs opacity-90">({currentMult.toFixed(2)}×)</span>
            </button>
          )}

        </div>

        {/* Action Choice Buttons (Rock, Paper, Scissors) */}
        <div className="w-full max-w-xl grid grid-cols-3 gap-2 sm:gap-3">
          {Object.entries(HANDS).map(([key, hand]) => (
            <button
              key={key}
              disabled={isPlaying}
              onClick={() => handlePlayMove(key)}
              className={`rps-action-card bg-gradient-to-br ${hand.color} ${hand.border}`}
            >
              <span className="text-3xl sm:text-4xl filter drop-shadow">
                {hand.icon}
              </span>
              <span className="font-display font-black text-xs sm:text-sm tracking-wider mt-1 text-white">
                {hand.name}
              </span>
              <span className="text-[9px] text-gray-400 uppercase">
                Beats {hand.beats}
              </span>
            </button>
          ))}
        </div>

        {/* History Streaks Ribbon */}
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-[10px] uppercase font-bold text-gray-500">History:</span>
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                  h.result === 'WIN' 
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' 
                    : h.result === 'DRAW'
                    ? 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                    : 'bg-red-950/80 border border-red-500/40 text-red-300'
                }`}
              >
                {h.result}
              </span>
            ))}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <Footer
        betAmount={betAmount}
        onBetChange={(newBet) => {
          setBetAmount(newBet);
          playSound('chip');
        }}
        disabled={isPlaying || streak > 0}
        maxBalance={balance}
      />

      {/* RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#100720] border border-purple-500/40 rounded-2xl max-w-md w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/40 hover:bg-black/80 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-lg text-yellow-400 mb-3 flex items-center gap-2">
              <HelpCircle size={20} /> How to Play RPS VIP
            </h3>
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>• <b>Rock</b> crushes Scissors, <b>Paper</b> covers Rock, and <b>Scissors</b> cut Paper.</p>
              <p>• Win consecutive rounds to climb the <b>Streak Multiplier Ladder</b> up to <b>30.00×</b> your stake!</p>
              <div className="bg-black/40 p-2.5 rounded-xl border border-purple-500/20 font-mono text-[11px] text-amber-300 space-y-1">
                <div>Round 1: 1.96× payout</div>
                <div>Round 2: 3.84× payout</div>
                <div>Round 3: 7.50× payout</div>
                <div>Round 4: 15.00× payout</div>
                <div>Round 5: 30.00× JACKPOT!</div>
              </div>
              <p>• <b>Draw:</b> Round repeats with no loss. Your stake remains intact.</p>
              <p>• <b>Cash Out:</b> You can take your profit after any winning round before risking the next!</p>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
