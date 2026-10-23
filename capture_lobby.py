import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        
        # Wait until splash is none + 3s for lobby animation
        iframe_element = await page.wait_for_selector('#gameIframe')
        frame = await iframe_element.content_frame()
        
        for i in range(25):
            await asyncio.sleep(1)
            disp = await frame.evaluate('() => document.getElementById("splash") ? document.getElementById("splash").style.display : null')
            if disp == 'none':
                print(f'Splash gone at second {i+1}! Waiting 3 seconds for lobby entrance...')
                await asyncio.sleep(3)
                await page.screenshot(path='/tmp/ab_lobby_live.png')
                print('Saved /tmp/ab_lobby_live.png')
                break

        await browser.close()

asyncio.run(run())
