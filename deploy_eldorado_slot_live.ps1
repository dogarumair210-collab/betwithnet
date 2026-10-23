$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/eldorado.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\eldorado.html "${server}:${baseRemote}/games/eldorado.html"

Write-Host "Uploading js/games/eldorado.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\eldorado.js "${server}:${baseRemote}/js/games/eldorado.js"

Write-Host "Uploading casino.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Uploading index.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js ${baseRemote}/casino.html ${baseRemote}/index.html && chmod 644 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js ${baseRemote}/casino.html ${baseRemote}/index.html && ls -la ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && echo 'DEPLOY_ELDORADO_SLOT_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $cmd

Write-Host "El Dorado Slot Deployed Successfully!" -ForegroundColor Green
