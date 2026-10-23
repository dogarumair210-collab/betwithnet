$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path
$out = "$base\gold_rush_trailer_active.png"

$tmpHtml = "$base\gold_rush_template\standalone_game\test_trailer_active.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw
# Replace splash display:none and immediately trigger trailer slide 2
$injected = $content -replace '<div class="splash-trailer-overlay" id="splashTrailer">', '<div class="splash-trailer-overlay" id="splashTrailer" style="display:none;">'
$injected = $injected -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) { window.goldRushGame.openCinematicTrailer(); window.goldRushGame.goToTrailerSlide(2); } }, 300); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$url = 'http://localhost:8080/gold_rush_template/standalone_game/test_trailer_active.html'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2000 --window-size=1280,720 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }
Write-Host "Trailer Active Screenshot: $((Get-Item $out).Length) bytes"
