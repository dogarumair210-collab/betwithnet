import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        await page.goto('https://betwithnet.com/games/card_game.html?game=363', wait_until='domcontentloaded')
        await asyncio.sleep(4)
        await page.screenshot(path='/tmp/card_game_363.png')
        print('Saved /tmp/card_game_363.png')
        await browser.close()

asyncio.run(run())
