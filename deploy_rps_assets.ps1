$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets/games/rps directory..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/rps"

Write-Host "Uploading realistic RPS graphics..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\games\rps\* "${server}:${baseRemote}/assets/games/rps/"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/rps && chmod 644 ${baseRemote}/assets/games/rps/*"

Write-Host "Verifying uploaded assets..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/rps"
