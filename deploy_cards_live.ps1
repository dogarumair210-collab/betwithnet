$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading games/card_game.html..."
scp.exe -o StrictHostKeyChecking=no games\card_game.html "${server}:${baseRemote}/games/card_game.html"

Write-Host "Uploading games/andarbahar.html..."
scp.exe -o StrictHostKeyChecking=no games\andarbahar.html "${server}:${baseRemote}/games/andarbahar.html"

Write-Host "Uploading index.html..."
scp.exe -o StrictHostKeyChecking=no index.html "${server}:${baseRemote}/index.html"

Write-Host "Uploading js/core.js..."
scp.exe -o StrictHostKeyChecking=no js\core.js "${server}:${baseRemote}/js/core.js"

Write-Host "Setting permissions..."
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/card_game.html ${baseRemote}/games/andarbahar.html ${baseRemote}/index.html ${baseRemote}/js/core.js; chmod 644 ${baseRemote}/games/card_game.html ${baseRemote}/games/andarbahar.html ${baseRemote}/index.html ${baseRemote}/js/core.js; echo 'ALL_CARDS_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
