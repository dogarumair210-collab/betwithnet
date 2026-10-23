$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets directory..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/safecracker/audio"

Write-Host "Uploading safecracker assets..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\safecracker.* "${server}:${baseRemote}/assets/covers/"
scp.exe -o StrictHostKeyChecking=no assets\games\safecracker\*.* "${server}:${baseRemote}/assets/games/safecracker/"
scp.exe -o StrictHostKeyChecking=no assets\games\safecracker\audio\*.* "${server}:${baseRemote}/assets/games/safecracker/audio/"

Write-Host "Uploading js/games/safecracker.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\safecracker.js "${server}:${baseRemote}/js/games/safecracker.js"

Write-Host "Uploading games/safecracker.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\safecracker.html "${server}:${baseRemote}/games/safecracker.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/safecracker.html ${baseRemote}/js/games/safecracker.js ${baseRemote}/assets/covers/safecracker.* ${baseRemote}/assets/games/safecracker && chmod -R 755 ${baseRemote}/assets/games/safecracker && chmod 644 ${baseRemote}/games/safecracker.html ${baseRemote}/js/games/safecracker.js ${baseRemote}/assets/covers/safecracker.* ${baseRemote}/assets/games/safecracker/*.* ${baseRemote}/assets/games/safecracker/audio/*.* && echo 'DEPLOY_SAFECRACKER_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

Write-Host "Deployment of Safe Cracker to https://betwithnet.com/games/safecracker.html completed!" -ForegroundColor Green
