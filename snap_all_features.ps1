$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

# 1. Capture Game Cabinet with lantern, lizard, and buttons
$outCabinet = "$base\gold_rush_cabinet_all_features.png"
$argsCabinet = "--headless --no-sandbox --disable-gpu --virtual-time-budget=3500 --window-size=1280,720 --screenshot=`"$outCabinet`" `"http://localhost:8080/gold_rush_template/standalone_game/index.html`""
Start-Process -FilePath $edge -ArgumentList $argsCabinet -Wait

# 2. Capture Paytable & Rules Modal
$outPaytable = "$base\gold_rush_paytable_modal.png"
$tmpHtml = "$base\gold_rush_template\standalone_game\test_paytable_view.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw -Encoding UTF8
$injected = $content -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { const m = document.getElementById('paytableModal'); if (m) m.style.display = 'flex'; }, 600); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$argsPaytable = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2500 --window-size=1280,720 --screenshot=`"$outPaytable`" `"http://localhost:8080/gold_rush_template/standalone_game/test_paytable_view.html`""
Start-Process -FilePath $edge -ArgumentList $argsPaytable -Wait

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }

# 3. Capture 1xBet Portal with all features
$out1x = "$base\gold_rush_1xbet_all_features.png"
$args1x = "--headless --no-sandbox --disable-gpu --virtual-time-budget=4000 --window-size=1280,840 --screenshot=`"$out1x`" `"http://localhost:8080/en/casino-search?game=71040`""
Start-Process -FilePath $edge -ArgumentList $args1x -Wait

Write-Host "Cabinet: $((Get-Item $outCabinet).Length) bytes"
Write-Host "Paytable: $((Get-Item $outPaytable).Length) bytes"
Write-Host "1xBet: $((Get-Item $out1x).Length) bytes"
