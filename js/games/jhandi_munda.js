// Jhandi Munda Game Compatibility Bridge
class JhandiMundaGame {
    constructor() {
        this.symbols = ['🚩', '👑', '♠️', '♥️', '♣️', '♦️'];
    }
    init() {
        if (typeof updateBalanceDisplay === 'function') updateBalanceDisplay();
    }
    pickSymbol(sym) {
        const map = { '🚩': 'flag', '👑': 'crown', '♠️': 'spade', '♥️': 'heart', '♣️': 'club', '♦️': 'diamond' };
        const key = map[sym] || 'flag';
        if (typeof handleCardClick === 'function') handleCardClick(key);
    }
    roll() {
        if (typeof handleRollAction === 'function') handleRollAction();
    }
}
window.jhandi_mundaGame = new JhandiMundaGame();