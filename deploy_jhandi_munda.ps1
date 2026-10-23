$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets/games/jhandi_munda directories..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/jhandi_munda/images ${baseRemote}/assets/games/jhandi_munda/audio ${baseRemote}/js/games"

Write-Host "Uploading Jhandi Munda assets (images & audio)..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no -r assets\games\jhandi_munda\* "${server}:${baseRemote}/assets/games/jhandi_munda/"

Write-Host "Uploading games/jhandi_munda.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\jhandi_munda.html "${server}:${baseRemote}/games/jhandi_munda.html"

Write-Host "Uploading js/games/jhandi_munda.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\jhandi_munda.js "${server}:${baseRemote}/js/games/jhandi_munda.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/jhandi_munda ${baseRemote}/games/jhandi_munda.html ${baseRemote}/js/games/jhandi_munda.js && chmod -R 755 ${baseRemote}/assets/games/jhandi_munda && chmod 644 ${baseRemote}/games/jhandi_munda.html ${baseRemote}/js/games/jhandi_munda.js"

Write-Host "Verifying uploaded assets..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/jhandi_munda/images ${baseRemote}/assets/games/jhandi_munda/audio"

Write-Host "Jhandi Munda JILI VIP Deployment Completed Successfully!" -ForegroundColor Green
