import os
import urllib.request

target_root = "/home/betwithnet.com/public_html/games/tower_rush_assets"

urls = [
    ("https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/main.js", "fg-client/prd/fg-towerrush-client/v112/main.js"),
    ("https://gx-games-54rg78cw-allalt1.click/gx-engine-client/remoteEntry.js", "gx-engine-client/remoteEntry.js"),
    ("https://gx-games-54rg78cw-allalt1.click/gx-launcher-client/remoteEntry.js", "gx-launcher-client/remoteEntry.js"),
    ("https://gx-games-54rg78cw-allalt1.click/gx-lobby-service/Lobby/SimilarGames?partnerId=50175", "api/SimilarGames.json"),
    ("https://gx-games-54rg78cw-allalt1.click/gx-lobby-service/Lobby/GetGameTranslations/?partnerId=50175&gameType=TowerRush&culture=en", "api/GetGameTranslations.json"),
]

v112_chunks = ["896", "540", "961", "556", "46", "263", "193", "253", "879", "256", "871", "634", "854", "3", "546", "396", "493", "492", "28", "15"]
for c in v112_chunks:
    urls.append((f"https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/{c}.js", f"fg-client/prd/fg-towerrush-client/v112/{c}.js"))

common_urls = [
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/6257.1e95bc1b5cce99f66481.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/6337.722fd7235dd008fcaa95.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/405.64fe16201905586f79d6.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/1620.2a6ece7cadbbe4ed4508.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/2568.02bb297aefe1f759e1eb.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/6987.e84b40cac9e3d7aeeea6.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/8196.8be2e75bb9af52a60d9a.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/3085.d0125d613af2dbbb371e.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/1260.057ecf695e72e836e8ff.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/5544.43180039671eb6154f9f.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/632.b57759154bda647ab6f1.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/4848.3ef3e07de0ae277d8936.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/6299.3bcb4b48f1aa3b6edaca.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/7079.06d5a89324847ca8ef95.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/2502.77dad0de3d475fffe920.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/3804.8b79658b1ac25dff1bae.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/2051.57905f899bf2a7e15a42.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/7311.eb3514782adcae4f706b.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-launcher-client/v91/2466.3e43eae71f81958778db.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/6640.9e6d3ec2da4916ac8aa6.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/4196.eef18b37a24e91ef5703.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/291.04a2f6f2d0a3571adae5.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/3249.2bfa9a90aef7ec869377.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/9950.0e8d8361b2429241a036.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/4206.3f8880d7f13da1892204.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/2207.456184ac73564178da1e.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/5052.d3b372b3e2ee6bf7f930.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/6411.0904310a41dcb2b7c710.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/8725.ac2feaf2d9d9a1f81ec5.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1300.15d9a77d632a505607ca.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1628.8b9c0a78fef5ae80473b.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/3718.a733b947c0fcd899164d.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/3139.551d8c22cdea05478029.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/2974.e2df289e6c6c3a7bae18.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/6545.83c24294db56d3cff99c.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/3970.ca878b090013d82d8925.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/2754.97ce1842c1b441a59d0c.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/5529.2d60f4ba570d511f4381.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/7910.fd76f652bc0bb44b9ab0.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1783.b0ecba9d61442405d690.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/8693.a4351526a6a39bbffc5a.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/9012.aa4302aee7b0a67c2050.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/5629.f55d247bc26eeb9c47ee.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1876.51f0fdf292dda45b1ef9.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1750.b927bd527a2e76a06d60.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/82.65268a152aa4e44a0ef9.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1534.595701b6bce08eb4d970.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/5682.2e97327400161ec1cdc5.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/6373.1a904b4ebec163129a1f.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/4271.fd94470f2ce52a3a52b2.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/2222.f07d936387681163b3ab.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/9100.92e317542bc01836a6a2.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/9323.067349a4b961e61d5dea.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/gx-common-client/prd/gx-engine-client/v70/1101.bb40263349a089445a59.js",
]

for u in common_urls:
    rel = u.split("allalt1.click/")[1]
    urls.append((u, rel))

ok = 0
for u, rel in urls:
    dest = os.path.join(target_root, rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    try:
        req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            with open(dest, "wb") as f:
                f.write(r.read())
            ok += 1
    except Exception as e:
        print(f"MISS {rel}: {e}")

print(f"Downloaded {ok}/{len(urls)} JS/API files to {target_root}")
