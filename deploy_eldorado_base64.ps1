$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Encoding games/eldorado.html..." -ForegroundColor Cyan
$htmlBytes = [System.IO.File]::ReadAllBytes((Resolve-Path "games\eldorado.html").Path)
$htmlB64 = [Convert]::ToBase64String($htmlBytes)

Write-Host "Uploading games/eldorado.html via SSH stream..." -ForegroundColor Cyan
$b64File = "temp_ed_html.b64"
[System.IO.File]::WriteAllText($b64File, $htmlB64)
# Pipe into ssh
Get-Content $b64File | ssh.exe -o StrictHostKeyChecking=no $server "base64 -d > ${baseRemote}/games/eldorado.html"
Remove-Item $b64File -ErrorAction SilentlyContinue

Write-Host "Encoding js/games/eldorado.js..." -ForegroundColor Cyan
$jsBytes = [System.IO.File]::ReadAllBytes((Resolve-Path "js\games\eldorado.js").Path)
$jsB64 = [Convert]::ToBase64String($jsBytes)

Write-Host "Uploading js/games/eldorado.js via SSH stream..." -ForegroundColor Cyan
$b64FileJs = "temp_ed_js.b64"
[System.IO.File]::WriteAllText($b64FileJs, $jsB64)
Get-Content $b64FileJs | ssh.exe -o StrictHostKeyChecking=no $server "base64 -d > ${baseRemote}/js/games/eldorado.js"
Remove-Item $b64FileJs -ErrorAction SilentlyContinue

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown betwi4261:betwi4261 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && chmod 644 ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && ls -la ${baseRemote}/games/eldorado.html ${baseRemote}/js/games/eldorado.js && echo 'DEPLOY_ELDORADO_STREAM_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $cmd

Write-Host "Done!" -ForegroundColor Green
