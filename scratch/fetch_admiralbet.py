import urllib.request
import re
import json

url = 'https://www.admiralbet.ro/casino-live/pragmatic-play'
req = urllib.request.Request(
    url,
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}
)
html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')

# Search for transfer state JSON or API calls
transfer_states = re.findall(r'<script id="serverApp-state" type="application/json">(.*?)</script>', html, re.DOTALL)
if not transfer_states:
    transfer_states = re.findall(r'<script[^>]*type="application/json"[^>]*>(.*?)</script>', html, re.DOTALL)

print(f"Transfer states found: {len(transfer_states)}")
for i, ts in enumerate(transfer_states):
    print(f"State {i} length: {len(ts)}")
    try:
        data = json.loads(ts)
        print(f"State {i} keys: {list(data.keys())[:10]}")
        with open(f'scratch/state_{i}.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error parsing state {i}: {e}")

# Also look for banner images
banners = re.findall(r'https://assets\.admiralbet\.ro/PCMS/image-details/[^\s\"\'\<\>]+', html)
print(f"Banners found: {len(set(banners))}")
for b in set(banners):
    print("Banner:", b)
