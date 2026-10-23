$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets/games/russian_roulette directory..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/russian_roulette/audio"

Write-Host "Uploading Russian Roulette assets..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no -r assets\games\russian_roulette\* "${server}:${baseRemote}/assets/games/russian_roulette/"

Write-Host "Uploading games/russian_roulette.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\russian_roulette.html "${server}:${baseRemote}/games/russian_roulette.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/russian_roulette ${baseRemote}/games/russian_roulette.html && chmod -R 755 ${baseRemote}/assets/games/russian_roulette && chmod 644 ${baseRemote}/games/russian_roulette.html"

Write-Host "Verifying uploaded assets..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/russian_roulette"

Write-Host "Russian Roulette VIP Deployment Completed Successfully!" -ForegroundColor Green
