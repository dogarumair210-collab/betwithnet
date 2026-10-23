def patch_main():
    path = '/home/betwithnet.com/public_html/games/ab_engine/main.js'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    target = """        bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
            if (!err) {
                cc.director.runSceneImmediate(scene);
                if (cc.sys.isBrowser) {
                    // show canvas
                    var canvas = document.getElementById("GameCanvas");"""

    replacement = """        bundle.loadScene(launchScene, null, onProgress, function (err, scene) {
            if (!err) {
                cc.director.runSceneImmediate(scene);
                if (cc.sys.isBrowser) {
                    var splash = document.getElementById("splash");
                    if (splash) {
                        splash.style.opacity = "0";
                        splash.style.transition = "opacity 0.35s ease";
                        setTimeout(function () {
                            splash.style.display = "none";
                        }, 350);
                    }
                    // show canvas
                    var canvas = document.getElementById("GameCanvas");"""

    if target in code:
        code = code.replace(target, replacement)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print("Successfully patched main.js")
    else:
        print("Target not found in main.js")

def patch_index():
    path = '/home/betwithnet.com/public_html/games/ab_engine/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Ensure guide is suppressed on startup
    t1 = "localStorage.setItem('isSoundMuted', 'false');"
    r1 = """localStorage.setItem('isSoundMuted', 'false');
        localStorage.setItem('andar-bahar_do_not_show_game_rule_at_startup', 'true');"""
    if t1 in code and 'andar-bahar_do_not_show_game_rule_at_startup' not in code:
        code = code.replace(t1, r1)

    # 2. Add safety watchdog to hide splash when scene is ready
    t2 = """      loadScript('cocos2d-js-min.js?v=20261007_audio2', function () {
        if (typeof window.boot === 'function') {
          window.boot();
        }
      });
    })();"""

    r2 = """      loadScript('cocos2d-js-min.js?v=20261007_audio2', function () {
        if (typeof window.boot === 'function') {
          window.boot();
        }
      });

      // Watchdog: guarantee splash hides as soon as Cocos Director has a scene
      var splashWatch = setInterval(function () {
        try {
          if (window.cc && cc.director && cc.director.getScene()) {
            var s = document.getElementById('splash');
            if (s && s.style.display !== 'none') {
              s.style.opacity = '0';
              s.style.transition = 'opacity 0.35s ease';
              setTimeout(function () {
                if (s) s.style.display = 'none';
              }, 350);
            }
            clearInterval(splashWatch);
          }
        } catch(e) {}
      }, 200);

      setTimeout(function () {
        var s = document.getElementById('splash');
        if (s && s.style.display !== 'none') {
          s.style.display = 'none';
        }
      }, 4000);
    })();"""

    if t2 in code:
        code = code.replace(t2, r2)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(code)
        print("Successfully patched index.html")
    else:
        print("Target t2 not found in index.html")

patch_main()
patch_index()
