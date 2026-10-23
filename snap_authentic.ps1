$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

# 1. Capture Loading Screen (at 400ms)
$outLoad = "$base\mannaplay_loading.png"
$argsLoad = "--headless --no-sandbox --disable-gpu --virtual-time-budget=400 --window-size=1280,720 --screenshot=`"$outLoad`" `"http://localhost:8080/gold_rush_template/standalone_game/index.html`""
Start-Process -FilePath $edge -ArgumentList $argsLoad -Wait

# 2. Capture Game Cabinet with Beams & Pedestal (at 3000ms)
$outGame = "$base\gold_rush_cabinet_authentic.png"
$argsGame = "--headless --no-sandbox --disable-gpu --virtual-time-budget=3000 --window-size=1280,720 --screenshot=`"$outGame`" `"http://localhost:8080/gold_rush_template/standalone_game/index.html`""
Start-Process -FilePath $edge -ArgumentList $argsGame -Wait

# 3. Capture 1xBet Embed
$out1x = "$base\gold_rush_1xbet_final.png"
$args1x = "--headless --no-sandbox --disable-gpu --virtual-time-budget=3500 --window-size=1280,820 --screenshot=`"$out1x`" `"http://localhost:8080/en/casino-search?game=71040`""
Start-Process -FilePath $edge -ArgumentList $args1x -Wait

Write-Host "Done capturing screenshots!"
