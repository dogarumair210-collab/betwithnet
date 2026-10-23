with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

import re
matches = [m.start() for m in re.finditer(r'\(os,', data)]
if not matches:
    matches = [m.start() for m in re.finditer(r'\bos\b', data[128000:135000])]
    matches = [m + 128000 for m in matches]
print("os matches:", len(matches))
for m in matches[:5]:
    print(data[m-100:m+200])
    print("="*40)
