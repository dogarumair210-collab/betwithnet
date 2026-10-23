$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Deploying compact admin/users.html and admin/index.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin\users.html "${server}:${baseRemote}/admin/users.html"
scp.exe -o StrictHostKeyChecking=no admin\index.html "${server}:${baseRemote}/admin/index.html"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$permCmd = "chown betwi4261:betwi4261 ${baseRemote}/admin/users.html ${baseRemote}/admin/index.html && chmod 644 ${baseRemote}/admin/users.html ${baseRemote}/admin/index.html && echo 'DEPLOY_ADMIN_USERS_SUCCESS'"
ssh.exe -n -o StrictHostKeyChecking=no $server $permCmd

Write-Host "Admin users compact update successfully deployed live!" -ForegroundColor Green
