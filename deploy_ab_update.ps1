$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/andarbahar.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\andarbahar.html "${server}:${baseRemote}/games/andarbahar.html"

Write-Host "Uploading games/ab_engine/index.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\ab_engine\index.html "${server}:${baseRemote}/games/ab_engine/index.html"

Write-Host "Uploading games/ab_engine/lobby/config.json..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\ab_engine\lobby\config.json "${server}:${baseRemote}/games/ab_engine/lobby/config.json"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/games/andarbahar.html ${baseRemote}/games/ab_engine/index.html ${baseRemote}/games/ab_engine/lobby/config.json && chmod 644 ${baseRemote}/games/andarbahar.html ${baseRemote}/games/ab_engine/index.html ${baseRemote}/games/ab_engine/lobby/config.json"

Write-Host "Deployment completed successfully!" -ForegroundColor Green
