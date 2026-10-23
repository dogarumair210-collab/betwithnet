import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 430, "height": 932})

    logs = []
    page.on("console", lambda msg: print(f"[{msg.type}] {msg.text}"))

    print("Navigating to https://betwithnet.com/games/tower_legend.html ...")
    page.goto("https://betwithnet.com/games/tower_legend.html", timeout=60000, wait_until="networkidle")
    time.sleep(5)

    # Check store state
    state = page.evaluate("""() => {
        let store = window.__REDUX_STORE__;
        if (!store) {
            let el = document.querySelector('#root');
            if (el && el._reactRootContainer) {
                // try to find store
            }
        }
        return {
            status: window.__TR_STATUS__ || 'none',
            btn: document.querySelector('[data-testid="b-btn"]')?.innerText,
            disabled: document.querySelector('[data-testid="b-btn"]')?.classList.contains('disabled'),
            introModal: !!document.querySelector('.j_UeZ, .RljG5')
        };
    }""")
    print("Initial page state:", state)

    # Let's inspect Redux store if available
    redux_info = page.evaluate("""() => {
        // Find Redux store from any React fiber
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
        let s = findStore(document.querySelector('[data-testid="b-btn"]') || document.querySelector('#root > div'));
        if (s) {
            window.__MY_STORE__ = s;
            return { found: true, state: s.getState()?.gameInfo };
        }
        return { found: false };
    }""")
    print("Redux info:", redux_info)

    # Click BUILD 1
    print("\n--- Clicking BUILD 1 ---")
    page.click('[data-testid="b-btn"]')
    time.sleep(2)

    s1 = page.evaluate("""() => {
        let store = window.__MY_STORE__;
        let gi = store ? store.getState()?.gameInfo : null;
        let pi = store ? store.getState()?.playerInfo : null;
        let btn = document.querySelector('[data-testid="b-btn"]');
        let cashout = document.querySelector('.cashoutBtn') || document.querySelector('button[class*="cashout"]');
        return {
            status: gi?.status,
            isReadyThrowFloor: gi?.isReadyThrowFloor,
            isFinished: gi?.isFinished,
            gameId: gi?.gameId,
            btnText: btn?.innerText,
            btnDisabled: btn?.classList.contains('disabled'),
            cashoutVisible: !!cashout && !cashout.classList.contains('disabled'),
            cashoutText: cashout?.innerText
        };
    }""")
    print("After BUILD 1 click (2s):", s1)

    time.sleep(3)
    s2 = page.evaluate("""() => {
        let store = window.__MY_STORE__;
        let gi = store ? store.getState()?.gameInfo : null;
        let btn = document.querySelector('[data-testid="b-btn"]');
        let cashout = document.querySelector('.cashoutBtn') || document.querySelector('button[class*="cashout"]');
        return {
            status: gi?.status,
            isReadyThrowFloor: gi?.isReadyThrowFloor,
            isFinished: gi?.isFinished,
            btnText: btn?.innerText,
            btnDisabled: btn?.classList.contains('disabled'),
            cashoutVisible: !!cashout,
            cashoutDisabled: cashout?.classList.contains('disabled'),
            cashoutText: cashout?.innerText
        };
    }""")
    print("After Floor 1 settled (5s):", s2)

    page.screenshot(path="/tmp/after_build1.png")

    # If button is enabled, click BUILD 2
    if not s2.get('btnDisabled'):
        print("\n--- Clicking BUILD 2 ---")
        page.click('[data-testid="b-btn"]')
        time.sleep(4)
        s3 = page.evaluate("""() => {
            let store = window.__MY_STORE__;
            let gi = store ? store.getState()?.gameInfo : null;
            let btn = document.querySelector('[data-testid="b-btn"]');
            let cashout = document.querySelector('.cashoutBtn') || document.querySelector('button[class*="cashout"]');
            return {
                status: gi?.status,
                isReadyThrowFloor: gi?.isReadyThrowFloor,
                isFinished: gi?.isFinished,
                btnText: btn?.innerText,
                btnDisabled: btn?.classList.contains('disabled'),
                cashoutVisible: !!cashout,
                cashoutDisabled: cashout?.classList.contains('disabled'),
                cashoutText: cashout?.innerText
            };
        }""")
        print("After Floor 2 settled (4s):", s3)
        page.screenshot(path="/tmp/after_build2.png")
    else:
        print("BUTTON WAS DISABLED! Cannot click BUILD 2!")

    # Check cashout
    cashout_btn = page.query_selector('.cashoutBtn, button[class*="cashoutBtn"]')
    if cashout_btn:
        print("\n--- Clicking CASHOUT ---")
        cashout_btn.click()
        time.sleep(3)
        s4 = page.evaluate("""() => {
            let store = window.__MY_STORE__;
            let gi = store ? store.getState()?.gameInfo : null;
            let btn = document.querySelector('[data-testid="b-btn"]');
            return {
                status: gi?.status,
                isReadyThrowFloor: gi?.isReadyThrowFloor,
                isFinished: gi?.isFinished,
                btnText: btn?.innerText,
                btnDisabled: btn?.classList.contains('disabled')
            };
        }""")
        print("After Cashout (3s):", s4)
        page.screenshot(path="/tmp/after_cashout.png")

        # Now try to start ROUND 2!
        time.sleep(2)
        s5 = page.evaluate("""() => {
            let store = window.__MY_STORE__;
            let gi = store ? store.getState()?.gameInfo : null;
            let btn = document.querySelector('[data-testid="b-btn"]');
            return {
                status: gi?.status,
                isReadyThrowFloor: gi?.isReadyThrowFloor,
                btnText: btn?.innerText,
                btnDisabled: btn?.classList.contains('disabled')
            };
        }""")
        print("Round 2 Readiness (5s after cashout):", s5)

        if not s5.get('btnDisabled'):
            print("\n--- Starting ROUND 2 (Clicking BUILD) ---")
            page.click('[data-testid="b-btn"]')
            time.sleep(4)
            s6 = page.evaluate("""() => {
                let store = window.__MY_STORE__;
                let gi = store ? store.getState()?.gameInfo : null;
                let btn = document.querySelector('[data-testid="b-btn"]');
                return {
                    status: gi?.status,
                    isReadyThrowFloor: gi?.isReadyThrowFloor,
                    btnText: btn?.innerText,
                    btnDisabled: btn?.classList.contains('disabled')
                };
            }""")
            print("Round 2 Floor 1 settled:", s6)
            page.screenshot(path="/tmp/round2_floor1.png")
        else:
            print("ROUND 2 BUTTON DISABLED! Game is STUCK after cashout!")

    browser.close()
