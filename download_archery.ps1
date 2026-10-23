$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/games/archery.html" "games/archery.html"
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/js/games/archery.js" "js/games/archery.js"
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/assets/covers/archery.*" "assets/covers/"

Write-Host "Downloaded archery files successfully!" -ForegroundColor Green
