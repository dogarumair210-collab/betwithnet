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
            if (!cam) return "No cam";
            
            function serialize(node, d=0) {
                if (d > 3) return node.name;
                return {
                    name: node.name,
                    active: node.active,
                    opacity: node.opacity,
                    children: node.children.map(c => serialize(c, d+1))
                };
            }
            return cam.children.map(c => serialize(c));
        }''')
        print('Camera children:', json.dumps(res, indent=2))
        await browser.close()

asyncio.run(run())
