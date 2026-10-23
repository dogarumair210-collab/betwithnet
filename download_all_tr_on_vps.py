import os
import urllib.request

base_cdn = "https://cdn.gx-games-54rg78cw-allalt1.click/fg-cdn/prd/root"
target_root = "/home/betwithnet.com/public_html/games/tower_rush_assets"

paths = [
    "images/loaderGS.svg",
    "gifs/rotate.gif",
    "fonts/index.css",
    "fonts/RubikLight/RubikLight.woff",
    "fonts/RubikRegular/RubikRegular.woff",
    "fonts/RubikMedium/RubikMedium.woff",
    "fonts/RubikBold/RubikBold.woff",
    "fonts/RubikBlack/RubikBlack.woff",
    "images/towerrush/favicon/favicon.ico",
    "images/towerrush/desktop/bg.webp",
    "images/towerrush/desktop/logo.webp",
    "images/towerrush/desktop/headerBg.webp",
    "images/towerrush/mobile/headerBg.webp",
    "images/towerrush/desktop/background-back.webp",
    "images/towerrush/desktop/background-front.webp",
    "images/towerrush/desktop/basis-tower.webp",
    "images/towerrush/desktop/betPartBorder.webp",
    "images/towerrush/desktop/buildBtn.webp",
    "images/towerrush/desktop/buildBtnLines.webp",
    "images/towerrush/desktop/cashoutBtn.webp",
    "images/towerrush/desktop/cashoutBtnFrozen.webp",
    "images/towerrush/desktop/win.webp",
    "images/towerrush/desktop/lose.webp",
    "images/towerrush/desktop/bigWin.webp",
    "images/towerrush/desktop/bigWinPopupBG.webp",
    "images/towerrush/desktop/sprite.webp",
    "images/towerrush/desktop/bonus-frozen.webp",
    "images/towerrush/desktop/bonus-triple.webp",
    "images/towerrush/desktop/bonus-temple.webp",
    "images/towerrush/desktop/bonus-temple-background.webp",
    "images/towerrush/desktop/intro/boardItem.webp",
    "images/towerrush/desktop/intro/boardItemArrow.webp",
    "images/towerrush/desktop/intro/resultRow.webp",
    "images/towerrush/desktop/intro/resultRowArrow.webp",
    "images/towerrush/mobile/bg.webp",
    "images/towerrush/mobile/logo.webp",
    "images/towerrush/mobile/background-back.webp",
    "images/towerrush/mobile/background-front.webp",
    "images/towerrush/mobile/basis-tower.webp",
    "images/towerrush/mobile/betPartBorder.webp",
    "images/towerrush/mobile/buildBtn.webp",
    "images/towerrush/mobile/buildBtnLines.webp",
    "images/towerrush/mobile/cashoutBtn.webp",
    "images/towerrush/mobile/cashoutBtnFrozen.webp",
    "images/towerrush/mobile/win.webp",
    "images/towerrush/mobile/lose.webp",
    "images/towerrush/mobile/bigWin.webp",
    "images/towerrush/mobile/bigWinPopupBG.webp",
    "images/towerrush/mobile/sprite.webp",
    "images/towerrush/mobile/bonus-frozen.webp",
    "images/towerrush/mobile/bonus-triple.webp",
    "images/towerrush/mobile/bonus-temple.webp",
    "images/towerrush/mobile/bonus-temple-background.webp",
    "images/towerrush/mobile/intro/boardItem.webp",
    "images/towerrush/mobile/intro/boardItemArrow.webp",
    "images/towerrush/mobile/intro/resultRow.webp",
    "images/towerrush/mobile/intro/resultRowArrow.webp",
    "images/towerrush/global/beforeLoad/global.json",
    "images/towerrush/global/beforeLoad/global.webp",
    "images/towerrush/global/resultItemFrozen.webp",
    "images/towerrush/global/buildBtnBolt.webp",
    "images/towerrush/global/betInputBackground.webp",
    "images/towerrush/global/quickBtnBackground.webp",
    "images/towerrush/global/switchBtn.webp",
    "images/towerrush/global/secondaryBtn.webp",
    "images/towerrush/global/secondaryBtnSm.webp",
    "images/towerrush/global/bonus-temple-wheel.webp",
    "images/towerrush/global/temple-text-shine.png",
    "images/towerrush/global/bonus-temple-wheel-frozen.webp",
    "images/towerrush/global/bonus-temple-wheel-arrow.webp",
    "images/towerrush/global/bonus-temple-wheel-centre.webp",
    "images/towerrush/global/bonus-temple-wheel-back.webp",
    "images/towerrush/global/bonus-temple-wheel-frame-shadow.webp",
    "spines/towerrush/v2/tr_all.atlas",
    "spines/towerrush/v2/tr_all.webp",
    "spines/towerrush/v2/tr_tower_rush_frozen.json",
    "spines/towerrush/v2/tr_result_smoke.json",
    "spines/towerrush/v2/tr_bonus_torch_fire_web.json",
    "spines/towerrush/v2/tr_triple_bonus_smoke.json",
    "spines/towerrush/v2/tr_bonus_wheel_stone.json",
    "spines/towerrush/v2/tr_bonus_sector_glow.json",
    "spines/towerrush/v2/tr_drop_smoke.json",
    "sounds/towerrush/sounds.mp3",
    "sounds/towerrush/background.mp3"
]

ok = 0
fail = 0
for rel in paths:
    url = f"{base_cdn}/{rel}"
    dest = os.path.join(target_root, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            with open(dest, "wb") as f:
                f.write(data)
            ok += 1
    except Exception as e:
        print(f"MISS {rel}: {e}")
        fail += 1

print(f"Downloaded {ok} assets to {target_root} ({fail} misses)")
