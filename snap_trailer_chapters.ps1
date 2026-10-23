$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path
$out1 = "$base\gold_rush_trailer_ch1_solid.png"
$out4 = "$base\gold_rush_trailer_ch4_bombs.png"

$tmpHtml = "$base\gold_rush_template\standalone_game\test_trailer_snap.html"
$content = Get-Content "$base\gold_rush_template\standalone_game\index.html" -Raw
$injected = $content -replace '<div class="splash-trailer-overlay" id="splashTrailer">', '<div class="splash-trailer-overlay" id="splashTrailer" style="display:none;">'
$injected = $injected -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) { window.goldRushGame.openCinematicTrailer(); window.goldRushGame.goToTrailerSlide(1); } }, 300); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected -Encoding UTF8

$url = 'http://localhost:8080/gold_rush_template/standalone_game/test_trailer_snap.html'
$args1 = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2000 --window-size=1280,720 --screenshot=`"$out1`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args1 -Wait

# Chapter 4 snapshot
$injected4 = $content -replace '<div class="splash-trailer-overlay" id="splashTrailer">', '<div class="splash-trailer-overlay" id="splashTrailer" style="display:none;">'
$injected4 = $injected4 -replace "<\/body>", "<script>window.addEventListener('DOMContentLoaded', () => { setTimeout(() => { if (window.goldRushGame) { window.goldRushGame.openCinematicTrailer(); window.goldRushGame.goToTrailerSlide(4); } }, 300); });</script></body>"
Set-Content -Path $tmpHtml -Value $injected4 -Encoding UTF8

$args4 = "--headless --no-sandbox --disable-gpu --virtual-time-budget=2000 --window-size=1280,720 --screenshot=`"$out4`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args4 -Wait

if (Test-Path $tmpHtml) { Remove-Item $tmpHtml -Force }
Write-Host "Ch1 Shot: $((Get-Item $out1).Length) bytes"
Write-Host "Ch4 Shot: $((Get-Item $out4).Length) bytes"
