$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/teenpatti.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\teenpatti.html "${server}:${baseRemote}/games/teenpatti.html"

Write-Host "Uploading games/teenpatti_native_studio.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\teenpatti_native_studio.html "${server}:${baseRemote}/games/teenpatti_native_studio.html"

Write-Host "Setting live permissions..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/games/teenpatti.html ${baseRemote}/games/teenpatti_native_studio.html; chmod 644 ${baseRemote}/games/teenpatti.html ${baseRemote}/games/teenpatti_native_studio.html; echo 'ALL_TEENPATTI_DEPLOY_SUCCESS'"
