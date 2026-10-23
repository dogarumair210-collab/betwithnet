// ============================================================
// Bet With Net - Lucky 777 Vegas Deluxe Slot Machine Engine
// Authentic 1:1 Vegas Classic 777 Slot
// 3x3 Luxury Reels + 4th Multiplier Reel (up to 777x) + Nudge / Respin
// ============================================================

class Lucky777SlotGame {
    constructor() {
        this.betAmount = 10;
        this.spinning = false;
        this.turbo = false;
        this.exBet = false;
        this.autoPlay = false;
        this.autoCount = 0;
        this.audioCtx = null;
        this.soundEnabled = true;
        this.bgmStarted = false;

        // Authentic Vegas 777 Sound System
        try {
            this.bgm = new Audio('../assets/games/slots777/audio/bgm_vegas.mp3');
            this.bgm.loop = true;
            this.bgm.volume = 0.28;

            this.sfxSpin = new Audio('../assets/games/slots777/audio/spin.mp3');
            this.sfxSpin.volume = 0.75;

            this.sfxStop = new Audio('../assets/games/slots777/audio/reel_stop.mp3');
            this.sfxStop.volume = 0.90;

            this.sfxWin = new Audio('../assets/games/slots777/audio/win.mp3');
            this.sfxWin.volume = 0.85;

            this.sfxJackpot = new Audio('../assets/games/slots777/audio/jackpot_fanfare.mp3');
            this.sfxJackpot.volume = 0.95;

            this.sfxChip = new Audio('../assets/games/slots777/audio/chip_bet.mp3');
            this.sfxChip.volume = 0.65;

            this.sfxCoins = new Audio('../assets/games/slots777/audio/coin_cascade.mp3');
            this.sfxCoins.volume = 0.80;
        } catch (e) {
            console.warn('[Audio] Audio element init warning:', e);
        }

        // Ultra HD 3D Vegas 777 Symbols - Balanced Light Payouts
        this.symbols = [
            { id: 'sym_777_wild', name: '777 Wild Jackpot', img: '../assets/games/slots777/sym_777_wild.jpg', mult: 10, weight: 1, isWild: true },
            { id: 'sym_7_red', name: 'Blazing Red 7', img: '../assets/games/slots777/sym_7_red.jpg', mult: 8, weight: 2 },
            { id: 'sym_7_blue', name: 'Electric Blue 7', img: '../assets/games/slots777/sym_7_blue.jpg', mult: 5, weight: 4 },
            { id: 'sym_bar', name: 'Triple Gold BAR', img: '../assets/games/slots777/sym_bar.jpg', mult: 3, weight: 8 },
            { id: 'sym_bell', name: 'Golden Bell', img: '../assets/games/slots777/sym_bell.jpg', mult: 2, weight: 15 },
            { id: 'sym_diamond', name: 'Sparkling Diamond', img: '../assets/games/slots777/sym_diamond.jpg', mult: 1.5, weight: 25 },
            { id: 'sym_cherry', name: 'Lucky Cherries', img: '../assets/games/slots777/sym_cherry.jpg', mult: 1, weight: 50 }
        ];

        // 4th Multiplier Reel - Capped strictly at 3x Maximum (1x baseline)
        this.multipliers = [
            { val: 1, label: '1x', type: 'normal', weight: 100 },
            { val: 2, label: '2x', type: 'normal', weight: 15 },
            { val: 3, label: '3x', type: 'normal', weight: 5 }
        ];

        this.paylines = [
            [1, 1, 1], // Center line (Line 1)
            [0, 0, 0], // Top line (Line 2)
            [2, 2, 2], // Bottom line (Line 3)
            [0, 1, 2], // Diagonal top-left to bottom-right (Line 4)
            [2, 1, 0]  // Diagonal bottom-left to top-right (Line 5)
        ];

        this.currentGrid = [
            ['sym_7_red', 'sym_7_red', 'sym_7_blue'],
            ['sym_777_wild', 'sym_7_red', 'sym_7_blue'],
            ['sym_7_blue', 'sym_7_red', 'sym_7_blue']
        ];

        this.currentMultiplier = this.multipliers[0]; // default 1x
        this.progressiveJackpot = 777777;
        this.totalSpins = parseInt(localStorage.getItem('bwn_slots_total_spins') || '0', 10);
    }

    init() {
        this.renderReels();
        this.renderMultiplierReel();
        this.resizeCanvas();
        this.startJackpotTicker();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Full wallet synchronization with Bet With Net backend
        this.syncSession();

        if (window.wallet && typeof window.wallet.on === 'function') {
            window.wallet.on('change', () => this.updateWalletDisplays());
            window.wallet.on('balanceChange', () => this.updateWalletDisplays());
        }

        window.addEventListener('storage', () => this.updateWalletDisplays());
        window.addEventListener('focus', () => this.syncSession());

        // Auto-play ambient & marquee video loops + kickstart Vegas BGM on user gesture
        const kickstartAudioAndVideos = () => {
            if (this.soundEnabled && !this.bgmStarted) {
                this.startBGM();
            }
            document.querySelectorAll('video').forEach(v => {
                if (v.id !== 'jackpotCoinsVideo' && v.paused) {
                    v.play().catch(() => {});
                }
            });
        };
        kickstartAudioAndVideos();
        document.addEventListener('touchstart', kickstartAudioAndVideos, { once: true });
        document.addEventListener('click', kickstartAudioAndVideos, { once: true });
    }

    async syncSession() {
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                if (window.wallet && typeof window.wallet.syncWithUser === 'function') {
                    window.wallet.syncWithUser(u);
                }
            }
        } catch(e) {}

        try {
            const res = await fetch('/api/auth.php?action=me', { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data && data.success && data.data) {
                    localStorage.setItem('bwn_session_user', JSON.stringify(data.data));
                    if (window.wallet && typeof window.wallet.syncWithUser === 'function') {
                        window.wallet.syncWithUser(data.data);
                    }
                }
            }
        } catch(e) {}

        this.updateWalletDisplays();
    }

    startJackpotTicker() {
        setInterval(() => {
            this.progressiveJackpot += (Math.random() * 0.45 + 0.05);
            const el = document.getElementById('jackpotAmountDisplay');
            if (el) {
                el.innerText = '₨ ' + this.progressiveJackpot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
        }, 1200);
    }

    updateWalletDisplays() {
        let balStr = '₨ 0.00';
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            const bal = window.wallet.getBalance();
            balStr = window.wallet.formatAmount(bal);
        } else {
            try {
                const sess = localStorage.getItem('bwn_session_user');
                if (sess) {
                    const u = JSON.parse(sess);
                    const b = u.balance_pkr !== undefined ? u.balance_pkr : (u.balancePKR || 0);
                    balStr = '₨ ' + Number(b).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            } catch(e) {}
        }
        const topEl = document.getElementById('topWalletVal');
        const hudEl = document.getElementById('hudWalletVal');
        if (topEl) topEl.innerText = balStr;
        if (hudEl) hudEl.innerText = balStr;
    }

    resizeCanvas() {
        const cabinet = document.querySelector('.vegas-reels-cabinet');
        const canvas = document.getElementById('lightningCanvas');
        if (cabinet && canvas) {
            const dpr = Math.min(window.devicePixelRatio || 1, 3);
            canvas.width = Math.round(cabinet.clientWidth * dpr);
            canvas.height = Math.round(cabinet.clientHeight * dpr);
            canvas.style.width = cabinet.clientWidth + 'px';
            canvas.style.height = cabinet.clientHeight + 'px';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        }
    }

    getRandomSymbol() {
        const totalWeight = this.symbols.reduce((sum, s) => sum + s.weight, 0);
        let rand = Math.random() * totalWeight;
        for (const s of this.symbols) {
            if (rand < s.weight) return s;
            rand -= s.weight;
        }
        return this.symbols[this.symbols.length - 1];
    }

    // 4th Multiplier Reel: Strictly 1x baseline. Multipliers > 1x (max 3x) allowed on rare spins (~1 in 100)
    getRandomMultiplier(allowMultiplier = false) {
        if (!allowMultiplier) {
            return this.multipliers[0]; // Strictly 1x
        }
        return Math.random() < 0.75 ? this.multipliers[1] : (this.multipliers[2] || this.multipliers[1]); // 2x or 3x
    }

    hasAnyWinningLine(grid) {
        return this.paylines.some(line => {
            const s0 = grid[line[0]][0];
            const s1 = grid[line[1]][1];
            const s2 = grid[line[2]][2];
            let match = (s0 === 'sym_777_wild') ? s1 : s0;
            return (s0 === match || s0 === 'sym_777_wild') &&
                   (s1 === match || s1 === 'sym_777_wild') &&
                   (s2 === match || s2 === 'sym_777_wild');
        });
    }

    generateLosingGrid() {
        let grid;
        let attempts = 0;
        do {
            grid = [
                [this.getRandomSymbol().id, this.getRandomSymbol().id, this.getRandomSymbol().id],
                [this.getRandomSymbol().id, this.getRandomSymbol().id, this.getRandomSymbol().id],
                [this.getRandomSymbol().id, this.getRandomSymbol().id, this.getRandomSymbol().id]
            ];
            // Intentionally break any accidental matching lines on reel 2
            this.paylines.forEach(line => {
                const s0 = grid[line[0]][0];
                const s1 = grid[line[1]][1];
                const s2 = grid[line[2]][2];
                let match = (s0 === 'sym_777_wild') ? s1 : s0;
                if ((s0 === match || s0 === 'sym_777_wild') && (s1 === match || s1 === 'sym_777_wild') && (s2 === match || s2 === 'sym_777_wild')) {
                    const diffSym = this.symbols.find(s => s.id !== match && !s.isWild);
                    if (diffSym) grid[line[2]][2] = diffSym.id;
                }
            });
            attempts++;
        } while (this.hasAnyWinningLine(grid) && attempts < 12);

        return grid;
    }

    generateWinningGrid() {
        const grid = this.generateLosingGrid();
        // Balanced winning pool: mostly Cherries, Diamonds, Bells; occasionally BAR or 7
        const winPool = [
            'sym_cherry', 'sym_cherry', 'sym_cherry', 'sym_cherry',
            'sym_diamond', 'sym_diamond', 'sym_diamond',
            'sym_bell', 'sym_bell',
            'sym_bar',
            'sym_7_blue'
        ];
        const winSym = winPool[Math.floor(Math.random() * winPool.length)];
        const line = this.paylines[Math.floor(Math.random() * this.paylines.length)];
        line.forEach((r, c) => {
            grid[r][c] = winSym;
        });
        return grid;
    }

    renderReels() {
        for (let c = 0; c < 3; c++) {
            const strip = document.getElementById(`reelStrip${c}`);
            if (strip) {
                strip.innerHTML = `
                    <div class="reel-cell-item" data-row="0" data-col="${c}">${this.getCellPlateHtml(this.currentGrid[0][c])}</div>
                    <div class="reel-cell-item" data-row="1" data-col="${c}">${this.getCellPlateHtml(this.currentGrid[1][c])}</div>
                    <div class="reel-cell-item" data-row="2" data-col="${c}">${this.getCellPlateHtml(this.currentGrid[2][c])}</div>
                `;
            }
        }
    }

    getCellPlateHtml(id) {
        const s = this.symbols.find(x => x.id === id) || this.symbols[0];
        const isWild = s.isWild;
        const plateClass = isWild ? 'plate-wild' : 'plate-vegas';
        return `
            <div class="cell-plate ${plateClass}">
                <div class="symbol-inner-frame">
                    <img src="${s.img}" alt="${s.name}" class="symbol-img">
                </div>
            </div>
        `;
    }

    renderMultiplierReel(mTop, mCenter, mBottom) {
        const strip = document.getElementById('multStrip');
        if (!strip) return;
        const c = mCenter || this.currentMultiplier;
        const t = mTop || this.getRandomMultiplier();
        const b = mBottom || this.getRandomMultiplier();

        strip.innerHTML = `
            <div class="multiplier-cell-item">${this.getMultBadgeHtml(t)}</div>
            <div class="multiplier-cell-item">${this.getMultBadgeHtml(c)}</div>
            <div class="multiplier-cell-item">${this.getMultBadgeHtml(b)}</div>
        `;
    }

    getMultBadgeHtml(m) {
        if (m.type === 'jackpot') {
            return `
                <div class="mult-vegas-badge badge-jackpot">
                    <div class="mult-badge-inner">
                        <div class="badge-content">
                            <span class="badge-tag">GRAND</span>
                            <span class="badge-number">777x</span>
                            <span class="badge-sub-tag">JACKPOT</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (m.type === 'nudge') {
            const isSuper = m.label && m.label.includes('SUPER');
            return `
                <div class="mult-vegas-badge badge-nudge">
                    <div class="mult-badge-inner">
                        <div class="badge-content">
                            <span class="badge-tag">${isSuper ? 'SUPER 77' : '777 NUDGE'}</span>
                            <span class="badge-number">${m.val}x</span>
                            <span class="badge-arrows">▲ ▲</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (m.val >= 50) {
            return `
                <div class="mult-vegas-badge badge-gold">
                    <div class="mult-badge-inner">
                        <div class="badge-content">
                            <span class="badge-tag">MEGA</span>
                            <span class="badge-number">${m.label}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        if (m.val >= 5) {
            return `
                <div class="mult-vegas-badge badge-ruby">
                    <div class="mult-badge-inner">
                        <div class="badge-content">
                            <span class="badge-tag">LUCKY</span>
                            <span class="badge-number">${m.label}</span>
                        </div>
                    </div>
                </div>
            `;
        }
        return `
            <div class="mult-vegas-badge badge-blue">
                <div class="mult-badge-inner">
                    <div class="badge-content">
                        <span class="badge-number">${m.label}</span>
                    </div>
                </div>
            </div>
        `;
    }

    spin() {
        if (this.spinning) return;

        const effectiveBet = this.exBet ? (this.betAmount * 1.5) : this.betAmount;

        // Deduct from real wallet balance
        if (window.wallet) {
            if (!window.wallet.placeBet(effectiveBet, 'Lucky 777 Vegas')) {
                if (window.app && window.app.showToast) {
                    window.app.showToast('Insufficient balance for bet!', 'error');
                } else {
                    alert('Insufficient balance in your wallet! Please add funds.');
                }
                this.stopAutoPlay();
                return;
            }
        }

        this.stopSpinAudio();
        this.spinning = true;
        this.clearLightning();

        const transEl = document.getElementById('transIdText');
        if (transEl) {
            transEl.innerText = `ID 777-${Math.floor(Math.random() * 899999 + 100000)}`;
        }

        this.playAudio('spin');

        const winEl = document.getElementById('winDisplayAmount');
        const hudWin = document.getElementById('hudWinVal');
        if (winEl) winEl.innerText = '0.00';
        if (hudWin) hudWin.innerText = '0.00';

        const spinBtn = document.getElementById('spinMasterBtn');
        if (spinBtn) {
            spinBtn.classList.add('spinning');
        }

        // Track total player spins
        this.totalSpins = (this.totalSpins || 0) + 1;
        try {
            localStorage.setItem('bwn_slots_total_spins', this.totalSpins.toString());
        } catch(e) {}

        // 1. Multipliers (> 1x, max 3x): Rare designated spins (~1 in 100 spins)
        const isMultiplierSpin = (this.totalSpins % 100 === 0) || (Math.random() < (1 / 100));

        // 2. Controlled Hit Rate: Win every 3-4 spins so game is active and never feels dead/zero
        this.lossStreak = (this.lossStreak || 0) + 1;
        let isWinningSpin = false;
        if (this.lossStreak >= 4 || Math.random() < 0.28) {
            isWinningSpin = true;
            this.lossStreak = 0;
        }

        let nextGrid;
        if (isWinningSpin) {
            nextGrid = this.generateWinningGrid();
        } else {
            nextGrid = this.generateLosingGrid();
        }

        const nextMult = this.getRandomMultiplier(isMultiplierSpin);
        const topMult = this.multipliers[0];
        const botMult = this.multipliers[0];

        const intervals = [];
        const baseSpeed = this.turbo ? 40 : 60;

        for (let c = 0; c < 3; c++) {
            const strip = document.getElementById(`reelStrip${c}`);
            const intv = setInterval(() => {
                if (strip) {
                    strip.innerHTML = `
                        <div class="reel-cell-item reel-blur">${this.getCellPlateHtml(this.getRandomSymbol().id)}</div>
                        <div class="reel-cell-item reel-blur">${this.getCellPlateHtml(this.getRandomSymbol().id)}</div>
                        <div class="reel-cell-item reel-blur">${this.getCellPlateHtml(this.getRandomSymbol().id)}</div>
                    `;
                }
            }, baseSpeed);
            intervals.push(intv);
        }

        const multStrip = document.getElementById('multStrip');
        const multIntv = setInterval(() => {
            if (multStrip) {
                multStrip.innerHTML = `
                    <div class="multiplier-cell-item reel-blur">${this.getMultBadgeHtml(this.multipliers[0])}</div>
                    <div class="multiplier-cell-item reel-blur">${this.getMultBadgeHtml(this.getRandomMultiplier(isMultiplierSpin))}</div>
                    <div class="multiplier-cell-item reel-blur">${this.getMultBadgeHtml(this.multipliers[0])}</div>
                `;
            }
        }, baseSpeed);

        const stopTiming = this.turbo ? [260, 460, 660, 860] : [550, 800, 1050, 1350];

        for (let c = 0; c < 3; c++) {
            setTimeout(() => {
                clearInterval(intervals[c]);
                const strip = document.getElementById(`reelStrip${c}`);
                if (strip) {
                    strip.innerHTML = `
                        <div class="reel-cell-item" data-row="0" data-col="${c}">${this.getCellPlateHtml(nextGrid[0][c])}</div>
                        <div class="reel-cell-item" data-row="1" data-col="${c}">${this.getCellPlateHtml(nextGrid[1][c])}</div>
                        <div class="reel-cell-item" data-row="2" data-col="${c}">${this.getCellPlateHtml(nextGrid[2][c])}</div>
                    `;
                }
                this.playAudio('stop');
                if (c === 2) {
                    // Cleanly stop the spinning whirr the exact instant the 3rd reel locks
                    this.stopSpinAudio();
                }
            }, stopTiming[c]);
        }

        setTimeout(() => {
            clearInterval(multIntv);
            this.stopSpinAudio();
            this.currentMultiplier = nextMult;
            this.renderMultiplierReel(topMult, nextMult, botMult);
            this.playAudio('multLock');

            if (spinBtn) {
                spinBtn.classList.remove('spinning');
            }
            this.currentGrid = nextGrid;

            setTimeout(() => {
                this.checkNudgeAndEvaluate(nextMult);
            }, 180);

        }, stopTiming[3]);
    }

    checkNudgeAndEvaluate(mult) {
        let nudged = false;

        for (let c = 0; c < 3; c++) {
            const hasWild = this.currentGrid[0][c] === 'sym_777_wild' || 
                            this.currentGrid[1][c] === 'sym_777_wild' || 
                            this.currentGrid[2][c] === 'sym_777_wild';

            // Expanding wild bonus only activates if 4th multiplier reel actually hits a Nudge medallion!
            if (hasWild && mult.type === 'nudge') {
                nudged = true;
                this.currentGrid[0][c] = 'sym_777_wild';
                this.currentGrid[1][c] = 'sym_777_wild';
                this.currentGrid[2][c] = 'sym_777_wild';

                const colEl = document.getElementById(`reelCol${c}`);
                if (colEl) {
                    const wildExpand = document.createElement('div');
                    wildExpand.className = 'wild-full-column';
                    wildExpand.innerHTML = `
                        <img src="../assets/games/slots777/sym_777_wild.jpg" alt="777 WILD EXPAND">
                    `;
                    colEl.appendChild(wildExpand);
                }
                this.playAudio('nudge');
            }
        }

        setTimeout(() => {
            this.evaluateWins(mult);
        }, nudged ? 500 : 120);
    }

    evaluateWins(mult) {
        this.spinning = false;
        let totalWin = 0;
        let winningLines = [];

        const multValue = mult.val || 1;

        this.paylines.forEach((line, idx) => {
            const sym0 = this.currentGrid[line[0]][0];
            const sym1 = this.currentGrid[line[1]][1];
            const sym2 = this.currentGrid[line[2]][2];

            let matchSym = sym0;
            if (matchSym === 'sym_777_wild') matchSym = (sym1 !== 'sym_777_wild') ? sym1 : sym2;

            const isMatch = (sym0 === matchSym || sym0 === 'sym_777_wild') &&
                            (sym1 === matchSym || sym1 === 'sym_777_wild') &&
                            (sym2 === matchSym || sym2 === 'sym_777_wild');

            if (isMatch) {
                const symObj = this.symbols.find(s => s.id === matchSym) || this.symbols[0];
                const baseWin = (this.betAmount / 5) * symObj.mult;
                const lineWin = baseWin * multValue;
                totalWin += lineWin;

                winningLines.push({
                    lineIndex: idx,
                    symbol: symObj,
                    coords: [
                        { row: line[0], col: 0 },
                        { row: line[1], col: 1 },
                        { row: line[2], col: 2 }
                    ]
                });
            }
        });

        totalWin = Math.round(totalWin * 100) / 100;
        const totalMult = this.betAmount > 0 ? (totalWin / this.betAmount) : 0;

        if (window.wallet) {
            window.wallet.creditWin(
                this.betAmount,
                totalWin,
                'Lucky 777 Vegas',
                totalMult,
                winningLines.length > 0 ? `${winningLines.length} Lines x ${multValue} Mult` : 'No Match'
            );
        }

        if (winningLines.length > 0) {
            this.drawPaylines(winningLines);
            this.animateWinCount(totalWin);
            this.playAudio(multValue >= 50 || totalMult >= 50 ? 'jackpot' : 'win');

            const hudWin = document.getElementById('hudWinVal');
            if (hudWin) hudWin.innerText = 'Rs ' + totalWin.toFixed(2);

            if (multValue >= 50 || totalMult >= 50) {
                this.showSuperWin(multValue, totalWin);
            }
        } else {
            const winEl = document.getElementById('winDisplayAmount');
            const hudWin = document.getElementById('hudWinVal');
            if (winEl) winEl.innerText = '0.00';
            if (hudWin) hudWin.innerText = '0.00';
        }

        if (this.autoPlay && this.autoCount > 0) {
            this.autoCount--;
            const countBadge = document.getElementById('autoCountBadge');
            if (countBadge) countBadge.innerText = this.autoCount;

            setTimeout(() => {
                if (this.autoPlay && !this.spinning) this.spin();
            }, this.turbo ? 650 : 1200);
        } else if (this.autoCount <= 0) {
            this.stopAutoPlay();
        }
    }

    animateWinCount(target) {
        const el = document.getElementById('winDisplayAmount');
        if (!el) return;
        let cur = 0;
        const step = target / 20;
        const intv = setInterval(() => {
            cur += step;
            if (cur >= target) {
                cur = target;
                clearInterval(intv);
            }
            el.innerText = cur.toFixed(2);
        }, 25);
    }

    drawPaylines(lines) {
        this.resizeCanvas();
        const canvas = document.getElementById('lightningCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff2a2a';
        ctx.shadowBlur = 12;
        ctx.lineCap = 'round';

        lines.forEach(line => {
            ctx.beginPath();
            line.coords.forEach((c, idx) => {
                const item = document.querySelector(`.reel-cell-item[data-row="${c.row}"][data-col="${c.col}"]`);
                if (item) {
                    const rect = item.getBoundingClientRect();
                    const stageRect = canvas.getBoundingClientRect();
                    const x = (rect.left + rect.width / 2) - stageRect.left;
                    const y = (rect.top + rect.height / 2) - stageRect.top;
                    if (idx === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            });

            const targetBox = document.querySelector('.multiplier-target-box');
            if (targetBox) {
                const tbRect = targetBox.getBoundingClientRect();
                const stageRect = canvas.getBoundingClientRect();
                const tx = (tbRect.left + tbRect.width / 2) - stageRect.left;
                const ty = (tbRect.top + tbRect.height / 2) - stageRect.top;
                ctx.lineTo(tx, ty);
            }
            ctx.stroke();
        });
    }

    clearLightning() {
        const canvas = document.getElementById('lightningCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        document.querySelectorAll('.wild-full-column').forEach(el => el.remove());
    }

    showSuperWin(multVal, cash) {
        const overlay = document.getElementById('superWinBanner');
        const titleEl = document.getElementById('winBannerTitle');
        const multEl = document.getElementById('winBannerMult');
        const cashEl = document.getElementById('winBannerCash');
        if (!overlay || !multEl) return;

        titleEl.innerText = multVal >= 100 ? '777 GRAND JACKPOT!' : (multVal >= 50 ? '777 MEGA WIN!' : 'BIG WIN!');
        multEl.innerText = `${multVal}x MULTIPLIER HIT`;
        cashEl.innerText = window.wallet ? window.wallet.formatAmount(cash) : `₨ ${cash.toFixed(2)}`;
        overlay.style.display = 'flex';

        const coinVid = document.getElementById('jackpotCoinsVideo');
        if (coinVid) {
            try {
                coinVid.currentTime = 0;
                coinVid.play().catch(() => {});
            } catch(e) {}
        }

        setTimeout(() => {
            this.closeSuperWin();
        }, 4000);
    }

    closeSuperWin() {
        const overlay = document.getElementById('superWinBanner');
        if (overlay) overlay.style.display = 'none';
        const coinVid = document.getElementById('jackpotCoinsVideo');
        if (coinVid) {
            try { coinVid.pause(); } catch(e) {}
        }
    }

    toggleAutoPlay() {
        if (this.autoPlay) {
            this.stopAutoPlay();
        } else {
            this.autoPlay = true;
            this.autoCount = 25;
            const btn = document.getElementById('autoPlayBtn');
            const countBadge = document.getElementById('autoCountBadge');
            if (btn) btn.classList.add('active');
            if (countBadge) {
                countBadge.style.display = 'flex';
                countBadge.innerText = this.autoCount;
            }
            if (!this.spinning) this.spin();
        }
    }

    stopAutoPlay() {
        this.autoPlay = false;
        this.autoCount = 0;
        const btn = document.getElementById('autoPlayBtn');
        const countBadge = document.getElementById('autoCountBadge');
        if (btn) btn.classList.remove('active');
        if (countBadge) countBadge.style.display = 'none';
    }

    toggleTurbo() {
        this.turbo = !this.turbo;
        const btn = document.getElementById('turboBtn');
        if (btn) {
            if (this.turbo) btn.classList.add('active');
            else btn.classList.remove('active');
        }
    }

    toggleExBet() {
        this.exBet = !this.exBet;
        const btn = document.getElementById('exBetBtn');
        if (btn) {
            if (this.exBet) btn.classList.add('active');
            else btn.classList.remove('active');
        }
        this.updateBetDisplay();
    }

    adjustBet(delta) {
        if (this.spinning) return;
        const bets = [1, 2, 5, 10, 20, 50, 100, 200, 500];
        let idx = bets.indexOf(this.betAmount);
        if (idx === -1) idx = 3;
        idx = Math.max(0, Math.min(bets.length - 1, idx + delta));
        this.betAmount = bets[idx];
        this.updateBetDisplay();
        this.playAudio('chip');
    }

    updateBetDisplay() {
        const effective = this.exBet ? (this.betAmount * 1.5) : this.betAmount;
        const betEl = document.getElementById('hudBetVal');
        const deckBetEl = document.getElementById('deckBetAmount');
        if (betEl) betEl.innerText = effective.toFixed(2);
        if (deckBetEl) deckBetEl.innerText = effective.toFixed(2);
    }

    // --------------------------------------------------------
    // Authentic Vegas 777 Audio Controller
    // --------------------------------------------------------
    startBGM() {
        if (!this.soundEnabled || !this.bgm) return;
        this.bgm.play().then(() => {
            this.bgmStarted = true;
        }).catch(() => {
            // Unlocked by user gesture on click/spin
        });
    }

    stopBGM() {
        if (this.bgm) {
            try { this.bgm.pause(); } catch(e) {}
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('soundToggleBtn');
        if (btn) {
            btn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
            btn.classList.toggle('muted', !this.soundEnabled);
        }
        if (!this.soundEnabled) {
            this.stopBGM();
        } else {
            this.startBGM();
        }
    }

    playSfx(audioObj) {
        if (!this.soundEnabled || !audioObj) return;
        try {
            const clone = audioObj.cloneNode();
            clone.volume = audioObj.volume;
            clone.play().catch(() => {
                audioObj.currentTime = 0;
                audioObj.play().catch(() => {});
            });
        } catch(e) {
            try {
                audioObj.currentTime = 0;
                audioObj.play().catch(() => {});
            } catch(err) {}
        }
    }

    stopSpinAudio() {
        if (this.sfxSpin) {
            try {
                this.sfxSpin.pause();
                this.sfxSpin.currentTime = 0;
            } catch(e) {}
        }
    }

    playAudio(type) {
        if (!this.soundEnabled) return;

        // Ensure Hip Hop background music is running smoothly
        if (!this.bgmStarted) {
            this.startBGM();
        }

        if (type === 'spin') {
            if (this.sfxSpin) {
                try {
                    this.sfxSpin.currentTime = 0;
                    this.sfxSpin.play().catch(() => {});
                } catch(e) {}
            }
        } else if (type === 'stop') {
            this.playSfx(this.sfxStop);
        } else if (type === 'win') {
            this.playSfx(this.sfxWin);
        } else if (type === 'jackpot') {
            this.playSfx(this.sfxJackpot);
            setTimeout(() => this.playSfx(this.sfxCoins), 350);
        } else if (type === 'chip' || type === 'click') {
            this.playSfx(this.sfxChip);
        }

        // Also fire Web Audio synth for crisp responsive audio haptics
        this.playAudioSynth(type);
    }

    playAudioSynth(type) {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.audioCtx = new AudioContext();
            }
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const ctx = this.audioCtx;
            const now = ctx.currentTime;

            if (type === 'spin') {
                // Tactile low solenoid button click
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(110, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.04);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            } else if (type === 'stop') {
                // Solid mechanical reel clunk
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'multLock') {
                // High chime for multiplier lock
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880.00, now + 0.07); // A5
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'win') {
                // 3-note celebration arpeggio
                const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                    gain.gain.setValueAtTime(0.3, now + idx * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.09 + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.09);
                    osc.stop(now + idx * 0.09 + 0.2);
                });
            } else if (type === 'jackpot') {
                // 777 Jackpot fanfare
                const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
                fanfare.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.4, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.35);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.35);
                });
            } else if (type === 'nudge') {
                // Nudge whoosh
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.18);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.04);
            }
        } catch(e) {}
    }
}

// Backwards compatibility alias
window.FortuneGarudaGame = Lucky777SlotGame;
window.slotsGame = new Lucky777SlotGame();
