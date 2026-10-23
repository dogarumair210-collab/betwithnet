import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Music,
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  Wallet, 
  Trophy, 
  Flame,
  ShieldCheck
} from 'lucide-react';

export default function Header({
  balance = 10000,
  currentStreak = 0,
  soundEnabled = true,
  musicEnabled = true,
  onToggleSound,
  onToggleMusic,
  onOpenRules,
  onBackToCasino
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pulseBalance, setPulseBalance] = useState(false);

  useEffect(() => {
    setPulseBalance(true);
    const t = setTimeout(() => setPulseBalance(false), 800);
    return () => clearTimeout(t);
  }, [balance]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleBack = () => {
    if (onBackToCasino) {
      onBackToCasino();
    } else {
      window.location.href = '../casino.html';
    }
  };

  return (
    <header className="relative z-30 w-full px-3 sm:px-6 py-3 flex items-center justify-between select-none bg-gradient-to-b from-[#07030d]/98 via-[#130722]/90 to-transparent backdrop-blur-md border-b border-purple-500/25 shadow-2xl">
      {/* LEFT: Back to Casino & Game Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-200 hover:text-white transition-all text-xs font-bold shadow-md hover:scale-105 active:scale-95"
          title="Back to Casino Lobby"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Casino</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-amber-500/30 text-base">
            ✊
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-sm sm:text-base tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow">
                ROCK PAPER SCISSORS
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-900/80 text-purple-300 border border-purple-500/40">
                VIP
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <ShieldCheck size={11} /> 98.0% RTP
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-amber-400/90 font-mono">Streak Ladder 30×</span>
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Current Streak Flame */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-purple-500/30">
        <Flame size={16} className={currentStreak > 0 ? "text-amber-400 animate-pulse" : "text-gray-500"} />
        <span className="text-xs font-bold text-gray-300">Streak:</span>
        <span className={`text-xs font-mono font-black ${currentStreak > 0 ? "text-amber-400" : "text-gray-400"}`}>
          {currentStreak} / 5
        </span>
      </div>

      {/* RIGHT: Balance Pill & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Wallet Balance Pill */}
        <div 
          className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-gradient-to-r from-purple-950/80 to-black/80 border border-yellow-500/40 shadow-lg shadow-yellow-500/10 transition-all ${
            pulseBalance ? 'scale-105 border-yellow-400 shadow-yellow-500/40' : ''
          }`}
        >
          <div className="w-5 h-5 rounded-full bg-yellow-500/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
            <Wallet size={12} />
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-bold leading-tight">
              Wallet
            </span>
            <span className="font-mono font-black text-xs sm:text-sm text-yellow-300">
              ₨ {Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Music BGM Toggle */}
        <button
          onClick={onToggleMusic}
          className={`p-2 rounded-xl border transition-all ${
            musicEnabled 
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900/60' 
              : 'bg-red-950/40 border-red-500/40 text-red-400 opacity-60'
          }`}
          title={musicEnabled ? "Mute Background Music" : "Play Background Music"}
        >
          <Music size={16} />
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-all ${
            soundEnabled 
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300 hover:text-white hover:bg-purple-900/60' 
              : 'bg-red-950/40 border-red-500/40 text-red-400'
          }`}
          title={soundEnabled ? "Mute Sound Effects" : "Enable Sound Effects"}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Rules Modal */}
        <button
          onClick={onOpenRules}
          className="p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all shadow-md"
          title="Game Rules & Payouts"
        >
          <HelpCircle size={16} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="hidden sm:flex p-2 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all shadow-md"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </header>
  );
}
