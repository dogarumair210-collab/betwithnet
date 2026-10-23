import urllib.request
import os

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'}

urls = [
    ('https://www.nayapay.com/images/smart-banner-logo.png', '/home/betwithnet.com/public_html/assets/nayapay.png'),
    ('https://www.nayapay.com/images/rebrand/NayaPay-Logo.svg', '/home/betwithnet.com/public_html/assets/nayapay.svg')
]

for url, out in urls:
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(out, 'wb') as f:
            f.write(resp.read())
        print(f"Successfully saved {out}: {os.path.getsize(out)} bytes")
        break
    except Exception as e:
        print(f"Failed {url}: {e}")
