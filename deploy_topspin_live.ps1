$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/topspin.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\topspin.html "${server}:${baseRemote}/games/topspin.html"

Write-Host "Uploading js/games/topspin.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\topspin.js "${server}:${baseRemote}/js/games/topspin.js"

Write-Host "Uploading assets/audio/topspin_bgm.mp3..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\audio\topspin_bgm.mp3 "${server}:${baseRemote}/assets/audio/topspin_bgm.mp3"

Write-Host "Uploading assets/audio/topspin_lounge.mp3..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\audio\topspin_lounge.mp3 "${server}:${baseRemote}/assets/audio/topspin_lounge.mp3"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/topspin.html ${baseRemote}/js/games/topspin.js ${baseRemote}/assets/audio/topspin_*.mp3 && chmod 644 ${baseRemote}/games/topspin.html ${baseRemote}/js/games/topspin.js ${baseRemote}/assets/audio/topspin_*.mp3 && echo 'DEPLOY_TOPSPIN_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $cmd

Write-Host "Deployment completed successfully!" -ForegroundColor Green
