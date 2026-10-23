// ============================================================================
// Atlas-V Greyhound Racing Virtual (1xBet Game #114801) - BWN Wallet & Live Bridge
// Connects to live Atlas-V room feed (with automatic local fallback),
// syncs real PKR balance via window.wallet, processes WIN/PLACE/SHOW/EXACTA
// tickets, and triggers the authentic 48-atlas 3D race & photo-finish animation.
// ============================================================================

(function () {
    var bwnRoundStake = 0;
    var fallbackTimer = null;
    var localLoopActive = false;
    var manualRaceActive = false;
    var manualRaceResetTimer = null;
    var latestServerNewGame = null;
    var localSeconds = 25;
    var localGameId = 891428100 + Math.floor(Math.random() * 900);

    var defaultDogs = [
        { name: "Mila", rating: 5, performance: 70, last_races: [3, 1, 3, 1, 1], win: 3.1, place: 1.75, show: 1.14, exacta: 2.25 },
        { name: "Riper", rating: 5, performance: 61, last_races: [2, 3, 2, 0, 3], win: 3.69, place: 2.02, show: 1.31, exacta: 2.69 },
        { name: "Tager", rating: 5, performance: 66, last_races: [0, 2, 3, 0, 2], win: 3.41, place: 1.87, show: 1.23, exacta: 2.49 },
        { name: "Magti", rating: 3, performance: 47, last_races: [0, 0, 0, 0, 2], win: 7.97, place: 4.36, show: 2.91, exacta: 5.81 },
        { name: "Caldo", rating: 3, performance: 49, last_races: [0, 0, 0, 0, 2], win: 7.65, place: 4.19, show: 2.79, exacta: 5.58 },
        { name: "Folk", rating: 3, performance: 44, last_races: [0, 0, 0, 0, 0], win: 8.52, place: 4.79, show: 3.19, exacta: 6.39 }
    ];

    var defaultLeaders = [
        { p: "6***9", w: 42600, c: "PKR", b: 10000, n: 4.26 },
        { p: "7***2", w: 31500, c: "PKR", b: 3500, n: 9.0 },
        { p: "7***9", w: 25360, c: "PKR", b: 2000, n: 12.68 },
        { p: "4***6", w: 18100, c: "PKR", b: 5000, n: 3.62 },
        { p: "6***4", w: 14060, c: "PKR", b: 2000, n: 7.03 },
        { p: "8***9", w: 8520, c: "PKR", b: 3000, n: 2.84 }
    ];

    function getRealBalance() {
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return parseFloat(window.wallet.getBalance('PKR')) || 0;
        }
        return 0;
    }

    function syncCreditDisplay() {
        _credit = getRealBalance();
        if (typeof formatMoney === 'function' && window.$) {
            $(".header_credit").html(formatMoney(_credit) + " " + _currency);
        }
    }

    function encodeDogsOrder(arr) {
        // Inverse of DecodeNumbers: "2x3x4x" + (2*n + 12) => ( (2*n + 12) - 4*3 ) / 2 = n
        return arr.map(function (n) {
            return "2x3x4x" + (2 * n + 12);
        });
    }

    function randomHash() {
        var chars = "0123456789ABCDEF";
        var out = "";
        for (var i = 0; i < 128; i++) out += chars.charAt(Math.floor(Math.random() * 16));
        return out;
    }

    function pickWeightedFinishOrder(dogs) {
        var pool = [1, 2, 3, 4, 5, 6];
        var order = [];
        while (pool.length > 0) {
            var weights = pool.map(function (num) {
                var d = dogs[num - 1];
                return d && d.win ? (1 / d.win) : 0.2;
            });
            var sum = weights.reduce(function (a, b) { return a + b; }, 0);
            var r = Math.random() * sum;
            var pickedIdx = 0;
            for (var i = 0; i < pool.length; i++) {
                r -= weights[i];
                if (r <= 0) {
                    pickedIdx = i;
                    break;
                }
            }
            order.push(pool[pickedIdx]);
            pool.splice(pickedIdx, 1);
        }
        return order;
    }

    function getBetOdd(item) {
        var dogs = (_horses && _horses.length === 6) ? _horses : defaultDogs;
        if (item.bet_type === "e") {
            var d1 = Math.floor(item.dog / 10) - 1;
            var d2 = (item.dog % 10) - 1;
            if (dogs[d1] && dogs[d2]) {
                return parseFloat((dogs[d1].win * dogs[d2].exacta * 0.8).toFixed(2));
            }
            return 12.5;
        }
        var dogObj = dogs[item.dog - 1] || dogs[0];
        if (item.bet_type === "w") return dogObj.win;
        if (item.bet_type === "p") return dogObj.place;
        if (item.bet_type === "s") return dogObj.show;
        return dogObj.win;
    }

    // Start local room cycle if external demo socket is slow or unavailable
    function startLocalRoomEngine() {
        if (localLoopActive || _is_inited) return;
        localLoopActive = true;

        var nowMs = Date.now();
        var hist = [];
        for (var h = 5; h >= 1; h--) {
            var ord = pickWeightedFinishOrder(defaultDogs);
            hist.push({
                date: String(nowMs - h * 75000),
                numbers: ord,
                game_id: String(localGameId - h),
                salt: "a6c19762b67b7108f1437732293f33d4",
                key: (localGameId - h) + "_horses_" + ord[0] + "_" + ord[1] + "_" + ord[2] + "_GreyhoundRacing_local",
                hash: randomHash()
            });
        }

        start_init({
            status: "login",
            game_id: String(localGameId),
            hash: randomHash(),
            credit: getRealBalance(),
            tickets: [],
            my_tickets: [],
            leaders: defaultLeaders,
            history: hist,
            dogs: defaultDogs,
            game_status: 1,
            time: localSeconds
        });
        syncCreditDisplay();

        setInterval(function () {
            if (_game_status === 1 && !manualRaceActive) {
                localSeconds--;
                if (localSeconds > 0) {
                    UpdateTimer({
                        status: "wait",
                        game_id: String(localGameId),
                        time: localSeconds,
                        total_count: _my_tickets.length
                    });
                } else {
                    triggerRaceNow();
                }
            }
        }, 1000);
    }

    function finishManualRace() {
        if (!manualRaceActive) return;
        manualRaceActive = false;
        if (manualRaceResetTimer) {
            clearTimeout(manualRaceResetTimer);
            manualRaceResetTimer = null;
        }
        localGameId++;
        localSeconds = 25;
        var nextRound = latestServerNewGame || {
            status: "newgame",
            game_id: String(localGameId),
            hash: randomHash(),
            leaders: (_leaders && _leaders.length) ? _leaders : defaultLeaders,
            dogs: (_horses && _horses.length === 6) ? _horses : defaultDogs
        };
        latestServerNewGame = null;
        NewGame(nextRound);
        syncCreditDisplay();
    }

    function triggerRaceNow() {
        if (_game_status !== 1 || !_is_inited) return;
        manualRaceActive = true;
        var dogs = (_horses && _horses.length === 6) ? _horses : defaultDogs;
        var winOrder = pickWeightedFinishOrder(dogs);
        var gid = _game_id || String(localGameId);

        GamePlay({
            status: "play",
            game_id: gid,
            date: String(Date.now()),
            numbers: encodeDogsOrder(winOrder),
            salt: "bd2c316e1e421dcfb7b32ca8eec45bba",
            key: gid + "_horses_" + winOrder[0] + "_" + winOrder[1] + "_" + winOrder[2] + "_GreyhoundRacing",
            hash: _game_hash || randomHash(),
            total_count: _my_tickets.length
        });

        if (manualRaceResetTimer) clearTimeout(manualRaceResetTimer);
        manualRaceResetTimer = setTimeout(finishManualRace, 38000);
    }

    window.bwnTriggerRaceNow = triggerRaceNow;

    // Hook into Atlas-V lifecycle once main.js defines globals
    function installAtlasHooks() {
        if (typeof window.start_init !== "function" || typeof window.Socket_SendEvent !== "function") {
            setTimeout(installAtlasHooks, 50);
            return;
        }

        // 0. Guard Socket_onRoomEventsGet so live room timer never interrupts a manual race
        var origSocketOnRoomEventsGet = window.Socket_onRoomEventsGet;
        window.Socket_onRoomEventsGet = function (t) {
            if (manualRaceActive) {
                if (t && t.status === "newgame") {
                    latestServerNewGame = t;
                }
                return;
            }
            origSocketOnRoomEventsGet(t);
        };

        // 1. Override Socket_Login to fetch fresh live token from /api/greyhound_token.php
        var origSocketLogin = window.Socket_Login;
        window.Socket_Login = function () {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            fallbackTimer = setTimeout(function () {
                if (!_is_inited) {
                    startLocalRoomEngine();
                }
            }, 3500);

            fetch("../api/greyhound_token.php")
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data && data.user_id && data.user_token) {
                        window._user_id = data.user_id;
                        window._user_token = data.user_token;
                    }
                    if (_connectionStatus && uws && uws.readyState === 1) {
                        origSocketLogin();
                    } else {
                        startLocalRoomEngine();
                    }
                })
                .catch(function () {
                    startLocalRoomEngine();
                });
        };

        // 2. Wrap start_init so balance is always real PKR balance and if joining mid-race (game_status==2), unlock immediately
        var origStartInit = window.start_init;
        window.start_init = function (t) {
            if (fallbackTimer) clearTimeout(fallbackTimer);
            if (t && t.game_status === 2) {
                t.game_status = 1;
                t.time = 25;
            }
            origStartInit(t);
            bwnRoundStake = 0;
            syncCreditDisplay();
        };

        // 3. Wrap NewGame so balance syncs with real PKR wallet
        var origNewGame = window.NewGame;
        window.NewGame = function (t) {
            bwnRoundStake = 0;
            origNewGame(t);
            syncCreditDisplay();
        };

        // 4. Override Socket_SendEvent to process bets with real Bet With Net PKR Wallet
        window.Socket_SendEvent = function (payload) {
            if (payload && payload.status === "betset" && Array.isArray(payload.bets)) {
                var bets = payload.bets;
                var totalBet = 0;
                bets.forEach(function (b) {
                    totalBet += parseFloat(b.bet) || 0;
                });

                if (window.wallet && typeof window.wallet.placeBet === "function") {
                    var ok = window.wallet.placeBet(totalBet, "Greyhound Racing");
                    if (!ok) {
                        $(".bet_set_btn").removeClass("wait");
                        syncCreditDisplay();
                        ShowWarning(_all_translation[_language].wrong_bet1, true);
                        return;
                    }
                }

                bwnRoundStake += totalBet;
                syncCreditDisplay();

                var createdTickets = bets.map(function (b, idx) {
                    var btCode = (b.bet_type === "e") ? ("e" + b.dog) : (b.bet_type + b.dog);
                    return {
                        t: String(Date.now() + idx),
                        bt: btCode,
                        n: getBetOdd(b),
                        b: parseFloat(b.bet)
                    };
                });

                setTimeout(function () {
                    MyBetSet({
                        credit: getRealBalance(),
                        total_count: _my_tickets.length + createdTickets.length,
                        tickets: createdTickets
                    });
                    syncCreditDisplay();
                }, 150);
            }
        };

        // 5. Wrap ShowResultPopUp to credit real PKR winnings to window.wallet
        var origShowResultPopUp = window.ShowResultPopUp;
        window.ShowResultPopUp = function () {
            if (_bufer_history && _bufer_history.tickets && _bufer_history.tickets.length > 0) {
                var winAmt = parseFloat(_bufer_history.win) || 0;
                if (window.wallet && typeof window.wallet.creditWin === "function") {
                    if (winAmt > 0) {
                        var effOdd = bwnRoundStake > 0 ? parseFloat((winAmt / bwnRoundStake).toFixed(2)) : 1;
                        window.wallet.creditWin(bwnRoundStake, winAmt, "Greyhound Racing", effOdd, "Greyhound Racing Win");
                    } else {
                        window.wallet.creditWin(bwnRoundStake, 0, "Greyhound Racing", 0, "Greyhound Racing Round");
                    }
                }
                bwnRoundStake = 0;
                syncCreditDisplay();
            }
            origShowResultPopUp();
            syncCreditDisplay();

            if (manualRaceActive) {
                if (manualRaceResetTimer) clearTimeout(manualRaceResetTimer);
                manualRaceResetTimer = setTimeout(finishManualRace, 4500);
            }
        };

        // Sync wallet changes
        if (window.wallet && typeof window.wallet.on === "function") {
            window.wallet.on("change", syncCreditDisplay);
            window.wallet.on("balanceChange", syncCreditDisplay);
        }
    }

    installAtlasHooks();
})();