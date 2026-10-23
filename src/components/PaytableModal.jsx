import React from 'react';
import { X, Award, ShieldCheck, Flame, Zap } from 'lucide-react';

const BASE_URL = 'https://static.mascot.games/mascotGaming/hook_up_fishing_wars/';

const FISH_PAYTABLE = [
  { name: 'Goldfish', mult: '2x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-1.png` },
  { name: 'Tropical Tang', mult: '3x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-2.png` },
  { name: 'Clownfish', mult: '4x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-3.png` },
  { name: 'Striped Perch', mult: '5x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-4.png` },
  { name: 'Blue Damsel', mult: '6x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-5.png` },
  { name: 'Neon Tetra', mult: '8x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-6.png` },
  { name: 'Butterflyfish', mult: '10x', type: 'Small', img: `${BASE_URL}assets/fishes/small/small-7.png` },
  { name: 'Spotted Puffer', mult: '15x', type: 'Medium', img: `${BASE_URL}assets/fishes/medium/med-1.png` },
  { name: 'Lionfish', mult: '20x', type: 'Medium', img: `${BASE_URL}assets/fishes/medium/med-2.png` },
  { name: 'Anglerfish', mult: '30x', type: 'Medium', img: `${BASE_URL}assets/fishes/medium/med-3.png` },
  { name: 'Swordfish', mult: '45x', type: 'Medium', img: `${BASE_URL}assets/fishes/medium/med-4.png` },
  { name: 'Stingray', mult: '60x', type: 'Big', img: `${BASE_URL}assets/fishes/big/big-1.png` },
  { name: 'Hammerhead Shark', mult: '100x', type: 'Big', img: `${BASE_URL}assets/fishes/big/big-2.png` },
  { name: 'Ancient Sea Turtle', mult: '150x', type: 'Big', img: `${BASE_URL}assets/fishes/big/big-3.png` },
  { name: 'Golden Mermaid', mult: '250x', type: 'Big', img: `${BASE_URL}assets/fishes/big/big-4.png` },
  { name: 'Kraken Sea Monster', mult: '500x - 1,000x', type: 'Boss', img: `${BASE_URL}assets/fishes/boss_1/boss-1.png`, isBoss: true },
];

const ARTEFACTS = [
  { name: 'Sunken Pearl Urn', effect: 'Triggers 5s Frost Freeze', img: `${BASE_URL}assets/artefacts/art-1.png` },
  { name: 'Ancient Aztec Relic', effect: 'Triggers AoE Multi-Net Blast', img: `${BASE_URL}assets/artefacts/art-2.png` },
  { name: 'Treasure Chest', effect: 'Mystery Cash Multiplier (50x - 300x)', img: `${BASE_URL}assets/artefacts/art-3.png` },
  { name: 'Golden Trident', effect: 'Upgrades Cannon to Rapid Laser (Free)', img: `${BASE_URL}assets/artefacts/art-4.png` }
];

export default function PaytableModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-gradient-to-b from-[#051c33] via-[#021020] to-[#010810] border border-cyan-400/40 rounded-3xl shadow-[0_0_50px_rgba(0,168,243,0.3)] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-cyan-500/20 bg-cyan-950/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display tracking-wide flex items-center gap-2">
                HOOK UP! FISHING WARS <span className="text-amber-400 text-sm font-mono">PAYTABLE & RULES</span>
              </h2>
              <p className="text-xs text-cyan-300/80 font-mono">Mascot Gaming - Game ID 74928 - RTP 96.50%</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/60 transition-all active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Fish Hunter Hero Banner */}
          <div className="relative w-full h-32 sm:h-44 rounded-2xl overflow-hidden border border-cyan-400/40 shadow-lg">
            <img 
              src="/assets/covers/fishhunter.png" 
              alt="Fish Hunter Mascot Gaming" 
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = 'https://betwithnet.com/assets/covers/fishhunter.png'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#021020] via-transparent to-transparent flex items-end p-4">
              <div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/80 text-black font-black font-mono">1XBET OFFICIAL ARCHIVE #74928</span>
                <h3 className="text-base sm:text-lg font-black text-white font-display text-glow-cyan">HOOK UP! FISHING WARS</h3>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-black font-arcade text-cyan-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" /> Fish Species & Multipliers
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FISH_PAYTABLE.map((fish, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-2xl flex flex-col items-center justify-between border transition-all ${
                    fish.isBoss 
                      ? 'bg-gradient-to-b from-red-950/50 to-amber-950/50 border-amber-400/60 col-span-2 shadow-[0_0_15px_rgba(255,153,0,0.3)]' 
                      : 'bg-[#031526]/70 border-cyan-500/25 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="w-20 h-16 flex items-center justify-center mb-1">
                    <img 
                      src={fish.img} 
                      alt={fish.name} 
                      className="max-w-full max-h-full object-contain filter drop-shadow-[0_2px_8px_rgba(0,247,255,0.4)]"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div className="text-center w-full">
                    <span className="block text-[11px] font-bold text-gray-300 truncate">
                      {fish.name}
                    </span>
                    <span className={`block font-mono font-black text-sm ${fish.isBoss ? 'text-amber-400 text-base text-glow-gold' : 'text-cyan-300'}`}>
                      {fish.mult}
                    </span>
                    <span className="inline-block text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400/80 uppercase font-mono mt-0.5">
                      {fish.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Artefacts & Special Features */}
          <div>
            <h3 className="text-sm font-black font-arcade text-cyan-300 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" /> Deep Sea Artefacts & Bonus Mechanics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ARTEFACTS.map((art, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#031526]/80 border border-cyan-500/30">
                  <div className="w-14 h-14 rounded-xl bg-cyan-950/70 p-1 flex items-center justify-center border border-cyan-400/30">
                    <img 
                      src={art.img} 
                      alt={art.name} 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-300 font-mono">{art.name}</h4>
                    <p className="text-[11px] text-gray-300">{art.effect}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How to Play Rules */}
          <div className="p-4 rounded-2xl bg-[#020d1a]/80 border border-cyan-500/20 text-xs text-gray-300 space-y-2 font-mono">
            <h4 className="text-sm font-bold text-cyan-200 uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Game Rules & Payout Mechanics
            </h4>
            <p>1. Each shot consumes your selected bet amount (Minimum bet: 16 PKR).</p>
            <p>2. Tap or click anywhere on the ocean to aim and fire your cannon. You can also press SPACEBAR or the FIRE button.</p>
            <p>3. Use <strong className="text-cyan-300">LOCK ON</strong> to target higher-tier fish and bosses. Your cannon will lock onto the fish until defeated or it leaves the screen.</p>
            <p>4. Enable <strong className="text-amber-400">AUTO FIRE</strong> for continuous rapid barrage shooting.</p>
            <p>5. Winnings are automatically added to your active PKR wallet balance immediately upon capturing any fish.</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-cyan-500/20 bg-cyan-950/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-sm transition-all active:scale-95"
          >
            GOT IT
          </button>
        </div>

      </div>
    </div>
  );
}
