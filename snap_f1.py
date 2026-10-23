import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('https://betwithnet.com/games/f1_racing.html', wait_until='domcontentloaded', timeout=20000)
        await asyncio.sleep(4)
        await page.screenshot(path='/tmp/live_f1_screen.png')
        print('Saved /tmp/live_f1_screen.png')
        await browser.close()

asyncio.run(run())
