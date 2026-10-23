$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote assets directory..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/assets/taoyuan"

Write-Host "Uploading bg-slide-1.webp..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\taoyuan\bg-slide-1.webp "${server}:${baseRemote}/assets/taoyuan/bg-slide-1.webp"

Write-Host "Uploading iphone.webp..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\taoyuan\iphone.webp "${server}:${baseRemote}/assets/taoyuan/iphone.webp"

Write-Host "Uploading taoyuan_logo.jpg..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\taoyuan\taoyuan_logo.jpg "${server}:${baseRemote}/assets/taoyuan/taoyuan_logo.jpg"

Write-Host "Uploading games/baccarat_squeeze.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\baccarat_squeeze.html "${server}:${baseRemote}/games/baccarat_squeeze.html"

Write-Host "Uploading games/taoyuan_baccarat.html to live server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\taoyuan_baccarat.html "${server}:${baseRemote}/games/taoyuan_baccarat.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/assets/taoyuan ${baseRemote}/games/baccarat_squeeze.html ${baseRemote}/games/taoyuan_baccarat.html && chmod -R 755 ${baseRemote}/assets/taoyuan && chmod 644 ${baseRemote}/games/baccarat_squeeze.html ${baseRemote}/games/taoyuan_baccarat.html && echo 'BACCARAT_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
