p = '/home/betwithnet.com/public_html/js/games/tower_legend.js'
with open(p, 'r', encoding='utf-8', errors='replace') as f:
    print("=== FULL tower_legend.js ===")
    print(f.read())

p2 = '/home/betwithnet.com/public_html/js/wallet.js'
with open(p2, 'r', encoding='utf-8', errors='replace') as f:
    print("=== wallet.js (lines 420-520) ===")
    lines = f.read().splitlines()
    print('\n'.join(lines[420:520]))
