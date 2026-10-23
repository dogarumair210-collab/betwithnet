import asyncio
import base64
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        assets = []
        page.on("response", lambda res: assets.append((res.status, res.url, res.headers.get('content-type', ''))) if any(k in res.url.lower() for k in ['galaxsys', 'tower', 'png', 'webp', 'svg', 'mp3', 'ogg', 'wav', 'json', 'atlas', 'js', 'mp4', 'webm']) else None)

        print("Opening https://galaxsys.co/games/demo/desktop/tower-rush/ ...")
        await page.goto("https://galaxsys.co/games/demo/desktop/tower-rush/", timeout=45000, wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)
        
        # Check if there is an age verification button (18+)
        btns = await page.eval_on_selector_all("button, a", "els => els.map(e => ({text: e.innerText.trim(), cls: e.className, id: e.id}))")
        print("Buttons on demo page:", btns)
        
        # Click 18+ or confirm if present
        for sel in ["button:has-text('18')", "a:has-text('18')", "button:has-text('Yes')", "button:has-text('Confirm')", ".age-confirm", ".age-gate button"]:
            try:
                if await page.locator(sel).count() > 0:
                    print("Clicking age gate:", sel)
                    await page.locator(sel).first.click()
                    await page.wait_for_timeout(3000)
            except Exception as e:
                pass

        iframes = await page.eval_on_selector_all("iframe", "els => els.map(e => ({src: e.src, id: e.id, cls: e.className}))")
        print("Iframes on demo page:", iframes)
        
        html = await page.content()
        print("Page HTML snippet:", html[:2000])
        for line in html.splitlines():
            if 'iframe' in line.lower() or 'game' in line.lower() or 'launch' in line.lower() or 'src=' in line.lower():
                print("HTML line:", line.strip()[:200])

        await page.wait_for_timeout(6000)
        await page.screenshot(path="/home/betwithnet.com/public_html/games/tr_inspect_1.png")
        
        print("\nCaptured assets count:", len(assets))
        for st, u, ct in assets[:120]:
            print(f"  [{st}] ({ct}) {u}")

        await browser.close()

asyncio.run(main())
