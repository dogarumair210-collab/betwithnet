$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/crash.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\crash.html "${server}:${baseRemote}/games/crash.html"

Write-Host "Uploading js/games/crash.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\crash.js "${server}:${baseRemote}/js/games/crash.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/crash.html ${baseRemote}/js/games/crash.js && chmod 644 ${baseRemote}/games/crash.html ${baseRemote}/js/games/crash.js && echo 'CRASH_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
