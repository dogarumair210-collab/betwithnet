$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating remote directories..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p ${baseRemote}/casino-live/pragmatic-play ${baseRemote}/pragmatic-live"

Write-Host "Uploading casino-live/pragmatic-play/index.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no "casino-live\pragmatic-play\index.html" "${server}:${baseRemote}/casino-live/pragmatic-play/index.html"

Write-Host "Uploading pragmatic-live/index.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no "pragmatic-live\index.html" "${server}:${baseRemote}/pragmatic-live/index.html"

Write-Host "Uploading games/pragmatic_live.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no "games\pragmatic_live.html" "${server}:${baseRemote}/games/pragmatic_live.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/casino-live ${baseRemote}/pragmatic-live ${baseRemote}/games/pragmatic_live.html && chmod -R 755 ${baseRemote}/casino-live ${baseRemote}/pragmatic-live && chmod 644 ${baseRemote}/casino-live/pragmatic-play/index.html ${baseRemote}/pragmatic-live/index.html ${baseRemote}/games/pragmatic_live.html"

Write-Host "Verifying HTTP response..." -ForegroundColor Green
$resp = curl.exe -s -I "https://betwithnet.com/casino-live/pragmatic-play/" | Select-String -Pattern "HTTP|content-type"
$resp | ForEach-Object { Write-Host $_ }
