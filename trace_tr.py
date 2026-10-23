import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932})

    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))

    page.goto("https://betwithnet.com/games/tower_legend.html", timeout=60000, wait_until="networkidle")
    time.sleep(6)

    # Inject detailed telemetry into window
    page.evaluate("""() => {
        window.__TRACE__ = [];
        let origEmit = window.__BWN_TR_HUB__;
        // Hook Redux dispatch
        let findStore = (el) => {
            let key = Object.keys(el || {}).find(k => k.startsWith('__reactFiber$'));
            if (!key) return null;
            let fiber = el[key];
            while (fiber) {
                if (fiber.memoizedProps && fiber.memoizedProps.store) return fiber.memoizedProps.store;
                if (fiber.stateNode && fiber.stateNode.store) return fiber.stateNode.store;
                fiber = fiber.return;
            }
            return null;
        };
        let store = findStore(document.querySelector('[data-testid="b-btn"]') || document.querySelector('#root > div'));
        if (store) {
            let origDispatch = store.dispatch;
            store.dispatch = function(action) {
                console.log('>>> REDUX DISPATCH:', action.type, JSON.stringify(action.payload));
                return origDispatch.apply(this, arguments);
            };
        }
    }""")

    print("\n--- CLICKING BUILD 1 ---")
    page.click('[data-testid="b-btn"]')

    # Wait 6 seconds for Floor 1 to drop, collide, world translate, and new floor hang on crane
    for sec in range(1, 8):
        time.sleep(1)
        st = page.evaluate("""() => {
            let store = document.querySelector('#root') ? window.__MY_STORE__ : null;
            let btn = document.querySelector('[data-testid="b-btn"]');
            let gi = store ? store.getState()?.gameInfo : null;
            return {
                sec: 't+' + sec,
                btnDisabled: btn?.classList.contains('disabled'),
                btnText: btn?.innerText,
                isReady: gi?.isReadyThrowFloor
            };
        }""")
        print(f"Floor 1 @ {sec}s:", st)
        if not st.get('btnDisabled') and sec >= 4:
            print("Floor 1 settled and button ready!")
            break

    print("\n--- CLICKING BUILD 2 ---")
    page.click('[data-testid="b-btn"]')

    # Track Floor 2 second by second for 10 seconds
    for sec in range(1, 11):
        time.sleep(1)
        st2 = page.evaluate("""() => {
            let btn = document.querySelector('[data-testid="b-btn"]');
            let store = window.__MY_STORE__;
            let gi = store ? store.getState()?.gameInfo : null;
            return {
                sec: 't+' + sec,
                btnDisabled: btn?.classList.contains('disabled'),
                btnText: btn?.innerText,
                isReady: gi?.isReadyThrowFloor,
                status: gi?.status
            };
        }""")
        print(f"Floor 2 @ {sec}s:", st2)

    browser.close()
