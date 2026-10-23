// ============================================================
// Bet With Net - Keno 80-Ball Casino Lottery Engine (Full HD VIP)
// 80 numbers, pick 1-10, draw 20 balls with live 3D sphere tray & paytable
// ============================================================

class KenoGame {
    constructor() {
        this.selectedNumbers = [];
        this.drawnNumbers = [];
        this.isPlaying = false;
        this.maxPick = 10;
        this.payoutTable = {
            1: { 1: 3.5 },
            2: { 2: 9 },
            3: { 2: 2, 3: 26 },
            4: { 2: 1, 3: 5, 4: 85 },
            5: { 3: 2, 4: 12, 5: 350 },
            6: { 3: 1, 4: 4, 5: 50, 6: 1200 },
            7: { 3: 1, 4: 2, 5: 15, 6: 120, 7: 2500 },
            8: { 4: 2, 5: 8, 6: 55, 7: 450, 8: 6000 },
            9: { 4: 1, 5: 4, 6: 28, 7: 180, 8: 1200, 9: 8500 },
            10: { 5: 2, 6: 15, 7: 55, 8: 250, 9: 1500, 10: 10000 }
        };
    }

    init() {
        if (typeof renderMatrixGrid === 'function') {
            // Already initialized in page
            return;
        }
    }

    toggleNumber(num) {
        if (typeof toggleNumber === 'function') {
            toggleNumber(num);
        }
    }

    quickPickCount(count) {
        if (typeof quickPick === 'function') {
            quickPick(count);
        }
    }

    quickPick() {
        this.quickPickCount(10);
    }

    clearPicks() {
        if (typeof clearAllPicks === 'function') {
            clearAllPicks();
        }
    }

    draw(bet = 100) {
        if (typeof handleDrawClick === 'function') {
            const betInput = document.getElementById('kenoBetInput');
            if (betInput) betInput.value = bet;
            handleDrawClick();
        }
    }

    toast(msg, type = 'info') {
        if (window.core && window.core.showToast) {
            window.core.showToast(msg, type);
        } else if (window.app && window.app.showToast) {
            window.app.showToast(msg, type);
        }
    }
}

window.kenoGame = new KenoGame();
