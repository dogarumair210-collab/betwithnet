import re

path = '/home/betwithnet.com/public_html/games/andarbahar.html'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = re.sub(r'// Auto-bust iframe src[\s\S]*?catch\(e\) \{\}', '', c)

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Cleaned andarbahar.html, removed iframe reload')
