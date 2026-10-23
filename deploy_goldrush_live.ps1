$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Creating archive gold_rush_template.tar.gz..." -ForegroundColor Cyan
if (Test-Path "gold_rush_template.tar.gz") { Remove-Item "gold_rush_template.tar.gz" -Force }
tar.exe -czf gold_rush_template.tar.gz gold_rush_template

$archiveSize = (Get-Item "gold_rush_template.tar.gz").Length / 1MB
Write-Host "Archive created: $([math]::Round($archiveSize, 2)) MB" -ForegroundColor Green

Write-Host "Uploading gold_rush_template.tar.gz to $server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no gold_rush_template.tar.gz "${server}:${baseRemote}/gold_rush_template.tar.gz"

Write-Host "Extracting archive on remote server..." -ForegroundColor Cyan
$extractCmd = "tar -xzf ${baseRemote}/gold_rush_template.tar.gz -C ${baseRemote}/ && rm -f ${baseRemote}/gold_rush_template.tar.gz && echo 'EXTRACT_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $extractCmd

Write-Host "Uploading games/goldmine.html to $server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\goldmine.html "${server}:${baseRemote}/games/goldmine.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown -R betwi4261:betwi4261 ${baseRemote}/gold_rush_template ${baseRemote}/games/goldmine.html && chmod -R 755 ${baseRemote}/gold_rush_template && chmod 644 ${baseRemote}/games/goldmine.html && echo 'PERM_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

# Cleanup local archive
if (Test-Path "gold_rush_template.tar.gz") { Remove-Item "gold_rush_template.tar.gz" -Force }

Write-Host "Deployment of Gold Rush to https://betwithnet.com/games/goldmine.html completed successfully!" -ForegroundColor Green
