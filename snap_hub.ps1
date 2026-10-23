$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$base = (Resolve-Path .).Path
$out = "$base\gold_rush_hub.png"
$url = 'http://localhost:8080/gold-rush'
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=4000 --window-size=1280,820 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait
Write-Host "Gold Rush Hub Screenshot: $((Get-Item $out).Length) bytes"
