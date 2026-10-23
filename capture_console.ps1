$edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
    $edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
$logFile = "$PSScriptRoot\chrome_debug.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

$proc = Start-Process -FilePath $edge -ArgumentList "--headless=new", "--enable-logging=stderr", "--v=1", "--disable-gpu", "https://betwithnet.com/games/chicken_rush.html" -RedirectStandardError $logFile -PassThru -NoNewWindow
Start-Sleep -Seconds 8
if (-not $proc.HasExited) {
    Stop-Process -Id $proc.Id -Force
}

Write-Host "Edge debug log length:" (Get-Item $logFile).Length
Get-Content $logFile | Select-String -Pattern "CONSOLE|Error|error|bundle|loader|chicken" | Select-Object -First 40
