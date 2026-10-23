$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$outShot = "C:\Users\as\.gemini\antigravity\brain\12393978-64ab-4097-baa6-a44891b13251\safecracker_compact_preview.png"
$url = "file:///c:/Users/as/Desktop/bet%20with%20net/games/safecracker.html"

Start-Process -FilePath $edgePath -ArgumentList @("--headless", "--disable-gpu", "--window-size=1280,920", "--screenshot=$outShot", $url) -Wait
Start-Sleep -Seconds 2

if (Test-Path $outShot) {
    Write-Output "SUCCESS: $((Get-Item $outShot).Length) bytes"
} else {
    Write-Output "FAILED"
}
