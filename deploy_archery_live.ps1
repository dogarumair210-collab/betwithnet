$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote archery directories..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/archery/audio"

Write-Host "Uploading archery assets..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\games\archery\*.* "${server}:${baseRemote}/assets/games/archery/"
scp.exe -o StrictHostKeyChecking=no assets\games\archery\audio\*.* "${server}:${baseRemote}/assets/games/archery/audio/"

Write-Host "Uploading js/games/archery.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\archery.js "${server}:${baseRemote}/js/games/archery.js"

Write-Host "Uploading games/archery.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\archery.html "${server}:${baseRemote}/games/archery.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/archery.html ${baseRemote}/js/games/archery.js ${baseRemote}/assets/games/archery && chmod -R 755 ${baseRemote}/assets/games/archery && chmod 644 ${baseRemote}/games/archery.html ${baseRemote}/js/games/archery.js ${baseRemote}/assets/games/archery/*.* ${baseRemote}/assets/games/archery/audio/*.* && echo 'DEPLOY_ARCHERY_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

Write-Host "Deployment of Archery to https://betwithnet.com/games/archery.html completed!" -ForegroundColor Green
