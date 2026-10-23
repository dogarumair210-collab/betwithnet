/**
 * ============================================================
 * SIC BO IMPERIAL 3D - CASINO ENGINE & THREE.JS CONTROLLER
 * Compact Screen Layout, Realistic Crystal Glass Audio & Sweet Voices
 * Authentic Macau High-Roller VIP Suite | Bet With Net
 * ============================================================
 */

class SicBoImperialEngine {
    constructor() {
        this.selectedChip = 100;
        this.bets = {}; // Map of betKey -> amount
        this.previousBets = null;
        this.betHistoryStack = [];
        this.dice = [1, 2, 3];
        this.isRolling = false;
        this.isDomeLifted = false;
        this.history = [];
        this.soundEnabled = true;
        this.turboMode = false;
        this.hasGreeted = false;
        
        // Payout multipliers definition
        this.payouts = {
            'small': 2.0,      // 1:1 plus bet returned = 2.0x
            'big': 2.0,        // 1:1
            'odd': 2.0,        // 1:1
            'even': 2.0,       // 1:1
            'triple_any': 31.0,// 30:1
            
            // Specific Triples (180:1)
            'triple_1': 181.0,
            'triple_2': 181.0,
            'triple_3': 181.0,
            'triple_4': 181.0,
            'triple_5': 181.0,
            'triple_6': 181.0,
            
            // Specific Doubles (10:1)
            'double_1': 11.0,
            'double_2': 11.0,
            'double_3': 11.0,
            'double_4': 11.0,
            'double_5': 11.0,
            'double_6': 11.0,
            
            // Sums
            'sum_4': 61.0,
            'sum_17': 61.0,
            'sum_5': 31.0,
            'sum_16': 31.0,
            'sum_6': 19.0,
            'sum_15': 19.0,
            'sum_7': 13.0,
            'sum_14': 13.0,
            'sum_8': 9.0,
            'sum_13': 9.0,
            'sum_9': 7.0,
            'sum_10': 7.0,
            'sum_11': 7.0,
            'sum_12': 7.0,
            
            // Domino Two-Dice Combinations (5:1)
            'combo_1_2': 6.0, 'combo_1_3': 6.0, 'combo_1_4': 6.0, 'combo_1_5': 6.0, 'combo_1_6': 6.0,
            'combo_2_3': 6.0, 'combo_2_4': 6.0, 'combo_2_5': 6.0, 'combo_2_6': 6.0,
            'combo_3_4': 6.0, 'combo_3_5': 6.0, 'combo_3_6': 6.0,
            'combo_4_5': 6.0, 'combo_4_6': 6.0,
            'combo_5_6': 6.0,
            
            // Single Numbers (variable payout 1x: 2.0x, 2x: 3.0x, 3x: 4.0x)
            'single_1': 2.0,
            'single_2': 2.0,
            'single_3': 2.0,
            'single_4': 2.0,
            'single_5': 2.0,
            'single_6': 2.0
        };

        this.threeApp = null;
        this.audioCtx = null;
    }

    init() {
        this.initAudio();
        this.initThreeJS();
        this.initHistory();
        this.setupEventHandlers();
        this.renderChips();
        this.updateTotalBetDisplay();
        this.syncBalance();
        this.syncProfileAvatar();
        
        // Sweet welcome greeting
        setTimeout(() => {
            if (!this.hasGreeted) {
                this.hasGreeted = true;
                this.speakDealer("Welcome to Sic Bo Imperial! Place your bets.");
            }
        }, 1000);

        // Listen to wallet balance updates
        if (window.wallet && typeof window.wallet.on === 'function') {
            window.wallet.on('balanceChange', () => this.syncBalance());
            window.wallet.on('change', () => this.syncBalance());
        }
    }

    /* -----------------------------------------------------------
       CASINO SWEET VOICE SYNTHESIZER (SpeechSynthesis API)
       ----------------------------------------------------------- */
    speakDealer(phrase, delay = 0) {
        if (!this.soundEnabled || !('speechSynthesis' in window)) return;
        setTimeout(() => {
            try {
                window.speechSynthesis.cancel();
                const utter = new SpeechSynthesisUtterance(phrase);
                utter.rate = 1.0;
                utter.pitch = 1.22; // Sweet, charming feminine dealer voice
                utter.lang = 'en-US';
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    const sweet = voices.find(v => 
                        v.lang.startsWith('en') && 
                        (v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Karen') || 
                         v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('Natural') || 
                         v.name.includes('Female') || v.name.includes('Google US English'))
                    );
                    if (sweet) utter.voice = sweet;
                }
                window.speechSynthesis.speak(utter);
            } catch(e) {}
        }, delay);
    }

    /* -----------------------------------------------------------
       WEB AUDIO SYNTHESIZER ENGINE (Zero External Asset Dependency)
       ----------------------------------------------------------- */
    initAudio() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        } catch(e) {
            console.warn('AudioContext not available', e);
        }
    }

    playChipSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const now = this.audioCtx.currentTime;
            
            // Dual-tone crisp casino ceramic/clay chip clink
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1600, now);
            osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.06);

            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(3200, now);
            osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.04);
            gain2.gain.setValueAtTime(0.18, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start(now);
            osc2.stop(now + 0.04);
        } catch(e) {}
    }

    /* REALISTIC CRYSTAL GLASS DOME SHAKING & DICE PINGING SOUND */
    playShakeSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const duration = this.turboMode ? 0.9 : 2.0;
            const now = this.audioCtx.currentTime;
            
            // 1. Shaker motor gentle vibration
            const oscMotor = this.audioCtx.createOscillator();
            const gainMotor = this.audioCtx.createGain();
            oscMotor.type = 'triangle';
            oscMotor.frequency.setValueAtTime(62, now);
            gainMotor.gain.setValueAtTime(0.07, now);
            gainMotor.gain.linearRampToValueAtTime(0.12, now + duration * 0.4);
            gainMotor.gain.exponentialRampToValueAtTime(0.001, now + duration);
            oscMotor.connect(gainMotor);
            gainMotor.connect(this.audioCtx.destination);
            oscMotor.start(now);
            oscMotor.stop(now + duration);

            // 2. Crystal glass singing resonance hum (587.33Hz D5 & 1174Hz D6)
            const oscGlass = this.audioCtx.createOscillator();
            const gainGlass = this.audioCtx.createGain();
            oscGlass.type = 'sine';
            oscGlass.frequency.setValueAtTime(587.33, now);
            gainGlass.gain.setValueAtTime(0.025, now);
            gainGlass.gain.linearRampToValueAtTime(0.065, now + duration * 0.35);
            gainGlass.gain.exponentialRampToValueAtTime(0.001, now + duration);
            oscGlass.connect(gainGlass);
            gainGlass.connect(this.audioCtx.destination);
            oscGlass.start(now);
            oscGlass.stop(now + duration);

            // 3. Dice tumbling and pinging against crystal glass walls (high-pitched crystal pings)
            const clatterCount = this.turboMode ? 12 : 24;
            const glassFreqs = [2200, 2600, 3100, 3500, 4100, 4700, 5300];

            for (let i = 0; i < clatterCount; i++) {
                const clickTime = now + (i / clatterCount) * duration + (Math.random() * 0.035 - 0.017);
                if (clickTime < now) continue;

                // High crystalline ping (glass ricochet)
                const oscPing = this.audioCtx.createOscillator();
                const gainPing = this.audioCtx.createGain();
                const freq = glassFreqs[Math.floor(Math.random() * glassFreqs.length)];
                oscPing.type = 'sine';
                oscPing.frequency.setValueAtTime(freq, clickTime);
                oscPing.frequency.exponentialRampToValueAtTime(freq * 0.75, clickTime + 0.035);
                gainPing.gain.setValueAtTime(0.18, clickTime);
                gainPing.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.035);
                oscPing.connect(gainPing);
                gainPing.connect(this.audioCtx.destination);
                oscPing.start(clickTime);
                oscPing.stop(clickTime + 0.035);

                // Acrylic dice impact click
                const oscClick = this.audioCtx.createOscillator();
                const gainClick = this.audioCtx.createGain();
                oscClick.type = 'triangle';
                oscClick.frequency.setValueAtTime(750 + Math.random() * 600, clickTime);
                gainClick.gain.setValueAtTime(0.11, clickTime);
                gainClick.gain.exponentialRampToValueAtTime(0.001, clickTime + 0.025);
                oscClick.connect(gainClick);
                gainClick.connect(this.audioCtx.destination);
                oscClick.start(clickTime);
                oscClick.stop(clickTime + 0.025);
            }
        } catch(e) {}
    }

    playDomeLiftSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const now = this.audioCtx.currentTime;
            
            // Elegant crystalline upward chime (harmonic glissando)
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.35);
            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.24, now + 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.45);

            // Subtle air release whoosh
            const osc2 = this.audioCtx.createOscillator();
            const gain2 = this.audioCtx.createGain();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(220, now);
            osc2.frequency.exponentialRampToValueAtTime(620, now + 0.3);
            gain2.gain.setValueAtTime(0.08, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc2.connect(gain2);
            gain2.connect(this.audioCtx.destination);
            osc2.start(now);
            osc2.stop(now + 0.35);
        } catch(e) {}
    }

    playDomeDockSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const now = this.audioCtx.currentTime;
            // Soft crystal/gold docking seal click
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(920, now);
            osc.frequency.exponentialRampToValueAtTime(260, now + 0.12);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
        } catch(e) {}
    }

    playWinSound(isMega = false) {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const now = this.audioCtx.currentTime;
            
            // Sweet sparkling crystal harp chords (C5, G5, C6, E6, G6, C7)
            const chords = isMega 
                ? [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00] 
                : [523.25, 659.25, 783.99, 1046.50, 1318.51];
            
            chords.forEach((freq, idx) => {
                const noteTime = now + idx * 0.085;
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);
                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.55);

                // Octave shimmer
                const osc2 = this.audioCtx.createOscillator();
                const gain2 = this.audioCtx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(freq * 2, noteTime);
                gain2.gain.setValueAtTime(0.12, noteTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
                osc2.connect(gain2);
                gain2.connect(this.audioCtx.destination);
                osc2.start(noteTime);
                osc2.stop(noteTime + 0.35);
            });
        } catch(e) {}
    }

    playLoseSound() {
        if (!this.soundEnabled || !this.audioCtx) return;
        try {
            if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
            const now = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(160, now + 0.3);
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.3);
        } catch(e) {}
    }

    /* -----------------------------------------------------------
       THREE.JS 3D DOME SHAKER (COMPACT CAMERA & CRYSTAL DESIGN)
       ----------------------------------------------------------- */
    initThreeJS() {
        const container = document.getElementById('three-dome-canvas-container');
        if (!container) return;

        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded, using CSS 3D fallback');
            this.setupCSS3DFallback();
            return;
        }

        try {
            const width = container.clientWidth || 320;
            const height = container.clientHeight || 165;

            const scene = new THREE.Scene();
            // Compact camera setup optimized for lower canvas height
            const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
            camera.position.set(0, 4.2, 6.8);
            camera.lookAt(0, 0.95, 0);

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            container.appendChild(renderer.domElement);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.3);
            scene.add(ambientLight);

            // Focused spotlight directly pointing onto the table center
            const spotLight = new THREE.SpotLight(0xfff0b3, 2.8, 25, Math.PI / 4, 0.35, 1);
            spotLight.position.set(0, 8.5, 3.2);
            spotLight.castShadow = true;
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            scene.add(spotLight);

            const rimLight = new THREE.PointLight(0xff2244, 1.6, 10);
            rimLight.position.set(-3.2, 2.5, -2);
            scene.add(rimLight);

            const cyanRim = new THREE.PointLight(0x00f0ff, 1.3, 10);
            cyanRim.position.set(3.2, 2.5, -2);
            scene.add(cyanRim);

            // Moving specular light orbiting dome for sparkling crystal reflections
            const specularOrbitLight = new THREE.PointLight(0xfff5dd, 1.5, 10);
            specularOrbitLight.position.set(0, 3.5, 4.5);
            scene.add(specularOrbitLight);

            // Pedestal Base
            const baseGeo = new THREE.CylinderGeometry(2.9, 3.2, 0.45, 64);
            const baseMat = new THREE.MeshStandardMaterial({
                color: 0x8a6d25,
                metalness: 0.9,
                roughness: 0.22
            });
            const baseMesh = new THREE.Mesh(baseGeo, baseMat);
            baseMesh.position.y = -0.25;
            baseMesh.receiveShadow = true;
            scene.add(baseMesh);

            // Red imperial felt table inlay
            const feltGeo = new THREE.CylinderGeometry(2.65, 2.65, 0.05, 64);
            const feltMat = new THREE.MeshStandardMaterial({
                color: 0x6e0e1a, // Imperial Velvet Crimson
                roughness: 0.88,
                metalness: 0.05
            });
            const feltMesh = new THREE.Mesh(feltGeo, feltMat);
            feltMesh.position.y = 0.02;
            feltMesh.receiveShadow = true;
            scene.add(feltMesh);

            // Pedestal Neon Underglow Ring
            const ledRingGeo = new THREE.TorusGeometry(2.45, 0.045, 16, 64);
            const ledRingMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffaa00,
                emissiveIntensity: 0.85,
                roughness: 0.2
            });
            const ledRingMesh = new THREE.Mesh(ledRingGeo, ledRingMat);
            ledRingMesh.position.y = 0.05;
            ledRingMesh.rotation.x = Math.PI / 2;
            scene.add(ledRingMesh);

            // Liftable Crystal Dome Cloche Group
            const domeGroup = new THREE.Group();
            domeGroup.position.set(0, 0, 0);
            scene.add(domeGroup);

            // Crystal Glass Bell Jar Body
            const domeGeo = new THREE.SphereGeometry(2.35, 64, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
            const domeMat = new THREE.MeshPhysicalMaterial({
                color: 0xf5faff,
                metalness: 0.08,
                roughness: 0.03,
                transmission: 0.95,
                transparent: true,
                opacity: 0.62,
                reflectivity: 0.98,
                clearcoat: 1.0,
                clearcoatRoughness: 0.04,
                ior: 1.54
            });
            const domeMesh = new THREE.Mesh(domeGeo, domeMat);
            domeMesh.position.y = 0.05;
            domeGroup.add(domeMesh);

            // Bottom Golden Rim Lip
            const rimGeo = new THREE.TorusGeometry(2.36, 0.08, 16, 64);
            const goldMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 0.92,
                roughness: 0.18
            });
            const rimMesh = new THREE.Mesh(rimGeo, goldMat);
            rimMesh.position.y = 0.06;
            rimMesh.rotation.x = Math.PI / 2;
            domeGroup.add(rimMesh);

            // 4 Imperial Golden Arched Ribs
            for (let i = 0; i < 4; i++) {
                const ribGeo = new THREE.TorusGeometry(2.36, 0.03, 12, 48, Math.PI * 0.5);
                const ribMesh = new THREE.Mesh(ribGeo, goldMat);
                ribMesh.position.y = 0.05;
                ribMesh.rotation.y = (Math.PI / 2) * i;
                domeGroup.add(ribMesh);
            }

            // Top Gold Crown Finial
            const crownCollarGeo = new THREE.CylinderGeometry(0.55, 0.78, 0.25, 32);
            const crownCollarMesh = new THREE.Mesh(crownCollarGeo, goldMat);
            crownCollarMesh.position.y = 2.42;
            domeGroup.add(crownCollarMesh);

            const crownRingGeo = new THREE.TorusGeometry(0.38, 0.09, 16, 32);
            const crownRingMesh = new THREE.Mesh(crownRingGeo, goldMat);
            crownRingMesh.position.y = 2.68;
            crownRingMesh.rotation.x = Math.PI / 2;
            domeGroup.add(crownRingMesh);

            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const spikeGeo = new THREE.SphereGeometry(0.08, 16, 16);
                const spikeMesh = new THREE.Mesh(spikeGeo, goldMat);
                spikeMesh.position.set(Math.cos(angle) * 0.45, 2.76, Math.sin(angle) * 0.45);
                domeGroup.add(spikeMesh);
            }

            const rubyJewelGeo = new THREE.SphereGeometry(0.34, 24, 24);
            const rubyJewelMat = new THREE.MeshStandardMaterial({
                color: 0xd61827,
                emissive: 0x99001a,
                emissiveIntensity: 0.75,
                roughness: 0.12,
                metalness: 0.25
            });
            const rubyJewelMesh = new THREE.Mesh(rubyJewelGeo, rubyJewelMat);
            rubyJewelMesh.position.y = 2.96;
            domeGroup.add(rubyJewelMesh);

            // Floating Gold Sparkles
            const sparkleCount = 65;
            const sparkleGeo = new THREE.BufferGeometry();
            const sparklePos = new Float32Array(sparkleCount * 3);
            for (let i = 0; i < sparkleCount; i++) {
                const r = Math.random() * 1.8;
                const theta = Math.random() * Math.PI * 2;
                sparklePos[i * 3] = Math.cos(theta) * r;
                sparklePos[i * 3 + 1] = 0.3 + Math.random() * 1.8;
                sparklePos[i * 3 + 2] = Math.sin(theta) * r;
            }
            sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePos, 3));
            const sparkleMat = new THREE.PointsMaterial({
                color: 0xffe680,
                size: 0.08,
                transparent: true,
                opacity: 0.85
            });
            const sparklesMesh = new THREE.Points(sparkleGeo, sparkleMat);
            domeGroup.add(sparklesMesh);

            // 3D Casino Dice Meshes
            const diceMaterials = this.createCasinoDiceMaterials();
            const diceSize = 0.72;
            const diceGeo = new THREE.BoxGeometry(diceSize, diceSize, diceSize);
            const diceMeshes = [];
            const dicePositions = [
                new THREE.Vector3(-0.75, 0.38, 0.2),
                new THREE.Vector3(0.75, 0.38, 0.2),
                new THREE.Vector3(0, 0.38, -0.6)
            ];

            for (let i = 0; i < 3; i++) {
                const die = new THREE.Mesh(diceGeo, diceMaterials);
                die.position.copy(dicePositions[i]);
                die.castShadow = true;
                die.receiveShadow = true;
                scene.add(die);
                diceMeshes.push(die);
            }

            // Set initial resting faces for [1, 2, 3]
            this.setDiceFace(diceMeshes[0], 1);
            this.setDiceFace(diceMeshes[1], 2);
            this.setDiceFace(diceMeshes[2], 3);

            this.threeApp = {
                scene,
                camera,
                renderer,
                domeGroup,
                domeMesh,
                diceMeshes,
                baseMesh,
                spotLight,
                specularOrbitLight,
                ledRingMat,
                sparklesMesh,
                dicePositions
            };

            // Responsive resize
            window.addEventListener('resize', () => {
                if (!container || !this.threeApp) return;
                const w = container.clientWidth;
                const h = container.clientHeight;
                this.threeApp.camera.aspect = w / h;
                this.threeApp.camera.updateProjectionMatrix();
                this.threeApp.renderer.setSize(w, h);
            });

            // Interactive Parallax mouse / touch move
            container.addEventListener('mousemove', (e) => {
                if (!this.threeApp) return;
                const rect = container.getBoundingClientRect();
                const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                this.threeApp.camera.position.x = mouseX * 0.7;
                this.threeApp.camera.position.y = 4.2 + mouseY * 0.35;
                this.threeApp.camera.lookAt(0, 0.95, 0);
            });

            container.addEventListener('mouseleave', () => {
                if (!this.threeApp) return;
                this.threeApp.camera.position.x = 0;
                this.threeApp.camera.position.y = 4.2;
                this.threeApp.camera.lookAt(0, 0.95, 0);
            });

            // Click canvas to toggle dome lift
            container.addEventListener('click', () => {
                this.toggleDome();
            });

            // Render loop
            const animate = () => {
                requestAnimationFrame(animate);
                if (this.threeApp && this.threeApp.renderer && this.threeApp.scene) {
                    const time = performance.now() * 0.001;

                    // Specular light orbits around dome
                    if (this.threeApp.specularOrbitLight) {
                        this.threeApp.specularOrbitLight.position.x = Math.sin(time * 0.75) * 4.5;
                        this.threeApp.specularOrbitLight.position.z = Math.cos(time * 0.75) * 4.5;
                    }

                    // Sparkle rotation
                    if (this.threeApp.sparklesMesh) {
                        this.threeApp.sparklesMesh.rotation.y += (this.isRolling ? 0.22 : 0.006);
                    }

                    // Neon LED ring
                    if (this.threeApp.ledRingMat) {
                        if (this.isRolling) {
                            this.threeApp.ledRingMat.emissiveIntensity = 0.5 + Math.sin(time * 25) * 0.7;
                        } else {
                            this.threeApp.ledRingMat.emissiveIntensity = 0.65 + Math.sin(time * 3.5) * 0.35;
                        }
                    }

                    // Idle Breathing Animation
                    if (!this.isRolling && !this.isDomeLifted && this.threeApp.domeGroup) {
                        this.threeApp.domeGroup.position.y = Math.sin(time * 2.2) * 0.035;
                        this.threeApp.domeGroup.rotation.y = Math.sin(time * 0.8) * 0.02;
                    }

                    this.threeApp.renderer.render(this.threeApp.scene, this.threeApp.camera);
                }
            };
            animate();

        } catch (e) {
            console.error('ThreeJS initialization error, using CSS fallback', e);
            this.setupCSS3DFallback();
        }
    }

    /* -----------------------------------------------------------
       DOME LIFT & REVEAL ANIMATIONS
       ----------------------------------------------------------- */
    async liftDome(duration = 750) {
        if (!this.threeApp || !this.threeApp.domeGroup || this.isDomeLifted) return;
        this.isDomeLifted = true;
        this.playDomeLiftSound();

        const btn = document.getElementById('btn-toggle-dome');
        if (btn) btn.innerHTML = '🔽 Cover Bowl';

        const startTime = performance.now();
        const startY = this.threeApp.domeGroup.position.y;
        const targetY = 2.45; // Compact elevation

        return new Promise(resolve => {
            const step = (time) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3);

                this.threeApp.domeGroup.position.y = startY + (targetY - startY) * ease;
                this.threeApp.domeGroup.rotation.x = -0.12 * ease;

                if (this.threeApp.spotLight) {
                    this.threeApp.spotLight.intensity = 2.8 + 1.2 * ease;
                }

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    }

    async lowerDome(duration = 600) {
        if (!this.threeApp || !this.threeApp.domeGroup || !this.isDomeLifted) return;
        this.isDomeLifted = false;
        this.playDomeDockSound();

        const btn = document.getElementById('btn-toggle-dome');
        if (btn) btn.innerHTML = '👁️ Lift Bowl';

        const startTime = performance.now();
        const startY = this.threeApp.domeGroup.position.y;
        const targetY = 0;

        return new Promise(resolve => {
            const step = (time) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = progress < 0.5 
                    ? 4 * progress * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

                this.threeApp.domeGroup.position.y = startY + (targetY - startY) * ease;
                this.threeApp.domeGroup.rotation.x = -0.12 * (1 - ease);

                if (this.threeApp.spotLight) {
                    this.threeApp.spotLight.intensity = 4.0 - 1.2 * ease;
                }

                if (progress < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.threeApp.domeGroup.position.y = 0;
                    this.threeApp.domeGroup.rotation.x = 0;
                    resolve();
                }
            };
            requestAnimationFrame(step);
        });
    }

    toggleDome() {
        if (this.isRolling) return;
        if (this.isDomeLifted) {
            this.lowerDome();
        } else {
            this.liftDome();
        }
    }

    createCasinoDiceMaterials() {
        const createFaceTexture = (val) => {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');

            const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 140);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.85, '#f5ede0');
            grad.addColorStop(1, '#dfd4c0');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);

            ctx.lineWidth = 10;
            ctx.strokeStyle = '#c4b39b';
            ctx.strokeRect(5, 5, 246, 246);

            const isRed = (val === 1 || val === 4);
            ctx.fillStyle = isRed ? '#d61827' : '#141d2f';

            const drawPip = (x, y, r) => {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.7, 0, Math.PI * 2);
                ctx.fillStyle = isRed ? '#ff5252' : '#2d3f61';
                ctx.fill();
                ctx.fillStyle = isRed ? '#d61827' : '#141d2f';
            };

            const rNormal = 18;
            const rAce = 36;

            switch (val) {
                case 1:
                    drawPip(128, 128, rAce);
                    break;
                case 2:
                    drawPip(72, 72, rNormal);
                    drawPip(184, 184, rNormal);
                    break;
                case 3:
                    drawPip(68, 68, rNormal);
                    drawPip(128, 128, rNormal);
                    drawPip(188, 188, rNormal);
                    break;
                case 4:
                    drawPip(74, 74, rNormal + 3);
                    drawPip(182, 74, rNormal + 3);
                    drawPip(74, 182, rNormal + 3);
                    drawPip(182, 182, rNormal + 3);
                    break;
                case 5:
                    drawPip(70, 70, rNormal);
                    drawPip(186, 70, rNormal);
                    drawPip(128, 128, rNormal);
                    drawPip(70, 186, rNormal);
                    drawPip(186, 186, rNormal);
                    break;
                case 6:
                    drawPip(70, 60, rNormal);
                    drawPip(70, 128, rNormal);
                    drawPip(70, 196, rNormal);
                    drawPip(186, 60, rNormal);
                    drawPip(186, 128, rNormal);
                    drawPip(186, 196, rNormal);
                    break;
            }

            const tex = new THREE.CanvasTexture(canvas);
            return new THREE.MeshStandardMaterial({
                map: tex,
                roughness: 0.18,
                metalness: 0.05
            });
        };

        return [
            createFaceTexture(1),
            createFaceTexture(6),
            createFaceTexture(2),
            createFaceTexture(5),
            createFaceTexture(3),
            createFaceTexture(4)
        ];
    }

    setDiceFace(mesh, targetVal) {
        if (!mesh) return;
        mesh.rotation.set(0, 0, 0);
        switch (targetVal) {
            case 2:
                mesh.rotation.set(0, 0, 0);
                break;
            case 5:
                mesh.rotation.set(Math.PI, 0, 0);
                break;
            case 1:
                mesh.rotation.set(0, 0, Math.PI / 2);
                break;
            case 6:
                mesh.rotation.set(0, 0, -Math.PI / 2);
                break;
            case 3:
                mesh.rotation.set(-Math.PI / 2, 0, 0);
                break;
            case 4:
                mesh.rotation.set(Math.PI / 2, 0, 0);
                break;
        }
        mesh.rotation.y += (Math.random() * 0.4 - 0.2);
    }

    setupCSS3DFallback() {
        const container = document.getElementById('three-dome-canvas-container');
        if (!container) return;
        container.innerHTML = `
            <div class="css3d-dome-fallback">
                <div id="fallback-dice-1" class="css3d-die">1</div>
                <div id="fallback-dice-2" class="css3d-die">2</div>
                <div id="fallback-dice-3" class="css3d-die">3</div>
            </div>
        `;
    }

    /* -----------------------------------------------------------
       BETTING & CHIP PLACEMENT LOGIC (Multi-Bet System)
       ----------------------------------------------------------- */
    setupEventHandlers() {
        document.querySelectorAll('.sicbo-bet-spot').forEach(spot => {
            spot.addEventListener('click', (e) => {
                const betKey = spot.getAttribute('data-bet');
                if (betKey) {
                    this.addBet(betKey);
                }
            });
        });

        const clearBtns = document.querySelectorAll('#btn-clear-bets, #btn-table-clear');
        clearBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.clearAllBets();
                this.speakDealer("Bets cleared.");
            });
        });

        const doubleBtns = document.querySelectorAll('#btn-double-bets, #btn-table-double');
        doubleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.doubleBets();
                this.speakDealer("Double bets.");
            });
        });

        const undoBtn = document.getElementById('btn-undo-bet');
        if (undoBtn) undoBtn.addEventListener('click', () => this.undoLastBet());

        const rebetBtn = document.getElementById('btn-rebet');
        if (rebetBtn) rebetBtn.addEventListener('click', () => {
            this.rebet();
            this.speakDealer("Rebet accepted.");
        });

        const rollBtns = document.querySelectorAll('#btn-roll-action, #btn-roll-action-table, .btn-primary-roll');
        rollBtns.forEach(btn => {
            btn.addEventListener('click', () => this.roll());
        });

        const toggleDomeBtn = document.getElementById('btn-toggle-dome');
        if (toggleDomeBtn) toggleDomeBtn.addEventListener('click', () => this.toggleDome());

        // Screen Rotation Button
        const rotateBtn = document.getElementById('btn-rotate-screen');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', (e) => {
                if (typeof window.toggleScreenRotation === 'function') {
                    window.toggleScreenRotation(e);
                } else {
                    document.body.classList.toggle('manual-rotate');
                    document.documentElement.classList.toggle('manual-rotate');
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                    }, 100);
                    this.speakDealer("Screen rotated.");
                }
            });
        }

        // Sound Toggle
        const soundBtn = document.getElementById('btn-sound-toggle');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                this.soundEnabled = !this.soundEnabled;
                soundBtn.classList.toggle('muted', !this.soundEnabled);
                soundBtn.innerHTML = this.soundEnabled ? '🔊' : '🔇';
                if (!this.soundEnabled && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                }
            });
        }

        // Turbo Toggle
        const turboBtn = document.getElementById('btn-turbo-toggle');
        if (turboBtn) {
            turboBtn.addEventListener('click', () => {
                this.turboMode = !this.turboMode;
                turboBtn.classList.toggle('active', this.turboMode);
            });
        }

        // Rules modal toggle
        const rulesBtn = document.getElementById('btn-rules-toggle');
        const rulesModal = document.getElementById('sicbo-rules-modal');
        const rulesClose = document.getElementById('btn-rules-close');
        if (rulesBtn && rulesModal) {
            rulesBtn.addEventListener('click', () => rulesModal.classList.add('open'));
        }
        if (rulesClose && rulesModal) {
            rulesClose.addEventListener('click', () => rulesModal.classList.remove('open'));
        }
    }

    renderChips() {
        const chips = [10, 50, 100, 500, 1000, 5000, 10000, 25000];
        const tray = document.getElementById('chip-selector-tray');
        if (!tray) return;

        tray.innerHTML = '';
        chips.forEach(val => {
            const chip = document.createElement('div');
            chip.className = `casino-chip chip-${val} ${this.selectedChip === val ? 'selected' : ''}`;
            chip.setAttribute('data-val', val);
            chip.innerHTML = `
                <div class="chip-inner">
                    <span class="chip-label">${this.formatChipLabel(val)}</span>
                </div>
            `;
            chip.addEventListener('click', () => {
                this.selectedChip = val;
                document.querySelectorAll('.casino-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this.playChipSound();
            });
            tray.appendChild(chip);
        });
    }

    formatChipLabel(val) {
        if (val >= 1000) return (val / 1000) + 'K';
        return val.toString();
    }

    addBet(betKey) {
        if (this.isRolling) return;

        if (this.isDomeLifted) {
            this.lowerDome();
        }

        const currentTotal = this.getTotalBetAmount();
        const newTotal = currentTotal + this.selectedChip;
        const currentBal = this.getUserBalance();

        if (newTotal > currentBal) {
            this.showToast('Insufficient balance for this bet!', 'warning');
            return;
        }

        this.bets[betKey] = (this.bets[betKey] || 0) + this.selectedChip;
        this.betHistoryStack.push({ key: betKey, amount: this.selectedChip });

        this.playChipSound();
        this.renderBetChipsOnTable();
        this.updateTotalBetDisplay();

        // First bet voice prompt
        if (this.betHistoryStack.length === 1) {
            this.speakDealer("Bets placed!");
        }
    }

    undoLastBet() {
        if (this.isRolling || this.betHistoryStack.length === 0) return;
        const last = this.betHistoryStack.pop();
        if (last && this.bets[last.key]) {
            this.bets[last.key] -= last.amount;
            if (this.bets[last.key] <= 0) {
                delete this.bets[last.key];
            }
        }
        this.playChipSound();
        this.renderBetChipsOnTable();
        this.updateTotalBetDisplay();
    }

    clearAllBets() {
        if (this.isRolling) return;
        this.bets = {};
        this.betHistoryStack = [];
        this.renderBetChipsOnTable();
        this.updateTotalBetDisplay();
        this.playChipSound();
    }

    doubleBets() {
        if (this.isRolling) return;
        const currentTotal = this.getTotalBetAmount();
        if (currentTotal === 0) return;

        const newTotal = currentTotal * 2;
        if (newTotal > this.getUserBalance()) {
            this.showToast('Balance too low to double!', 'warning');
            return;
        }

        Object.keys(this.bets).forEach(k => {
            this.bets[k] *= 2;
        });
        this.betHistoryStack.push({ type: 'double' });
        this.playChipSound();
        this.renderBetChipsOnTable();
        this.updateTotalBetDisplay();
    }

    rebet() {
        if (this.isRolling || !this.previousBets) return;
        const prevTotal = Object.values(this.previousBets).reduce((a, b) => a + b, 0);
        if (prevTotal > this.getUserBalance()) {
            this.showToast('Balance too low to rebet!', 'warning');
            return;
        }

        this.bets = JSON.parse(JSON.stringify(this.previousBets));
        this.betHistoryStack = [];
        this.playChipSound();
        this.renderBetChipsOnTable();
        this.updateTotalBetDisplay();
    }

    renderBetChipsOnTable() {
        document.querySelectorAll('.table-chip-badge').forEach(el => el.remove());
        document.querySelectorAll('.sicbo-bet-spot').forEach(spot => spot.classList.remove('has-bet'));

        Object.keys(this.bets).forEach(betKey => {
            const amount = this.bets[betKey];
            if (amount <= 0) return;

            const spot = document.querySelector(`.sicbo-bet-spot[data-bet="${betKey}"]`);
            if (spot) {
                spot.classList.add('has-bet');
                const badge = document.createElement('div');
                badge.className = 'table-chip-badge';
                badge.innerHTML = `<span>₨${this.formatCompact(amount)}</span>`;
                spot.appendChild(badge);
            }
        });
    }

    getTotalBetAmount() {
        return Object.values(this.bets).reduce((a, b) => a + b, 0);
    }

    getUserBalance() {
        if (window.wallet && window.wallet.state) {
            return window.wallet.state.currency === 'USD' 
                ? (window.wallet.state.balanceUSD || 0) 
                : (window.wallet.state.balancePKR || 0);
        }
        return 0;
    }

    updateTotalBetDisplay() {
        const total = this.getTotalBetAmount();
        const totalEl = document.getElementById('stat-total-bet');
        if (totalEl) {
            totalEl.innerText = `₨ ${total.toLocaleString()}`;
        }
        const tableTotalEl = document.getElementById('stat-table-total-bet');
        if (tableTotalEl) {
            tableTotalEl.innerText = `₨ ${total.toLocaleString()}`;
        }

        const rollBtns = document.querySelectorAll('#btn-roll-action, #btn-roll-action-table, .btn-primary-roll');
        rollBtns.forEach(btn => {
            btn.disabled = this.isRolling || total === 0;
        });

        const clearBtns = document.querySelectorAll('#btn-clear-bets, #btn-table-clear');
        clearBtns.forEach(btn => {
            btn.disabled = this.isRolling || total === 0;
        });

        const doubleBtns = document.querySelectorAll('#btn-double-bets, #btn-table-double');
        doubleBtns.forEach(btn => {
            btn.disabled = this.isRolling || total === 0;
        });

        const undoBtn = document.getElementById('btn-undo-bet');
        if (undoBtn) undoBtn.disabled = this.isRolling || this.betHistoryStack.length === 0;

        const rebetBtn = document.getElementById('btn-rebet');
        if (rebetBtn) rebetBtn.disabled = this.isRolling || !this.previousBets;
    }

    syncBalance() {
        const balEl = document.getElementById('stat-user-balance');
        if (balEl && window.wallet) {
            balEl.innerText = window.wallet.formatAmount(this.getUserBalance());
        }
    }

    syncProfileAvatar() {
        try {
            const avWrap = document.getElementById('headerUserAvatar');
            if (avWrap) {
                avWrap.removeAttribute('title');
                avWrap.removeAttribute('aria-label');
                avWrap.innerHTML = `<img src="../assets/icons/sicbo_profile.png?v=777" alt="Sic Bo Profile" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block; pointer-events:none;">`;
            }
        } catch(e) {}
    }

    formatCompact(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
        return num.toString();
    }

    /* -----------------------------------------------------------
       GAME ROLL & 3D PHYSICS TUMBLE ANIMATION
       ----------------------------------------------------------- */
    async roll() {
        if (this.isRolling) return;
        const totalBet = this.getTotalBetAmount();
        if (totalBet <= 0) {
            this.showToast('Please place at least one bet on the board!', 'warning');
            return;
        }

        if (!window.wallet || !window.wallet.placeBet(totalBet, 'Sic Bo Imperial')) {
            this.showToast('Wallet transaction failed. Check balance.', 'error');
            return;
        }

        if (this.isDomeLifted) {
            await this.lowerDome(400);
        }

        this.isRolling = true;
        this.previousBets = JSON.parse(JSON.stringify(this.bets));
        this.updateTotalBetDisplay();
        this.syncBalance();

        // Sweet Dealer Voice: "No more bets!"
        this.speakDealer("No more bets!");

        this.setStatus('SHAKING DOME...', 'rolling');
        this.playShakeSound();

        const domeWrap = document.getElementById('three-dome-canvas-container');
        if (domeWrap) domeWrap.classList.add('vibrating');

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;
        this.dice = [d1, d2, d3];

        await this.animate3DDice(d1, d2, d3);

        if (domeWrap) domeWrap.classList.remove('vibrating');

        // Automatically lift the glass dome to reveal winning dice
        await this.liftDome(650);

        // Calculate wins
        this.evaluateRound(d1, d2, d3, totalBet);
    }

    async animate3DDice(target1, target2, target3) {
        const duration = this.turboMode ? 850 : 1900;
        const startTime = performance.now();

        if (this.threeApp && this.threeApp.diceMeshes) {
            const meshes = this.threeApp.diceMeshes;
            const originalPositions = this.threeApp.dicePositions;
            const domeGroup = this.threeApp.domeGroup;

            return new Promise(resolve => {
                const animateStep = (time) => {
                    const elapsed = time - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    if (progress < 1) {
                        const speed = (1 - progress * 0.7);
                        meshes.forEach((mesh, idx) => {
                            mesh.rotation.x += 0.35 * speed * (idx === 0 ? 1 : -1.2);
                            mesh.rotation.y += 0.42 * speed * (idx === 1 ? -1 : 1.1);
                            mesh.rotation.z += 0.38 * speed;

                            const bounceHeight = Math.sin(progress * Math.PI * 8 + idx) * (1 - progress) * 1.5;
                            mesh.position.y = 0.38 + Math.max(0, bounceHeight);
                            
                            mesh.position.x = originalPositions[idx].x + Math.sin(time * 0.02 + idx) * 0.22 * (1 - progress);
                            mesh.position.z = originalPositions[idx].z + Math.cos(time * 0.02 + idx) * 0.22 * (1 - progress);
                        });

                        // 3D Glass Dome mechanical vibration
                        if (domeGroup) {
                            domeGroup.position.x = (Math.random() - 0.5) * 0.12 * (1 - progress);
                            domeGroup.position.z = (Math.random() - 0.5) * 0.12 * (1 - progress);
                            domeGroup.rotation.z = (Math.random() - 0.5) * 0.035 * (1 - progress);
                        }

                        requestAnimationFrame(animateStep);
                    } else {
                        meshes.forEach((mesh, idx) => {
                            mesh.position.copy(originalPositions[idx]);
                            mesh.position.y = 0.38;
                        });
                        this.setDiceFace(meshes[0], target1);
                        this.setDiceFace(meshes[1], target2);
                        this.setDiceFace(meshes[2], target3);

                        if (domeGroup) {
                            domeGroup.position.x = 0;
                            domeGroup.position.z = 0;
                            domeGroup.rotation.z = 0;
                        }
                        resolve();
                    }
                };
                requestAnimationFrame(animateStep);
            });
        } else {
            const f1 = document.getElementById('fallback-dice-1');
            const f2 = document.getElementById('fallback-dice-2');
            const f3 = document.getElementById('fallback-dice-3');
            const interval = 60;
            const steps = duration / interval;
            for (let i = 0; i < steps; i++) {
                if (f1) f1.innerText = Math.floor(Math.random() * 6) + 1;
                if (f2) f2.innerText = Math.floor(Math.random() * 6) + 1;
                if (f3) f3.innerText = Math.floor(Math.random() * 6) + 1;
                await new Promise(r => setTimeout(r, interval));
            }
            if (f1) f1.innerText = target1;
            if (f2) f2.innerText = target2;
            if (f3) f3.innerText = target3;
        }
    }

    /* -----------------------------------------------------------
       ROUND EVALUATION & SWEET CALLOUTS
       ----------------------------------------------------------- */
    evaluateRound(d1, d2, d3, totalBet) {
        const sum = d1 + d2 + d3;
        const isTriple = (d1 === d2 && d2 === d3);
        const isSmall = (sum >= 4 && sum <= 10 && !isTriple);
        const isBig = (sum >= 11 && sum <= 17 && !isTriple);
        const isOdd = (sum % 2 !== 0 && !isTriple);
        const isEven = (sum % 2 === 0 && !isTriple);

        const winningSpots = new Set();

        if (isSmall) winningSpots.add('small');
        if (isBig) winningSpots.add('big');
        if (isOdd) winningSpots.add('odd');
        if (isEven) winningSpots.add('even');

        if (isTriple) {
            winningSpots.add('triple_any');
            winningSpots.add(`triple_${d1}`);
        }

        if ((d1 === d2 || d2 === d3 || d1 === d3) && !isTriple) {
            const doubleVal = (d1 === d2 || d1 === d3) ? d1 : d2;
            winningSpots.add(`double_${doubleVal}`);
        }

        winningSpots.add(`sum_${sum}`);

        const diceSorted = [d1, d2, d3].sort((a, b) => a - b);
        const pairs = [
            `${diceSorted[0]}_${diceSorted[1]}`,
            `${diceSorted[0]}_${diceSorted[2]}`,
            `${diceSorted[1]}_${diceSorted[2]}`
        ];
        pairs.forEach(p => winningSpots.add(`combo_${p}`));

        const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        counts[d1]++;
        counts[d2]++;
        counts[d3]++;
        [1, 2, 3, 4, 5, 6].forEach(num => {
            if (counts[num] > 0) winningSpots.add(`single_${num}`);
        });

        document.querySelectorAll('.sicbo-bet-spot').forEach(spot => {
            const key = spot.getAttribute('data-bet');
            if (winningSpots.has(key)) {
                spot.classList.add('winner-glow');
            } else {
                spot.classList.remove('winner-glow');
            }
        });

        let totalPayout = 0;
        let highestMultiplier = 0;

        Object.keys(this.bets).forEach(betKey => {
            const betAmt = this.bets[betKey];
            if (betAmt <= 0) return;

            if (winningSpots.has(betKey)) {
                let mult = this.payouts[betKey] || 2.0;

                if (betKey.startsWith('single_')) {
                    const num = parseInt(betKey.replace('single_', ''));
                    const occ = counts[num] || 1;
                    mult = 1.0 + occ;
                }

                const payout = betAmt * mult;
                totalPayout += payout;
                if (mult > highestMultiplier) highestMultiplier = mult;
            }
        });

        const netProfit = totalPayout - totalBet;
        const won = totalPayout > 0;

        // Sweet Dealer Announcement of winning result
        if (isTriple) {
            this.speakDealer(`Triple ${d1}! Mega Jackpot!`);
        } else if (isBig) {
            this.speakDealer(`Big, total ${sum}.`);
        } else if (isSmall) {
            this.speakDealer(`Small, total ${sum}.`);
        }

        if (won) {
            window.wallet.creditWin(
                totalBet, 
                totalPayout, 
                'Sic Bo Imperial', 
                highestMultiplier, 
                `Sum ${sum} (${d1}, ${d2}, ${d3}) | Net: +${netProfit}`
            );
            this.playWinSound(highestMultiplier >= 30);
            this.showRoundVictoryBanner(sum, [d1, d2, d3], totalPayout, netProfit);
            this.setStatus(`WIN! SUM ${sum} (+₨${this.formatCompact(totalPayout)})`, 'win');
            
            // Sweet congratulatory cheer
            setTimeout(() => {
                this.speakDealer("Winner! Congratulations!");
            }, 1200);
        } else {
            window.wallet.creditWin(
                totalBet, 
                0, 
                'Sic Bo Imperial', 
                0, 
                `Sum ${sum} (${d1}, ${d2}, ${d3})`
            );
            this.playLoseSound();
            this.setStatus(`RESULT: SUM ${sum} (${d1}-${d2}-${d3})`, 'loss');
        }

        this.addHistoryRecord({
            d1, d2, d3, sum,
            isSmall, isBig, isTriple,
            won, payout: totalPayout
        });

        this.syncBalance();
        this.isRolling = false;
        this.updateTotalBetDisplay();

        setTimeout(() => {
            document.querySelectorAll('.sicbo-bet-spot').forEach(spot => spot.classList.remove('winner-glow'));
        }, 3800);
    }

    setStatus(text, type = 'normal') {
        const el = document.getElementById('sicbo-hud-status');
        if (el) {
            el.className = `sicbo-hud-banner status-${type}`;
            el.innerHTML = text;
        }
    }

    showRoundVictoryBanner(sum, dice, payout, netProfit) {
        const overlay = document.getElementById('round-win-overlay');
        if (!overlay) return;

        overlay.innerHTML = `
            <div class="win-card animate-win-pop">
                <div class="win-title">✨ VICTORY WIN ✨</div>
                <div class="win-dice-display">
                    <span class="hud-pip">${dice[0]}</span>
                    <span class="hud-pip">${dice[1]}</span>
                    <span class="hud-pip">${dice[2]}</span>
                </div>
                <div class="win-sum-badge">SUM TOTAL: ${sum}</div>
                <div class="win-amount">+₨ ${payout.toLocaleString()}</div>
                <div class="win-sub">Net Profit: ₨ ${netProfit.toLocaleString()}</div>
            </div>
        `;
        overlay.classList.add('active');

        this.triggerCelebrationParticles();

        setTimeout(() => {
            overlay.classList.remove('active');
        }, 2700);
    }

    triggerCelebrationParticles() {
        const container = document.getElementById('celebration-canvas-container');
        if (!container) return;

        const count = 35;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'gold-coin-particle';
            p.style.left = `${45 + (Math.random() * 10 - 5)}%`;
            p.style.top = `${40 + (Math.random() * 10 - 5)}%`;
            p.style.setProperty('--tx', `${(Math.random() * 500 - 250)}px`);
            p.style.setProperty('--ty', `${(Math.random() * 500 - 250)}px`);
            p.style.setProperty('--rot', `${Math.random() * 720}deg`);
            container.appendChild(p);
            setTimeout(() => p.remove(), 1200);
        }
    }

    /* -----------------------------------------------------------
       HISTORY ROADMAP & BEAD PLATE
       ----------------------------------------------------------- */
    initHistory() {
        for (let i = 0; i < 15; i++) {
            const d1 = Math.floor(Math.random() * 6) + 1;
            const d2 = Math.floor(Math.random() * 6) + 1;
            const d3 = Math.floor(Math.random() * 6) + 1;
            const sum = d1 + d2 + d3;
            const isTriple = (d1 === d2 && d2 === d3);
            this.history.push({
                d1, d2, d3, sum,
                isSmall: sum >= 4 && sum <= 10 && !isTriple,
                isBig: sum >= 11 && sum <= 17 && !isTriple,
                isTriple
            });
        }
        this.renderHistory();
    }

    addHistoryRecord(rec) {
        this.history.push(rec);
        if (this.history.length > 30) this.history.shift();
        this.renderHistory();
    }

    renderHistory() {
        const road = document.getElementById('sicbo-roadmap-beads');
        if (!road) return;

        road.innerHTML = '';
        let smallCount = 0, bigCount = 0, tripleCount = 0;

        this.history.forEach(item => {
            if (item.isTriple) tripleCount++;
            else if (item.isSmall) smallCount++;
            else if (item.isBig) bigCount++;

            const bead = document.createElement('div');
            let beadClass = 'bead-small';
            let label = 'S';
            if (item.isTriple) {
                beadClass = 'bead-triple';
                label = 'T';
            } else if (item.isBig) {
                beadClass = 'bead-big';
                label = 'B';
            }

            bead.className = `roadmap-bead ${beadClass}`;
            bead.title = `Dice: ${item.d1}+${item.d2}+${item.d3} = ${item.sum}`;
            bead.innerHTML = `
                <span class="bead-type">${label}</span>
                <span class="bead-sum">${item.sum}</span>
            `;
            road.appendChild(bead);
        });

        road.scrollLeft = road.scrollWidth;

        const total = this.history.length || 1;
        const smallPct = Math.round((smallCount / total) * 100);
        const bigPct = Math.round((bigCount / total) * 100);
        const statBar = document.getElementById('roadmap-stat-bar');
        if (statBar) {
            statBar.innerHTML = `
                <div class="stat-seg small" style="width:${smallPct}%">S:${smallPct}%</div>
                <div class="stat-seg big" style="width:${bigPct}%">B:${bigPct}%</div>
            `;
        }
    }

    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `sicbo-toast toast-${type}`;
        toast.innerText = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 2400);
    }
}

// Global Export
window.sicboImperial = new SicBoImperialEngine();
window.sicboGame = window.sicboImperial; // Backwards compatibility
