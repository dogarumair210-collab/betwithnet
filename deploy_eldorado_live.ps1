$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/eldorado.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\eldorado.html "${server}:${baseRemote}/games/eldorado.html"

Write-Host "Uploading js/games/eldorado.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\games\eldorado.js "${server}:${baseRemote}/js/games/eldorado.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && chmod 644 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && echo 'DEPLOY_ELDORADO_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $cmd

Write-Host "Deployment of El Dorado completed successfully!" -ForegroundColor Green
