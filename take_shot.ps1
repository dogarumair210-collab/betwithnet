$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\test_teenpatti.png'
$url = 'file:///' + ((Resolve-Path 'games\teenpatti.html').Path -replace '\\', '/')
$args = "--headless --no-sandbox --disable-gpu --virtual-time-budget=3000 --window-size=450,900 --screenshot=`"$out`" `"$url`""
Start-Process -FilePath $edge -ArgumentList $args -Wait
if (Test-Path $out) {
    Write-Host "Screenshot captured successfully: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Screenshot failed"
}
