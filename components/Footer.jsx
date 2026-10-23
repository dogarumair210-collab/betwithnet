import React, { useState } from 'react';
import { 
  Crosshair, 
  Zap, 
  Minus, 
  Plus, 
  Snowflake, 
  Bomb, 
  Sparkles, 
  Play, 
  Square,
  Target
} from 'lucide-react';

const BET_OPTIONS = [16, 32, 80, 160, 320, 800, 1600];

export default function Footer({
  currentBet = 16,
  onBetChange,
  isAutoFiring = false,
  onToggleAutoFire,
  isLockTarget = false,
  onToggleLockTarget,
  selectedWeapon = 'normal',
  onSelectWeapon,
  onManualShoot,
  canShoot = true,
  turretAngle = 0
}) {
  const [showChipSelector, setShowChipSelector] = useState(false);

  // Increase Bet
  const handleIncrease = () => {
    const idx = BET_OPTIONS.indexOf(currentBet);
    if (idx !== -1 && idx < BET_OPTIONS.length - 1) {
      onBetChange(BET_OPTIONS[idx + 1]);
    } else if (idx === -1) {
      const next = BET_OPTIONS.find(b => b > currentBet);
      if (next) onBetChange(next);
    }
  };

  // Decrease Bet (Strict minimum 16 PKR)
  const handleDecrease = () => {
    const idx = BET_OPTIONS.indexOf(currentBet);
    if (idx > 0) {
      onBetChange(BET_OPTIONS[idx - 1]);
    } else if (idx === -1) {
      const prev = [...BET_OPTIONS].reverse().find(b => b < currentBet);
      if (prev && prev >= 16) onBetChange(prev);
    }
  };

  return (
    <footer className="relative z-30 w-full px-2 sm:px-6 py-2 pb-3 bg-gradient-to-t from-[#020b14]/98 via-[#04192f]/92 to-transparent border-t border-cyan-500/25 backdrop-blur-md select-none">
      <div className="max-w-7xl mx-auto flex items-end justify-between gap-2 sm:gap-4">
        
        {/* LEFT: Special Weapons & Skill Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#031526]/85 p-1.5 rounded-2xl border border-cyan-500/30 shadow-lg">
          {/* Normal Laser Bullet */}
          <button
            onClick={() => onSelectWeapon('normal')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold font-mono ${
              selectedWeapon === 'normal'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_0_12px_rgba(0,247,255,0.6)] border border-cyan-300'
                : 'bg-cyan-950/40 text-cyan-300 hover:bg-cyan-900/40 border border-transparent'
            }`}
            title="Standard Torpedo (1x Cost)"
          >
            <Zap className="w-4 h-4 text-cyan-300" />
            <span className="hidden sm:inline">TORPEDO</span>
          </button>

          {/* Ice / Frost Net (Freeze) */}
          <button
            onClick={() => onSelectWeapon('freeze')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold font-mono ${
              selectedWeapon === 'freeze'
                ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_0_14px_rgba(56,197,255,0.7)] border border-sky-200'
                : 'bg-cyan-950/40 text-sky-300 hover:bg-cyan-900/40 border border-transparent'
            }`}
            title="Frost Wave: Freezes fish movement (2x Bet)"
          >
            <Snowflake className="w-4 h-4 text-sky-200 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="hidden sm:inline">FREEZE</span>
          </button>

          {/* Deep Sea Torpedo Bomb (AoE) */}
          <button
            onClick={() => onSelectWeapon('bomb')}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-xs font-bold font-mono ${
              selectedWeapon === 'bomb'
                ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-[0_0_14px_rgba(255,153,0,0.7)] border border-amber-300'
                : 'bg-cyan-950/40 text-amber-300 hover:bg-cyan-900/40 border border-transparent'
            }`}
            title="Depth Charge Bomb: Blast AoE Radius (3x Bet)"
          >
            <Bomb className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">BOMB</span>
          </button>
        </div>

        {/* CENTER: Turret Mount + Bet Adjuster */}
        <div className="flex flex-col items-center justify-center relative -top-3">
          {/* Animated Cannon Gun Visualization */}
          <div className="relative w-20 h-16 flex items-end justify-center pointer-events-none">
            {/* Cannon Base Ring */}
            <div className="absolute bottom-0 w-16 h-8 bg-gradient-to-t from-gray-900 via-cyan-950 to-cyan-800 rounded-t-full border-t-2 border-x-2 border-cyan-400 shadow-[0_0_15px_rgba(0,247,255,0.5)] flex items-center justify-center">
              <div className="w-8 h-4 bg-cyan-400/30 rounded-t-full"></div>
            </div>
            
            {/* Rotating Cannon Turret Barrel */}
            <div 
              className="w-5 h-12 bg-gradient-to-t from-cyan-600 via-blue-500 to-cyan-300 rounded-t-md border border-cyan-200 shadow-[0_0_10px_rgba(0,247,255,0.8)] origin-bottom transition-transform duration-75"
              style={{ transform: `rotate(${turretAngle}deg)` }}
            >
              <div className="w-full h-2 bg-white rounded-t-sm shadow-[0_0_8px_#fff]"></div>
            </div>
          </div>

          {/* Bet Selector Bar */}
          <div className="flex items-center gap-2 bg-[#041a30]/95 px-3 py-1.5 rounded-2xl border border-cyan-500/40 shadow-xl backdrop-blur-md">
            {/* Decrease Bet */}
            <button
              onClick={handleDecrease}
              disabled={currentBet <= 16}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 font-bold ${
                currentBet <= 16
                  ? 'bg-gray-800/60 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300 shadow-sm'
              }`}
              title="Decrease Bet (Min 16 PKR)"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Current Bet Display (Click to open quick chip drawer) */}
            <div 
              onClick={() => setShowChipSelector(!showChipSelector)}
              className="cursor-pointer px-3 py-0.5 flex flex-col items-center justify-center rounded-xl bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 transition-all"
              title="Click to select chip"
            >
              <span className="text-[9px] uppercase font-bold text-cyan-300/80 font-mono tracking-wider">
                BET
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base sm:text-lg font-black text-amber-400 font-mono tracking-tight text-glow-gold">
                  {currentBet}
                </span>
                <span className="text-[10px] font-bold text-amber-300">PKR</span>
              </div>
            </div>

            {/* Increase Bet */}
            <button
              onClick={handleIncrease}
              disabled={currentBet >= BET_OPTIONS[BET_OPTIONS.length - 1]}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all active:scale-90 font-bold ${
                currentBet >= BET_OPTIONS[BET_OPTIONS.length - 1]
                  ? 'bg-gray-800/60 border-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900 hover:border-cyan-300 shadow-sm'
              }`}
              title="Increase Bet"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Chip Dropup Panel */}
          {showChipSelector && (
            <div className="absolute bottom-16 flex items-center gap-1.5 p-2 bg-[#020b14]/95 border border-cyan-500/40 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
              {BET_OPTIONS.map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    onBetChange(val);
                    setShowChipSelector(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-mono text-xs font-black transition-all ${
                    currentBet === val
                      ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(255,215,0,0.8)]'
                      : 'bg-cyan-950/80 text-cyan-200 hover:bg-cyan-900 border border-cyan-500/30'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Targeting & Firing Modes (Auto Fire, Lock On, Shoot Button) */}
        <div className="flex items-center gap-2">
          {/* Lock Target Mode Button */}
          <button
            onClick={onToggleLockTarget}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 border text-xs sm:text-sm font-bold font-mono ${
              isLockTarget
                ? 'bg-red-600/90 text-white border-red-400 shadow-[0_0_18px_rgba(255,51,102,0.8)] animate-pulse'
                : 'bg-[#031526]/85 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/60 hover:border-cyan-400'
            }`}
            title="Auto-Target Lock On Mode"
          >
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="hidden sm:inline">LOCK</span>
          </button>

          {/* Auto Fire Button */}
          <button
            onClick={onToggleAutoFire}
            className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-1.5 sm:gap-2 transition-all active:scale-95 border text-xs sm:text-sm font-bold font-mono ${
              isAutoFiring
                ? 'bg-amber-500 text-black border-amber-300 shadow-[0_0_20px_rgba(255,215,0,0.8)] font-black'
                : 'bg-[#031526]/85 text-amber-300 border-cyan-500/30 hover:bg-cyan-900/60 hover:border-cyan-400'
            }`}
            title="Continuous Rapid Auto Shooting"
          >
            {isAutoFiring ? (
              <>
                <Square className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-amber-400" />
                <span>AUTO</span>
              </>
            )}
          </button>

          {/* Big Neon SHOOT Action Button */}
          <button
            onClick={onManualShoot}
            disabled={!canShoot}
            className={`px-5 py-2.5 sm:px-7 sm:py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-90 font-black font-arcade text-sm sm:text-base border shadow-xl ${
              canShoot
                ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-slate-950 border-cyan-200 shadow-[0_0_25px_rgba(0,247,255,0.7)] hover:shadow-[0_0_35px_rgba(0,247,255,1)] hover:brightness-110'
                : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>FIRE</span>
          </button>
        </div>

      </div>
    </footer>
  );
}
