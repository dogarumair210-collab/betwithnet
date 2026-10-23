import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        urls_seen = []
        page.on("request", lambda req: urls_seen.append(req.url) if any(k in req.url.lower() for k in ['tower', 'galaxsys', '151203', 'game', 'iframe', 'launch', 'demo']) else None)

        print("Checking galaxsys.co/games/tower-rush/ ...")
        try:
            await page.goto("https://galaxsys.co/games/tower-rush/", timeout=30000, wait_until="domcontentloaded")
            await page.wait_for_timeout(4000)
            await page.screenshot(path="galaxsys_page.png")
            iframes = await page.eval_on_selector_all("iframe", "els => els.map(e => e.src)")
            links = await page.eval_on_selector_all("a, button", "els => els.map(e => ({text: e.innerText, href: e.href || '', onclick: e.getAttribute('onclick') || '', cls: e.className}))")
            print("Galaxsys iframes:", iframes)
            for l in links:
                if 'demo' in str(l).lower() or 'play' in str(l).lower() or 'tower' in str(l).lower():
                    print("Link/Btn:", l)
        except Exception as e:
            print("Galaxsys error:", e)

        print("\nChecking 1x-betpk.mobi/en/casino-search?game=151203 ...")
        try:
            await page.goto("https://1x-betpk.mobi/en/casino-search?game=151203", timeout=30000, wait_until="domcontentloaded")
            await page.wait_for_timeout(6000)
            await page.screenshot(path="1xbet_151203.png")
            print("1xBet title:", await page.title())
            iframes2 = await page.eval_on_selector_all("iframe", "els => els.map(e => e.src)")
            print("1xBet iframes:", iframes2)
            imgs = await page.eval_on_selector_all("img", "els => els.map(e => ({src: e.src, alt: e.alt})).filter(x => x.src)")
            for im in imgs[:30]:
                print("Img:", im)
        except Exception as e:
            print("1xBet error:", e)

        print("\nInteresting network requests:")
        for u in urls_seen[:40]:
            print(" ", u)
        await browser.close()

asyncio.run(main())
