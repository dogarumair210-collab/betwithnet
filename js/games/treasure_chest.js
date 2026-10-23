// Treasure Chest Game compatibility bridge
class TreasureChestGame {
    constructor() { this.isPlaying = false; }
    init() {
        if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
    }
    startPick() {
        if (typeof startExpedition === 'function') startExpedition();
    }
    pickChest(idx) {
        if (typeof handleChestClick === 'function') handleChestClick(idx);
    }
}
window.treasure_chestGame = new TreasureChestGame();