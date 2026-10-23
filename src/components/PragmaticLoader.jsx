import React, { useState, useEffect } from 'react';

export default function PragmaticLoader({ onLoaded }) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  useEffect(() => {
    let currentPct = 0;
    let timer = null;

    const step = () => {
      if (currentPct < 30) {
        currentPct += Math.floor(Math.random() * 8) + 14;
      } else if (currentPct < 70) {
        currentPct += Math.floor(Math.random() * 10) + 12;
      } else if (currentPct < 95) {
        currentPct += Math.floor(Math.random() * 8) + 8;
      } else {
        currentPct = 100;
      }

      if (currentPct > 100) currentPct = 100;
      setProgress(currentPct);

      if (currentPct < 100) {
        const delay = currentPct > 60 ? (Math.random() * 80 + 60) : (Math.random() * 50 + 35);
        timer = setTimeout(step, delay);
      } else {
        setTimeout(() => {
          setIsFading(true);
          if (onLoaded) onLoaded();
          setTimeout(() => {
            setIsRemoved(true);
          }, 500);
        }, 200);
      }
    };

    timer = setTimeout(step, 50);

    // Fallback safety timeout
    const fallbackTimer = setTimeout(() => {
      setProgress(100);
      setIsFading(true);
      if (onLoaded) onLoaded();
      setTimeout(() => setIsRemoved(true), 500);
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [onLoaded]);

  if (isRemoved) return null;

  return (
    <div
      className={`fixed inset-0 w-screen h-screen bg-black z-[2147483647] flex items-center justify-center transition-opacity duration-500 pointer-events-auto select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center gap-3.5 w-full max-w-[240px] p-4">
        {/* Pragmatic Play Official Loading Graphic */}
        <div className="w-full max-w-[165px] flex items-center justify-center">
          <img
            src="../assets/games/card/ui/pragmatic_play_loading.png?v=official_hd"
            alt="Pragmatic Play"
            className="w-full max-w-[165px] h-auto drop-shadow-[0_0_8px_rgba(255,122,0,0.3)]"
          />
        </div>

        {/* Yellow/Amber Glowing Progress Bar Track */}
        <div className="w-full max-w-[180px] h-[3.5px] bg-white/10 rounded-full overflow-hidden relative shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#ff9500] via-[#ffb700] to-[#ffd000] rounded-full transition-all duration-150 ease-out shadow-[0_0_10px_rgba(255,190,0,0.9)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
