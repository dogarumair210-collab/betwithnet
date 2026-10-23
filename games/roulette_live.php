<?php
header("Access-Control-Allow-Origin: *");
header("Cache-Control: no-cache, no-store, must-revalidate");

$url = "https://crash-games.astriona.games/?mode=fun&partnerId=1&languageCode=en&gameId=61";
$opts = [
    "http" => [
        "method" => "GET",
        "header" => "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36\r\n"
    ]
];
$context = stream_context_create($opts);
$html = @file_get_contents($url, false, $context);
if ($html === false) {
    echo "<h2 style='color:#fff;font-family:sans-serif;text-align:center;padding-top:50px;'>Connecting to VIP Roulette Studio...</h2>";
    exit;
}

// Rewrite relative assets to absolute Astriona CDN
$html = str_replace('href="/', 'href="https://crash-games.astriona.games/', $html);
$html = str_replace('src="/', 'src="https://crash-games.astriona.games/', $html);

// Inject custom CSS to style the balance box on the wooden rail like a VIP casino
$customCSS = '
<style>
/* Luxury Bet With Net styling for in-game balance */
.stat-balance {
    background: rgba(5, 10, 18, 0.85) !important;
    border: 1px solid rgba(255, 190, 46, 0.6) !important;
    border-radius: 8px !important;
    padding: 3px 10px !important;
    box-shadow: 0 0 12px rgba(255, 190, 46, 0.25) !important;
}
.stat-balance .stat-label {
    color: #00dc82 !important;
    font-weight: 800 !important;
    font-size: 10px !important;
    letter-spacing: 0.6px !important;
    text-transform: uppercase !important;
}
.stat-balance .stat-value {
    color: #ffbe2e !important;
    font-family: "JetBrains Mono", monospace, sans-serif !important;
    font-size: 15px !important;
    font-weight: 900 !important;
    letter-spacing: 0.5px !important;
    text-shadow: 0 0 10px rgba(255, 190, 46, 0.5) !important;
}
.stat-stake {
    background: rgba(5, 10, 18, 0.7) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    border-radius: 8px !important;
    padding: 3px 10px !important;
}
.stat-stake .stat-value {
    color: #ffffff !important;
    font-family: "JetBrains Mono", monospace, sans-serif !important;
    font-size: 14px !important;
    font-weight: 800 !important;
}
</style>
';

// Inject real-time wallet synchronization engine
$customJS = '
<script>
(function() {
    console.log("[BWN] Live Roulette Wallet Engine Active");

    function getWalletData() {
        let bal = 0;
        let sym = "₨ ";
        let curr = "PKR";
        let balUSD = 0;

        try {
            const pWallet = (window.parent && window.parent.wallet) ? window.parent.wallet : (window.wallet || null);
            if (pWallet && typeof pWallet.getBalance === "function") {
                bal = pWallet.getBalance();
                sym = pWallet.getCurrencySymbol ? pWallet.getCurrencySymbol() : "₨ ";
                curr = pWallet.getCurrency ? pWallet.getCurrency() : "PKR";
                balUSD = pWallet.toUSD ? pWallet.toUSD(bal) : (bal / 280);
            } else {
                const raw = localStorage.getItem("bwn_session_user") || (window.parent && window.parent.localStorage.getItem("bwn_session_user"));
                if (raw) {
                    const u = JSON.parse(raw);
                    bal = parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : (u.balancePKR || 0));
                    balUSD = parseFloat(u.balance_usd !== undefined ? u.balance_usd : (bal / 280));
                } else {
                    const st = localStorage.getItem("bwn_wallet_state_v1") || (window.parent && window.parent.localStorage.getItem("bwn_wallet_state_v1"));
                    if (st) {
                        const parsed = JSON.parse(st);
                        bal = parseFloat(parsed.balancePKR || 0);
                        balUSD = parseFloat(parsed.balanceUSD || (bal / 280));
                    }
                }
            }
        } catch(e) {
            console.warn("[BWN] wallet read error", e);
        }

        return { bal, sym, curr, balUSD };
    }

    let lastKnownBet = 0;

    function applyLiveBalance() {
        const { bal, sym, balUSD } = getWalletData();
        const formatted = sym + Number(bal).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const dualFormatted = "$" + Number(balUSD).toFixed(2);

        // 1. Table bottom rail balance (.stat-balance)
        const balVal = document.querySelector(".stat-balance .stat-value");
        if (balVal) {
            if (balVal.textContent !== formatted && !balVal.textContent.includes("₨")) {
                balVal.textContent = formatted;
            } else if (balVal.textContent !== formatted) {
                balVal.textContent = formatted;
            }
        }
        const balLabel = document.querySelector(".stat-balance .stat-label");
        if (balLabel && balLabel.textContent !== "MY WALLET") {
            balLabel.textContent = "MY WALLET";
        }

        // 2. Top bar balance if rendered
        const topBal = document.querySelector("[class*=\"_balance_\"]");
        if (topBal && topBal.textContent !== formatted) {
            topBal.textContent = formatted;
        }

        // 3. Monitor Stake (.stat-stake) to deduct bet from user real wallet
        const stakeVal = document.querySelector(".stat-stake .stat-value");
        if (stakeVal) {
            const rawStakeText = stakeVal.textContent.replace(/[^0-9.]/g, "");
            const currentStake = parseFloat(rawStakeText || "0");
            if (currentStake > lastKnownBet) {
                const diff = currentStake - lastKnownBet;
                lastKnownBet = currentStake;
                const pWallet = (window.parent && window.parent.wallet) ? window.parent.wallet : null;
                if (pWallet && typeof pWallet.deductBet === "function") {
                    pWallet.deductBet(diff, "RouletteX Live");
                    if (window.parent && window.parent.syncWallet) {
                        window.parent.syncWallet();
                    }
                }
            } else if (currentStake === 0 && lastKnownBet > 0) {
                lastKnownBet = 0;
            }
        }
    }

    // High frequency sync to guarantee 100000 USD is instantly overwritten with real wallet
    setInterval(applyLiveBalance, 100);

    // Watch for DOM mutations inside the app container
    const observer = new MutationObserver(() => {
        applyLiveBalance();
    });
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Parent wallet event listener
    try {
        if (window.parent && window.parent.wallet && window.parent.wallet.on) {
            window.parent.wallet.on("change", applyLiveBalance);
            window.parent.wallet.on("balanceChange", applyLiveBalance);
        }
    } catch(e) {}
})();
</script>
';

$html = str_replace('</head>', $customCSS . $customJS . '</head>', $html);
echo $html;
