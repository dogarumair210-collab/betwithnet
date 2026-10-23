import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Settings, 
  HelpCircle, 
  Maximize2, 
  Minimize2, 
  ChevronLeft, 
  Coins, 
  Trophy, 
  Flame,
  ShieldCheck
} from 'lucide-react';

export default function Header({
  balance = 0,
  currentBet = 16,
  lastWin = 0,
  soundEnabled = true,
  onToggleSound,
  onOpenSettings,
  onOpenPaytable,
  onBackToLobby
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [winGlow, setWinGlow] = useState(false);

  // Trigger win glow animation when lastWin increases
  useEffect(() => {
    if (lastWin > 0) {
      setWinGlow(true);
      const timer = setTimeout(() => setWinGlow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [lastWin]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  const handleLobby = () => {
    if (onBackToLobby) {
      onBackToLobby();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className="relative z-30 w-full px-3 py-2 flex items-center justify-between select-none bg-gradient-to-b from-[#020b14]/95 via-[#031526]/85 to-transparent backdrop-blur-md border-b border-cyan-500/20 shadow-lg">
      {/* Left: Back button & Title/Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleLobby}
          className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 transition-all flex items-center justify-center shadow-sm"
          title="Back to Lobby"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            {/* Logo Badge with Fish Hunter Cover */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-900 p-[1.5px] shadow-[0_0_15px_rgba(0,247,255,0.5)] overflow-hidden">
              <img 
                src="/assets/covers/fishhunter.png" 
                alt="Fish Hunter Wars" 
                className="w-full h-full object-cover rounded-[9px]"
                onError={(e) => { e.currentTarget.src = 'https://betwithnet.com/assets/covers/fishhunter.png'; }}
              />
            </div>
            <div className="ml-2.5 leading-tight hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 font-arcade">
                  HOOK UP!
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  MASCOT
                </span>
              </div>
              <h1 className="text-sm font-black tracking-wider text-cyan-100 font-display">
                FISHING WARS
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Live Stats HUD (Balance, Shot Bet, Recent Win) */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Balance Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#041a30]/90 to-[#020d1a]/95 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,168,243,0.25)]">
          <div className="w-6 h-6 rounded-full bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-[0_0_8px_rgba(255,215,0,0.5)]">
            <Coins className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-bold text-cyan-300/80 font-mono tracking-wider leading-none">
              WALLET
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm sm:text-base font-black text-white font-mono tracking-tight text-glow-cyan">
                {Number(balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-amber-400">PKR</span>
            </div>
          </div>
        </div>

        {/* Current Shot Cost / Bet */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#041a30]/70 border border-cyan-500/25">
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-bold text-cyan-300/70 font-mono tracking-wider leading-none">
              SHOT BET
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-black text-cyan-200 font-mono">
                {Number(currentBet).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] font-bold text-cyan-400">PKR</span>
            </div>
          </div>
        </div>

        {/* Win Display */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl transition-all duration-300 ${
          winGlow 
            ? 'bg-gradient-to-r from-amber-500/30 to-yellow-600/30 border-amber-400 shadow-[0_0_25px_rgba(255,215,0,0.8)] scale-105' 
            : 'bg-[#041a30]/80 border-amber-500/30 shadow-[0_0_10px_rgba(255,190,0,0.15)]'
        } border`}>
          <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] uppercase font-bold text-amber-300/80 font-mono tracking-wider leading-none">
              LAST WIN
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-sm sm:text-base font-black font-mono tracking-tight ${winGlow ? 'text-amber-200 text-glow-gold' : 'text-amber-400'}`}>
                {Number(lastWin).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] font-bold text-amber-400">PKR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions (Paytable, Sound, Settings, Fullscreen, Provably Fair) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Provably Fair indicator badge */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>FAIR</span>
        </div>

        {/* Paytable & Rules Button */}
        <button
          onClick={onOpenPaytable}
          className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 transition-all shadow-sm"
          title="Game Rules & Paytable"
        >
          <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-all active:scale-95 shadow-sm ${
            soundEnabled 
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-300' 
              : 'bg-red-950/60 border-red-500/40 text-red-400 hover:text-red-200 hover:bg-red-900/60'
          }`}
          title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 transition-all shadow-sm"
          title="Game Settings"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 hover:border-cyan-400 active:scale-95 transition-all shadow-sm"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          ) : (
            <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
