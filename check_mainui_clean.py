import asyncio
import json
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 430, 'height': 932})
        await page.goto('https://betwithnet.com/games/andarbahar.html', wait_until='domcontentloaded')
        await asyncio.sleep(12)
        iframe_element = await page.wait_for_selector('#gameIframe')
        frame = await iframe_element.content_frame()
        res = await frame.evaluate('''() => {
            const sc = cc.director.getScene();
            const canvas = sc ? sc.getChildByName("Canvas") : null;
            const cam = canvas ? canvas.getChildByName("Main Camera") : null;
            const mui = cam ? cam.getChildByName("MainUI") : null;
            if (!mui) return "No MainUI";
            return mui.children.map(function(c) {
                return {
                    name: c.name,
                    active: c.active,
                    opacity: c.opacity,
                    children: c.children.map(function(c2) {
                        return { name: c2.name, active: c2.active, opacity: c2.opacity };
                    })
                };
            });
        }''')
        print('MainUI children:', json.dumps(res, indent=2))
        await browser.close()

asyncio.run(run())
