$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$out = (Resolve-Path 'scratch').Path + '\real_1xbet_98308.png'
$url = 'https://1x-betpk.mobi/en/slots/game/98308/fortune-gems-2'
$argList = @('--headless=new', '--disable-gpu', '--window-size=1280,820', "--screenshot=$out", $url)
Start-Process -FilePath $edge -ArgumentList $argList -Wait
if (Test-Path $out) {
    Write-Host "Real 1xbet captured: $((Get-Item $out).Length) bytes"
} else {
    Write-Host "Failed to capture"
}
