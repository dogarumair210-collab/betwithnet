$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/chicken_rush.html..."
scp.exe -o StrictHostKeyChecking=no games\chicken_rush.html "${server}:${baseRemote}/games/chicken_rush.html"

Write-Host "Uploading css/games/chicken_rush.css..."
scp.exe -o StrictHostKeyChecking=no css\games\chicken_rush.css "${server}:${baseRemote}/css/games/chicken_rush.css"

Write-Host "Uploading js/games/chicken_rush.js..."
scp.exe -o StrictHostKeyChecking=no js\games\chicken_rush.js "${server}:${baseRemote}/js/games/chicken_rush.js"

Write-Host "Setting permissions..."
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/games/chicken_rush.html ${baseRemote}/css/games/chicken_rush.css ${baseRemote}/js/games/chicken_rush.js && chmod 644 ${baseRemote}/games/chicken_rush.html ${baseRemote}/css/games/chicken_rush.css ${baseRemote}/js/games/chicken_rush.js && echo 'DITTO_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
