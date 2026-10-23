$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Deploying Limbo Turbo win rate reduction (6% Win / 94% House Edge)..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\limbo.html "${server}:${baseRemote}/games/limbo.html"
scp.exe -o StrictHostKeyChecking=no js\games\limbo.js "${server}:${baseRemote}/js/games/limbo.js"
scp.exe -o StrictHostKeyChecking=no js\admin_config.js "${server}:${baseRemote}/js/admin_config.js"
scp.exe -o StrictHostKeyChecking=no js\admin.js "${server}:${baseRemote}/js/admin.js"
scp.exe -o StrictHostKeyChecking=no admin\game-rates.html "${server}:${baseRemote}/admin/game-rates.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown betwi4261:betwi4261 ${baseRemote}/games/limbo.html ${baseRemote}/js/games/limbo.js ${baseRemote}/js/admin_config.js ${baseRemote}/js/admin.js ${baseRemote}/admin/game-rates.html && chmod 644 ${baseRemote}/games/limbo.html ${baseRemote}/js/games/limbo.js ${baseRemote}/js/admin_config.js ${baseRemote}/js/admin.js ${baseRemote}/admin/game-rates.html && echo 'DEPLOY_LIMBO_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

Write-Host "Limbo Turbo win rate successfully reduced and deployed live!" -ForegroundColor Green
