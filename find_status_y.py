with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

import re
# Find where status is set or where Y ("MIDDLE") is referenced
matches = [m.start() for m in re.finditer(r'status:\s*Y', data)]
print("Matches for status: Y:", len(matches))
for m in matches:
    print(data[m-100:m+150])
    print("="*40)

matches_middle = [m.start() for m in re.finditer(r'status\s*=\s*Y', data)]
print("Matches for status = Y:", len(matches_middle))
for m in matches_middle:
    print(data[m-100:m+150])
    print("="*40)
