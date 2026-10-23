import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.type}: {msg.text[:200]}'))
        page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
        
        print('Navigating to https://betwithnet.com/games/andarbahar.html...')
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        
        # Wait until scene is loaded or up to 20 seconds
        for i in range(20):
            await asyncio.sleep(1)
            # Check if scene loaded inside iframe
            frames = page.frames
            for f in frames:
                if 'ab_engine' in f.url:
                    try:
                        res = await f.evaluate('() => window.cc && cc.director && cc.director.getScene() ? cc.director.getScene().name : null')
                        if res:
                            print(f'Second {i+1}: Scene is loaded! Scene name = {res}')
                            # Wait an extra 2 seconds for rendering
                            await asyncio.sleep(2)
                            await page.screenshot(path='/tmp/ab_real_user_view.png')
                            print('Saved /tmp/ab_real_user_view.png')
                            await browser.close()
                            return
                    except Exception as e:
                        pass

        await page.screenshot(path='/tmp/ab_real_user_view.png')
        print('Saved /tmp/ab_real_user_view.png after timeout')
        await browser.close()

asyncio.run(run())
