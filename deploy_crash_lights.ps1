$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading js/games/crash.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\crash.js "${server}:${baseRemote}/js/games/crash.js"

Write-Host "Uploading games/crash.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\crash.html "${server}:${baseRemote}/games/crash.html"

Write-Host "Uploading scratch/aviator_background_lights.html to aviator_lights.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no scratch\aviator_background_lights.html "${server}:${baseRemote}/aviator_lights.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/js/games/crash.js ${baseRemote}/games/crash.html ${baseRemote}/aviator_lights.html && chmod 644 ${baseRemote}/js/games/crash.js ${baseRemote}/games/crash.html ${baseRemote}/aviator_lights.html"

Write-Host "Verifying remote deployment..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/js/games/crash.js ${baseRemote}/games/crash.html ${baseRemote}/aviator_lights.html"

Write-Host "Aviator Background Neon Lights Deployed Successfully!" -ForegroundColor Green
