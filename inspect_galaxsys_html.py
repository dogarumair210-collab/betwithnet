import urllib.request
import re

req = urllib.request.Request(
    "https://galaxsys.co/games/tower-rush/",
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'}
)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='replace')
        print("Galaxsys page length:", len(html))
        for m in re.finditer(r'(demo|tower-rush|iframe|video|mp4|webm|launch|gameId|game_id)[^"<>]{0,150}', html, re.I):
            print("Match:", m.group(0))
except Exception as e:
    print("Error:", e)
