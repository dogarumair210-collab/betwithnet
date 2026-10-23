$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote directories if not exist..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/games ${baseRemote}/css/games ${baseRemote}/js/games ${baseRemote}/assets/covers ${baseRemote}/assets/games/meow_hi_lo"

Write-Host "Uploading games/hilo.html and meow_hi_lo.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\hilo.html "${server}:${baseRemote}/games/hilo.html"
scp.exe -o StrictHostKeyChecking=no games\meow_hi_lo.html "${server}:${baseRemote}/games/meow_hi_lo.html"

Write-Host "Uploading css and js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no css\games\meow_hi_lo.css "${server}:${baseRemote}/css/games/meow_hi_lo.css"
scp.exe -o StrictHostKeyChecking=no js\games\meow_hi_lo.js "${server}:${baseRemote}/js/games/meow_hi_lo.js"

Write-Host "Uploading assets..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\hilo.jpg "${server}:${baseRemote}/assets/covers/hilo.jpg"
scp.exe -o StrictHostKeyChecking=no assets\covers\meow_hi_lo.jpg "${server}:${baseRemote}/assets/covers/meow_hi_lo.jpg"
scp.exe -o StrictHostKeyChecking=no assets\games\meow_hi_lo\logo.jpg "${server}:${baseRemote}/assets/games/meow_hi_lo/logo.jpg"
scp.exe -o StrictHostKeyChecking=no assets\games\meow_hi_lo\jili_logo.png "${server}:${baseRemote}/assets/games/meow_hi_lo/jili_logo.png"
scp.exe -o StrictHostKeyChecking=no assets\games\meow_hi_lo\hilo_bgm.mp3 "${server}:${baseRemote}/assets/games/meow_hi_lo/hilo_bgm.mp3"

Write-Host "Uploading index.html and casino.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"
scp.exe -o StrictHostKeyChecking=no casino.html "${server}:${baseRemote}/casino.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/hilo.html ${baseRemote}/games/meow_hi_lo.html ${baseRemote}/css/games/meow_hi_lo.css ${baseRemote}/js/games/meow_hi_lo.js ${baseRemote}/assets/covers/hilo.jpg ${baseRemote}/assets/covers/meow_hi_lo.jpg ${baseRemote}/assets/games/meow_hi_lo ${baseRemote}/index.html ${baseRemote}/casino.html && chmod 644 ${baseRemote}/games/hilo.html ${baseRemote}/games/meow_hi_lo.html ${baseRemote}/css/games/meow_hi_lo.css ${baseRemote}/js/games/meow_hi_lo.js ${baseRemote}/assets/covers/hilo.jpg ${baseRemote}/assets/covers/meow_hi_lo.jpg ${baseRemote}/assets/games/meow_hi_lo/* ${baseRemote}/index.html ${baseRemote}/casino.html && echo 'DEPLOY_HILO_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
