$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/scratch.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\scratch.html "${server}:${baseRemote}/games/scratch.html"

Write-Host "Uploading assets/covers/scratch.png to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\scratch.png "${server}:${baseRemote}/assets/covers/scratch.png"

Write-Host "Uploading index.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"

Write-Host "Uploading casino.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Uploading js/app.js to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\app.js "${server}:${baseRemote}/js/app.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/scratch.html ${baseRemote}/assets/covers/scratch.png ${baseRemote}/index.html ${baseRemote}/casino.html ${baseRemote}/js/app.js && chmod 644 ${baseRemote}/games/scratch.html ${baseRemote}/assets/covers/scratch.png ${baseRemote}/index.html ${baseRemote}/casino.html ${baseRemote}/js/app.js && echo 'SCRATCH_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
