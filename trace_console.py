import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        
        page.on('response', lambda res: print('RESP 404:', res.url) if res.status == 404 else None)

        await page.goto('https://betwithnet.com/games/f1_racing.html', wait_until='networkidle')
        await asyncio.sleep(1)
        await browser.close()

asyncio.run(run())
