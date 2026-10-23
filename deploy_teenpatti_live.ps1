$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/teenpatti.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\teenpatti.html "${server}:${baseRemote}/games/teenpatti.html"

Write-Host "Uploading covers..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\teenpatti.png "${server}:${baseRemote}/assets/covers/teenpatti.png"
scp.exe -o StrictHostKeyChecking=no assets\covers\teenpatti_versus.jpg "${server}:${baseRemote}/assets/covers/teenpatti_versus.jpg"

Write-Host "Uploading index.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"

Write-Host "Uploading casino.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Creating remote teenpatti assets directory..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/teenpatti"

Write-Host "Uploading live dealer images..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\games\teenpatti\dealer_priya_*.jpg "${server}:${baseRemote}/assets/games/teenpatti/"
scp.exe -o StrictHostKeyChecking=no assets\covers\dealer_priya_*.jpg "${server}:${baseRemote}/assets/covers/"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/teenpatti.html ${baseRemote}/assets/games/teenpatti ${baseRemote}/assets/covers/teenpatti.png ${baseRemote}/assets/covers/teenpatti_versus.jpg ${baseRemote}/assets/covers/dealer_priya*.jpg ${baseRemote}/index.html ${baseRemote}/casino.html && chmod -R 755 ${baseRemote}/assets/games/teenpatti && chmod 644 ${baseRemote}/games/teenpatti.html ${baseRemote}/assets/covers/teenpatti.png ${baseRemote}/assets/covers/teenpatti_versus.jpg ${baseRemote}/assets/covers/dealer_priya*.jpg ${baseRemote}/index.html ${baseRemote}/casino.html && echo 'TEENPATTI_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
