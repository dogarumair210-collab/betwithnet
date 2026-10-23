import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            viewport={'width': 1280, 'height': 800}
        )
        page = await context.new_page()
        
        urls = []
        page.on('request', lambda req: urls.append(req.url) if ('108297' in req.url or 'game' in req.url or 'iframe' in req.url or 'racing' in req.url or 't1' in req.url) else None)

        try:
            print("Opening 1xBet link...")
            await page.goto('https://1xbet.com.gh/en/casino-search?game=108297', wait_until='networkidle', timeout=30000)
            await asyncio.sleep(5)
            await page.screenshot(path='/tmp/1xbet_108297_live.png')
            print("Saved screenshot /tmp/1xbet_108297_live.png")
            
            frames = page.frames
            print(f"Total frames: {len(frames)}")
            for f in frames:
                print("Frame URL:", f.url)
                
            with open('/tmp/1xbet_urls.txt', 'w') as f:
                f.write('\n'.join(urls))
        except Exception as e:
            print("Error loading 1xbet:", e)
            
        await browser.close()

asyncio.run(run())
