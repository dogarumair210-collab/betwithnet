$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\real_1xbet_71040.png'
$url = 'https://1x-betpk.mobi/en/casino-search?game=71040'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=10000 --window-size=1280,820 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait
if (Test-Path $out) {
    Write-Host "Real 1xbet captured: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Failed to capture real 1xbet"
}
