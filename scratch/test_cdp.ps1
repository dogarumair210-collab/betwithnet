$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$port = 9222
$userDir = "$((Resolve-Path .).Path)\scratch\edge_cdp_profile"
Remove-Item -Recurse -Force $userDir -ErrorAction SilentlyContinue

$argList = @(
    '--headless=new',
    "--remote-debugging-port=$port",
    "--user-data-dir=$userDir",
    'http://localhost:3000/games/fg2_engine/index.html'
)

$proc = Start-Process -FilePath $edge -ArgumentList $argList -PassThru
Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:$port/json" -TimeoutSec 5
    Write-Host "Open tabs: $($tabs.Count)"
    $wsUrl = $tabs[0].webSocketDebuggerUrl
    Write-Host "WS URL: $wsUrl"
} catch {
    Write-Host "Could not connect to CDP: $_"
}

if (!$proc.HasExited) { Stop-Process -Id $proc.Id -Force }
