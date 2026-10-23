$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

# 1. 1xBet Portal View
$out1 = "$base\gold_rush_1xbet.png"
$url1 = 'http://localhost:8080/en/casino-search?game=71040'
$args1 = "--headless --no-sandbox --disable-gpu --virtual-time-budget=6000 --window-size=1280,820 --screenshot=`"$out1`" `"$url1`""
Start-Process -FilePath $edge -ArgumentList $args1 -Wait

# 2. Standalone Game View
$out2 = "$base\gold_rush_game.png"
$url2 = 'http://localhost:8080/gold_rush_template/standalone_game/index.html'
$args2 = "--headless --no-sandbox --disable-gpu --virtual-time-budget=5000 --window-size=1280,720 --screenshot=`"$out2`" `"$url2`""
Start-Process -FilePath $edge -ArgumentList $args2 -Wait

Write-Host "1xBet Screenshot: $((Get-Item $out1).Length) bytes"
Write-Host "Game Screenshot: $((Get-Item $out2).Length) bytes"
