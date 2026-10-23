import React from 'react';
import { ShieldCheck, Lock, Award, RotateCcw } from 'lucide-react';

const PRESET_CHIPS = [
  { value: 100, label: '100', color: 'chip-100' },
  { value: 500, label: '500', color: 'chip-500' },
  { value: 1000, label: '1K', color: 'chip-1k' },
  { value: 5000, label: '5K', color: 'chip-5k' },
  { value: 10000, label: '10K', color: 'chip-10k' }
];

export default function Footer({
  betAmount = 100,
  onBetChange,
  disabled = false,
  maxBalance = 10000
}) {
  const handleModify = (mode) => {
    if (disabled) return;
    let next = betAmount;
    if (mode === 'half') {
      next = Math.max(10, Math.floor(betAmount / 2));
    } else if (mode === 'double') {
      next = Math.min(maxBalance, betAmount * 2);
    } else if (mode === 'max') {
      next = Math.min(maxBalance, 50000);
    } else if (mode === 'clear') {
      next = 100;
    }
    onBetChange(next);
  };

  return (
    <footer className="relative z-30 w-full px-3 sm:px-6 py-4 bg-gradient-to-t from-[#07030d] via-[#10061e] to-transparent border-t border-purple-500/20 backdrop-blur-md select-none">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        
        {/* TOP ROW: Quick Chip Selector & Modifiers */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-purple-950/40 p-3 rounded-2xl border border-purple-500/30">
          
          {/* Quick Chip Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider hidden sm:inline">
              Chips:
            </span>
            {PRESET_CHIPS.map((chip) => (
              <button
                key={chip.value}
                disabled={disabled}
                onClick={() => onBetChange(chip.value)}
                className={`casino-chip-btn ${chip.color} ${
                  betAmount === chip.value ? 'active' : ''
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={`Bet ₨ ${chip.value}`}
              >
                <span>₨</span>
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Modifiers */}
          <div className="flex items-center gap-1.5">
            <button
              disabled={disabled}
              onClick={() => handleModify('half')}
              className="px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-purple-900/60 border border-purple-500/30 text-xs font-mono font-bold text-gray-300 hover:text-white transition-all disabled:opacity-40"
              title="Half Bet"
            >
              ½
            </button>
            <button
              disabled={disabled}
              onClick={() => handleModify('double')}
              className="px-2.5 py-1.5 rounded-lg bg-black/50 hover:bg-purple-900/60 border border-purple-500/30 text-xs font-mono font-bold text-gray-300 hover:text-white transition-all disabled:opacity-40"
              title="Double Bet"
            >
              2×
            </button>
            <button
              disabled={disabled}
              onClick={() => handleModify('max')}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-500 hover:to-yellow-500 border border-yellow-400/40 text-xs font-mono font-black text-black transition-all disabled:opacity-40 shadow-sm"
              title="Max Bet"
            >
              MAX
            </button>
            <button
              disabled={disabled}
              onClick={() => handleModify('clear')}
              className="p-1.5 rounded-lg bg-black/50 hover:bg-red-950/60 border border-red-500/30 text-xs font-bold text-gray-400 hover:text-red-400 transition-all disabled:opacity-40"
              title="Reset to ₨ 100"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: Provably Fair & Casino Trust Badges */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 border-t border-purple-900/40 pt-3 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <ShieldCheck size={13} /> Provably Fair SHA-256
            </span>
            <span className="hidden sm:inline text-gray-600">|</span>
            <span className="hidden sm:flex items-center gap-1 text-purple-300">
              <Lock size={12} /> SSL 256-Bit Encrypted
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono text-[10px]">
              GAME #88492
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px]">
              18+ ONLY
            </span>
            <span className="text-gray-500">© Bet With Net VIP</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
