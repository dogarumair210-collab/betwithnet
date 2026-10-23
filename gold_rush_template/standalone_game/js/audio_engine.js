// Gold Rush Audio Engine - Web Audio API & HTML5 Audio
class GoldRushAudio {
    constructor() {
        this.basePath = '/gold_rush_template/standalone_game/assets/audio/';
        this.bgm = null;
        this.isMuted = false;
        this.sfxPool = {};
        
        this.sfxFiles = {
            spin: 'spin.mp3',
            stop: 'stop.mp3',
            win: 'win.mp3',
            win_big: 'win_big.mp3',
            multiplier: 'multiplier.mp3',
            scatter: 'scatter.mp3',
            click: 'click.mp3',
            payout: 'payout.mp3',
            pickaxe: 'pickaxe.mp3'
        };

        this.init();
    }

    init() {
        try {
            this.bgm = new Audio(this.basePath + 'bgm_main.mp3');
            this.bgm.loop = true;
            this.bgm.volume = 0.5;

            this.bgmFreeSpin = new Audio(this.basePath + 'bgm_freespin.mp3');
            this.bgmFreeSpin.loop = true;
            this.bgmFreeSpin.volume = 0.6;
        } catch (e) {
            console.warn("Audio init warning:", e);
        }
    }

    playBgm(type = 'main') {
        if (this.isMuted) return;
        try {
            if (type === 'main') {
                if (this.bgmFreeSpin) {
                    this.bgmFreeSpin.pause();
                    this.bgmFreeSpin.currentTime = 0;
                }
                if (this.bgm && this.bgm.paused) {
                    this.bgm.play().catch(() => {});
                }
            } else if (type === 'freespin') {
                if (this.bgm) {
                    this.bgm.pause();
                    this.bgm.currentTime = 0;
                }
                if (this.bgmFreeSpin && this.bgmFreeSpin.paused) {
                    this.bgmFreeSpin.play().catch(() => {});
                }
            }
        } catch (e) {}
    }

    stopBgm() {
        try {
            if (this.bgm) this.bgm.pause();
            if (this.bgmFreeSpin) this.bgmFreeSpin.pause();
        } catch (e) {}
    }

    playSfx(name) {
        if (this.isMuted) return;
        const file = this.sfxFiles[name];
        if (!file) return;

        try {
            const snd = new Audio(this.basePath + file);
            snd.volume = 0.75;
            snd.play().catch(() => {});
        } catch (e) {}
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBgm();
        } else {
            this.playBgm('main');
        }
        return this.isMuted;
    }
}

window.goldRushAudio = new GoldRushAudio();
