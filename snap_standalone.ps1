$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$url = "http://localhost:8080/gold_rush_template/standalone_game/index.html"
$outShot = "c:\Users\as\Desktop\bet with net\standalone_test.png"

$proc = Start-Process -FilePath $edgePath -ArgumentList "--headless", "--disable-gpu", "--window-size=1100,750", "--screenshot=""$outShot""", $url -PassThru
$proc.WaitForExit(10000)
Start-Sleep -Seconds 2

if (Test-Path $outShot) {
    Write-Output "Screenshot saved: $((Get-Item $outShot).Length) bytes"
} else {
    Write-Output "Failed"
}
