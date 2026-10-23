$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Ensuring remote directory ${baseRemote}/assets/games/limbo exists..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/limbo ${baseRemote}/games"

Write-Host "Uploading jili_wordmark_tight.png..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\games\limbo\jili_wordmark_tight.png "${server}:${baseRemote}/assets/games/limbo/"

Write-Host "Uploading JILI loading screen and updated games..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\jili_loading_screen.html "${server}:${baseRemote}/games/jili_loading_screen.html"
scp.exe -o StrictHostKeyChecking=no games\limbo.html "${server}:${baseRemote}/games/limbo.html"
scp.exe -o StrictHostKeyChecking=no games\fortune-gems-2.html "${server}:${baseRemote}/games/fortune-gems-2.html"
scp.exe -o StrictHostKeyChecking=no games\fortunegems2.html "${server}:${baseRemote}/games/fortunegems2.html"
scp.exe -o StrictHostKeyChecking=no games\fortune_gems_2.html "${server}:${baseRemote}/games/fortune_gems_2.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/games/jili_loading_screen.html ${baseRemote}/games/limbo.html ${baseRemote}/games/fortune*.html ${baseRemote}/assets/games/limbo/jili_wordmark_tight.png && chmod 644 ${baseRemote}/games/jili_loading_screen.html ${baseRemote}/games/limbo.html ${baseRemote}/games/fortune*.html ${baseRemote}/assets/games/limbo/jili_wordmark_tight.png"

Write-Host "Verifying remote deployment..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/games/jili_loading_screen.html ${baseRemote}/games/limbo.html ${baseRemote}/games/fortune-gems-2.html"

Write-Host "JILI Loading Screen & Games Deployment Completed Successfully!" -ForegroundColor Green
