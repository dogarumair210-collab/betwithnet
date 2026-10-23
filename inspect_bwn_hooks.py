import os

for fn in ['/home/betwithnet.com/public_html/games/chicken_rush_game.html', '/home/betwithnet.com/public_html/api/radar.php']:
    print(f"=== {fn} ===")
    if os.path.exists(fn):
        with open(fn, 'r', encoding='utf-8', errors='replace') as f:
            print(f.read()[:3500])
    else:
        print("NOT FOUND")
