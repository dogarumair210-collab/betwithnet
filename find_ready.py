with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

import re
matches = [m.start() for m in re.finditer(r'isReadyThrowFloor', data)]
print("Matches for isReadyThrowFloor:", len(matches))
for m in matches:
    print(data[m-60:m+120])
    print("="*40)
