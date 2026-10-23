def patch_index_js():
    path = '/home/betwithnet.com/public_html/games/ab_engine/assets/main/index.js'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Update __bwn_getRealBalance to fallback to 10000 instead of 0
    target_bal = """window.__bwn_getRealBalance = function() {
    try {
        if (window.parent && typeof window.parent.getRealBalance === 'function') {
            return window.parent.getRealBalance();
        }
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return window.wallet.getBalance();
        }
        var u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
        if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
        if (u && u.balance !== undefined) return parseFloat(u.balance);
        var b = localStorage.getItem("BETWITHNET_balance");
        if (b !== null) return parseFloat(b);
    } catch(e) {}
    return 0;
};"""

    repl_bal = """window.__bwn_getRealBalance = function() {
    try {
        if (window.parent && typeof window.parent.getRealBalance === 'function') {
            var pb = window.parent.getRealBalance();
            if (pb > 0) return pb;
        }
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            var wb = window.wallet.getBalance();
            if (wb > 0) return wb;
        }
        var u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
        if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
        if (u && u.balance !== undefined) return parseFloat(u.balance);
        var b = localStorage.getItem("BETWITHNET_balance") || localStorage.getItem("bwn_demo_balance");
        if (b !== null) {
            var parsedB = parseFloat(b);
            if (parsedB > 0) return parsedB;
        }
    } catch(e) {}
    return 10000;
};"""

    if target_bal in code:
        code = code.replace(target_bal, repl_bal)
        print("Patched __bwn_getRealBalance in index.js")
    else:
        print("target_bal not found in index.js")

    # 2. Add auto-join casual table in displayLobbies
    target_lobbies = 'this.lbOnline.string=""+r},t.prototype.isHighestCount'
    repl_lobbies = 'this.lbOnline.string=""+r;try{if(!window.__bwn_auto_entered&&t&&t.length>0){window.__bwn_auto_entered=!0;setTimeout(function(){try{if(s.default.Instance.mainUIManager.getCurrentNameUI()==="lobby"){e.onItemLobbyClicked(t[0]);}}catch(err){}},300);}}catch(err){}},t.prototype.isHighestCount'

    if target_lobbies in code:
        code = code.replace(target_lobbies, repl_lobbies)
        print("Patched auto-join in displayLobbies in index.js")
    else:
        print("target_lobbies not found in index.js")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Done writing index.js")

patch_index_js()
