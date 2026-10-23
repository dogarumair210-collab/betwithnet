$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Deploying calibrated game JS files (30% Win / 70% Loss)..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\penalty.js "${server}:${baseRemote}/js/games/penalty.js"
scp.exe -o StrictHostKeyChecking=no js\games\crash.js "${server}:${baseRemote}/js/games/crash.js"
scp.exe -o StrictHostKeyChecking=no js\games\space_xy.js "${server}:${baseRemote}/js/games/space_xy.js"
scp.exe -o StrictHostKeyChecking=no js\games\mines.js "${server}:${baseRemote}/js/games/mines.js"
scp.exe -o StrictHostKeyChecking=no js\games\limbo.js "${server}:${baseRemote}/js/games/limbo.js"
scp.exe -o StrictHostKeyChecking=no js\games\slots.js "${server}:${baseRemote}/js/games/slots.js"
scp.exe -o StrictHostKeyChecking=no js\games\fortunegems2.js "${server}:${baseRemote}/js/games/fortunegems2.js"
scp.exe -o StrictHostKeyChecking=no js\games\topspin.js "${server}:${baseRemote}/js/games/topspin.js"
scp.exe -o StrictHostKeyChecking=no js\games\lucky.js "${server}:${baseRemote}/js/games/lucky.js"

Write-Host "Deploying calibrated game HTML files (30% Win / 70% Loss)..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\coinflip.html "${server}:${baseRemote}/games/coinflip.html"
scp.exe -o StrictHostKeyChecking=no games\dice.html "${server}:${baseRemote}/games/dice.html"
scp.exe -o StrictHostKeyChecking=no games\treasure_chest.html "${server}:${baseRemote}/games/treasure_chest.html"
scp.exe -o StrictHostKeyChecking=no games\scratch.html "${server}:${baseRemote}/games/scratch.html"
scp.exe -o StrictHostKeyChecking=no games\cups.html "${server}:${baseRemote}/games/cups.html"
scp.exe -o StrictHostKeyChecking=no games\rps.html "${server}:${baseRemote}/games/rps.html"
scp.exe -o StrictHostKeyChecking=no games\color.html "${server}:${baseRemote}/games/color.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown -R betwi4261:betwi4261 ${baseRemote}/js/games ${baseRemote}/games && chmod 644 ${baseRemote}/js/games/*.js ${baseRemote}/games/*.html && echo 'DEPLOY_WIN_RATES_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

Write-Host "All games successfully calibrated and deployed live!" -ForegroundColor Green
