import asyncio
import os
from playwright.async_api import async_playwright

out_dir = "/home/betwithnet.com/public_html/games/tr_assets"
os.makedirs(out_dir, exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1440, 'height': 900},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        )
        page = await context.new_page()

        saved_idx = [0]
        async def on_response(res):
            try:
                u = res.url
                ct = res.headers.get("content-type", "")
                if res.status == 200 and any(ext in u.lower() or ext in ct.lower() for ext in ['webp', 'png', 'svg', 'gif', 'jpg', 'mp4', 'webm', 'mp3', 'ogg']):
                    if 'google' not in u and 'yandex' not in u and 'cloudflare' not in u:
                        body = await res.body()
                        if len(body) > 500:
                            saved_idx[0] += 1
                            ext = u.split('?')[0].split('.')[-1]
                            if len(ext) > 5 or '/' in ext:
                                ext = 'bin'
                            fname = f"asset_{saved_idx[0]}_{os.path.basename(u.split('?')[0])}"
                            fpath = os.path.join(out_dir, fname)
                            with open(fpath, "wb") as f:
                                f.write(body)
                            print(f"Saved {fname} ({len(body)} bytes) from {u}")
            except Exception as e:
                pass

        page.on("response", lambda res: asyncio.create_task(on_response(res)))

        print("Opening https://galaxsys.co/games/tower-rush/ ...")
        await page.goto("https://galaxsys.co/games/tower-rush/", timeout=40000, wait_until="domcontentloaded")
        await page.wait_for_timeout(5000)
        
        title = await page.title()
        print("Page title:", title)

        # Click YES, I'M 18 +
        try:
            btn = page.locator("text=YES, I'M 18 +")
            if await btn.count() > 0:
                print("Clicking YES, I'M 18 + ...")
                await btn.first.click()
                await page.wait_for_timeout(3000)
        except Exception as e:
            print("Age gate click err:", e)

        # Scroll down slowly to trigger lazy loaded images/videos
        for y in range(0, 5000, 600):
            await page.evaluate(f"window.scrollTo(0, {y})")
            await page.wait_for_timeout(700)

        await page.evaluate("window.scrollTo(0, 0)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path=os.path.join(out_dir, "galaxsys_full.png"), full_page=True)
        print("Saved galaxsys_full.png")

        txt = await page.inner_text("body")
        print("Body text:\n", txt[:3000])

        # Also check all img src and video src
        media_info = await page.eval_on_selector_all("img, video, source, iframe, a.btn", """els => els.map(e => ({
            tag: e.tagName,
            src: e.src || e.href || '',
            alt: e.alt || '',
            text: (e.innerText || '').trim(),
            cls: e.className
        }))""")
        for m in media_info:
            print("Media/Btn:", m)

        await browser.close()

asyncio.run(main())
