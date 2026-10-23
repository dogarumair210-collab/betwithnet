$url = "https://jiligames.com/plusplayer/PlusTrial/223/en-US"
Write-Host "Fetching official JILI session from $url..."

$req = [System.Net.HttpWebRequest]::Create($url)
$req.AllowAutoRedirect = $true
$req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
$req.Timeout = 15000

$resp = $req.GetResponse()
$effectiveUrl = $resp.ResponseUri.AbsoluteUri
$reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
$html = $reader.ReadToEnd()
$reader.Close()
$resp.Close()

Write-Host "Effective URL: $effectiveUrl"
Write-Host "HTML length: $($html.Length) chars"

$baseUrl = "https://casino-wbgame.jiligames.com/fgp/"
if ($effectiveUrl -match "(https://[^/]+/fgp/)") {
    $baseUrl = $matches[1]
}

$bridgeScript = @"
<base href="$baseUrl">
<script>
// =====================================================================
// BET WITH NET REAL WALLET BRIDGE FOR FORTUNE GEMS 2
// Directly connects the in-game bet controls & spin button to the website wallet
// =====================================================================
(function() {
    window.__BWN_CONNECTED = true;
    window.__bwn_currentBet = 50;
    window.__bwn_lastPlacedBet = 50;
    window.__bwn_pendingSpin = false;
    window.__bwn_lastWin = 0;

    console.log('[BWN-FG2] In-game wallet bridge activated! Base URL: $baseUrl');

    // Helper: Get real balance from parent Bet With Net window
    window.__bwn_getRealBalance = function() {
        try {
            if (window.parent && typeof window.parent.getRealBalance === 'function') {
                return window.parent.getRealBalance();
            }
            if (window.wallet && typeof window.wallet.getBalance === 'function') {
                return window.wallet.getBalance();
            }
            var u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
            if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) {
                return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
            }
            var b = localStorage.getItem("BETWITHNET_balance");
            if (b !== null) return parseFloat(b);
        } catch(e) {}
        return 2000;
    };

    // Helper: Place real bet from game
    window.__bwn_placeBet = function(amount) {
        amount = parseFloat(amount) || window.__bwn_currentBet || 50;
        var curBal = window.__bwn_getRealBalance();
        if (amount > curBal) {
            console.warn('[BWN-FG2] Insufficient balance! Required: ' + amount + ', Available: ' + curBal);
            alert('Insufficient Balance! Your current Bet With Net balance is PKR ' + curBal.toFixed(2) + '. Please deposit funds to continue playing.');
            return false;
        }

        try {
            if (window.parent && typeof window.parent.placeRealBetFromGame === 'function') {
                var ok = window.parent.placeRealBetFromGame(amount, 'Fortune Gems 2');
                if (ok) {
                    window.__bwn_lastPlacedBet = amount;
                    window.postMessage({ type: 'BWN_BET_PLACED', amount: amount }, '*');
                    return true;
                }
            }
        } catch(e) {
            console.error('[BWN-FG2] placeRealBetFromGame error:', e);
        }

        var newBal = Math.max(0, curBal - amount);
        localStorage.setItem("BETWITHNET_balance", newBal.toString());
        window.__bwn_lastPlacedBet = amount;
        return true;
    };

    // Helper: Credit real win from game
    window.__bwn_creditWin = function(stake, multiplier, winAmount) {
        stake = parseFloat(stake) || window.__bwn_lastPlacedBet || 50;
        winAmount = parseFloat(winAmount) || 0;
        multiplier = parseFloat(multiplier) || (stake > 0 ? winAmount / stake : 1);

        if (winAmount <= 0) return;
        console.log('[BWN-FG2] Win detected! Stake: ' + stake + ', Win: ' + winAmount + ', Mult: ' + multiplier + 'x');

        try {
            if (window.parent && typeof window.parent.winRealBetFromGame === 'function') {
                window.parent.winRealBetFromGame(stake, multiplier, winAmount, 'Fortune Gems 2');
                window.postMessage({ type: 'BWN_WIN_CREDITED', stake: stake, winAmount: winAmount, multiplier: multiplier }, '*');
                return;
            }
        } catch(e) {
            console.error('[BWN-FG2] winRealBetFromGame error:', e);
        }

        var curBal = window.__bwn_getRealBalance();
        localStorage.setItem("BETWITHNET_balance", (curBal + winAmount).toString());
    };

    // -------------------------------------------------------------
    // INTERCEPT NETWORK TRAFFIC (Fetch, XHR, WebSocket)
    // -------------------------------------------------------------

    // 1. Hook Fetch
    var origFetch = window.fetch;
    window.fetch = async function() {
        var args = arguments;
        var url = (args[0] ? args[0].toString() : '');
        var opts = args[1] || {};

        if (opts.body) {
            try {
                inspectOutgoingData(opts.body);
            } catch(e) {}
        }

        var response = await origFetch.apply(this, args);
        try {
            var clone = response.clone();
            clone.text().then(function(text) {
                inspectIncomingData(url, text);
            }).catch(function() {});
        } catch(e) {}

        return response;
    };

    // 2. Hook XMLHttpRequest
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
        this.__bwn_url = url;
        this.__bwn_method = method;
        return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function(data) {
        var url = this.__bwn_url || '';
        if (data) {
            try {
                inspectOutgoingData(data);
            } catch(e) {}
        }

        this.addEventListener('load', function() {
            try {
                if (this.responseText) {
                    inspectIncomingData(url, this.responseText);
                }
            } catch(e) {}
        });

        return origSend.apply(this, arguments);
    };

    // 3. Hook WebSocket
    var OrigWebSocket = window.WebSocket;
    window.WebSocket = function(url, protocols) {
        var ws = protocols !== undefined ? new OrigWebSocket(url, protocols) : new OrigWebSocket(url);

        var origWsSend = ws.send;
        ws.send = function(data) {
            try {
                inspectOutgoingData(data);
            } catch(e) {}
            return origWsSend.apply(this, arguments);
        };

        ws.addEventListener('message', function(ev) {
            try {
                inspectIncomingData(url, ev.data);
            } catch(e) {}
        });

        return ws;
    };
    window.WebSocket.prototype = OrigWebSocket.prototype;

    // Helper: Analyze outgoing requests to extract bet amounts
    function inspectOutgoingData(data) {
        var str = '';
        if (typeof data === 'string') {
            str = data;
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            try {
                str = new TextDecoder().decode(data);
            } catch(e) {}
        }

        if (!str) return;

        var match = str.match(/"(?:bet|betAmount|stake|totalBet|coin|wager)"\s*:\s*([0-9.]+)/i);
        if (match && match[1]) {
            var val = parseFloat(match[1]);
            if (val > 0) {
                window.__bwn_currentBet = val;
                console.log('[BWN-FG2] Captured bet selection: PKR ' + val);
            }
        }

        if (str.indexOf('spin') !== -1 || str.indexOf('Spin') !== -1 || str.indexOf('play') !== -1 || str.indexOf('action":1') !== -1) {
            console.log('[BWN-FG2] Spin command detected! Deducting bet: PKR ' + window.__bwn_currentBet);
            window.__bwn_placeBet(window.__bwn_currentBet);
        }
    }

    // Helper: Analyze incoming game responses to extract winnings
    function inspectIncomingData(sourceUrl, data) {
        var str = '';
        if (typeof data === 'string') {
            str = data;
        } else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
            try {
                str = new TextDecoder().decode(data);
            } catch(e) {}
        }

        if (!str) return;

        var winMatch = str.match(/"(?:win|totalWin|winAmount|prize|payout|award)"\s*:\s*([0-9.]+)/i);
        if (winMatch && winMatch[1]) {
            var winVal = parseFloat(winMatch[1]);
            if (winVal > 0) {
                var multMatch = str.match(/"(?:multiplier|wheelMult|specialMult)"\s*:\s*([0-9.]+)/i);
                var mult = multMatch ? parseFloat(multMatch[1]) : (winVal / (window.__bwn_lastPlacedBet || 50));
                window.__bwn_creditWin(window.__bwn_lastPlacedBet, mult, winVal);
            }
        }
    }

    // -------------------------------------------------------------
    // COCOS CANVAS TOUCH & TAP LISTENER FOR SPIN / BET BUTTONS
    // -------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', function() {
        var canvas = document.getElementById('GameCanvas');
        if (canvas) {
            function handleCanvasTap(e) {
                var rect = canvas.getBoundingClientRect();
                var x = (e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)) - rect.left;
                var y = (e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)) - rect.top;
                var w = rect.width;
                var h = rect.height;

                var relX = x / w;
                var relY = y / h;

                if (relY > 0.70 && relX > 0.35 && relX < 0.65) {
                    var curBal = window.__bwn_getRealBalance();
                    if (window.__bwn_currentBet > curBal) {
                        alert('Insufficient Bet With Net Balance! You have PKR ' + curBal.toFixed(2) + ', but current bet is PKR ' + window.__bwn_currentBet + '. Please deposit funds.');
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    }
                }
            }

            canvas.addEventListener('touchstart', handleCanvasTap, { capture: true, passive: false });
            canvas.addEventListener('mousedown', handleCanvasTap, { capture: true });
        }
    });

})();
</script>
"@

$injected = $html.Replace("<head>", "<head>`n" + $bridgeScript)
[System.IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\games\fg2_engine\index.html", $injected, [System.Text.Encoding]::UTF8)
Write-Host "Generated games/fg2_engine/index.html ($($injected.Length) bytes) successfully!"
