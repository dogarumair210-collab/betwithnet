def apply_loader_fix():
    main_path = '/home/betwithnet.com/public_html/games/ab_engine/main.js'
    with open(main_path, 'r', encoding='utf-8') as f:
        main_code = f.read()

    old_load = """        bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
            if (!err) {
                cc.director.runSceneImmediate(scene);
                if (cc.sys.isBrowser) {
                    // show canvas
                    var canvas = document.getElementById("GameCanvas");
                    canvas.style.visibility = "";
                    var div = document.getElementById("GameDiv");
                    if (div) {
                        div.style.backgroundImage = "";
                    }
                    console.log("Success to load scene: " + launchScene);
                }
            }
        });"""

    new_load = """        bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
            if (!err) {
                cc.director.runSceneImmediate(scene);
                if (cc.sys.isBrowser) {
                    // show canvas
                    var canvas = document.getElementById("GameCanvas");
                    if (canvas) canvas.style.visibility = "";
                    var div = document.getElementById("GameDiv");
                    if (div) div.style.backgroundImage = "";
                    console.log("Success to load scene: " + launchScene);

                    // Complete progress bar to 100% and dismiss splash
                    var splash = document.getElementById("splash");
                    if (splash) {
                        var pBar = splash.querySelector(".progress-bar span");
                        if (pBar) pBar.style.width = "100%";
                        setTimeout(function () {
                            splash.style.opacity = "0";
                            splash.style.transition = "opacity 0.3s ease";
                            setTimeout(function () {
                                splash.style.display = "none";
                            }, 300);
                        }, 150);
                    }
                }
            } else {
                console.error("Failed to load launch scene:", err);
            }
        });"""

    if old_load in main_code:
        main_code = main_code.replace(old_load, new_load)
        with open(main_path, 'w', encoding='utf-8') as f:
            f.write(main_code)
        print("Patched main.js loader")
    else:
        print("old_load not found in main.js")

    # 2. Patch ab_engine/index.html
    idx_path = '/home/betwithnet.com/public_html/games/ab_engine/index.html'
    with open(idx_path, 'r', encoding='utf-8') as f:
        idx_code = f.read()

    # Suppress startup guide
    if 'andar-bahar_do_not_show_game_rule_at_startup' not in idx_code:
        idx_code = idx_code.replace("localStorage.setItem('isSoundMuted', 'false');", 
                                    "localStorage.setItem('isSoundMuted', 'false');\n        localStorage.setItem('andar-bahar_do_not_show_game_rule_at_startup', 'true');")

    # Update cache busters
    idx_code = idx_code.replace("20261007_audio2", "20261010_loader_fix")
    idx_code = idx_code.replace("20261009_multiplayer_sync1", "20261010_loader_fix")
    idx_code = idx_code.replace("20261009_v3", "20261010_loader_fix")

    # Add watchdog
    watchdog = """
      // Watchdog: guarantee splash hides when Cocos scene is ready
      var _splashWatchdog = setInterval(function () {
        try {
          if (window.cc && cc.director && cc.director.getScene()) {
            var splash = document.getElementById('splash');
            if (splash && splash.style.display !== 'none') {
              var pBar = splash.querySelector('.progress-bar span');
              if (pBar) pBar.style.width = '100%';
              setTimeout(function () {
                splash.style.opacity = '0';
                splash.style.transition = 'opacity 0.3s ease';
                setTimeout(function () {
                  splash.style.display = 'none';
                }, 300);
              }, 150);
            }
            clearInterval(_splashWatchdog);
          }
        } catch(e) {}
      }, 250);
"""
    if '_splashWatchdog' not in idx_code:
        idx_code = idx_code.replace("loadScript('cocos2d-js-min.js", watchdog + "\n      loadScript('cocos2d-js-min.js")

    with open(idx_path, 'w', encoding='utf-8') as f:
        f.write(idx_code)
    print("Patched ab_engine/index.html")

    # 3. Patch andarbahar.html
    ab_path = '/home/betwithnet.com/public_html/games/andarbahar.html'
    with open(ab_path, 'r', encoding='utf-8') as f:
        ab_code = f.read()

    ab_code = ab_code.replace('20261009_multiplayer_sync1', '20261010_loader_fix')
    ab_code = ab_code.replace('20261007_audio2', '20261010_loader_fix')
    ab_code = ab_code.replace('20261009_v3', '20261010_loader_fix')

    # Ensure dynamic timestamp cache busting in andarbahar.html
    bust_snippet = """
        // Auto-bust iframe src to guarantee latest engine code
        try {
            var ifr = document.getElementById('gameIframe');
            if (ifr) {
                ifr.src = '/games/ab_engine/index.html?currency=PKR&lang=en&test=1&t=' + Date.now();
            }
        } catch(e) {}
"""
    if 'Auto-bust iframe src' not in ab_code:
        ab_code = ab_code.replace("window.addEventListener('load', () => {", 
                                  "window.addEventListener('load', () => {" + bust_snippet)

    with open(ab_path, 'w', encoding='utf-8') as f:
        f.write(ab_code)
    print("Patched andarbahar.html")

apply_loader_fix()
