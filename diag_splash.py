import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        page.on('console', lambda msg: print(f'[CONSOLE] {msg.type}: {msg.text}'))
        page.on('pageerror', lambda err: print(f'[PAGEERROR] {err}'))
        
        await page.goto('https://betwithnet.com/games/ab_engine/index.html?currency=PKR&lang=en&test=1', wait_until='domcontentloaded')
        
        for i in range(15):
            await asyncio.sleep(1)
            diag = await page.evaluate('''() => {
                const splash = document.getElementById("splash");
                const bar = splash ? splash.querySelector(".progress-bar span") : null;
                return {
                    hasCC: !!window.cc,
                    director: !!(window.cc && cc.director),
                    scene: window.cc && cc.director && cc.director.getScene() ? cc.director.getScene().name : null,
                    splashDisplay: splash ? splash.style.display : null,
                    splashOpacity: splash ? splash.style.opacity : null,
                    barWidth: bar ? bar.style.width : null
                };
            }''')
            print(f'Second {i+1}: {diag}')

        await browser.close()

asyncio.run(run())
