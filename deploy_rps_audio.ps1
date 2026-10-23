$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets/games/rps/audio directory..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/games/rps/audio"

Write-Host "Uploading RPS audio assets..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\games\rps\audio\* "${server}:${baseRemote}/assets/games/rps/audio/"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/rps/audio && chmod 644 ${baseRemote}/assets/games/rps/audio/*"

Write-Host "Verifying uploaded audio..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/rps/audio"
