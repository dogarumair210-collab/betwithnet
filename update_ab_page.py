def update_andarbahar_html():
    path = '/home/betwithnet.com/public_html/games/andarbahar.html'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Add anti-cache meta tags if missing
    meta_tags = """    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">"""
    if 'http-equiv="Cache-Control"' not in code:
        code = code.replace('<meta name="viewport"', meta_tags + '\n    <meta name="viewport"')

    # 2. Fix syncSession to use /api/auth.php?action=me
    old_sync = """        async function syncSession() {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('auth_token') || localStorage.getItem('bwn_auth_token');
                if (token) {
                    const res = await fetch('/api/user/me', {
                        headers: { 'Authorization': 'Bearer ' + token }
                    });
                    const data = await res.json();
                    if (data && data.success && data.data) {
                        localStorage.setItem('bwn_session_user', JSON.stringify(data.data));
                        if (window.wallet && typeof window.wallet.syncWithUser === 'function') {
                            window.wallet.syncWithUser(data.data);
                        }
                    }
                }
            } catch(e) {}
        }"""

    new_sync = """        async function syncSession() {
            try {
                const res = await fetch('/api/auth.php?action=me', { cache: 'no-store' });
                const data = await res.json();
                if (data && data.success && data.data) {
                    localStorage.setItem('bwn_session_user', JSON.stringify(data.data));
                    if (data.data.balance_pkr !== undefined) {
                        localStorage.setItem('BETWITHNET_balance', String(data.data.balance_pkr));
                    }
                    if (window.wallet && typeof window.wallet.syncWithUser === 'function') {
                        window.wallet.syncWithUser(data.data);
                    }
                }
            } catch(e) {}
        }"""
    if old_sync in code:
        code = code.replace(old_sync, new_sync)

    # 3. Ensure getRealBalance returns at least 10000 demo for guests
    old_bal = """            if (isNaN(bal) || bal < 0) bal = 0;
            return bal;"""
    new_bal = """            if (isNaN(bal) || bal <= 0) {
                const u = localStorage.getItem('bwn_session_user');
                if (!u) {
                    bal = 10000;
                    localStorage.setItem('BETWITHNET_balance', '10000');
                    localStorage.setItem('bwn_demo_balance', '10000');
                }
            }
            return bal;"""
    if old_bal in code:
        code = code.replace(old_bal, new_bal)

    # 4. Auto bust iframe src on window load
    bust_script = """
        // Auto-bust iframe src to guarantee latest engine code
        try {
            var ifr = document.getElementById('gameIframe');
            if (ifr) {
                ifr.src = '/games/ab_engine/index.html?currency=PKR&lang=en&test=1&t=' + Date.now();
            }
        } catch(e) {}
"""
    if 'Auto-bust iframe src' not in code:
        code = code.replace("window.addEventListener('load', () => {", "window.addEventListener('load', () => {" + bust_script)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)
    print("Updated andarbahar.html successfully")

update_andarbahar_html()
