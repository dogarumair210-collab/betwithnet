$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote directories..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/games ${baseRemote}/assets/covers ${baseRemote}/assets/games/andarbahar"

Write-Host "Uploading games/andarbahar.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\andarbahar.html "${server}:${baseRemote}/games/andarbahar.html"

Write-Host "Uploading cover art..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\andarbahar.jpg "${server}:${baseRemote}/assets/covers/andarbahar.jpg"
if (Test-Path "assets\covers\andarbahar.webp") {
    scp.exe -o StrictHostKeyChecking=no assets\covers\andarbahar.webp "${server}:${baseRemote}/assets/covers/andarbahar.webp"
}

Write-Host "Uploading assets/games/andarbahar..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no -r assets\games\andarbahar\* "${server}:${baseRemote}/assets/games/andarbahar/"

Write-Host "Uploading index.html and casino.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/andarbahar.html ${baseRemote}/assets/covers/andarbahar.* ${baseRemote}/assets/games/andarbahar ${baseRemote}/index.html ${baseRemote}/casino.html && chmod 644 ${baseRemote}/games/andarbahar.html ${baseRemote}/assets/covers/andarbahar.* ${baseRemote}/assets/games/andarbahar/* ${baseRemote}/index.html ${baseRemote}/casino.html && echo 'DEPLOY_ANDARBAHAR_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
Write-Host "Deployment Completed Successfully!" -ForegroundColor Green
