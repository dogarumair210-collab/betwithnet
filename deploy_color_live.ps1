$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading assets/covers/color.png to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\color.png "${server}:${baseRemote}/assets/covers/color.png"

Write-Host "Uploading games/color.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\color.html "${server}:${baseRemote}/games/color.html"

Write-Host "Uploading games/scratch.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\scratch.html "${server}:${baseRemote}/games/scratch.html"

Write-Host "Uploading index.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"

Write-Host "Uploading casino.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/assets/covers/color.png ${baseRemote}/games/color.html ${baseRemote}/games/scratch.html ${baseRemote}/index.html ${baseRemote}/casino.html && chmod 644 ${baseRemote}/assets/covers/color.png ${baseRemote}/games/color.html ${baseRemote}/games/scratch.html ${baseRemote}/index.html ${baseRemote}/casino.html && echo 'COLOR_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
