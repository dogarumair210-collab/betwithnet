$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote lobby directory..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/games/ab_engine/lobby"

Write-Host "Uploading config.json to remote lobby..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\ab_engine\lobby\config.json "${server}:${baseRemote}/games/ab_engine/lobby/config.json"

Write-Host "Setting permissions..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/games/ab_engine && chmod -R 755 ${baseRemote}/games/ab_engine && chmod 644 ${baseRemote}/games/ab_engine/lobby/config.json"

Write-Host "Remote lobby config.json content:" -ForegroundColor Yellow
ssh.exe -o StrictHostKeyChecking=no $server "cat ${baseRemote}/games/ab_engine/lobby/config.json"

Write-Host "Listing files in ab_engine:" -ForegroundColor Yellow
ssh.exe -o StrictHostKeyChecking=no $server "ls -la ${baseRemote}/games/ab_engine"
