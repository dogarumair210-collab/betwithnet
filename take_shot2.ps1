$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path .).Path + '\test_teenpatti_5s.png'
$url = 'file:///' + ((Resolve-Path 'games\teenpatti.html').Path -replace '\\', '/')
# Start edge in background, wait 4 seconds, take screenshot
$proc = Start-Process -FilePath $edge -ArgumentList "--headless --no-sandbox --disable-gpu --window-size=450,900 --screenshot=`"$out`" `"$url`"" -PassThru
Start-Sleep -Seconds 4
if (Test-Path $out) {
    Write-Host "Screenshot captured successfully: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Screenshot failed"
}
