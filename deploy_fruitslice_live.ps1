$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating archive of fruitslice assets..." -ForegroundColor Cyan
if (Test-Path "fruitslice_audio_pack.tar.gz") { Remove-Item "fruitslice_audio_pack.tar.gz" -Force }
tar.exe -czf fruitslice_audio_pack.tar.gz -C assets/games fruitslice

Write-Host "Uploading fruitslice assets package..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no fruitslice_audio_pack.tar.gz "${server}:${baseRemote}/assets/games/"

Write-Host "Extracting assets on server..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "tar -xzf ${baseRemote}/assets/games/fruitslice_audio_pack.tar.gz -C ${baseRemote}/assets/games/ && rm -f ${baseRemote}/assets/games/fruitslice_audio_pack.tar.gz"

Write-Host "Uploading games/fruitslice.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\fruitslice.html "${server}:${baseRemote}/games/fruitslice.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/assets/games/fruitslice ${baseRemote}/games/fruitslice.html && chmod -R 755 ${baseRemote}/assets/games/fruitslice && chmod 644 ${baseRemote}/games/fruitslice.html"

Write-Host "Cleaning local archive..." -ForegroundColor Cyan
if (Test-Path "fruitslice_audio_pack.tar.gz") { Remove-Item "fruitslice_audio_pack.tar.gz" -Force }

Write-Host "Verifying remote deployment..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/assets/games/fruitslice/audio && head -n 15 ${baseRemote}/games/fruitslice.html"

Write-Host "Fruit Slice Music, Voices & SFX Deployed Successfully!" -ForegroundColor Green
