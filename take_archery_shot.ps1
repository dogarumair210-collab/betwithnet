$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$outShot = "C:\Users\as\.gemini\antigravity\brain\12393978-64ab-4097-baa6-a44891b13251\archery_live_preview.png"
$url = "https://betwithnet.com/games/archery.html"

Start-Process -FilePath $edgePath -ArgumentList @("--headless", "--disable-gpu", "--virtual-time-budget=4000", "--window-size=1280,920", "--screenshot=$outShot", $url) -Wait
Start-Sleep -Seconds 1

if (Test-Path $outShot) {
    Write-Output "SUCCESS: $((Get-Item $outShot).Length) bytes"
} else {
    Write-Output "FAILED"
}
