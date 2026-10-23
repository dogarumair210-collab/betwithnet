$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\gold_rush_verified.png'
$url = 'http://localhost:8080/en/casino-search?game=71040'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=4000 --window-size=1280,820 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait
if (Test-Path $out) {
    Write-Host "Screenshot captured successfully: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Screenshot failed"
}
