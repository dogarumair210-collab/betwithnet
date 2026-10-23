$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\scratch\live_game_shot.png'
$url = 'https://betwithnet.com/games/teenpatti.html'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=8000 --window-size=430,932 --screenshot=`"$out`" `"$url`""
Write-Host "Capturing screenshot of $url..."
Start-Process -FilePath $edge -ArgumentList $args -Wait
if (Test-Path $out) {
    Write-Host "Screenshot captured successfully: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Screenshot failed"
}
