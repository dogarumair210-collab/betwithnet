import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        
        # Wait until splash display is none inside iframe
        iframe_element = await page.wait_for_selector('#gameIframe')
        frame = await iframe_element.content_frame()
        
        for i in range(20):
            await asyncio.sleep(1)
            disp = await frame.evaluate('() => document.getElementById("splash") ? document.getElementById("splash").style.display : null')
            print(f'Second {i+1}: splash display = {disp}')
            if disp == 'none':
                print('Splash is dismissed! Waiting 1s and taking screenshot...')
                await asyncio.sleep(1)
                await page.screenshot(path='/tmp/ab_verified_live.png')
                print('Saved /tmp/ab_verified_live.png')
                break

        await browser.close()

asyncio.run(run())
