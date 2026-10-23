import os

base = "/home/betwithnet.com/public_html"
atlas = os.path.join(base, "assets/games/greyhound_atlas")

js_path = os.path.join(atlas, "js/main.js")
with open(js_path, "r", encoding="utf-8", errors="ignore") as f:
    js = f.read()

js = js.replace(
    '_credit<_min_bet&&_demo_game&&(document.getElementById("first_screen_pop_up").style.display="block"),',
    ""
)

with open(js_path, "w", encoding="utf-8") as f:
    f.write(js)

os.system(f"chown -R betwi4261:betwi4261 {base}/games/greyhound.html {base}/js/games/greyhound.js {base}/assets/games/greyhound_atlas/js/main.js")
os.system(f"chmod -R a+rX {base}/games/greyhound.html {base}/js/games/greyhound.js {base}/assets/games/greyhound_atlas/js/main.js")
print("PATCH2_COMPLETE")
