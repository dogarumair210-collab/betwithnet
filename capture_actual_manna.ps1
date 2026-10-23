$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\manna_actual_game.png'
$url = 'https://cors.mannagaming.com/games/MEGA_7042?lan=en-us&brand=manna'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=6000 --window-size=1280,800 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait
if (Test-Path $out) {
    Write-Host "Screenshot captured successfully: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Screenshot failed"
}
