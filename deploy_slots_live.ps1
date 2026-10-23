$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading js/games/slots.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\slots.js "${server}:${baseRemote}/js/games/slots.js"

Write-Host "Uploading games/slots.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\slots.html "${server}:${baseRemote}/games/slots.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/js/games/slots.js ${baseRemote}/games/slots.html && chmod 644 ${baseRemote}/js/games/slots.js ${baseRemote}/games/slots.html"

Write-Host "Verifying remote deployment..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/js/games/slots.js ${baseRemote}/games/slots.html"

Write-Host "Lucky 777 Slots Economy Update Deployed Successfully!" -ForegroundColor Green
