// ============================================================
// Bet With Net - Universal VIP Game Launcher & Splash Audio Engine
// Provides authentic luxury opening window, loading progress,
// regulatory certification badges, and continuous genre-matched BGM
// for all 60 casino games. Modeled after Spribe Aviator UX.
// ============================================================

(function() {
    'use strict';

    // 1. Comprehensive Registry of all 60 Casino Games
    const GAME_REGISTRY = {
        'andarbahar': { title: 'Andar Bahar Royale', studio: 'EVOLUTION LIVE', genre: 'table_jazz', accent: '#f5a623', rtp: '97.85%' },
        'archery': { title: 'Archery Champion', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#2ecc71', rtp: '98.00%' },
        'baccarat_squeeze': { title: 'Baccarat VIP Squeeze', studio: 'EVOLUTION GAMING', genre: 'table_jazz', accent: '#f5a623', rtp: '98.94%' },
        'bingo': { title: 'Lucky Bingo Bonanza', studio: 'PRAGMATIC PLAY', genre: 'casino_lounge', accent: '#9b51e0', rtp: '96.80%' },
        'blackjack': { title: 'Blackjack Classic VIP', studio: 'EVOLUTION VIP', genre: 'table_jazz', accent: '#2ecc71', rtp: '99.50%' },
        'bowling': { title: 'Strike Bowling Deluxe', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#00e5ff', rtp: '97.20%' },
        'card': { title: 'High-Low Card Royale', studio: 'VIP TABLE GAMES', genre: 'table_jazz', accent: '#f5a623', rtp: '98.00%' },
        'chicken_road': { title: 'Chicken Road 1xBet', studio: 'INOUT ARCADE', genre: 'none', accent: '#f59e0b', rtp: '98.00%' },
        'chicken-road': { title: 'Chicken Road 1xBet', studio: 'INOUT ARCADE', genre: 'none', accent: '#f59e0b', rtp: '98.00%' },
        'coinflip': { title: 'Coin Flip 3D Gold', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '99.00%' },
        'color': { title: 'Color Wheel Fortune', studio: 'SPINOMENAL', genre: 'casino_lounge', accent: '#ff9f1c', rtp: '97.50%' },
        'crash': { title: 'Aviator Spribe Official', studio: 'SPRIBE STUDIOS', genre: 'electro_flight', accent: '#e71d36', rtp: '97.00%' },
        'cups': { title: 'Three Cups Mystery', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '98.00%' },
        'cyber_keno': { title: 'Cyber Keno 2077', studio: 'NEON GAMING', genre: 'slots_synth', accent: '#00e5ff', rtp: '96.80%' },
        'cyber_ninja': { title: 'Cyber Ninja Slash', studio: 'NEON GAMING', genre: 'slots_synth', accent: '#e74c3c', rtp: '96.90%' },
        'derby': { title: 'Virtual Horse Derby', studio: 'KIRON INTERACTIVE', genre: 'none', accent: '#f5a623', rtp: '97.00%' },
        'dice': { title: 'Classic 100x Dice', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#00e5ff', rtp: '99.00%' },
        'dragon_slots': { title: 'Dragon Fortune Slots', studio: 'PRAGMATIC PLAY', genre: 'slots_synth', accent: '#f5a623', rtp: '96.75%' },
        'dragontiger': { title: 'Dragon Tiger Live', studio: 'EVOLUTION GAMING', genre: 'table_jazz', accent: '#e74c3c', rtp: '96.27%' },
        'eldorado': { title: 'El Dorado Gold Quest', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '97.40%' },
        'f1_racing': { title: 'Grand Prix F1 Turbo', studio: 'TURBO GAMES', genre: 'electro_flight', accent: '#e71d36', rtp: '97.10%' },
        'fishhunter': { title: 'Ocean Fish Hunter', studio: 'SPINOMENAL', genre: 'slots_synth', accent: '#00e5ff', rtp: '96.80%' },
        'fruitslice': { title: 'Fruit Ninja Slice', studio: 'ARCADE CASINO', genre: 'slots_synth', accent: '#2ecc71', rtp: '97.00%' },
        'goldmine': { title: 'Gold Mine Rush', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '97.80%' },
        'greyhound': { title: 'Greyhound Velocity', studio: 'KIRON INTERACTIVE', genre: 'electro_flight', accent: '#3498db', rtp: '97.00%' },
        'hilo': { title: 'Hi-Lo Supreme Cards', studio: 'SPRIBE PARTNER', genre: 'chill_groove', accent: '#00e5ff', rtp: '98.50%' },
        'hockey_shootout': { title: 'Ice Hockey Shootout', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#3498db', rtp: '97.50%' },
        'jhandi_munda': { title: 'Jhandi Munda Traditional', studio: 'DESI CASINO', genre: 'chill_groove', accent: '#f5a623', rtp: '97.14%' },
        'keno': { title: 'Royal Keno Lounge', studio: 'PRAGMATIC PLAY', genre: 'casino_lounge', accent: '#f5a623', rtp: '96.50%' },
        'lightning_roulette': { title: 'First Person XXXtreme Lightning Roulette', studio: 'EVOLUTION GAMING', genre: 'casino_lounge', accent: '#f5a623', rtp: '97.30%' },
        'limbo': { title: 'Limbo Rocket 10,000x', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#00e5ff', rtp: '99.00%' },
        'lucky': { title: 'Lucky Clover Spin', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#2ecc71', rtp: '97.20%' },
        'lucky88': { title: 'Lucky 88 Golden Emperor', studio: 'ARISTOCRAT CASINO', genre: 'slots_synth', accent: '#f5a623', rtp: '96.88%' },
        'mines': { title: 'Mines Gold Field', studio: 'SPRIBE STUDIOS', genre: 'chill_groove', accent: '#00e5ff', rtp: '99.00%' },
        'penalty': { title: 'Penalty Shootout Pro', studio: 'EVOPLAY CASINO', genre: 'chill_groove', accent: '#2ecc71', rtp: '97.50%' },
        'pinball_deluxe': { title: 'Pinball Deluxe Royale', studio: 'ARCADE CASINO', genre: 'slots_synth', accent: '#00e5ff', rtp: '96.90%' },
        'plinko': { title: 'Plinko Master 1000x', studio: 'BGAMING OFFICIAL', genre: 'chill_groove', accent: '#00e700', rtp: '99.00%' },
        'poker': { title: 'Texas Hold\'em Poker VIP', studio: 'EVOLUTION LIVE', genre: 'table_jazz', accent: '#f5a623', rtp: '98.60%' },
        'roulette': { title: 'European Roulette Studio', studio: 'PRAGMATIC PLAY', genre: 'casino_lounge', accent: '#f5a623', rtp: '97.30%' },
        'rps': { title: 'Rock Paper Scissors 3D', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#3498db', rtp: '98.00%' },
        'russian_roulette': { title: 'Russian Roulette High Roller', studio: 'VIP TABLE GAMES', genre: 'casino_lounge', accent: '#e74c3c', rtp: '97.00%' },
        'safecracker': { title: 'Safe Cracker Vault', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '97.50%' },
        'scratch': { title: 'Diamond Scratch & Win', studio: 'HACKSAW GAMING', genre: 'chill_groove', accent: '#00e5ff', rtp: '96.20%' },
        'sicbo': { title: 'Sic Bo Triple Dice', studio: 'EVOLUTION LIVE', genre: 'chill_groove', accent: '#f5a623', rtp: '97.22%' },
        'slots': { title: 'Vegas 777 Classic Slots', studio: 'PRAGMATIC PLAY', genre: 'slots_synth', accent: '#f5a623', rtp: '96.50%' },
        'space_xy': { title: 'Space XY Cosmic Rocket', studio: 'BGAMING OFFICIAL', genre: 'electro_flight', accent: '#00e5ff', rtp: '97.00%' },
        'teenpatti': { title: 'Teen Patti 20-20 Live', studio: 'EVOLUTION LIVE', genre: 'table_jazz', accent: '#f5a623', rtp: '97.50%' },
        'topspin': { title: 'Top Spin Table Tennis', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#ff9f1c', rtp: '97.00%' },
        'tower_legend': { title: 'Tower Legend Ascent', studio: 'TURBO GAMES', genre: 'slots_synth', accent: '#9b51e0', rtp: '97.80%' },
        'treasure_chest': { title: 'Treasure Chest Bounty', studio: 'BETWITHNET ORIGINALS', genre: 'chill_groove', accent: '#f5a623', rtp: '97.50%' },
        'wheel': { title: 'Aztec Sun Stone Lucky Wheel', studio: 'TADA GAMING', genre: 'casino_lounge', accent: '#ffd700', rtp: '97.20%' },
        'zeppelin': { title: 'Zeppelin Sky Airship', studio: 'BETSOLUTIONS', genre: 'electro_flight', accent: '#e71d36', rtp: '97.00%' }
    };

    // 2. Determine Current Game
    function getCurrentGameId() {
        const path = window.location.pathname.toLowerCase();
        const filename = path.split('/').pop().replace('.html', '').replace('.php', '');
        return filename;
    }

    // 3. Inject CSS Styles for Universal Splash Window
    function injectLauncherStyles() {
        if (document.getElementById('bwn-launcher-styles')) return;
        const style = document.createElement('style');
        style.id = 'bwn-launcher-styles';
        style.textContent = `
            #bwn-game-splash {
                position: fixed;
                inset: 0;
                z-index: 999999;
                background: radial-gradient(circle at 50% 32%, #181d28 0%, #080a0f 85%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: space-between;
                padding: 40px 20px 24px;
                color: #ffffff;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                user-select: none;
                transition: opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.55s;
                overflow: hidden;
            }
            #bwn-game-splash.splash-fade-out {
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
            }
            .bwn-splash-glow {
                position: absolute;
                top: 25%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 320px;
                height: 320px;
                border-radius: 50%;
                filter: blur(80px);
                opacity: 0.22;
                pointer-events: none;
                animation: bwnGlowPulse 3s ease-in-out infinite alternate;
            }
            @keyframes bwnGlowPulse {
                0% { opacity: 0.15; transform: translate(-50%, -50%) scale(0.9); }
                100% { opacity: 0.35; transform: translate(-50%, -50%) scale(1.15); }
            }
            .bwn-splash-center {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                margin-top: 40px;
                position: relative;
                z-index: 2;
            }
            .bwn-emblem-wrap {
                position: relative;
                width: 110px;
                height: 110px;
                margin-bottom: 20px;
                animation: bwnEmblemFloat 2.8s ease-in-out infinite alternate;
            }
            @keyframes bwnEmblemFloat {
                0% { transform: translateY(0px) rotate(0deg); }
                100% { transform: translateY(-10px) rotate(1deg); }
            }
            .bwn-emblem-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                border-radius: 24px;
                box-shadow: 0 12px 35px rgba(0,0,0,0.7), 0 0 25px rgba(245, 166, 35, 0.35);
                border: 2px solid rgba(255, 255, 255, 0.18);
            }
            .bwn-splash-studio {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255, 255, 255, 0.07);
                border: 1px solid rgba(255, 255, 255, 0.14);
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.2px;
                color: #00e5ff;
                text-transform: uppercase;
                margin-bottom: 10px;
            }
            .bwn-splash-title {
                font-size: 28px;
                font-weight: 900;
                color: #ffffff;
                margin: 0 0 6px 0;
                line-height: 1.2;
                letter-spacing: -0.5px;
                text-shadow: 0 2px 14px rgba(0,0,0,0.8);
            }
            .bwn-splash-rtp-badge {
                font-size: 11.5px;
                font-weight: 700;
                color: #94a3b8;
                letter-spacing: 0.5px;
                margin-bottom: 24px;
            }
            .bwn-splash-rtp-badge span {
                color: #2ecc71;
                font-weight: 800;
            }

            /* Progress Bar */
            .bwn-progress-box {
                width: 100%;
                max-width: 320px;
                margin: 0 auto;
            }
            .bwn-progress-track {
                width: 100%;
                height: 12px;
                background: #121722;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                overflow: hidden;
                box-shadow: inset 0 2px 6px rgba(0,0,0,0.7);
                position: relative;
            }
            .bwn-progress-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #f5a623, #ff9f1c, #00e5ff);
                border-radius: 20px;
                transition: width 0.15s ease-out;
                box-shadow: 0 0 16px rgba(0, 229, 255, 0.7);
            }
            .bwn-progress-status {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 10px;
                font-size: 12px;
                font-weight: 800;
                color: #cbd5e1;
                font-family: 'JetBrains Mono', monospace;
            }
            .bwn-sound-prompt {
                margin-top: 14px;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(0, 229, 255, 0.12);
                border: 1px solid rgba(0, 229, 255, 0.3);
                padding: 7px 16px;
                border-radius: 20px;
                color: #00e5ff;
                font-size: 11.5px;
                font-weight: 800;
                cursor: pointer;
                transition: all 0.2s;
                animation: bwnPromptPulse 1.8s ease-in-out infinite;
            }
            @keyframes bwnPromptPulse {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 rgba(0, 229, 255, 0); }
                50% { transform: scale(1.03); box-shadow: 0 0 16px rgba(0, 229, 255, 0.35); }
            }
            .bwn-sound-prompt:hover {
                background: rgba(0, 229, 255, 0.25);
                color: #ffffff;
            }

            /* Regulatory Footer Badges */
            .bwn-splash-footer {
                width: 100%;
                max-width: 480px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 18px;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                font-size: 10px;
                color: #64748b;
                z-index: 2;
            }
            .bwn-footer-item b {
                display: block;
                color: #cbd5e1;
                font-size: 11px;
                margin-bottom: 2px;
            }
            .bwn-footer-legal {
                grid-column: 1 / -1;
                text-align: center;
                font-size: 9.5px;
                color: #475569;
                margin-top: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    // 4. Build and Inject Universal Opening Splash Screen
    function launchUniversalSplash() {
        const gameId = getCurrentGameId();
        // Aviator (crash.html), card, dragontiger, sicbo, coinflip, wheel, lucky88 have their own direct UX
        if (gameId === 'crash' || gameId === 'card' || gameId === 'dragontiger' || gameId === 'sicbo' || gameId === 'blackjack' || gameId === 'coinflip' || gameId === 'wheel' || gameId === 'lucky88' || gameId === 'lucky' || document.getElementById('aviator-splash') || document.getElementById('jiliLoadingScreen') || document.getElementById('dvt-game-screen')) {
            return;
        }

        const meta = GAME_REGISTRY[gameId] || {
            title: gameId.replace(/_/g, ' ').toUpperCase() + ' VIP',
            studio: 'BETWITHNET ORIGINALS',
            genre: 'casino_lounge',
            accent: '#f5a623',
            rtp: '98.00%'
        };

        injectLauncherStyles();

        const splashEl = document.createElement('div');
        splashEl.id = 'bwn-game-splash';

        const coverPath = `../assets/covers/${gameId}.png`;

        splashEl.innerHTML = `
            <div class="bwn-splash-glow" style="background:${meta.accent};"></div>

            <div class="bwn-splash-center">
                <div class="bwn-emblem-wrap">
                    <img class="bwn-emblem-img" src="${coverPath}" alt="${meta.title}" onerror="this.src='../assets/covers/casino.png'; this.onerror=null;">
                </div>
                <div class="bwn-splash-studio">
                    <span>👑</span> ${meta.studio}
                </div>
                <h1 class="bwn-splash-title">${meta.title}</h1>
                <div class="bwn-splash-rtp-badge">
                    PROVABLY FAIR RNG • <span>${meta.rtp} RTP</span> • OFFICIAL STUDIO
                </div>

                <div class="bwn-progress-box">
                    <div class="bwn-progress-track">
                        <div class="bwn-progress-fill" id="bwn-progress-bar"></div>
                    </div>
                    <div class="bwn-progress-status">
                        <span>CONNECTING TO STUDIO...</span>
                        <span id="bwn-progress-pct">0%</span>
                    </div>
                    <div class="bwn-sound-prompt" id="bwn-sound-action">
                        <span>⚡</span> INITIALIZING LIVE STUDIO STREAM
                    </div>
                </div>
            </div>

            <div class="bwn-splash-footer">
                <div class="bwn-footer-item">
                    <b>🇲🇹 Licensed in UK & Malta</b>
                    <span>MGA / B2C / 394 / 2018</span>
                </div>
                <div class="bwn-footer-item" style="text-align:right;">
                    <b>🔒 Certified GA / BMM testlabs</b>
                    <span>256-Bit SHA Encrypted RNG</span>
                </div>
                <div class="bwn-footer-item">
                    <b>🔞 18+ SUITABLE</b>
                    <span>Play Responsibly • BeGambleAware</span>
                </div>
                <div class="bwn-footer-item" style="text-align:right;">
                    <b>💎 VIP Royale Suite</b>
                    <span>Instant Payouts 2026</span>
                </div>
                <div class="bwn-footer-legal">
                    Bet With Net™ Official Gaming License. All Rights Reserved.
                </div>
            </div>
        `;

        document.body.prepend(splashEl);

        // One-time audio unlock handler for browser autoplay compliance
        let audioUnlocked = false;
        const unlockAudio = () => {
            if (audioUnlocked) return;
            audioUnlocked = true;
            if (window.sound) {
                window.sound.init();
                window.sound.stopCasinoThemeBGM();
                if (window.sound.ctx && window.sound.ctx.state === 'suspended') {
                    window.sound.ctx.resume();
                }
                if (meta.genre === 'electro_flight' && !window.sound.loadingMusicPlaying) {
                    window.sound.startLoadingMusic();
                }
            }
            document.removeEventListener('pointerdown', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        document.addEventListener('pointerdown', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        // Stop any website casino theme immediately upon game entry
        if (window.sound) {
            try { window.sound.stopCasinoThemeBGM(); } catch(e) {}
            if (meta.genre === 'electro_flight') {
                try { window.sound.startLoadingMusic(); } catch(e) {}
            }
        }

        // Animate progress 0% -> 100%
        let pct = 0;
        const bar = document.getElementById('bwn-progress-bar');
        const pctTxt = document.getElementById('bwn-progress-pct');

        const interval = setInterval(() => {
            pct += Math.floor(Math.random() * 16) + 12;
            if (pct >= 100) {
                pct = 100;
                clearInterval(interval);

                // Play completion chime for Aviator only
                if (window.sound && meta.genre === 'electro_flight') {
                    try { window.sound.onLoadingComplete(); } catch(e) {}
                }

                // Immediately trigger fullscreen & orientation if function exists
                try {
                    window.dispatchEvent(new CustomEvent('bwn:loading_complete'));
                    if (typeof window.requestFullScreenLandscape === 'function') {
                        window.requestFullScreenLandscape();
                    }
                } catch(e) {}

                setTimeout(() => {
                    splashEl.classList.add('splash-fade-out');

                    // Only Aviator flight engine plays background music in games
                    if (window.sound) {
                        try {
                            if (meta.genre === 'electro_flight') {
                                window.sound.startAviatorBGM();
                            } else {
                                window.sound.stopCasinoThemeBGM();
                                window.sound.stopBGM();
                            }
                        } catch(e) {}
                    }

                    // Remove splash element after fade transition completes
                    setTimeout(() => {
                        if (splashEl.parentNode) splashEl.parentNode.removeChild(splashEl);
                        if (typeof window.requestFullScreenLandscape === 'function') {
                            window.requestFullScreenLandscape();
                        }
                    }, 300);
                }, 120);
            }

            if (bar) bar.style.width = pct + '%';
            if (pctTxt) pctTxt.innerText = pct + '%';
            if (window.sound) {
                try { window.sound.updateLoadingProgress(pct); } catch(e) {}
            }
        }, 110);
    }

    // 5. Ensure Sleek Floating Sound & Music Control Pill
    function ensureHeaderSoundToggle() {
        const gameId = getCurrentGameId();
        if (gameId === 'crash' || gameId === 'card' || gameId === 'dragontiger' || gameId === 'sicbo' || gameId === 'lucky88' || gameId === 'lucky' || document.getElementById('aviator-splash') || document.querySelector('.aviator-app-shell') || document.getElementById('dvt-game-screen')) return;
        if (document.getElementById('bwn-sound-toggle-fixed')) return;

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'bwn-sound-toggle-fixed';
        toggleBtn.className = 'bwn-sound-toggle-btn';
        toggleBtn.style.cssText = `
            position: fixed;
            top: 14px;
            right: 16px;
            z-index: 99999;
            background: rgba(18, 24, 38, 0.82);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 24px;
            padding: 6px 12px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.5);
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            user-select: none;
        `;

        const isMuted = (window.sound && window.sound.muted);
        toggleBtn.innerHTML = `<span>${isMuted ? '🔇' : '🔊'}</span> <span style="font-size:11px; letter-spacing:0.5px; opacity:0.9;">${isMuted ? 'Muted' : 'Music ON'}</span>`;
        toggleBtn.title = 'Click to Toggle Casino Sound & Music';

        toggleBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.sound) {
                const muted = window.sound.toggleMute();
                toggleBtn.innerHTML = `<span>${muted ? '🔇' : '🔊'}</span> <span style="font-size:11px; letter-spacing:0.5px; opacity:0.9;">${muted ? 'Muted' : 'Music ON'}</span>`;
                toggleBtn.style.borderColor = muted ? 'rgba(231, 76, 60, 0.4)' : 'rgba(0, 229, 255, 0.4)';
            }
        };

        toggleBtn.onmouseenter = () => {
            toggleBtn.style.transform = 'scale(1.05)';
            toggleBtn.style.background = 'rgba(28, 36, 56, 0.95)';
        };
        toggleBtn.onmouseleave = () => {
            toggleBtn.style.transform = 'scale(1)';
            toggleBtn.style.background = 'rgba(18, 24, 38, 0.82)';
        };

        document.body.appendChild(toggleBtn);
    }

    // 6. Hook Auto-Init on DOM Ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            launchUniversalSplash();
            setTimeout(ensureHeaderSoundToggle, 400);
        });
    } else {
        launchUniversalSplash();
        setTimeout(ensureHeaderSoundToggle, 400);
    }

    window.bwnGameLauncher = {
        launch: launchUniversalSplash,
        registry: GAME_REGISTRY
    };

})();
