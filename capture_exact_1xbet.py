import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Desktop viewport
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        
        try:
            print("Loading T1Games Racing...")
            await page.goto('https://bg01.t1games.live/parse?game=racing', wait_until='networkidle', timeout=30000)
            await asyncio.sleep(4)
            await page.screenshot(path='/tmp/t1_racing_exact.png')
            print("Saved /tmp/t1_racing_exact.png")
            content = await page.content()
            with open('/tmp/t1_racing_dom.html', 'w', encoding='utf-8') as f:
                f.write(content)
            print("Saved /tmp/t1_racing_dom.html")
        except Exception as e:
            print("Error loading direct url:", e)
            
        await browser.close()

asyncio.run(run())
