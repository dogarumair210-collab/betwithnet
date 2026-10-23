$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

# 1. Capture Trailer Modal on auto-launch (at 2200ms right after loader reaches 100%)
$outTrailerAuto = "$base\gold_rush_trailer_autolaunch.png"
$argsTrailerAuto = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2600 --window-size=1280,720 --screenshot=`"$outTrailerAuto`" `"http://localhost:8080/gold_rush_template/standalone_game/index.html`""
Start-Process -FilePath $edge -ArgumentList $argsTrailerAuto -Wait

# 2. Capture Chapter 2 of Trailer (Gem Cart)
$outTrailerCh2 = "$base\gold_rush_trailer_chapter2.png"
$tmpHtml = "$base\gold_rush_template\standalone_game\test_trailer_ch2.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw -Encoding UTF8
$injected = $content -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) { window.goldRushGame.openCinematicTrailer(); window.goldRushGame.goToTrailerSlide(2); } }, 600); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$argsCh2 = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2500 --window-size=1280,720 --screenshot=`"$outTrailerCh2`" `"http://localhost:8080/gold_rush_template/standalone_game/test_trailer_ch2.html`""
Start-Process -FilePath $edge -ArgumentList $argsCh2 -Wait
if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }

# 3. Capture 1xBet Portal with Trailer Banner
$out1xTrailer = "$base\gold_rush_1xbet_trailer_banner.png"
$args1xTrailer = "--headless --no-sandbox --disable-gpu --virtual-time-budget=4000 --window-size=1280,1050 --screenshot=`"$out1xTrailer`" `"http://localhost:8080/en/casino-search?game=71040`""
Start-Process -FilePath $edge -ArgumentList $args1xTrailer -Wait

Write-Host "Auto-launched Trailer: $((Get-Item $outTrailerAuto).Length) bytes"
Write-Host "Trailer Chapter 2: $((Get-Item $outTrailerCh2).Length) bytes"
Write-Host "1xBet Portal Trailer Banner: $((Get-Item $out1xTrailer).Length) bytes"
