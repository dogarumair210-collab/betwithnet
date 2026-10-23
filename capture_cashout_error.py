import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932})

    page.on("pageerror", lambda err: print(f"!!! UNCID ERROR: {err} !!!"))
    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))

    page.goto("https://betwithnet.com/games/tower_legend.html", timeout=60000, wait_until="networkidle")
    time.sleep(5)

    # Listen to window.onerror explicitly
    page.evaluate("""() => {
        window.addEventListener('error', (e) => {
            console.log('>>> DETAILED WINDOW ERROR:', e.message, e.filename, e.lineno, e.colno, e.error ? e.error.stack : 'no-stack');
        });
        window.addEventListener('unhandledrejection', (e) => {
            console.log('>>> UNHANDLED REJECTION:', e.reason);
        });
    }""")

    page.click('[data-testid="b-btn"]')
    time.sleep(5)

    print(">>> CLICKING CASHOUT NOW...")
    page.click('button:has-text("CASHOUT")')
    time.sleep(4)

    browser.close()
