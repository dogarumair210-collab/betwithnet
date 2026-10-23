import React from 'react';
import { X, Volume2, Monitor, Shield, Zap, Sparkles } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  soundVolume = 80,
  onVolumeChange,
  soundEffects = true,
  onToggleSoundEffects,
  autoFireRate = 350,
  onChangeAutoFireRate,
  graphicsQuality = 'high',
  onChangeGraphicsQuality
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#051c33] via-[#021020] to-[#010810] border border-cyan-400/40 rounded-3xl shadow-[0_0_40px_rgba(0,168,243,0.3)] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white font-mono tracking-wide">
              GAME SETTINGS
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-all active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 space-y-5 font-mono text-sm">
          {/* Sound FX Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-200">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Sound Effects</span>
            </div>
            <button
              onClick={() => onToggleSoundEffects(!soundEffects)}
              className={`w-12 h-6 rounded-full transition-all flex items-center p-0.5 ${
                soundEffects ? 'bg-cyan-500 justify-end' : 'bg-gray-700 justify-start'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Volume</span>
              <span className="font-bold text-cyan-300">{soundVolume}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={soundVolume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full accent-cyan-400 bg-gray-700 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* Auto Fire Rate */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-gray-200">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Auto-Fire Speed</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { label: 'Normal (300ms)', value: 300 },
                { label: 'Fast (200ms)', value: 200 },
                { label: 'Turbo (120ms)', value: 120 }
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => onChangeAutoFireRate(item.value)}
                  className={`py-2 px-1 rounded-xl border text-center font-bold transition-all ${
                    autoFireRate === item.value
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                      : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-gray-200">
              <Monitor className="w-4 h-4 text-sky-400" />
              <span>Graphics Quality</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['high', 'medium'].map((q) => (
                <button
                  key={q}
                  onClick={() => onChangeGraphicsQuality(q)}
                  className={`py-2 px-3 rounded-xl border uppercase font-bold transition-all ${
                    graphicsQuality === q
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_10px_rgba(0,247,255,0.5)]'
                      : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/30 hover:bg-cyan-900/50'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-500/20 bg-cyan-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all active:scale-95"
          >
            SAVE
          </button>
        </div>

      </div>
    </div>
  );
}
