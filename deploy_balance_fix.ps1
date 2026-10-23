$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading api/common.php..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no api\common.php "${server}:${baseRemote}/api/common.php"

Write-Host "Uploading api/admin.php..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no api\admin.php "${server}:${baseRemote}/api/admin.php"

Write-Host "Uploading api/wallet.php..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no api\wallet.php "${server}:${baseRemote}/api/wallet.php"

Write-Host "Uploading admin/users.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin\users.html "${server}:${baseRemote}/admin/users.html"

Write-Host "Uploading admin/user-edit.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin\user-edit.html "${server}:${baseRemote}/admin/user-edit.html"

Write-Host "Uploading admin/user-view.html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin\user-view.html "${server}:${baseRemote}/admin/user-view.html"

Write-Host "Uploading js/admin.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\admin.js "${server}:${baseRemote}/js/admin.js"

Write-Host "Uploading js/wallet.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\wallet.js "${server}:${baseRemote}/js/wallet.js"

Write-Host "Uploading js/core.js..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\core.js "${server}:${baseRemote}/js/core.js"

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
$cmd = "chown -R betwi4261:betwi4261 ${baseRemote}/api/common.php ${baseRemote}/api/admin.php ${baseRemote}/api/wallet.php ${baseRemote}/admin/users.html ${baseRemote}/admin/user-edit.html ${baseRemote}/admin/user-view.html ${baseRemote}/js/admin.js ${baseRemote}/js/wallet.js ${baseRemote}/js/core.js && chmod 644 ${baseRemote}/api/common.php ${baseRemote}/api/admin.php ${baseRemote}/api/wallet.php ${baseRemote}/admin/users.html ${baseRemote}/admin/user-edit.html ${baseRemote}/admin/user-view.html ${baseRemote}/js/admin.js ${baseRemote}/js/wallet.js ${baseRemote}/js/core.js && echo 'BALANCE_DEPLOY_SUCCESS'"

ssh.exe -o StrictHostKeyChecking=no $server $cmd
