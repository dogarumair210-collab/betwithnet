$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "http://localhost:8080/en/casino-search?game=71040"
$outShot = "c:\Users\as\Desktop\bet with net\gold_rush_portal_final.png"

$proc = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--window-size=1280,820", "--screenshot=""$outShot""", $url -PassThru
$proc.WaitForExit(10000)
Start-Sleep -Seconds 2

if (Test-Path $outShot) {
    Write-Output "Screenshot saved: $((Get-Item $outShot).Length) bytes"
} else {
    Write-Output "Failed"
}
