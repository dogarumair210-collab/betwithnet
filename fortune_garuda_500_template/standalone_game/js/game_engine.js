/**
 * Fortune Garuda 500 - Official Slot Math & Reel Engine
 * TaDa Gaming / JILI VIP Specification
 */

class FortuneGarudaEngine {
    constructor() {
        this.baseBets = [1, 2, 3, 5, 10, 20, 50, 100, 200, 500, 1000];
        this.betIndex = 2; // Default PKR 3.00
        this.extraBetActive = false;
        this.isSpinning = false;
        this.isTurbo = false;
        this.isAuto = false;
        this.autoSpinCount = 0;
        
        // Symbols definition
        this.symbols = {
            garuda_wild: { name: 'Garuda Wild', file: 'tile_wild_3d.png', pay: 25, isWild: true },
            ruby:        { name: 'Ruby Phoenix', file: 'tile_ruby.png', pay: 20 },
            sapphire:    { name: 'Sapphire Bird', file: 'tile_sapphire.png', pay: 15 },
            emerald:     { name: 'Emerald Claw', file: 'tile_emerald.png', pay: 10 },
            sym_a:       { name: 'Ace', file: 'sym_a.png', pay: 5 },
            sym_k:       { name: 'King', file: 'sym_k.png', pay: 3 },
            sym_q:       { name: 'Queen', file: 'sym_q.png', pay: 2 },
            sym_j:       { name: 'Jack', file: 'tile_j.png', pay: 1 }
        };

        this.symbolKeys = ['garuda_wild', 'ruby', 'sapphire', 'emerald', 'sym_a', 'sym_k', 'sym_q', 'sym_j'];

        // 5 Standard Paylines across 3x3 Grid [col, row] (0-indexed, row 0=top, 1=mid, 2=bot)
        this.paylines = [
            { id: 1, name: 'Middle Row',  coords: [[0,1], [1,1], [2,1]], color: '#ffd700' },
            { id: 2, name: 'Top Row',     coords: [[0,0], [1,0], [2,0]], color: '#ff334b' },
            { id: 3, name: 'Bottom Row',  coords: [[0,2], [1,2], [2,2]], color: '#00e676' },
            { id: 4, name: 'Diagonal ↘',  coords: [[0,0], [1,1], [2,2]], color: '#00b0ff' },
            { id: 5, name: 'Diagonal ↗',  coords: [[0,2], [1,1], [2,0]], color: '#e040fb' }
        ];

        // 4th Reel Multipliers
        this.normalMultipliers = [1, 1, 2, 2, 3, 3, 5, 5, 10, 15, 20, 50, 100, 500];
        this.extraBetMultipliers = [5, 5, 10, 10, 15, 15, 20, 20, 50, 50, 100, 100, 500, 500];

        // Current Grid state (3 columns x 3 rows)
        this.grid = [
            ['ruby', 'garuda_wild', 'sym_a'],
            ['sym_k', 'ruby', 'sym_q'],
            ['emerald', 'sym_j', 'garuda_wild']
        ];
        this.currentMultiplier = 1;

        // Initialize state
        this.init();
    }

    init() {
        this.balance = parseFloat(localStorage.getItem('user_balance') || '50000');
        this.updateHUD();
        this.renderInitialGrid();
        this.setupEmbers();
        this.initJiliSplash();
    }

    initJiliSplash() {
        const splash = document.getElementById('jiliSplash');
        const bar = document.getElementById('jiliBar');
        if (!splash || !bar) return;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 15) + 10;
            if (progress > 100) progress = 100;
            bar.style.width = progress + '%';
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.style.display = 'none', 500);
                }, 300);
            }
        }, 80);
    }

    setupEmbers() {
        const canvas = document.getElementById('embersCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        for (let i = 0; i < 40; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2.5 + 0.5,
                color: Math.random() > 0.4 ? 'rgba(255, 215, 0, ' : 'rgba(255, 90, 0, ',
                alpha: Math.random() * 0.7 + 0.2,
                speedY: -(Math.random() * 1.2 + 0.4),
                speedX: (Math.random() - 0.5) * 0.6
            });
        }

        function loop() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                if (p.y < 0) {
                    p.y = height + 10;
                    p.x = Math.random() * width;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color + p.alpha + ')';
                ctx.fill();
            });
            requestAnimationFrame(loop);
        }
        loop();
    }

    renderInitialGrid() {
        for (let col = 0; col < 3; col++) {
            const colEl = document.getElementById(`reelCol_${col}`);
            if (!colEl) continue;
            colEl.innerHTML = '';
            const track = document.createElement('div');
            track.className = 'reel-track';
            track.id = `reelTrack_${col}`;
            
            for (let row = 0; row < 3; row++) {
                const symKey = this.grid[col][row];
                const cell = document.createElement('div');
                cell.className = 'slot-cell';
                cell.id = `cell_${col}_${row}`;
                const img = document.createElement('img');
                img.className = 'slot-tile-img';
                img.src = `assets/${this.symbols[symKey].file}`;
                cell.appendChild(img);
                track.appendChild(cell);
            }
            colEl.appendChild(track);
        }

        // Render Multiplier 4th Reel
        const multWrap = document.getElementById('multReelWrap');
        if (multWrap) {
            multWrap.innerHTML = '<div class="mult-center-indicator"></div>';
            const track = document.createElement('div');
            track.className = 'multiplier-track';
            track.id = 'multTrack';
            
            // 3 preview cells (top, center, bottom)
            const sampleMults = [2, 10, 50];
            sampleMults.forEach(val => {
                const cell = document.createElement('div');
                cell.className = 'multiplier-cell';
                cell.innerHTML = `<span class="mult-text-val ${val >= 100 ? 'super-500' : ''}">${val}X</span>`;
                track.appendChild(cell);
            });
            multWrap.appendChild(track);
        }
    }

    getBetAmount() {
        const base = this.baseBets[this.betIndex];
        return this.extraBetActive ? base * 1.5 : base;
    }

    changeBet(direction) {
        if (this.isSpinning) return;
        this.betIndex += direction;
        if (this.betIndex < 0) this.betIndex = 0;
        if (this.betIndex >= this.baseBets.length) this.betIndex = this.baseBets.length - 1;
        this.updateHUD();
    }

    toggleExtraBet() {
        if (this.isSpinning) return;
        this.extraBetActive = !this.extraBetActive;
        const btn = document.getElementById('extraBetSwitch');
        if (btn) {
            if (this.extraBetActive) {
                btn.classList.add('active');
                btn.querySelector('.extra-bet-status').innerText = 'ON';
            } else {
                btn.classList.remove('active');
                btn.querySelector('.extra-bet-status').innerText = 'OFF';
            }
        }
        if (window.SlotAudio) window.SlotAudio.playNudge();
        this.updateHUD();
    }

    toggleTurbo() {
        this.isTurbo = !this.isTurbo;
        const btn = document.getElementById('turboBtn');
        if (btn) btn.classList.toggle('active', this.isTurbo);
    }

    toggleAuto() {
        this.isAuto = !this.isAuto;
        const btn = document.getElementById('autoBtn');
        if (btn) btn.classList.toggle('active', this.isAuto);
        if (this.isAuto && !this.isSpinning) {
            this.spin();
        }
    }

    updateHUD() {
        const betEl = document.getElementById('betAmountVal');
        if (betEl) {
            betEl.innerText = 'PKR ' + this.getBetAmount().toFixed(2);
        }
        const balEl = document.getElementById('balanceVal');
        if (balEl) {
            balEl.innerText = 'PKR ' + this.balance.toLocaleString('en-US', { minimumFractionDigits: 2 });
        }
        localStorage.setItem('user_balance', this.balance.toFixed(2));

        // Sync with parent 1xBet portal if embedded
        try {
            window.parent.postMessage({
                type: 'BALANCE_UPDATE',
                balance: this.balance
            }, '*');
        } catch (e) {}
    }

    clearPaylines() {
        const canvas = document.getElementById('paylineCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        document.querySelectorAll('.slot-cell').forEach(c => {
            c.classList.remove('win-pulse', 'nudge-anim');
        });
    }

    drawWinningLine(line, color) {
        const canvas = document.getElementById('paylineCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.strokeStyle = color || '#ffd700';
        ctx.lineWidth = 4;
        ctx.shadowColor = color || '#ffd700';
        ctx.shadowBlur = 12;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const points = line.coords.map(([col, row]) => {
            const cell = document.getElementById(`cell_${col}_${row}`);
            if (!cell) return null;
            const cRect = cell.getBoundingClientRect();
            return {
                x: (cRect.left - rect.left) + cRect.width / 2,
                y: (cRect.top - rect.top) + cRect.height / 2
            };
        }).filter(p => p !== null);

        if (points.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();
        }

        // Highlight cells
        line.coords.forEach(([col, row]) => {
            const cell = document.getElementById(`cell_${col}_${row}`);
            if (cell) cell.classList.add('win-pulse');
        });
    }

    spin() {
        if (this.isSpinning) return;
        const bet = this.getBetAmount();
        if (this.balance < bet) {
            alert('Insufficient balance! Please deposit to continue.');
            this.isAuto = false;
            document.getElementById('autoBtn')?.classList.remove('active');
            return;
        }

        this.isSpinning = true;
        this.balance -= bet;
        this.updateHUD();
        this.clearPaylines();

        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) spinBtn.classList.add('spinning');
        const winEl = document.getElementById('winAmountVal');
        if (winEl) winEl.innerText = '0.00';

        if (window.SlotAudio) window.SlotAudio.playSpinStart();

        // Check for Gift of Garuda divine event (12% chance, 25% if extra bet)
        const giftChance = this.extraBetActive ? 0.25 : 0.12;
        const triggerGift = Math.random() < giftChance;

        if (triggerGift) {
            this.triggerGiftOfGaruda();
        }

        // Start reel spinning animations
        this.animateReelsSpin(triggerGift);
    }

    triggerGiftOfGaruda() {
        if (window.SlotAudio) window.SlotAudio.playGiftOfGaruda();
        const banner = document.getElementById('blessingBanner');
        if (banner) {
            banner.classList.add('active');
            setTimeout(() => banner.classList.remove('active'), 1800);
        }
    }

    animateReelsSpin(isGift = false) {
        const pool = this.symbolKeys;
        const multPool = this.extraBetActive ? this.extraBetMultipliers : this.normalMultipliers;

        // Determine outcome grid
        const outcome = [
            [this.randomSymbol(isGift), this.randomSymbol(isGift), this.randomSymbol(isGift)],
            [this.randomSymbol(isGift), this.randomSymbol(isGift), this.randomSymbol(isGift)],
            [this.randomSymbol(isGift), this.randomSymbol(isGift), this.randomSymbol(isGift)]
        ];

        // Pick multiplier
        let chosenMult = multPool[Math.floor(Math.random() * multPool.length)];
        if (isGift && Math.random() < 0.4) {
            chosenMult = [50, 100, 500][Math.floor(Math.random() * 3)];
        }

        const spinSpeed = this.isTurbo ? 0.5 : 1.0;
        const stopTimes = [
            800 * spinSpeed,
            1100 * spinSpeed,
            1400 * spinSpeed,
            1750 * spinSpeed // Multiplier reel
        ];

        // Animate 3 symbol columns
        for (let col = 0; col < 3; col++) {
            const track = document.getElementById(`reelTrack_${col}`);
            if (!track) continue;

            // Generate blur rolling tiles
            let rollHTML = '';
            for (let i = 0; i < 18; i++) {
                const s = pool[Math.floor(Math.random() * pool.length)];
                rollHTML += `<div class="slot-cell"><img class="slot-tile-img" src="assets/${this.symbols[s].file}" style="filter:blur(3px);"></div>`;
            }
            // Final 3 tiles
            for (let row = 0; row < 3; row++) {
                const sym = outcome[col][row];
                rollHTML += `<div class="slot-cell" id="cell_${col}_${row}"><img class="slot-tile-img" src="assets/${this.symbols[sym].file}"></div>`;
            }
            track.innerHTML = rollHTML;
            track.style.transition = 'none';
            track.style.transform = 'translateY(0)';

            const cellHeight = 98;
            const targetY = -((18) * cellHeight);

            // Trigger scroll
            setTimeout(() => {
                track.style.transition = `transform ${stopTimes[col]}ms cubic-bezier(0.15, 0.85, 0.35, 1)`;
                track.style.transform = `translateY(${targetY}px)`;
            }, 30);

            // Reel Stop callback
            setTimeout(() => {
                if (window.SlotAudio) window.SlotAudio.playReelStop(col);

                // Check Nudge mechanic on column
                this.checkNudgeOnColumn(col, outcome);
            }, stopTimes[col]);
        }

        // Animate 4th Multiplier Reel
        const multTrack = document.getElementById('multTrack');
        if (multTrack) {
            let multHTML = '';
            for (let i = 0; i < 15; i++) {
                const m = multPool[Math.floor(Math.random() * multPool.length)];
                multHTML += `<div class="multiplier-cell"><span class="mult-text-val" style="filter:blur(2px);">${m}X</span></div>`;
            }
            // Target multiplier centered (preceded and followed by neighbours)
            multHTML += `<div class="multiplier-cell"><span class="mult-text-val">2X</span></div>`;
            multHTML += `<div class="multiplier-cell"><span class="mult-text-val ${chosenMult >= 100 ? 'super-500' : ''}">${chosenMult}X</span></div>`;
            multHTML += `<div class="multiplier-cell"><span class="mult-text-val">5X</span></div>`;

            multTrack.innerHTML = multHTML;
            multTrack.style.transition = 'none';
            multTrack.style.transform = 'translateY(0)';

            const cellH = 98;
            const targetMultY = -((15) * cellH);

            setTimeout(() => {
                multTrack.style.transition = `transform ${stopTimes[3]}ms cubic-bezier(0.1, 0.9, 0.25, 1)`;
                multTrack.style.transform = `translateY(${targetMultY}px)`;
            }, 30);

            setTimeout(() => {
                if (window.SlotAudio) window.SlotAudio.playMultiplierStop(chosenMult);
            }, stopTimes[3]);
        }

        // Spin complete evaluation
        setTimeout(() => {
            this.grid = outcome;
            this.currentMultiplier = chosenMult;
            this.evaluateSpinOutcome();
        }, stopTimes[3] + 200);
    }

    randomSymbol(isGift = false) {
        if (isGift && Math.random() < 0.35) {
            return 'garuda_wild';
        }
        const r = Math.random();
        if (r < 0.08) return 'garuda_wild';
        if (r < 0.20) return 'ruby';
        if (r < 0.35) return 'sapphire';
        if (r < 0.50) return 'emerald';
        if (r < 0.65) return 'sym_a';
        if (r < 0.78) return 'sym_k';
        if (r < 0.90) return 'sym_q';
        return 'sym_j';
    }

    checkNudgeOnColumn(col, grid) {
        // Ex NUDGE™: If Garuda wild is at row 0 or 2, give 30% chance to nudge into center
        if (grid[col][0] === 'garuda_wild' || grid[col][2] === 'garuda_wild') {
            if (Math.random() < 0.4) {
                const cell = document.getElementById(`cell_${col}_1`);
                if (cell) {
                    cell.classList.add('nudge-anim');
                    if (window.SlotAudio) window.SlotAudio.playNudge();
                }
            }
        }
    }

    evaluateSpinOutcome() {
        this.isSpinning = false;
        const spinBtn = document.getElementById('spinBtn');
        if (spinBtn) spinBtn.classList.remove('spinning');

        const baseBet = this.baseBets[this.betIndex];
        let totalWin = 0;
        const winningLines = [];

        this.paylines.forEach(line => {
            const sym0 = this.grid[line.coords[0][0]][line.coords[0][1]];
            const sym1 = this.grid[line.coords[1][0]][line.coords[1][1]];
            const sym2 = this.grid[line.coords[2][0]][line.coords[2][1]];

            const match = this.checkLineMatch(sym0, sym1, sym2);
            if (match) {
                const payout = this.symbols[match].pay * baseBet * this.currentMultiplier;
                totalWin += payout;
                winningLines.push({ line, match, payout });
            }
        });

        if (totalWin > 0) {
            this.balance += totalWin;
            this.updateHUD();

            // Draw winning lines
            winningLines.forEach(w => this.drawWinningLine(w.line, w.line.color));
            if (window.SlotAudio) window.SlotAudio.playWinLine(winningLines.length);

            // Animate win counter
            const winEl = document.getElementById('winAmountVal');
            let currentDisplay = 0;
            const step = totalWin / 20;
            const countTimer = setInterval(() => {
                currentDisplay += step;
                if (currentDisplay >= totalWin) {
                    currentDisplay = totalWin;
                    clearInterval(countTimer);
                }
                if (winEl) winEl.innerText = currentDisplay.toFixed(2);
                if (window.SlotAudio) window.SlotAudio.playCoinTick();
            }, 30);

            // Check Big Win tiers (relative to bet)
            const winRatio = totalWin / this.getBetAmount();
            if (winRatio >= 15) {
                setTimeout(() => {
                    this.showCelebrationModal(totalWin, winRatio);
                }, 600);
            }
        }

        // Auto spin loop
        if (this.isAuto) {
            setTimeout(() => {
                if (this.isAuto && !this.isSpinning) {
                    this.spin();
                }
            }, 1200);
        }
    }

    checkLineMatch(s0, s1, s2) {
        const symbols = [s0, s1, s2];
        const nonWilds = symbols.filter(s => s !== 'garuda_wild');

        if (nonWilds.length === 0) {
            return 'garuda_wild'; // 3 Wilds
        }
        const target = nonWilds[0];
        const allMatch = symbols.every(s => s === target || s === 'garuda_wild');
        return allMatch ? target : null;
    }

    showCelebrationModal(winAmount, ratio) {
        if (window.SlotAudio) window.SlotAudio.playBigWinFanfare();
        const overlay = document.getElementById('celebrationModal');
        const title = document.getElementById('celebTitle');
        const num = document.getElementById('celebNum');
        if (!overlay || !title || !num) return;

        if (ratio >= 200) {
            title.innerText = 'GARUDA 500X WIN!';
        } else if (ratio >= 70) {
            title.innerText = 'SUPER WIN!';
        } else if (ratio >= 30) {
            title.innerText = 'MEGA WIN!';
        } else {
            title.innerText = 'BIG WIN!';
        }

        num.innerText = 'PKR ' + winAmount.toLocaleString('en-US', { minimumFractionDigits: 2 });
        overlay.classList.add('active');
    }

    closeCelebration() {
        const overlay = document.getElementById('celebrationModal');
        if (overlay) overlay.classList.remove('active');
    }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
    window.garudaGame = new FortuneGarudaEngine();
});
