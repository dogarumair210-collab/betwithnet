import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932})

    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))

    page.goto("https://betwithnet.com/games/tower_legend.html", timeout=60000, wait_until="networkidle")
    time.sleep(6)

    # Let's inspect window.__BWN_TR_HUB__ and log all calls
    page.evaluate("""() => {
        let origHub = window.__BWN_TR_HUB__;
        window.__BWN_TR_HUB__ = function(method, payload, hub) {
            console.log('>>> HUB METHOD CALLED:', method, JSON.stringify(payload));
            return origHub.apply(this, arguments);
        };
    }""")

    print("\n=== 1. CLICKING BUILD 1 ===")
    page.click('[data-testid="b-btn"]')
    time.sleep(6)

    # Check state after floor 1
    s1 = page.evaluate("""() => {
        let btn = document.querySelector('[data-testid="b-btn"]');
        let bodies = window.__TR_MATTER_ENGINE__ ? window.__TR_MATTER_ENGINE__.world.bodies.map(b => ({
            label: b.label, index: b.index, x: Math.round(b.position.x), y: Math.round(b.position.y), isStatic: b.isStatic
        })) : [];
        return {
            btnText: btn?.innerText,
            disabled: btn?.classList.contains('disabled'),
            bodies: bodies
        };
    }""")
    print("State after Floor 1:", s1)

    print("\n=== 2. CLICKING BUILD 2 ===")
    page.click('[data-testid="b-btn"]')

    # Monitor for 8 seconds
    for i in range(1, 9):
        time.sleep(1)
        st = page.evaluate("""() => {
            let btn = document.querySelector('[data-testid="b-btn"]');
            let bodies = window.__TR_MATTER_ENGINE__ ? window.__TR_MATTER_ENGINE__.world.bodies.map(b => ({
                label: b.label, index: b.index, x: Math.round(b.position.x), y: Math.round(b.position.y), isStatic: b.isStatic
            })) : [];
            return {
                btnText: btn?.innerText,
                disabled: btn?.classList.contains('disabled'),
                bodies: bodies
            };
        }""")
        print(f"Sec {i}: btn='{st['btnText']}', disabled={st['disabled']}, bodies count={len(st['bodies'])}")
        if not st['disabled'] and i >= 4:
            print("Floor 2 settled successfully!")
            break

    browser.close()
