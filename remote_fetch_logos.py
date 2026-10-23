import urllib.request
import json
import os

headers = {'User-Agent': 'AntigravityLogoFetcher/1.0 (admin@betwithnet.com)'}

def fetch_wikimedia(filename, out_path):
    try:
        api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(filename)}&prop=imageinfo&iiprop=url&format=json"
        req = urllib.request.Request(api_url, headers=headers)
        data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
        pages = data.get('query', {}).get('pages', {})
        for pid, pdata in pages.items():
            if 'imageinfo' in pdata and len(pdata['imageinfo']) > 0:
                img_url = pdata['imageinfo'][0]['url']
                print(f"Downloading {filename} from {img_url}")
                img_req = urllib.request.Request(img_url, headers=headers)
                with urllib.request.urlopen(img_req) as response, open(out_path, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Saved {out_path} ({os.path.getsize(out_path)} bytes)")
                return True
    except Exception as e:
        print(f"Error {filename}: {e}")
    return False

# 1. EasyPaisa
fetch_wikimedia("File:Easypaisa Digital Bank logo.png", "/home/betwithnet.com/public_html/assets/easypaisa.png")

# 2. NayaPay search via API
try:
    search_url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=NayaPay&format=json"
    req = urllib.request.Request(search_url, headers=headers)
    sdata = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    print("NayaPay search:", sdata)
except Exception as e:
    print("NayaPay search err:", e)
