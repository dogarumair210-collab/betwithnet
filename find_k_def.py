with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

# Let's find definition of K
# Search for var K = or const K = or K="
import re
matches = [m.start() for m in re.finditer(r'\bK\s*=', data[:128326])]
print("Matches for K = :", matches[-5:] if matches else "none")
for m in matches[-5:]:
    print(data[m-50:m+100])
