import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932})

    page.goto("https://betwithnet.com/games/tower_legend.html", timeout=60000, wait_until="networkidle")
    time.sleep(5)

    print("--- Initial Buttons ---")
    btns0 = page.evaluate("""() => Array.from(document.querySelectorAll('button')).map(b => ({
        tag: b.tagName, cls: b.className, text: b.innerText
    }))""")
    for b in btns0:
        print("  ", b)

    page.click('[data-testid="b-btn"]')
    time.sleep(5)

    print("\n--- After BUILD 1 Buttons ---")
    btns1 = page.evaluate("""() => Array.from(document.querySelectorAll('button')).map(b => ({
        tag: b.tagName, cls: b.className, text: b.innerText, visible: b.offsetWidth > 0 && b.offsetHeight > 0
    }))""")
    for b in btns1:
        print("  ", b)

    page.click('[data-testid="b-btn"]')
    time.sleep(5)

    print("\n--- After BUILD 2 Buttons ---")
    btns2 = page.evaluate("""() => Array.from(document.querySelectorAll('button')).map(b => ({
        tag: b.tagName, cls: b.className, text: b.innerText, visible: b.offsetWidth > 0 && b.offsetHeight > 0
    }))""")
    for b in btns2:
        print("  ", b)

    browser.close()
