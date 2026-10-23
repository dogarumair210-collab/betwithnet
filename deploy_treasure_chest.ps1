$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets/games/treasure_chest directories..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/treasure_chest/images ${baseRemote}/assets/games/treasure_chest/audio ${baseRemote}/js/games"

Write-Host "Uploading Treasure Chest assets (images & audio)..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no -r assets\games\treasure_chest\* "${server}:${baseRemote}/assets/games/treasure_chest/"

Write-Host "Uploading games/treasure_chest.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\treasure_chest.html "${server}:${baseRemote}/games/treasure_chest.html"

Write-Host "Uploading js/games/treasure_chest.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\treasure_chest.js "${server}:${baseRemote}/js/games/treasure_chest.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/treasure_chest ${baseRemote}/games/treasure_chest.html ${baseRemote}/js/games/treasure_chest.js && chmod -R 755 ${baseRemote}/assets/games/treasure_chest && chmod 644 ${baseRemote}/games/treasure_chest.html"

Write-Host "Verifying uploaded assets..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/treasure_chest/images ${baseRemote}/assets/games/treasure_chest/audio"

Write-Host "Treasure Chest VIP Deployment Completed Successfully!" -ForegroundColor Green
