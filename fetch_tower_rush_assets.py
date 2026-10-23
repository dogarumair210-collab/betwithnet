import asyncio
import json
import os
import glob
from urllib.parse import urlparse
from playwright.async_api import async_playwright

proxy_files = glob.glob("/opt/*/*prox*.json") + glob.glob("/opt/*/*prox*.txt")
print("Found proxy files:", proxy_files)

proxies = []
for pf in proxy_files:
    try:
        with open(pf, "r") as f:
            data = json.load(f)
            if isinstance(data, list) and len(data) > 0:
                for item in data:
                    if isinstance(item, str) and item.startswith("http"):
                        proxies.append(item)
                    elif isinstance(item, dict) and item.get("proxy"):
                        proxies.append(item["proxy"])
    except Exception:
        pass

print(f"Total proxies loaded: {len(proxies)}")

async def try_proxy(p_str):
    u = urlparse(p_str)
    proxy_cfg = {
        "server": f"http://{u.hostname}:{u.port}",
        "username": u.username,
        "password": u.password
    }
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
        context = await browser.new_context(
            proxy=proxy_cfg,
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        all_urls = []
        page.on("request", lambda r: all_urls.append(r.url))
        try:
            print("Trying 1x-betpk.mobi via proxy:", u.hostname, u.port)
            await page.goto("https://1x-betpk.mobi/en/casino-search?game=151203", timeout=35000, wait_until="domcontentloaded")
            await page.wait_for_timeout(8000)
            txt = await page.inner_text("body")
            if "Access denied" in txt and len(txt) < 500:
                print("Access denied on this proxy:", txt[:120])
                await browser.close()
                return False
            print("SUCCESS on 1x-betpk.mobi! Title:", await page.title())
            await page.screenshot(path="/home/betwithnet.com/public_html/games/tr_1xbet_live.png", full_page=True)
            print("Body text excerpt:", txt[:1500])
            
            els = await page.eval_on_selector_all("a, button, div, span, img, iframe", """els => els.filter(e => {
                const s = (e.innerText || '') + ' ' + (e.src || '') + ' ' + (e.className || '') + ' ' + (e.alt || '');
                return /tower|151203|demo|free|play|galaxsys|iframe/i.test(s);
            }).slice(0, 60).map(e => ({tag: e.tagName, text: (e.innerText||'').trim().slice(0,80), src: e.src||e.href||'', alt: e.alt||'', cls: e.className}))""")
            for el in els[:40]:
                print("  El:", el)

            for req_u in all_urls:
                if any(k in req_u.lower() for k in ['tower', 'galaxsys', '151203', 'launch', 'game', 'demo', 'slot', 'v3.traincdn']):
                    print("  URL:", req_u[:180])
            await browser.close()
            return True
        except Exception as e:
            print("Proxy err:", e)
            await browser.close()
            return False

async def main():
    for p_str in proxies[:8]:
        ok = await try_proxy(p_str)
        if ok:
            break

asyncio.run(main())
