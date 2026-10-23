$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/rps.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\rps.html "${server}:${baseRemote}/games/rps.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/games/rps.html && chmod 644 ${baseRemote}/games/rps.html"

Write-Host "Verifying remote rps.html..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "head -n 20 ${baseRemote}/games/rps.html"

Write-Host "RPS VIP Deployment Completed Successfully!" -ForegroundColor Green
