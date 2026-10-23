import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda err: errors.append(f"PAGEERROR: {err}"))
        page.on("console", lambda msg: errors.append(f"CONSOLE_{msg.type}: {msg.text}") if msg.type == "error" else None)

        print("Opening https://betwithnet.com/ ...")
        await page.goto("https://betwithnet.com/", wait_until="domcontentloaded", timeout=20000)
        await asyncio.sleep(2)

        # Close auth modal if open
        await page.evaluate("""() => {
            const m = document.getElementById('auth-modal-root');
            if (m) m.remove();
        }""")
        await asyncio.sleep(1)

        print("Testing manual deposit popup trigger...")
        await page.evaluate("""() => {
            if (window.core && window.core.showTransactionPopup) {
                window.core.showTransactionPopup({
                    type: 'deposit',
                    amount: 5000,
                    method: 'EasyPaisa',
                    user: 'Hamza_VIP***',
                    trxId: 'TID89472910',
                    isSelf: false
                });
            }
        }""")
        await asyncio.sleep(1)
        await page.screenshot(path="/tmp/tx_popup_deposit.jpg", type="jpeg", quality=90)
        print("Captured /tmp/tx_popup_deposit.jpg")

        print("Testing manual withdraw popup trigger with isSelf celebration...")
        await page.evaluate("""() => {
            if (window.core && window.core.showTransactionPopup) {
                window.core.showTransactionPopup({
                    type: 'withdraw',
                    amount: 15000,
                    method: 'JazzCash',
                    user: 'Ali_Raza***',
                    trxId: 'WTH5829104',
                    isSelf: true
                });
            }
        }""")
        await asyncio.sleep(1)
        await page.screenshot(path="/tmp/tx_popup_celebrate.jpg", type="jpeg", quality=90)
        print("Captured /tmp/tx_popup_celebrate.jpg")

        print("ERRORS:", errors)
        await browser.close()

asyncio.run(main())
