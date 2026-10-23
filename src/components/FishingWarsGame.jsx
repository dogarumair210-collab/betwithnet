import React, { useRef, useEffect, useState, useCallback } from 'react';

const ASSET_BASE = 'https://static.mascot.games/mascotGaming/hook_up_fishing_wars/assets/';

// Fish configurations
const FISH_DEFS = [
  // Small fish
  { id: 's1', name: 'Goldfish', img: `${ASSET_BASE}fishes/small/small-1.png`, mult: 2, hp: 1, speed: 2.2, width: 48, height: 32 },
  { id: 's2', name: 'Tang', img: `${ASSET_BASE}fishes/small/small-2.png`, mult: 3, hp: 2, speed: 2.0, width: 52, height: 34 },
  { id: 's3', name: 'Clownfish', img: `${ASSET_BASE}fishes/small/small-3.png`, mult: 4, hp: 2, speed: 1.9, width: 56, height: 36 },
  { id: 's4', name: 'Perch', img: `${ASSET_BASE}fishes/small/small-4.png`, mult: 5, hp: 3, speed: 1.8, width: 58, height: 38 },
  { id: 's5', name: 'Damsel', img: `${ASSET_BASE}fishes/small/small-5.png`, mult: 6, hp: 3, speed: 1.7, width: 62, height: 40 },
  { id: 's6', name: 'Tetra', img: `${ASSET_BASE}fishes/small/small-6.png`, mult: 8, hp: 4, speed: 1.6, width: 66, height: 42 },
  { id: 's7', name: 'Butterfly', img: `${ASSET_BASE}fishes/small/small-7.png`, mult: 10, hp: 5, speed: 1.5, width: 72, height: 48 },
  
  // Medium fish
  { id: 'm1', name: 'Puffer', img: `${ASSET_BASE}fishes/medium/med-1.png`, mult: 15, hp: 7, speed: 1.3, width: 85, height: 58 },
  { id: 'm2', name: 'Lionfish', img: `${ASSET_BASE}fishes/medium/med-2.png`, mult: 20, hp: 9, speed: 1.2, width: 95, height: 65 },
  { id: 'm3', name: 'Anglerfish', img: `${ASSET_BASE}fishes/medium/med-3.png`, mult: 30, hp: 12, speed: 1.1, width: 105, height: 72 },
  { id: 'm4', name: 'Swordfish', img: `${ASSET_BASE}fishes/medium/med-4.png`, mult: 45, hp: 16, speed: 1.4, width: 120, height: 60 },

  // Big fish
  { id: 'b1', name: 'Stingray', img: `${ASSET_BASE}fishes/big/big-1.png`, mult: 60, hp: 22, speed: 0.9, width: 140, height: 110 },
  { id: 'b2', name: 'Shark', img: `${ASSET_BASE}fishes/big/big-2.png`, mult: 100, hp: 30, speed: 1.0, width: 160, height: 80 },
  { id: 'b3', name: 'Sea Turtle', img: `${ASSET_BASE}fishes/big/big-3.png`, mult: 150, hp: 40, speed: 0.8, width: 150, height: 110 },

  // Boss
  { id: 'boss1', name: 'Kraken', img: `${ASSET_BASE}fishes/boss_1/boss-1.png`, mult: 500, hp: 80, speed: 0.65, width: 220, height: 160, isBoss: true }
];

export default function FishingWarsGame({
  balance,
  currentBet,
  onDeductBet,
  onAddWin,
  isAutoFiring,
  isLockTarget,
  selectedWeapon,
  turretAngle,
  setTurretAngle,
  soundEnabled,
  soundVolume
}) {
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioCacheRef = useRef({});
  const imageCacheRef = useRef({});

  // Game internal state
  const gameStateRef = useRef({
    fishes: [],
    bullets: [],
    particles: [],
    floatingTexts: [],
    lockedTarget: null,
    aimX: 0,
    aimY: 0,
    lastShootTime: 0,
    frozenUntil: 0,
    bossAlert: false,
    nextFishSpawn: 0
  });

  // Sound helper using HTMLAudioElement with cached audio or WebAudio fallback
  const playSound = useCallback((soundName) => {
    if (!soundEnabled) return;
    try {
      const vol = (soundVolume || 80) / 100;
      const soundFileMap = {
        shot: `${ASSET_BASE}audio/shot.mp3`,
        hit: `${ASSET_BASE}audio/hit.mp3`,
        kill: `${ASSET_BASE}audio/kill.mp3`,
        win: `${ASSET_BASE}audio/win_1.mp3`,
        freeze: `${ASSET_BASE}audio/fishFreeze.mp3`,
        power: `${ASSET_BASE}audio/upgradeGun.mp3`
      };

      const url = soundFileMap[soundName] || soundFileMap.shot;
      let audio = audioCacheRef.current[url];
      if (!audio) {
        audio = new Audio(url);
        audioCacheRef.current[url] = audio;
      }
      const clone = audio.cloneNode();
      clone.volume = vol;
      clone.play().catch(() => {});
    } catch (e) {
      // Audio autoplay restrictions or errors
    }
  }, [soundEnabled, soundVolume]);

  // Preload Images
  useEffect(() => {
    // Background
    const bgImg = new Image();
    bgImg.src = `${ASSET_BASE}bg.jpg`;
    imageCacheRef.current['bg'] = bgImg;

    // Bullet
    const bulletImg = new Image();
    bulletImg.src = `${ASSET_BASE}gun/bullet.png`;
    imageCacheRef.current['bullet'] = bulletImg;

    // Preload Fish sprites
    FISH_DEFS.forEach((f) => {
      const img = new Image();
      img.src = f.img;
      imageCacheRef.current[f.id] = img;
    });
  }, []);

  // Spawn a fish
  const spawnFish = (canvas, forceBoss = false) => {
    const isBoss = forceBoss || (Math.random() < 0.05 && !gameStateRef.current.fishes.some(f => f.isBoss));
    let fishDef;
    if (isBoss) {
      fishDef = FISH_DEFS.find(f => f.isBoss);
      gameStateRef.current.bossAlert = true;
      setTimeout(() => { gameStateRef.current.bossAlert = false; }, 3000);
    } else {
      const pool = FISH_DEFS.filter(f => !f.isBoss);
      fishDef = pool[Math.floor(Math.random() * pool.length)];
    }

    const fromLeft = Math.random() > 0.5;
    const startX = fromLeft ? -fishDef.width : canvas.width + fishDef.width;
    const startY = 80 + Math.random() * (canvas.height - 240);
    const speed = (fromLeft ? 1 : -1) * (fishDef.speed * (0.8 + Math.random() * 0.4));

    gameStateRef.current.fishes.push({
      ...fishDef,
      uniqueId: Math.random().toString(36).substring(2, 9),
      x: startX,
      y: startY,
      vx: speed,
      vy: (Math.random() - 0.5) * 0.6,
      currentHp: fishDef.hp,
      maxHp: fishDef.hp,
      hitFlash: 0,
      swimPhase: Math.random() * Math.PI * 2,
      facingRight: fromLeft
    });
  };

  // Shoot Bullet Logic
  const fireBullet = useCallback((targetAngle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (balance < currentBet) {
      // Insufficient balance
      return;
    }

    // Deduct bet
    if (onDeductBet) {
      onDeductBet(currentBet);
    }

    const cannonX = canvas.width / 2;
    const cannonY = canvas.height - 35;
    
    // Convert angle to velocity vector
    const rad = ((targetAngle - 90) * Math.PI) / 180;
    const speed = 16;
    const vx = Math.cos(rad) * speed;
    const vy = Math.sin(rad) * speed;

    gameStateRef.current.bullets.push({
      x: cannonX + Math.cos(rad) * 45,
      y: cannonY + Math.sin(rad) * 45,
      vx,
      vy,
      angle: targetAngle,
      weapon: selectedWeapon,
      betAmount: currentBet,
      targetFishId: gameStateRef.current.lockedTarget ? gameStateRef.current.lockedTarget.uniqueId : null
    });

    playSound(selectedWeapon === 'bomb' ? 'power' : 'shot');
  }, [balance, currentBet, onDeductBet, selectedWeapon, playSound]);

  // Handle Canvas Click / Tap to Shoot & Target Selection
  const handleCanvasInteraction = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const clickY = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;

    gameStateRef.current.aimX = clickX;
    gameStateRef.current.aimY = clickY;

    // Check if clicked directly on a fish to lock-on
    const clickedFish = gameStateRef.current.fishes.find(f => {
      return (
        clickX >= f.x - f.width / 2 &&
        clickX <= f.x + f.width / 2 &&
        clickY >= f.y - f.height / 2 &&
        clickY <= f.y + f.height / 2
      );
    });

    if (clickedFish && isLockTarget) {
      gameStateRef.current.lockedTarget = clickedFish;
      playSound('hit');
    }

    // Calculate angle towards click
    const cannonX = canvas.width / 2;
    const cannonY = canvas.height - 35;
    const deltaX = clickX - cannonX;
    const deltaY = clickY - cannonY;
    const angleDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90;

    setTurretAngle(angleDeg);
    fireBullet(angleDeg);
  };

  // Mouse Move tracking for Aiming
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gameStateRef.current.aimX = x;
    gameStateRef.current.aimY = y;

    if (!gameStateRef.current.lockedTarget) {
      const cannonX = canvas.width / 2;
      const cannonY = canvas.height - 35;
      const deltaX = x - cannonX;
      const deltaY = y - cannonY;
      const angleDeg = (Math.atan2(deltaY, deltaX) * 180) / Math.PI + 90;
      setTurretAngle(angleDeg);
    }
  };

  // Auto-Fire Interval
  useEffect(() => {
    if (!isAutoFiring) return;
    const interval = setInterval(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      let angle = turretAngle;
      if (gameStateRef.current.lockedTarget) {
        const target = gameStateRef.current.lockedTarget;
        const cannonX = canvas.width / 2;
        const cannonY = canvas.height - 35;
        angle = (Math.atan2(target.y - cannonY, target.x - cannonX) * 180) / Math.PI + 90;
        setTurretAngle(angle);
      }
      fireBullet(angle);
    }, 280);

    return () => clearInterval(interval);
  }, [isAutoFiring, turretAngle, fireBullet, setTurretAngle]);

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize Handler
    const handleResize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Initial fish population
    for (let i = 0; i < 9; i++) {
      spawnFish(canvas);
      if (gameStateRef.current.fishes[i]) {
        gameStateRef.current.fishes[i].x = Math.random() * canvas.width;
      }
    }

    let animationFrameId;

    const gameLoop = (timestamp) => {
      // 1. CLEAR & DRAW BACKGROUND
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const bgImg = imageCacheRef.current['bg'];
      if (bgImg && bgImg.complete) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
      } else {
        // Deep sea aquatic gradient fallback
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#041d38');
        grad.addColorStop(0.5, '#021226');
        grad.addColorStop(1, '#010810');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Caustic ambient light overlay
      ctx.fillStyle = 'rgba(0, 247, 255, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Boss Alert Flashing Warning
      if (gameStateRef.current.bossAlert) {
        ctx.fillStyle = `rgba(255, 51, 102, ${0.12 + Math.sin(timestamp / 100) * 0.08})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = 'bold 24px "Orbitron", sans-serif';
        ctx.fillStyle = '#ff3366';
        ctx.textAlign = 'center';
        ctx.fillText('⚠ BOSS APPROACHING: ANCIENT KRAKEN! ⚠', canvas.width / 2, 70);
      }

      // 2. SPAWN NEW FISH IF NEEDED
      if (gameStateRef.current.fishes.length < 14 && timestamp > gameStateRef.current.nextFishSpawn) {
        spawnFish(canvas);
        gameStateRef.current.nextFishSpawn = timestamp + 1200 + Math.random() * 1500;
      }

      // Check if locked target is still valid
      if (gameStateRef.current.lockedTarget) {
        const stillAlive = gameStateRef.current.fishes.some(f => f.uniqueId === gameStateRef.current.lockedTarget.uniqueId);
        if (!stillAlive) {
          gameStateRef.current.lockedTarget = null;
        } else {
          // Smoothly track locked target angle
          const t = gameStateRef.current.lockedTarget;
          const cannonX = canvas.width / 2;
          const cannonY = canvas.height - 35;
          const targetAngle = (Math.atan2(t.y - cannonY, t.x - cannonX) * 180) / Math.PI + 90;
          setTurretAngle(targetAngle);
        }
      }

      // 3. UPDATE & DRAW FISH
      const isFrozen = timestamp < gameStateRef.current.frozenUntil;

      gameStateRef.current.fishes.forEach((fish, fIdx) => {
        if (!isFrozen) {
          fish.swimPhase += 0.05;
          fish.x += fish.vx;
          fish.y += fish.vy + Math.sin(fish.swimPhase) * 0.4;
        }

        // Draw fish sprite
        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (!fish.facingRight) {
          ctx.scale(-1, 1);
        }

        const fishImg = imageCacheRef.current[fish.id];
        if (fishImg && fishImg.complete) {
          if (fish.hitFlash > 0) {
            ctx.filter = 'brightness(2.5) contrast(1.5)';
            fish.hitFlash--;
          }
          if (isFrozen) {
            ctx.filter = 'hue-rotate(180deg) brightness(1.3)';
          }
          ctx.drawImage(fishImg, -fish.width / 2, -fish.height / 2, fish.width, fish.height);
          ctx.filter = 'none';
        } else {
          // Fallback colored oval
          ctx.fillStyle = fish.isBoss ? '#ff3366' : '#00f7ff';
          ctx.beginPath();
          ctx.ellipse(0, 0, fish.width / 2, fish.height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Draw Multiplier Badge
        ctx.save();
        ctx.font = 'bold 11px "Orbitron", monospace';
        ctx.fillStyle = fish.isBoss ? '#ffd700' : '#d5f4ff';
        ctx.textAlign = 'center';
        ctx.fillText(`${fish.mult}x`, fish.x, fish.y - fish.height / 2 - 4);
        ctx.restore();

        // Draw Locked Target Reticle
        if (gameStateRef.current.lockedTarget && gameStateRef.current.lockedTarget.uniqueId === fish.uniqueId) {
          ctx.save();
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(fish.x, fish.y, Math.max(fish.width, fish.height) * 0.65, 0, Math.PI * 2);
          ctx.stroke();

          // Crosshairs
          const r = Math.max(fish.width, fish.height) * 0.65;
          ctx.beginPath();
          ctx.moveTo(fish.x - r - 8, fish.y);
          ctx.lineTo(fish.x + r + 8, fish.y);
          ctx.moveTo(fish.x, fish.y - r - 8);
          ctx.lineTo(fish.x, fish.y + r + 8);
          ctx.stroke();
          ctx.restore();
        }
      });

      // Filter out off-screen fish
      gameStateRef.current.fishes = gameStateRef.current.fishes.filter(f => {
        return f.x > -f.width * 2 && f.x < canvas.width + f.width * 2;
      });

      // 4. UPDATE & DRAW BULLETS
      const bulletImg = imageCacheRef.current['bullet'];

      gameStateRef.current.bullets.forEach((bullet, bIdx) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Draw Bullet
        ctx.save();
        ctx.translate(bullet.x, bullet.y);
        ctx.rotate((bullet.angle * Math.PI) / 180);

        if (bulletImg && bulletImg.complete) {
          ctx.drawImage(bulletImg, -8, -14, 16, 28);
        } else {
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#00f7ff';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // Collision Check with Fish
        for (let i = 0; i < gameStateRef.current.fishes.length; i++) {
          const fish = gameStateRef.current.fishes[i];
          const dist = Math.hypot(bullet.x - fish.x, bullet.y - fish.y);

          if (dist < Math.max(fish.width, fish.height) * 0.45) {
            // Hit!
            fish.currentHp--;
            fish.hitFlash = 3;
            playSound('hit');

            // Spawn Impact Particles (Bubbles & Sparks)
            for (let p = 0; p < 6; p++) {
              gameStateRef.current.particles.push({
                x: bullet.x,
                y: bullet.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                alpha: 1,
                color: '#00f7ff',
                size: 3 + Math.random() * 3
              });
            }

            // Check if killed
            if (fish.currentHp <= 0) {
              const winAmount = bullet.betAmount * fish.mult;
              if (onAddWin) {
                onAddWin(winAmount);
              }
              playSound('win');

              // Floating Win Text
              gameStateRef.current.floatingTexts.push({
                text: `+${winAmount} PKR`,
                x: fish.x,
                y: fish.y,
                alpha: 1,
                color: fish.isBoss ? '#ffd700' : '#00f7ff',
                scale: fish.isBoss ? 1.5 : 1
              });

              // Remove fish
              gameStateRef.current.fishes.splice(i, 1);
            }

            // Remove bullet
            gameStateRef.current.bullets.splice(bIdx, 1);
            break;
          }
        }
      });

      // Filter off-screen bullets
      gameStateRef.current.bullets = gameStateRef.current.bullets.filter(b => {
        return b.x >= 0 && b.x <= canvas.width && b.y >= 0 && b.y <= canvas.height;
      });

      // 5. UPDATE & DRAW PARTICLES
      gameStateRef.current.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      gameStateRef.current.particles = gameStateRef.current.particles.filter(p => p.alpha > 0);

      // 6. UPDATE & DRAW FLOATING WIN TEXTS
      gameStateRef.current.floatingTexts.forEach((txt, idx) => {
        txt.y -= 1.2;
        txt.alpha -= 0.015;

        ctx.save();
        ctx.globalAlpha = Math.max(0, txt.alpha);
        ctx.font = `bold ${Math.floor(18 * txt.scale)}px "Orbitron", sans-serif`;
        ctx.fillStyle = txt.color;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText(txt.text, txt.x, txt.y);
        ctx.restore();
      });
      gameStateRef.current.floatingTexts = gameStateRef.current.floatingTexts.filter(t => t.alpha > 0);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [playSound, onAddWin, setTurretAngle]);

  return (
    <div 
      className="relative w-full h-full flex-1 overflow-hidden select-none cursor-crosshair"
      onMouseDown={handleCanvasInteraction}
      onMouseMove={handleMouseMove}
      onTouchStart={handleCanvasInteraction}
    >
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  );
}
