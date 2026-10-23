import asyncio
import re
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=['--disable-blink-features=AutomationControlled'])
        context = await browser.new_context(
            viewport={'width': 1440, 'height': 900},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        )
        page = await context.new_page()

        # 1. Inspect galaxsys.co/games/tower-rush/ HTML and media
        print("=== 1. Inspecting galaxsys.co/games/tower-rush/ ===")
        try:
            await page.goto("https://galaxsys.co/games/tower-rush/", timeout=30000, wait_until="domcontentloaded")
            await page.wait_for_timeout(4000)
            html = await page.content()
            print("Galaxsys HTML length:", len(html))
            for m in re.finditer(r'<(video|source|iframe|a|img)[^>]+(tower|demo|mp4|webm|media)[^>]*>', html, re.I):
                print("  Tag:", m.group(0)[:250])
            # Also print text description of the game from galaxsys page
            body_text = await page.inner_text("body")
            print("Galaxsys body text excerpt:\n", body_text[:2500])
        except Exception as e:
            print("Galaxsys err:", e)

        # 2. Inspect 1x-betpk.mobi/en/casino-search?game=151203
        print("\n=== 2. Inspecting 1x-betpk.mobi/en/casino-search?game=151203 ===")
        req_urls = []
        page.on("request", lambda r: req_urls.append(r.url) if any(x in r.url.lower() for x in ['151203', 'tower', 'galaxsys', 'game', 'launch', 'slot', 'casino', 'demo']) else None)
        try:
            await page.goto("https://1x-betpk.mobi/en/casino-search?game=151203", timeout=45000, wait_until="domcontentloaded")
            await page.wait_for_timeout(8000)
            body2 = await page.inner_text("body")
            print("1xBet body text excerpt:\n", body2[:2000])
            els = await page.eval_on_selector_all("a, button, [role='button'], iframe, video", "els => els.map(e => ({tag: e.tagName, text: (e.innerText||'').trim().slice(0,60), src: e.src||e.href||'', cls: e.className}))")
            for el in els:
                if any(k in str(el).lower() for k in ['play', 'free', 'demo', 'tower', '151203', 'iframe', 'game']):
                    print("  1xBet el:", el)
        except Exception as e:
            print("1xBet err:", e)

        print("1xBet matching requests:")
        for u in req_urls[:60]:
            print(" ", u)

        await browser.close()

asyncio.run(main())
