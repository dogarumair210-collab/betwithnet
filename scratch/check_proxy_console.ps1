$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'https://betwithnet.com/games/proxy_jili_test.php'
$userDir = "$((Resolve-Path .).Path)\scratch\edge_temp_profile"
$logFile = "$((Resolve-Path .).Path)\scratch\edge_chrome_debug.log"

Remove-Item -Recurse -Force $userDir -ErrorAction SilentlyContinue
Remove-Item -Force $logFile -ErrorAction SilentlyContinue

$argList = @(
    '--headless=new',
    '--disable-gpu',
    "--user-data-dir=$userDir",
    '--enable-logging',
    '--v=1',
    "--log-file=$logFile",
    '--virtual-time-budget=10000',
    $url
)

$proc = Start-Process -FilePath $edge -ArgumentList $argList -PassThru
Start-Sleep -Seconds 12
if (!$proc.HasExited) { Stop-Process -Id $proc.Id -Force }

if (Test-Path $logFile) {
    Write-Host "Log file exists ($((Get-Item $logFile).Length) bytes)"
    Get-Content $logFile -Tail 30 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "No log file found"
}
