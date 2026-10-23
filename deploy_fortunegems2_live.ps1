$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote directories if not exist..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/games ${baseRemote}/css/games ${baseRemote}/js/games ${baseRemote}/assets/covers ${baseRemote}/assets/games/fortunegems ${baseRemote}/assets/games/fortunegems/audio"

Write-Host "Uploading HTML files..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\fortunegems2.html "${server}:${baseRemote}/games/fortunegems2.html"
scp.exe -o StrictHostKeyChecking=no games\fortune-gems-2.html "${server}:${baseRemote}/games/fortune-gems-2.html"
scp.exe -o StrictHostKeyChecking=no games\fortune_gems_2.html "${server}:${baseRemote}/games/fortune_gems_2.html"

Write-Host "Uploading CSS and JS..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no css\games\fortunegems2.css "${server}:${baseRemote}/css/games/fortunegems2.css"
scp.exe -o StrictHostKeyChecking=no js\games\fortunegems2.js "${server}:${baseRemote}/js/games/fortunegems2.js"

Write-Host "Uploading Cover..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\fortunegems2.png "${server}:${baseRemote}/assets/covers/fortunegems2.png"

Write-Host "Uploading fortunegems assets..." -ForegroundColor Cyan
scp.exe -r -o StrictHostKeyChecking=no assets\games\fortunegems "${server}:${baseRemote}/assets/games/"

Write-Host "Uploading index.html and casino.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/fortune* ${baseRemote}/css/games/fortunegems2.css ${baseRemote}/js/games/fortunegems2.js ${baseRemote}/assets/covers/fortunegems2.png ${baseRemote}/assets/games/fortunegems ${baseRemote}/index.html ${baseRemote}/casino.html && chmod -R 755 ${baseRemote}/assets/games/fortunegems && chmod 644 ${baseRemote}/games/fortune* ${baseRemote}/css/games/fortunegems2.css ${baseRemote}/js/games/fortunegems2.js ${baseRemote}/assets/covers/fortunegems2.png ${baseRemote}/index.html ${baseRemote}/casino.html && echo 'DEPLOY_FORTUNEGEMS2_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
