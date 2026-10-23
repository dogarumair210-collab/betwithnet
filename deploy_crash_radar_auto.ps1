$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading admin.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin.html "${server}:${baseRemote}/admin.html"

Write-Host "Uploading admin/crash-control.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin\crash-control.html "${server}:${baseRemote}/admin/crash-control.html"

Write-Host "Uploading js/admin.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\admin.js "${server}:${baseRemote}/js/admin.js"

Write-Host "Uploading js/admin_config.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\admin_config.js "${server}:${baseRemote}/js/admin_config.js"

Write-Host "Uploading games/crash.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\crash.html "${server}:${baseRemote}/games/crash.html"

Write-Host "Uploading js/games/crash.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\crash.js "${server}:${baseRemote}/js/games/crash.js"

Write-Host "Uploading api/games.php..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no api\games.php "${server}:${baseRemote}/api/games.php"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/admin.html ${baseRemote}/admin/crash-control.html ${baseRemote}/js/admin.js ${baseRemote}/js/admin_config.js ${baseRemote}/games/crash.html ${baseRemote}/js/games/crash.js ${baseRemote}/api/games.php && chmod 644 ${baseRemote}/admin.html ${baseRemote}/admin/crash-control.html ${baseRemote}/js/admin.js ${baseRemote}/js/admin_config.js ${baseRemote}/games/crash.html ${baseRemote}/js/games/crash.js ${baseRemote}/api/games.php && echo 'RADAR_LIVE_CONNECT_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
