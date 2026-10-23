with open('/home/betwithnet.com/public_html/games/tower_rush_assets/fg-client/prd/fg-towerrush-client/v112/896.js', 'r', encoding='utf-8') as f:
    data = f.read()

pos = data.find('onClick:i===K?')
print("pos:", pos)
if pos != -1:
    print(data[pos-500:pos+200])
