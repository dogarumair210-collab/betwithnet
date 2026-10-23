$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path 'scratch').Path + '\proxy_jili_snap.png'
$url = 'https://betwithnet.com/games/proxy_jili_test.php'
$argList = @('--headless=new', '--disable-gpu', '--window-size=1280,820', "--screenshot=$out", $url)
Start-Process -FilePath $edge -ArgumentList $argList -Wait
if (Test-Path $out) {
    Write-Host "Snapshot taken: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Failed to capture"
}
