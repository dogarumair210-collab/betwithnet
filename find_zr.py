with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

import re
matches = [m.start() for m in re.finditer(r'\bZr\(', data)]
print("Matches for Zr(:", len(matches))
for m in matches:
    print(data[m-100:m+150])
    print("="*40)
