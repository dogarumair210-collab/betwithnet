import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        page.on('console', lambda msg: print(f'[PARENT CONSOLE] {msg.type}: {msg.text}'))
        
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        
        iframe_element = await page.wait_for_selector('#gameIframe')
        frame = await iframe_element.content_frame()
        print('Frame URL:', frame.url)
        
        for i in range(12):
            await asyncio.sleep(1)
            info = await frame.evaluate('''() => {
                const splash = document.getElementById("splash");
                const bar = splash ? splash.querySelector(".progress-bar span") : null;
                return {
                    width: bar ? bar.style.width : null,
                    display: splash ? splash.style.display : null,
                    hasCC: !!window.cc,
                    scene: window.cc && cc.director && cc.director.getScene() ? cc.director.getScene().name : null,
                    err: window.__lastErr || null
                };
            }''')
            print(f'Second {i+1}: {info}')

        await browser.close()

asyncio.run(run())
