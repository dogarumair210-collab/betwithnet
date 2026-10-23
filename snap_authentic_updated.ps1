$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

# 1. Capture Game Cabinet with authentic background
$outGame = "$base\gold_rush_authentic_bg.png"
$argsGame = "--headless --no-sandbox --disable-gpu --virtual-time-budget=3500 --window-size=1280,720 --screenshot=`"$outGame`" `"http://localhost:8080/gold_rush_template/standalone_game/index.html`""
Start-Process -FilePath $edge -ArgumentList $argsGame -Wait

# 2. Capture Trailer Modal with authentic video player
$outTrailer = "$base\gold_rush_authentic_trailer.png"
$tmpHtml = "$base\gold_rush_template\standalone_game\test_trailer_view.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw
$injected = $content -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) window.goldRushGame.openCinematicTrailer(); }, 600); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$argsTrailer = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2500 --window-size=1280,720 --screenshot=`"$outTrailer`" `"http://localhost:8080/gold_rush_template/standalone_game/test_trailer_view.html`""
Start-Process -FilePath $edge -ArgumentList $argsTrailer -Wait

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }

# 3. Capture 1xBet Embed Portal
$out1x = "$base\gold_rush_1xbet_updated.png"
$args1x = "--headless --no-sandbox --disable-gpu --virtual-time-budget=4000 --window-size=1280,820 --screenshot=`"$out1x`" `"http://localhost:8080/en/casino-search?game=71040`""
Start-Process -FilePath $edge -ArgumentList $args1x -Wait

Write-Host "Game screenshot: $((Get-Item $outGame).Length) bytes"
Write-Host "Trailer screenshot: $((Get-Item $outTrailer).Length) bytes"
Write-Host "1xBet portal screenshot: $((Get-Item $out1x).Length) bytes"
