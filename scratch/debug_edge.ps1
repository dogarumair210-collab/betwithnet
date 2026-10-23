$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'http://localhost:3000/games/fg2_engine/index.html'
$userDir = "$((Resolve-Path .).Path)\scratch\edge_debug_profile"
$logFile = "$((Resolve-Path .).Path)\scratch\edge_console_output.log"

Remove-Item -Recurse -Force $userDir -ErrorAction SilentlyContinue
Remove-Item -Force $logFile -ErrorAction SilentlyContinue

$argList = @(
    '--headless=new',
    '--disable-gpu',
    "--user-data-dir=$userDir",
    '--enable-logging=stderr',
    '--v=1',
    "--log-file=$logFile",
    '--virtual-time-budget=10000',
    $url
)

$proc = Start-Process -FilePath $edge -ArgumentList $argList -PassThru
Start-Sleep -Seconds 8
if (!$proc.HasExited) { Stop-Process -Id $proc.Id -Force }

if (Test-Path $logFile) {
    Get-Content $logFile -Tail 100
} else {
    Write-Host "No log file generated"
}
