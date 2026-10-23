$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "1. Uploading games/fishhunter.html and hook_up_fishing_wars.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no games\fishhunter.html "${server}:${baseRemote}/games/fishhunter.html"
scp.exe -o StrictHostKeyChecking=no games\hook_up_fishing_wars.html "${server}:${baseRemote}/games/hook_up_fishing_wars.html"

Write-Host "2. Uploading assets/covers/fishhunter.png..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no assets\covers\fishhunter.png "${server}:${baseRemote}/assets/covers/fishhunter.png"

Write-Host "3. Uploading index.html and manifest.json..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"
scp.exe -o StrictHostKeyChecking=no manifest.json "${server}:${baseRemote}/manifest.json"

Write-Host "4. Setting remote permissions and ownership..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/fishhunter.html ${baseRemote}/games/hook_up_fishing_wars.html ${baseRemote}/assets/covers/fishhunter.png ${baseRemote}/index.html ${baseRemote}/manifest.json && chmod 644 ${baseRemote}/games/fishhunter.html ${baseRemote}/games/hook_up_fishing_wars.html ${baseRemote}/assets/covers/fishhunter.png ${baseRemote}/index.html ${baseRemote}/manifest.json && echo 'FISHHUNTER_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
