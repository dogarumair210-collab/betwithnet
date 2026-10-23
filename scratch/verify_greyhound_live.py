import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        errors = []
        failed_reqs = []
        page.on("pageerror", lambda err: errors.append(f"PAGEERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE_{msg.type}: {msg.text}") if msg.type in ("error", "warning") else None)
        page.on("response", lambda res: failed_reqs.append(f"{res.status} {res.url}") if res.status >= 400 else None)

        print("Navigating to https://betwithnet.com/games/greyhound.html ...")
        await page.goto("https://betwithnet.com/games/greyhound.html", wait_until="domcontentloaded", timeout=30000)

        for i in range(25):
            await asyncio.sleep(1)
            inited = await page.evaluate("() => typeof _is_inited !== 'undefined' && _is_inited")
            if inited:
                print(f"Game initialized at {i+1}s!")
                break

        await asyncio.sleep(1)

        # Give test wallet 5000 PKR to verify bet slip UI and bet placement
        await page.evaluate("""() => {
            if (window.wallet) {
                window.wallet.getBalance = () => 5000;
                window.wallet.placeBet = (amt) => true;
            }
            _credit = 5000;
            $(".header_credit").html("5 000 PKR");
            const btn = document.querySelector('.bet_itm_btn');
            if (btn) btn.click();
        }""")
        await asyncio.sleep(0.8)
        await page.screenshot(path="/tmp/greyhound_live_betting.jpg", type="jpeg", quality=90)
        print("Saved /tmp/greyhound_live_betting.jpg")

        # Click PLACE BET (.bet_set_btn)
        await page.evaluate("""() => {
            const placeBtn = document.querySelector('.bet_set_btn');
            if (placeBtn) placeBtn.click();
        }""")
        await asyncio.sleep(0.8)

        # Trigger Race Now and wait 6 seconds into the 3D race
        print("Triggering race now...")
        await page.evaluate("() => window.bwnTriggerRaceNow && window.bwnTriggerRaceNow()")
        await asyncio.sleep(6)
        await page.screenshot(path="/tmp/greyhound_live_racing.jpg", type="jpeg", quality=90)
        print("Saved /tmp/greyhound_live_racing.jpg")

        print("ERRORS:", errors)
        print("FAILED_REQS:", failed_reqs)
        await browser.close()

asyncio.run(main())
