import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        await asyncio.sleep(14)
        
        await page.screenshot(path='/tmp/check_lobby_screen.png')
        print('Saved /tmp/check_lobby_screen.png')
        await browser.close()

asyncio.run(run())
