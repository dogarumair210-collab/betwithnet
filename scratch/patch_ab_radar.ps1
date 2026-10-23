$path = "c:\Users\as\Desktop\bet with net\games\ab_engine\assets\main\index.js"
$content = [System.IO.File]::ReadAllText($path)

$bundleIdx = $content.IndexOf("window.__require=function e(t,n,o){")
if ($bundleIdx -lt 0) {
    throw "Could not find bundle start window.__require=function e(t,n,o){"
}

$bundleBody = $content.Substring($bundleIdx)

# 1. Hook game_round.prototype.associateAttributes
$target1 = 'cc._RF.push(t,"8419d0yYItNZbjiZxEkfUzS","game_round"),Object.defineProperty(n,"__esModule",{value:!0});var o=e("lodash"),i=e("../../base/model/round_base"),r=cc._decorator,a=r.ccclass,s=(r.property,function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return __extends(t,e),t.prototype.associateAttributes=function(){e.prototype.associateAttributes.call(this)}'
$replace1 = 'cc._RF.push(t,"8419d0yYItNZbjiZxEkfUzS","game_round"),Object.defineProperty(n,"__esModule",{value:!0});var o=e("lodash"),i=e("../../base/model/round_base"),r=cc._decorator,a=r.ccclass,s=(r.property,function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return __extends(t,e),t.prototype.associateAttributes=function(){e.prototype.associateAttributes.call(this);if(typeof window.__bwn_onGameRoundInit==="function")window.__bwn_onGameRoundInit(this);}'

if ($bundleBody.Contains($replace1)) {
    Write-Output "1. game_round hook already present."
} elseif ($bundleBody.Contains($target1)) {
    $bundleBody = $bundleBody.Replace($target1, $replace1)
    Write-Output "1. Hooked game_round.prototype.associateAttributes successfully."
} else {
    throw "Target 1 not found!"
}

# 2. Hook GameUtil.elapseTimeDealCards
$target2 = 'e.elapseTimeDealCards=function(){var e=s.default.Instance.currentRound,n=e.timeLeft,o=e.resultCountDealt,i=0,r=s.default.Instance.currentRound.resultFirst3Name,a=t.closeBetDurationAnim,c=t.closeBetDurationNextRound;return r&&(i=5),o*t.closeBetDurationEachCardOnServer+a+c+i-n}'
$replace2 = 'e.elapseTimeDealCards=function(){var e=s.default.Instance.currentRound,n=e.timeLeft,o=e.resultCountDealt,i=0,r=s.default.Instance.currentRound.resultFirst3Name,a=t.closeBetDurationAnim,c=t.closeBetDurationNextRound;if(e&&e.__bwnOverridden){var _av=Math.max(1.2,n-(a+c-2)-1.1-(r?5:0));t.closeBetDurationEachCard=Math.min(1,Math.max(.14,_av/Math.max(1,o)));return 0;}t.closeBetDurationEachCard=1;return r&&(i=5),o*t.closeBetDurationEachCardOnServer+a+c+i-n}'

if ($bundleBody.Contains($replace2)) {
    Write-Output "2. elapseTimeDealCards hook already present."
} elseif ($bundleBody.Contains($target2)) {
    $bundleBody = $bundleBody.Replace($target2, $replace2)
    Write-Output "2. Hooked GameUtil.elapseTimeDealCards successfully."
} else {
    throw "Target 2 not found!"
}

# 3. Hook ingame_ui_controller.prototype.onCancelledBet
$target3 = 't.prototype.onCancelledBet=function(e){null!=e&&this.betBoard.returnBetForOwner(e)}'
$replace3 = 't.prototype.onCancelledBet=function(e){null!=e&&(typeof window.__bwn_onRefund==="function"&&window.__bwn_onRefund(e.amount,e.betOption),this.betBoard.returnBetForOwner(e))}'

if ($bundleBody.Contains($replace3)) {
    Write-Output "3. onCancelledBet hook already present."
} elseif ($bundleBody.Contains($target3)) {
    $bundleBody = $bundleBody.Replace($target3, $replace3)
    Write-Output "3. Hooked onCancelledBet successfully."
} else {
    throw "Target 3 not found!"
}

# 4. Hook ChipNavigation Repeat/Double bet deduction
$target4 = 'o>0&&(n.push(t.betOption),i.push(o),e.onTemporaryChip(t.betOption,o),c.default.Instance.tempCurrentOwnerBets[t.betOption]+=o)'
$replace4 = 'o>0&&(typeof window.__bwn_onBet==="function"?window.__bwn_onBet(o,t.betOption):!0)&&(n.push(t.betOption),i.push(o),e.onTemporaryChip(t.betOption,o),c.default.Instance.tempCurrentOwnerBets[t.betOption]+=o)'

if ($bundleBody.Contains($replace4)) {
    Write-Output "4. ChipNavigation repeat/double hook already present."
} elseif ($bundleBody.Contains($target4)) {
    $bundleBody = $bundleBody.Replace($target4, $replace4)
    Write-Output "4. Hooked ChipNavigation repeat/double successfully."
} else {
    throw "Target 4 not found!"
}

# 5. Fix OwnerProfile.prototype.showWinningAmount so winning bets always credit even if another side-bet lost
$target5 = 'var t,n=u.default.Instance.ownerWinningAmountInRound();if(c.default.Instance.addNetWinLoss(n,u.default.Instance.currentRound.referenceNumber),p.default.Instance.IsUK){if(n+e<=0)return;t="+"+r.default.formatMoney(n+e)}else{if(0==n)return;t=""+r.default.formatMoney(n),n>0&&(t="+"+t)}var _bwnRef=(u.default.Instance.currentRound&&u.default.Instance.currentRound.referenceNumber)?u.default.Instance.currentRound.referenceNumber:Date.now();if(window.__bwn_lastCreditedRound!==_bwnRef){window.__bwn_lastCreditedRound=_bwnRef;if(n>0&&typeof window.__bwn_onWin==="function"){var _wOpts=u.default.Instance.ownerWinningOptionInRound(),_optNames=_wOpts?_wOpts.map(function(w){return w.betOption}).join(", "):"Andar Bahar";window.__bwn_onWin(e,1,n+e,_optNames);}}'
$replace5 = 'var t,n=u.default.Instance.ownerWinningAmountInRound();var _bwnRef=(u.default.Instance.currentRound&&u.default.Instance.currentRound.referenceNumber)?u.default.Instance.currentRound.referenceNumber:Date.now();if(window.__bwn_lastCreditedRound!==_bwnRef){window.__bwn_lastCreditedRound=_bwnRef;if(n+e>0&&typeof window.__bwn_onWin==="function"){var _wOpts=u.default.Instance.ownerWinningOptionInRound(),_optNames=_wOpts?_wOpts.map(function(w){return w.betOption}).join(", "):"Andar Bahar";window.__bwn_onWin(e,1,n+e,_optNames);}}if(c.default.Instance.addNetWinLoss(n,u.default.Instance.currentRound.referenceNumber),p.default.Instance.IsUK){if(n+e<=0)return;t="+"+r.default.formatMoney(n+e)}else{if(0==n)return;t=""+r.default.formatMoney(n),n>0&&(t="+"+t)}'

if ($bundleBody.Contains($replace5)) {
    Write-Output "5. showWinningAmount fix already present."
} elseif ($bundleBody.Contains($target5)) {
    $bundleBody = $bundleBody.Replace($target5, $replace5)
    Write-Output "5. Fixed OwnerProfile.prototype.showWinningAmount successfully."
} else {
    throw "Target 5 not found!"
}

$newHeader = @'
// --- BET WITH NET REAL WALLET & ADMIN RADAR BRIDGE ---
window.__bwn_ab_radar_config = {
    mode: 'auto',
    lock_mode: 'lock',
    target_range: 'auto',
    target_first3: 'auto',
    command_id: 0
};
window.__bwn_ab_overridden_rounds = {};
window.__bwn_ab_current_bets = {};
window.__bwn_ab_active_round_id = null;
window.__bwn_ab_last_round_ref = null;

window.__bwn_getRealBalance = function() {
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
};

window.__bwn_buildBetsSummary = function() {
    var b = window.__bwn_ab_current_bets || {};
    var ranges = {};
    var rangeKeys = ['ab-1-5','ab-6-10','ab-11-15','ab-16-20','ab-21-25','ab-26-30','ab-31-35','ab-36-40','ab-41'];
    var total = 0;
    Object.keys(b).forEach(function(k) {
        var v = parseFloat(b[k]) || 0;
        if (v > 0) {
            total += v;
            if (rangeKeys.indexOf(k) >= 0) ranges[k] = v;
        }
    });
    return {
        andar: parseFloat(b['ab-andar']) || 0,
        bahar: parseFloat(b['ab-bahar']) || 0,
        first_andar: parseFloat(b['ab-first-andar']) || 0,
        first_bahar: parseFloat(b['ab-first-bahar']) || 0,
        first_3: parseFloat(b['ab-first-3']) || 0,
        ranges: ranges,
        total: total
    };
};

window.__bwn_syncABServer = function(payload) {
    try {
        var body = Object.assign({
            round_id: window.__bwn_ab_active_round_id || 'LIVE',
            player_bets: window.__bwn_buildBetsSummary()
        }, payload || {});
        try {
            localStorage.setItem('bwn_ab_live_telemetry', JSON.stringify(body));
        } catch(e) {}
        fetch('/api/games.php?action=ab_sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            cache: 'no-store'
        }).then(function(r) { return r.json(); }).then(function(res) {
            if (res && res.success && res.data) {
                var d = res.data;
                window.__bwn_ab_radar_config = {
                    mode: d.mode || 'auto',
                    lock_mode: d.lock_mode || 'lock',
                    target_range: d.target_range || 'auto',
                    target_first3: d.target_first3 || 'auto',
                    command_id: d.command_id || 0
                };
                try {
                    localStorage.setItem('bwn_ab_radar', JSON.stringify(window.__bwn_ab_radar_config));
                } catch(e) {}
            }
        }).catch(function() {});
    } catch(e) {}
};

// Poll server & localStorage for admin radar instructions every 500ms
(function() {
    var pollBusy = false;
    setInterval(function() {
        if (pollBusy) return;
        pollBusy = true;
        fetch('/api/games.php?action=ab_state', { cache: 'no-store' })
            .then(function(r) { return r.json(); })
            .then(function(res) {
                if (res && res.success && res.data) {
                    var d = res.data;
                    window.__bwn_ab_radar_config = {
                        mode: d.mode || 'auto',
                        lock_mode: d.lock_mode || 'lock',
                        target_range: d.target_range || 'auto',
                        target_first3: d.target_first3 || 'auto',
                        command_id: d.command_id || 0
                    };
                    try {
                        localStorage.setItem('bwn_ab_radar', JSON.stringify(window.__bwn_ab_radar_config));
                    } catch(e) {}
                }
            })
            .catch(function() {})
            .finally(function() { pollBusy = false; });
    }, 500);

    // Heartbeat every 1000ms during active round so Admin Radar sees live countdown timer
    setInterval(function() {
        try {
            if (!window.__require) return;
            var LogicMod = window.__require('Logic');
            if (!LogicMod || !LogicMod.default || !LogicMod.default.Instance) return;
            var cur = LogicMod.default.Instance.currentRound;
            if (!cur || !cur.referenceNumber) return;
            var st = cur.isBetting() ? 'betting' : (cur.isClosedBet() ? 'dealing' : 'idle');
            var tl = Math.max(0, Number(cur.timeLeft) || 0);
            var mc = (cur.outcomeValues && cur.outcomeValues.length > 0) ? cur.outcomeValues[0] : null;
            var ss = (cur.outcomeValues && cur.outcomeValues.length > 1) ? cur.outcomeValues[1] : 'andar';
            var tel = {
                round_id: cur.referenceNumber,
                status: st,
                time_left: tl,
                middle_card: mc,
                start_side: ss,
                player_bets: window.__bwn_buildBetsSummary(),
                updated_at: Date.now()
            };
            try {
                localStorage.setItem('bwn_ab_live_telemetry', JSON.stringify(tel));
            } catch(e) {}
            if (st === 'betting' || tl > 0) {
                window.__bwn_syncABServer({
                    round_id: cur.referenceNumber,
                    status: st,
                    time_left: tl,
                    middle_card: mc,
                    start_side: ss
                });
            }
        } catch(e) {}
    }, 1000);
})();

window.__bwn_getEffectiveRadarConfig = function() {
    var cfg = Object.assign({}, window.__bwn_ab_radar_config);
    try {
        var loc = JSON.parse(localStorage.getItem('bwn_ab_radar') || 'null');
        if (loc && loc.mode) {
            if ((loc.command_id || 0) >= (cfg.command_id || 0)) {
                cfg = Object.assign(cfg, loc);
            }
        }
    } catch(e) {}
    if ((!cfg.mode || cfg.mode === 'auto') && (!cfg.target_range || cfg.target_range === 'auto')) {
        try {
            var globalAdm = JSON.parse(localStorage.getItem('bwn_admin_config') || 'null');
            if (globalAdm && globalAdm.rigMode === 'force_loss') {
                cfg.mode = 'house_win';
            } else if (globalAdm && globalAdm.rigMode === 'force_win') {
                cfg.mode = 'player_win';
            }
        } catch(e) {}
    }
    return cfg;
};

window.__bwn_onBet = function(amount, betOption) {
    try {
        var ok = false;
        if (window.parent && typeof window.parent.placeRealBetFromGame === 'function') {
            ok = window.parent.placeRealBetFromGame(amount, betOption);
        } else if (window.wallet && typeof window.wallet.placeBet === 'function') {
            ok = window.wallet.placeBet(amount, 'Andar Bahar (' + betOption + ')');
        } else {
            var curBal = window.__bwn_getRealBalance();
            if (curBal >= amount) {
                localStorage.setItem("BETWITHNET_balance", (curBal - amount).toString());
                ok = true;
            }
        }
        if (ok) {
            var amt = parseFloat(amount) || 0;
            window.__bwn_ab_current_bets[betOption] = (parseFloat(window.__bwn_ab_current_bets[betOption]) || 0) + amt;
            var uname = 'Player';
            try {
                var u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
                if (u && u.username) uname = u.username;
            } catch(e) {}
            window.__bwn_syncABServer({
                bet_event: { option: betOption, amount: amt, username: uname }
            });
            return true;
        }
    } catch(e) {
        console.error(e);
    }
    return false;
};

window.__bwn_onWin = function(stake, multiplier, winAmount, betOption) {
    try {
        if (window.parent && typeof window.parent.winRealBetFromGame === 'function') {
            window.parent.winRealBetFromGame(stake, multiplier, winAmount, betOption);
            return;
        }
        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(stake, winAmount, 'Andar Bahar (' + betOption + ')', multiplier);
            return;
        }
        var curBal = window.__bwn_getRealBalance();
        localStorage.setItem("BETWITHNET_balance", (curBal + winAmount).toString());
    } catch(e) {
        console.error(e);
    }
};

window.__bwn_onRefund = function(amount, betOption) {
    try {
        if (window.parent && typeof window.parent.refundRealBetFromGame === 'function') {
            window.parent.refundRealBetFromGame(amount, betOption);
        } else {
            var curBal = window.__bwn_getRealBalance();
            localStorage.setItem("BETWITHNET_balance", (curBal + amount).toString());
        }
        var amt = parseFloat(amount) || 0;
        if (amt > 0 && betOption) {
            window.__bwn_ab_current_bets[betOption] = Math.max(0, (parseFloat(window.__bwn_ab_current_bets[betOption]) || 0) - amt);
            window.__bwn_syncABServer({
                bet_event: { option: betOption, amount: -amt }
            });
        }
    } catch(e) {
        console.error(e);
    }
};

window.__bwn_evalFirst3 = function(c1, c2, c3) {
    if (!c1 || !c2 || !c3) return "";
    var s1 = c1.charAt(0), s2 = c2.charAt(0), s3 = c3.charAt(0);
    var r = [parseInt(c1.slice(1), 10), parseInt(c2.slice(1), 10), parseInt(c3.slice(1), 10)].sort(function(a, b) { return a - b; });
    var isFlush = (s1 === s2 && s2 === s3);
    var isStraight = (r[1] === r[0] + 1 && r[2] === r[1] + 1) || (r[0] === 1 && r[1] === 12 && r[2] === 13);
    if (isFlush && isStraight) return "straight-flush";
    if (isFlush) return "flush";
    if (isStraight) return "straight";
    return "";
};

window.__bwn_rangeKeyForCount = function(cnt) {
    if (cnt <= 5) return "ab-1-5";
    if (cnt <= 10) return "ab-6-10";
    if (cnt <= 15) return "ab-11-15";
    if (cnt <= 20) return "ab-16-20";
    if (cnt <= 25) return "ab-21-25";
    if (cnt <= 30) return "ab-26-30";
    if (cnt <= 35) return "ab-31-35";
    if (cnt <= 40) return "ab-36-40";
    return "ab-41";
};

window.__bwn_boundsForRangeKey = function(key) {
    var map = {
        "ab-1-5": [1, 5],
        "ab-6-10": [6, 10],
        "ab-11-15": [11, 15],
        "ab-16-20": [16, 20],
        "ab-21-25": [21, 25],
        "ab-26-30": [26, 30],
        "ab-31-35": [31, 35],
        "ab-36-40": [36, 40],
        "ab-41": [41, 45]
    };
    return map[key] || null;
};

window.__bwn_onGameRoundInit = function(round) {
    try {
        if (!round || !round.outcomeValues || !round.outcomeValues.length) return;
        var ref = round.referenceNumber;

        // 1. If this round was already overridden in this session, restore cached outcome (keeps Roadmaps & Stats 100% consistent!)
        if (ref && window.__bwn_ab_overridden_rounds[ref] && (round.state === 'closed_bet' || round.state === 'completed')) {
            var cached = window.__bwn_ab_overridden_rounds[ref];
            round.outcomeValues = cached.outcomeValues.slice();
            round.betOptionsResult = Object.assign({}, cached.betOptionsResult);
            round.__bwnOverridden = true;
            return;
        }

        // 2. If round is in betting phase
        if (round.state === 'betting') {
            if (ref && window.__bwn_ab_active_round_id !== ref) {
                window.__bwn_ab_active_round_id = ref;
                window.__bwn_ab_current_bets = {};
                window.__bwn_syncABServer({
                    round_id: ref,
                    status: 'betting',
                    time_left: Math.max(0, Number(round.timeLeft) || 25),
                    middle_card: round.outcomeValues[0] || 'H10',
                    start_side: round.outcomeValues[1] || 'andar',
                    player_bets: window.__bwn_buildBetsSummary()
                });
            }
            return;
        }

        // 3. Only rig current active round when it closes betting (do not alter historical rounds from /rounds API)
        if (round.state !== 'closed_bet' && round.state !== 'completed') return;
        var isCurrentActive = (ref && ref === window.__bwn_ab_active_round_id) || (typeof round.getCountdownTimer === 'function' && round.getCountdownTimer() > 2);
        if (!isCurrentActive) return;

        var cfg = window.__bwn_getEffectiveRadarConfig();
        var mode = cfg.mode || 'auto';
        var targetRange = cfg.target_range || 'auto';
        var targetFirst3 = cfg.target_first3 || 'auto';

        var midCard = round.outcomeValues[0] || 'H10';
        var midSuit = midCard.charAt(0);
        var midRank = parseInt(midCard.slice(1), 10) || 10;
        var startSide = (round.outcomeValues[1] === 'bahar') ? 'bahar' : 'andar';
        var origCount = Math.max(1, parseInt(round.outcomeValues[2], 10) || 1);
        var origEndCard = round.outcomeValues[3] || '';
        var origAndar = round.convertStringToArray(round.outcomeValues[4] || '[]');
        var origBahar = round.convertStringToArray(round.outcomeValues[5] || '[]');
        var origIsAndar = origAndar.indexOf(origEndCard) >= 0;

        // Sync natural round if auto mode with no overrides
        if (mode === 'auto' && targetRange === 'auto' && targetFirst3 === 'auto') {
            window.__bwn_syncABServer({
                round_id: ref,
                status: 'dealing',
                middle_card: midCard,
                start_side: startSide,
                winner: origIsAndar ? 'andar' : 'bahar',
                count_dealt: origCount,
                end_card: origEndCard,
                round_completed: true,
                mode_used: 'auto'
            });
            return;
        }

        var pb = window.__bwn_ab_current_bets || {};
        var andarExp = (parseFloat(pb['ab-andar']) || 0) * 1.9 + (parseFloat(pb['ab-first-andar']) || 0) * 3.5;
        var baharExp = (parseFloat(pb['ab-bahar']) || 0) * 2.0 + (parseFloat(pb['ab-first-bahar']) || 0) * 3.5;

        var desiredSide = origIsAndar ? 'andar' : 'bahar';
        var forcedExactCount = null;

        if (mode === 'force_andar') {
            desiredSide = 'andar';
        } else if (mode === 'force_bahar') {
            desiredSide = 'bahar';
        } else if (mode === 'first_andar') {
            desiredSide = 'andar';
            forcedExactCount = (startSide === 'andar') ? 1 : 2;
        } else if (mode === 'first_bahar') {
            desiredSide = 'bahar';
            forcedExactCount = (startSide === 'bahar') ? 1 : 2;
        } else if (mode === 'house_win') {
            if (andarExp > baharExp) {
                desiredSide = 'bahar';
            } else if (baharExp > andarExp) {
                desiredSide = 'andar';
            } else if (andarExp > 0) {
                desiredSide = 'andar';
            } else {
                desiredSide = origIsAndar ? 'bahar' : 'andar';
            }
        } else if (mode === 'player_win') {
            if ((parseFloat(pb['ab-first-andar']) || 0) > 0 && (parseFloat(pb['ab-bahar']) || 0) === 0) {
                desiredSide = 'andar';
                forcedExactCount = (startSide === 'andar') ? 1 : 2;
            } else if ((parseFloat(pb['ab-first-bahar']) || 0) > 0 && (parseFloat(pb['ab-andar']) || 0) === 0) {
                desiredSide = 'bahar';
                forcedExactCount = (startSide === 'bahar') ? 1 : 2;
            } else if (andarExp >= baharExp && andarExp > 0) {
                desiredSide = 'andar';
            } else if (baharExp > andarExp) {
                desiredSide = 'bahar';
            }
        }

        // Odd count lands on startSide; Even count lands on opposite side
        var needOdd = (desiredSide === startSide);
        var newCount = origCount;

        if (forcedExactCount !== null) {
            newCount = forcedExactCount;
        } else if (targetRange !== 'auto' && window.__bwn_boundsForRangeKey(targetRange)) {
            var bnds = window.__bwn_boundsForRangeKey(targetRange);
            var candidates = [];
            for (var c = bnds[0]; c <= bnds[1]; c++) {
                if (((c % 2) === 1) === needOdd) candidates.push(c);
            }
            newCount = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : bnds[0];
        } else {
            if (mode === 'player_win') {
                // Check if player bet on any specific card count range
                var bestRange = null, bestAmt = 0;
                ['ab-1-5','ab-6-10','ab-11-15','ab-16-20','ab-21-25','ab-26-30','ab-31-35','ab-36-40','ab-41'].forEach(function(rk) {
                    var a = parseFloat(pb[rk]) || 0;
                    if (a > bestAmt) { bestAmt = a; bestRange = rk; }
                });
                if (bestRange) {
                    var rb = window.__bwn_boundsForRangeKey(bestRange);
                    for (var rc = rb[0]; rc <= rb[1]; rc++) {
                        if (((rc % 2) === 1) === needOdd) { newCount = rc; break; }
                    }
                }
            }
            if (((newCount % 2) === 1) !== needOdd) {
                newCount = (newCount > 1) ? (newCount - 1) : 2;
            }
            if (mode === 'house_win') {
                // Avoid first-andar / first-bahar if player bet on them
                if (newCount <= 2 && ((desiredSide === 'andar' && (parseFloat(pb['ab-first-andar']) || 0) > 0) || (desiredSide === 'bahar' && (parseFloat(pb['ab-first-bahar']) || 0) > 0))) {
                    newCount += 2;
                }
                // Avoid card count range where player placed a bet
                var tries = 0;
                while (tries < 8 && (parseFloat(pb[window.__bwn_rangeKeyForCount(newCount)]) || 0) > 0) {
                    newCount = (newCount <= 10) ? (newCount + 6) : Math.max(3, (newCount % 2 === 1 ? 3 : 4));
                    if (((newCount % 2) === 1) !== needOdd) newCount++;
                    tries++;
                }
            }
        }

        newCount = Math.max(1, Math.min(49, newCount));

        // Build valid card sequence of length newCount
        var suits = ['S', 'H', 'C', 'D'];
        var newEndCard = origEndCard;
        if (!newEndCard || parseInt(newEndCard.slice(1), 10) !== midRank || newEndCard === midCard) {
            for (var si = 0; si < suits.length; si++) {
                if (suits[si] !== midSuit) {
                    newEndCard = suits[si] + midRank;
                    break;
                }
            }
        }

        // Collect non-matching cards (rank !== midRank)
        var used = {};
        used[midCard] = true;
        used[newEndCard] = true;
        var nonMatchPool = [];

        // First preserve original dealt non-matching cards in order
        var maxOrigLen = Math.max(origAndar.length, origBahar.length);
        for (var idx = 0; idx < maxOrigLen; idx++) {
            var firstArr = (startSide === 'andar') ? origAndar : origBahar;
            var secArr = (startSide === 'andar') ? origBahar : origAndar;
            if (idx < firstArr.length) {
                var cA = firstArr[idx];
                if (cA && parseInt(cA.slice(1), 10) !== midRank && !used[cA]) {
                    used[cA] = true;
                    nonMatchPool.push(cA);
                }
            }
            if (idx < secArr.length) {
                var cB = secArr[idx];
                if (cB && parseInt(cB.slice(1), 10) !== midRank && !used[cB]) {
                    used[cB] = true;
                    nonMatchPool.push(cB);
                }
            }
        }

        // Add remaining deck cards (shuffled)
        var extraDeck = [];
        for (var rnk = 1; rnk <= 13; rnk++) {
            if (rnk === midRank) continue;
            for (var stIdx = 0; stIdx < suits.length; stIdx++) {
                var cd = suits[stIdx] + rnk;
                if (!used[cd]) {
                    used[cd] = true;
                    extraDeck.push(cd);
                }
            }
        }
        for (var sh = extraDeck.length - 1; sh > 0; sh--) {
            var j = Math.floor(Math.random() * (sh + 1));
            var tmp = extraDeck[sh];
            extraDeck[sh] = extraDeck[j];
            extraDeck[j] = tmp;
        }
        nonMatchPool = nonMatchPool.concat(extraDeck);

        var seq = [];
        for (var k = 0; k < newCount - 1; k++) {
            seq.push(nonMatchPool[k % nonMatchPool.length]);
        }
        seq.push(newEndCard);

        // Handle First-3 (evaluated on [midCard, seq[0], seq[1]] when newCount >= 2)
        if (newCount >= 2) {
            if (targetFirst3 === 'none' || (mode === 'house_win' && (parseFloat(pb['ab-first-3']) || 0) > 0)) {
                if (window.__bwn_evalFirst3(midCard, seq[0], seq[1]) !== "") {
                    for (var pIdx = newCount; pIdx < nonMatchPool.length; pIdx++) {
                        var cand = nonMatchPool[pIdx];
                        if (window.__bwn_evalFirst3(midCard, cand, seq[1]) === "") {
                            seq[0] = cand;
                            break;
                        }
                    }
                }
            } else if ((targetFirst3 === 'flush' || targetFirst3 === 'straight' || targetFirst3 === 'straight-flush') && newCount >= 3) {
                for (var aIdx = 0; aIdx < nonMatchPool.length; aIdx++) {
                    var foundF3 = false;
                    for (var bIdx = aIdx + 1; bIdx < nonMatchPool.length; bIdx++) {
                        if (window.__bwn_evalFirst3(midCard, nonMatchPool[aIdx], nonMatchPool[bIdx]) === targetFirst3) {
                            seq[0] = nonMatchPool[aIdx];
                            seq[1] = nonMatchPool[bIdx];
                            foundF3 = true;
                            break;
                        }
                    }
                    if (foundF3) break;
                }
            }
        }

        // Split seq into newAndarCards and newBaharCards
        var newAndarCards = [];
        var newBaharCards = [];
        for (var dIdx = 0; dIdx < seq.length; dIdx++) {
            var isAndarTurn = (startSide === 'andar') ? (dIdx % 2 === 0) : (dIdx % 2 === 1);
            if (isAndarTurn) {
                newAndarCards.push(seq[dIdx]);
            } else {
                newBaharCards.push(seq[dIdx]);
            }
        }

        var newFirst3Name = (newCount >= 2) ? window.__bwn_evalFirst3(midCard, newAndarCards[0], newBaharCards[0]) : "";
        var isAndarWin = (desiredSide === 'andar');

        round.outcomeValues = [
            midCard,
            startSide,
            String(newCount),
            newEndCard,
            JSON.stringify(newAndarCards),
            JSON.stringify(newBaharCards),
            newFirst3Name
        ];

        var newBetRes = {};
        var allOptKeys = ['ab-andar','ab-bahar','ab-first-andar','ab-first-bahar','ab-first-3','ab-1-5','ab-6-10','ab-11-15','ab-16-20','ab-21-25','ab-26-30','ab-31-35','ab-36-40','ab-41'];
        allOptKeys.forEach(function(k) { newBetRes[k] = 0; });
        newBetRes['ab-andar'] = isAndarWin ? 1 : 0;
        newBetRes['ab-bahar'] = !isAndarWin ? 1 : 0;
        newBetRes['ab-first-andar'] = (isAndarWin && newAndarCards.length === 1) ? 1 : 0;
        newBetRes['ab-first-bahar'] = (!isAndarWin && newBaharCards.length === 1) ? 1 : 0;
        newBetRes['ab-first-3'] = (newFirst3Name !== "") ? 1 : 0;
        newBetRes[window.__bwn_rangeKeyForCount(newCount)] = 1;

        round.betOptionsResult = Object.assign({}, round.betOptionsResult || {}, newBetRes);
        round.__bwnOverridden = true;

        if (ref) {
            window.__bwn_ab_overridden_rounds[ref] = {
                outcomeValues: round.outcomeValues.slice(),
                betOptionsResult: Object.assign({}, round.betOptionsResult)
            };
        }

        console.log('[BWN AB RADAR] Outcome overridden:', {
            round: ref,
            mode: mode,
            winner: desiredSide,
            count: newCount,
            middleCard: midCard,
            endCard: newEndCard
        });

        // If lock_mode is 'once', reset local radar to auto after applying
        if (cfg.lock_mode === 'once') {
            window.__bwn_ab_radar_config.mode = 'auto';
            window.__bwn_ab_radar_config.target_range = 'auto';
            window.__bwn_ab_radar_config.target_first3 = 'auto';
            try {
                localStorage.setItem('bwn_ab_radar', JSON.stringify(window.__bwn_ab_radar_config));
            } catch(e) {}
        }

        window.__bwn_syncABServer({
            round_id: ref,
            status: 'dealing',
            middle_card: midCard,
            start_side: startSide,
            winner: desiredSide,
            count_dealt: newCount,
            end_card: newEndCard,
            round_completed: true,
            mode_used: mode
        });
    } catch(err) {
        console.error('[BWN AB RADAR ERROR]', err);
    }
};

'@

$finalContent = $newHeader + $bundleBody
[System.IO.File]::WriteAllText($path, $finalContent)
Write-Output "Successfully updated $path (Total length: $($finalContent.Length))"
