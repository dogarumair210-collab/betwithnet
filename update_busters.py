def update_busters():
    path = '/home/betwithnet.com/public_html/games/ab_engine/index.html'
    with open(path, 'r', encoding='utf-8') as f:
        c = f.read()

    c = c.replace('main.js?v=20261007_audio2', 'main.js?v=20261009_v3')
    c = c.replace('settings.js?v=20261007_audio2', 'settings.js?v=20261009_v3')
    c = c.replace('cocos2d-js-min.js?v=20261007_audio2', 'cocos2d-js-min.js?v=20261009_v3')

    # Also add automatic splash dismiss in index.html when iframe receives load or after scene is ready
    watchdog = """
      // Watchdog: auto dismiss splash as soon as scene is loaded
      var _sceneWatch = setInterval(function () {
        try {
          if (window.cc && cc.director && cc.director.getScene()) {
            var s = document.getElementById('splash');
            if (s) {
              s.style.opacity = '0';
              s.style.transition = 'opacity 0.3s ease';
              setTimeout(function () { if (s) s.style.display = 'none'; }, 300);
            }
            clearInterval(_sceneWatch);
          }
        } catch(e) {}
      }, 300);
"""
    if '_sceneWatch' not in c:
        c = c.replace("loadScript('cocos2d-js-min.js?v=20261009_v3'", watchdog + "\n      loadScript('cocos2d-js-min.js?v=20261009_v3'")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(c)
    print("Updated busters and watchdog in index.html")

update_busters()
