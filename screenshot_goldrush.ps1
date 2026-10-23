$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$url = "http://localhost:8080/en/casino-search?game=71040"
$outShot = "c:\Users\as\Desktop\bet with net\gold_rush_preview.png"

& $edgePath --headless --disable-gpu --window-size=1280,800 --screenshot=$outShot $url
Start-Sleep -Seconds 3

if (Test-Path $outShot) {
    Write-Output "Screenshot captured: $outShot ($((Get-Item $outShot).Length) bytes)"
} else {
    Write-Output "Screenshot failed"
}
