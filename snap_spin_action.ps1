$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path

$outSpin = "$base\gold_rush_spin_action.png"
$tmpHtml = "$base\gold_rush_template\standalone_game\test_spin_view.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw -Encoding UTF8
$injected = $content -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) window.goldRushGame.spin(); }, 600); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$argsSpin = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2800 --window-size=1280,720 --screenshot=`"$outSpin`" `"http://localhost:8080/gold_rush_template/standalone_game/test_spin_view.html`""
Start-Process -FilePath $edge -ArgumentList $argsSpin -Wait

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }
Write-Host "Spin action screenshot: $((Get-Item $outSpin).Length) bytes"
