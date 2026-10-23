import React, { useState, useEffect, useRef } from 'react';
import Header from './Header';
import Footer from './Footer';
import PragmaticLoader from './PragmaticLoader';
import { Flame, ShieldAlert, Sparkles, HelpCircle, X, CheckCircle2, RotateCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const MULTIPLIERS = [1.20, 1.60, 2.50, 4.50, 15.00];

export default function RussianRouletteGame() {
  const [balance, setBalance] = useState(10000);
  const [betAmount, setBetAmount] = useState(100);
  const [chamber, setChamber] = useState(0);
  const [bullet, setBullet] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [statusMessage, setStatusMessage] = useState('6-Chamber Cylinder. 1 Fatal Bullet. Pull the trigger!');
  const [statusType, setStatusType] = useState('normal'); // 'normal', 'win', 'bang'
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [screenFlash, setScreenFlash] = useState(false);

  const audioCtxRef = useRef(null);
  const bgmRef = useRef(null);
  const hasInteractedRef = useRef(false);

  const AUDIO_FILES = {
    bgm: '../assets/games/russian_roulette/audio/bgm.mp3',
    spin: '../assets/games/russian_roulette/audio/spin.mp3',
    click: '../assets/games/russian_roulette/audio/click.mp3',
    bang: '../assets/games/russian_roulette/audio/bang.mp3',
    win: '../assets/games/russian_roulette/audio/win.mp3',
    cashout: '../assets/games/russian_roulette/audio/cashout.mp3',
    chip: '../assets/games/russian_roulette/audio/chip.mp3'
  };

  const initBGM = () => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio(AUDIO_FILES.bgm);
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.35;
    }
  };

  const playBGM = () => {
    initBGM();
    if (bgmRef.current) bgmRef.current.play().catch(() => {});
  };

  const stopBGM = () => {
    if (bgmRef.current) bgmRef.current.pause();
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
      if (musicEnabled) playBGM();
    }
  };

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

  const playSound = (type) => {
    if (!soundEnabled) return;
    const fileSrc = AUDIO_FILES[type];
    if (fileSrc) {
      try {
        const audio = new Audio(fileSrc);
        audio.volume = type === 'bang' ? 0.95 : (type === 'click' ? 0.75 : 0.65);
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => playSynthFallback(type));
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
      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'bang') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
        gain.gain.setValueAtTime(0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'win') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {}
  };

  const handlePullTrigger = async () => {
    unlockAudio();
    let currentChamber = chamber;
    let currentBullet = bullet;

    if (!isPlaying) {
      if (betAmount > balance) {
        setStatusMessage('⚠️ Insufficient Balance in Wallet!');
        setStatusType('bang');
        return;
      }

      if (window.wallet && typeof window.wallet.placeBet === 'function') {
        if (!window.wallet.placeBet(betAmount, 'Russian Chamber')) return;
      } else {
        const nextBal = Math.max(0, balance - betAmount);
        setBalance(nextBal);
        localStorage.setItem("BETWITHNET_balance", nextBal.toString());
      }

      setIsPlaying(true);
      currentChamber = 0;
      currentBullet = Math.floor(Math.random() * 6) + 1;
      setBullet(currentBullet);

      setIsSpinning(true);
      playSound('spin');
      await new Promise(r => setTimeout(r, 600));
      setIsSpinning(false);
    }

    currentChamber++;
    setChamber(currentChamber);

    await new Promise(r => setTimeout(r, 150));

    if (currentChamber === currentBullet) {
      // BANG
      setIsPlaying(false);
      playSound('bang');
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 500);

      if (window.wallet && typeof window.wallet.creditWin === 'function') {
        window.wallet.creditWin(betAmount, 0, 'Russian Chamber', 0, `Bullet fired at chamber ${currentChamber}`);
      }

      setStatusMessage(`💥 BANG! BULLET DISCHARGED AT CHAMBER ${currentChamber}!`);
      setStatusType('bang');
      setHistory(prev => [{ result: 'LOSS', ch: currentChamber }, ...prev.slice(0, 7)]);
      setChamber(0);
    } else {
      // SURVIVED
      playSound('click');
      playSound('win');

      const mult = MULTIPLIERS[Math.min(currentChamber - 1, MULTIPLIERS.length - 1)];
      const winPayout = betAmount * mult;

      setStatusMessage(`✨ *CLICK* EMPTY CHAMBER ${currentChamber}/6! SURVIVED (${mult.toFixed(2)}×) = ₨ ${winPayout.toFixed(0)}`);
      setStatusType('win');
      setHistory(prev => [{ result: 'SURVIVED', ch: currentChamber }, ...prev.slice(0, 7)]);

      if (currentChamber >= 5) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        await new Promise(r => setTimeout(r, 800));
        handleCashOut(currentChamber);
      }
    }

    syncWalletBalance();
  };

  const handleCashOut = (overrideChamber = null) => {
    const activeChamber = overrideChamber || chamber;
    if (!isPlaying || activeChamber === 0) return;

    setIsPlaying(false);
    const mult = MULTIPLIERS[Math.min(activeChamber - 1, MULTIPLIERS.length - 1)];
    const winAmt = betAmount * mult;

    if (window.wallet && typeof window.wallet.creditWin === 'function') {
      window.wallet.creditWin(betAmount, winAmt, 'Russian Chamber', mult, `Survived chamber ${activeChamber}`);
    } else {
      const nextBal = balance + winAmt;
      setBalance(nextBal);
      localStorage.setItem("BETWITHNET_balance", nextBal.toString());
    }

    setStatusMessage(`💰 WALKED AWAY WITH ₨ ${winAmt.toFixed(0)} (${mult.toFixed(2)}×)!`);
    setStatusType('win');
    playSound('cashout');
    confetti({ particleCount: 80, spread: 60 });
    setChamber(0);
    syncWalletBalance();
  };

  const currentMult = chamber > 0 ? MULTIPLIERS[Math.min(chamber - 1, MULTIPLIERS.length - 1)] : 1.0;
  const currentCashoutVal = chamber > 0 ? betAmount * currentMult : 0;

  return (
    <div className="min-h-screen bg-[#060205] text-white flex flex-col justify-between selection:bg-red-500 selection:text-white relative overflow-hidden font-sans">
      
      {/* Gunshot screen flash */}
      {screenFlash && (
        <div className="fixed inset-0 bg-red-600/90 z-[9999] pointer-events-none animate-ping" />
      )}

      {/* Pragmatic Play Loader */}
      <PragmaticLoader onLoaded={() => unlockAudio()} />

      {/* Ambient Casino Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-25 pointer-events-none filter contrast-125 brightness-75"
        style={{ backgroundImage: `url('../assets/games/russian_roulette/bg.jpg')` }}
      />
      <div className="fixed inset-0 bg-radial-gradient from-transparent via-[#060205]/60 to-[#060205] pointer-events-none" />

      {/* HEADER */}
      <Header
        balance={balance}
        currentStreak={chamber}
        soundEnabled={soundEnabled}
        musicEnabled={musicEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onToggleMusic={toggleMusic}
        onOpenRules={() => setShowRulesModal(true)}
      />

      {/* MAIN ARENA */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 flex flex-col justify-center items-center gap-4">
        
        {/* Multiplier Ladder */}
        <div className="w-full max-w-xl flex items-center justify-between gap-1.5 sm:gap-2">
          {MULTIPLIERS.map((m, idx) => {
            const isCompleted = chamber > idx + 1;
            const isActive = chamber === idx + 1;
            return (
              <div
                key={idx}
                className={`flex-1 py-2 px-1 rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600/40 to-amber-600/40 border border-yellow-400 shadow-[0_0_15px_rgba(255,215,0,0.5)] scale-105'
                    : isCompleted
                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                    : 'bg-black/40 border border-red-500/20 text-gray-400'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CH {idx + 1}</span>
                <span className={`font-mono font-black text-xs sm:text-sm ${isActive ? 'text-yellow-300' : isCompleted ? 'text-emerald-300' : 'text-gray-300'}`}>
                  {m.toFixed(2)}×
                </span>
              </div>
            );
          })}
        </div>

        {/* 3D Russian Chamber Stage Card */}
        <div className="w-full max-w-2xl bg-gradient-to-b from-[#1c060d]/90 to-[#0c0306]/95 border border-red-500/40 rounded-3xl p-4 sm:p-6 shadow-2xl relative flex flex-col items-center backdrop-blur-md">
          
          <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
            {/* Revolver Display */}
            <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl">
              <img src="../assets/games/russian_roulette/revolver.jpg" alt="Colt .357" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2.5">
                <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider">
                  COLT .357 MAGNUM
                </span>
              </div>
            </div>

            {/* Cylinder Wheel & Chamber Pips */}
            <div className="flex flex-col items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-widest text-red-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
                6-CHAMBER CYLINDER
              </span>

              <div className={`relative w-40 h-40 rounded-full flex items-center justify-center shadow-2xl ${isSpinning ? 'animate-spin' : ''}`}>
                <img
                  src="../assets/games/russian_roulette/cylinder.jpg"
                  alt="Cylinder"
                  className="w-full h-full object-cover rounded-full transition-transform duration-500"
                  style={{ transform: `rotate(${chamber * 60}deg)` }}
                />
              </div>

              {/* Chamber Pips (1 to 6) */}
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5, 6].map(i => {
                  const isPast = i < chamber;
                  const isCurrent = i === chamber;
                  const isTarget = i === chamber + 1 && isPlaying;
                  return (
                    <div
                      key={i}
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-[10px] transition-all border ${
                        isPast
                          ? 'bg-emerald-900/60 border-emerald-400 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                          : isCurrent
                          ? (statusType === 'bang' ? 'bg-red-600 border-red-300 text-white animate-bounce' : 'bg-emerald-900/60 border-emerald-400 text-emerald-300')
                          : isTarget
                          ? 'bg-amber-500/30 border-amber-400 text-amber-300 scale-110 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                          : 'bg-black/60 border-red-500/30 text-gray-500'
                      }`}
                    >
                      {isPast ? '✓' : isCurrent ? (statusType === 'bang' ? '💀' : '✓') : i}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Current Multiplier */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs uppercase font-bold text-gray-400">Multiplier:</span>
            <span className="font-mono font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500">
              {currentMult.toFixed(2)}×
            </span>
          </div>

          {/* Status Message */}
          <div className="mt-3 px-4 py-2 rounded-xl bg-black/80 border border-red-500/30 text-center font-bold text-xs sm:text-sm max-w-md">
            <span className={statusType === 'bang' ? 'text-red-400' : statusType === 'win' ? 'text-emerald-400' : 'text-yellow-300'}>
              {statusMessage}
            </span>
          </div>

          {/* Cash Out Button */}
          {isPlaying && chamber > 0 && (
            <button
              onClick={() => handleCashOut()}
              className="btn-cashout-glow w-full max-w-sm mt-3 py-3 px-6 uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Sparkles size={16} />
              <span>TAKE CASH ₨ {currentCashoutVal.toFixed(0)}</span>
              <span className="font-mono text-xs opacity-90">({currentMult.toFixed(2)}×)</span>
            </button>
          )}

        </div>

        {/* Action Trigger Button */}
        <div className="w-full max-w-md">
          <button
            onClick={handlePullTrigger}
            className="btn-trigger-glow w-full py-4 px-8 text-base uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <span>{isPlaying ? `PULL AGAIN (CHAMBER ${chamber + 1}/6) 🔫` : 'PULL TRIGGER 🔫'}</span>
          </button>
        </div>

        {/* History Bar */}
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="text-[10px] uppercase font-bold text-gray-500">History:</span>
            {history.map((h, i) => (
              <span
                key={i}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  h.result === 'SURVIVED'
                    ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-950/80 border-red-500/40 text-red-300'
                }`}
              >
                {h.result === 'SURVIVED' ? `CH ${h.ch} ✓` : `CH ${h.ch} 💀`}
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
        disabled={isPlaying}
        maxBalance={balance}
      />

      {/* RULES MODAL */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#140409] border border-red-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowRulesModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/40 hover:bg-black/80 text-gray-400 hover:text-white"
            >
              <X size={18} />
            </button>
            <h3 className="font-display font-black text-xl text-yellow-400 mb-3 flex items-center gap-2">
              <ShieldAlert size={20} /> Russian Chamber VIP Rules
            </h3>
            <div className="space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>• The revolver cylinder contains <b>6 chambers</b> with <b>1 live bullet</b>.</p>
              <p>• Pull the trigger to advance the chamber. Each empty chamber survived increases your multiplier:</p>
              <div className="bg-black/50 p-3 rounded-2xl border border-red-500/30 font-mono text-[11px] text-amber-300 space-y-1.5">
                <div className="flex justify-between"><span>Chamber 1:</span> <b className="text-white">1.20×</b></div>
                <div className="flex justify-between"><span>Chamber 2:</span> <b className="text-white">1.60×</b></div>
                <div className="flex justify-between"><span>Chamber 3:</span> <b className="text-white">2.50×</b></div>
                <div className="flex justify-between"><span>Chamber 4:</span> <b className="text-white">4.50×</b></div>
                <div className="flex justify-between text-yellow-400 font-bold"><span>Chamber 5:</span> <b>15.00× JACKPOT!</b></div>
              </div>
              <p>• <b>Take Cash:</b> Walk away with your profit anytime after surviving any chamber.</p>
            </div>
            <button
              onClick={() => setShowRulesModal(false)}
              className="w-full mt-5 py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold text-xs"
            >
              Understood, Let's Play!
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
