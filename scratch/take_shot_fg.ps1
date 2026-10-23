$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path 'scratch').Path + '\fg2.png'
$url = 'http://localhost:3000/games/fortunegems2.html'
$argList = @('--headless=new', '--disable-gpu', '--window-size=430,920', "--screenshot=$out", $url)
Start-Process -FilePath $edge -ArgumentList $argList -Wait
if (Test-Path $out) {
    Write-Host "SUCCESS: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "FAILED"
}
