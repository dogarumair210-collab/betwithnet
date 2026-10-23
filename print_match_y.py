with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

import re
matches = [m.start() for m in re.finditer(r'status\s*=\s*Y', data)]
for idx, m in enumerate(matches):
    print(f"=== MATCH {idx+1} ===")
    print(data[m-400:m+200])
