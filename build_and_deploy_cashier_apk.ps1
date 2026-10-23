$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "1. Uploading backend files, deposit.html, withdraw.html, and admin files to server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no api\wallet.php "${server}:${baseRemote}/api/wallet.php"
scp.exe -o StrictHostKeyChecking=no api\admin.php "${server}:${baseRemote}/api/admin.php"
scp.exe -o StrictHostKeyChecking=no js\admin.js "${server}:${baseRemote}/js/admin.js"
scp.exe -o StrictHostKeyChecking=no deposit.html "${server}:${baseRemote}/deposit.html"
scp.exe -o StrictHostKeyChecking=no withdraw.html "${server}:${baseRemote}/withdraw.html"
scp.exe -o StrictHostKeyChecking=no admin\cashier_desk.html "${server}:${baseRemote}/admin/cashier_desk.html"
scp.exe -o StrictHostKeyChecking=no admin\deposits.html "${server}:${baseRemote}/admin/deposits.html"
scp.exe -o StrictHostKeyChecking=no admin\withdrawals.html "${server}:${baseRemote}/admin/withdrawals.html"
scp.exe -o StrictHostKeyChecking=no admin\js\adminlte.js "${server}:${baseRemote}/admin/js/adminlte.js"
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/admin/cashier_desk.html ${baseRemote}/admin/deposits.html ${baseRemote}/admin/withdrawals.html ${baseRemote}/admin/js/adminlte.js ${baseRemote}/api/wallet.php ${baseRemote}/api/admin.php ${baseRemote}/js/admin.js ${baseRemote}/deposit.html ${baseRemote}/withdraw.html"

Write-Host "2. Preparing admin_android_app on server..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "mkdir -p /root/admin_android_app/src/com/betwithnet/cashier && cp -r /root/android_app/res /root/admin_android_app/ && sed -i 's/>Bet With Net</>BWN Cashier</g' /root/admin_android_app/res/values/strings.xml"

Write-Host "3. Uploading AndroidManifest.xml, MainActivity.java, and CashierBackgroundService.java..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no admin_android_app\AndroidManifest.xml "${server}:/root/admin_android_app/AndroidManifest.xml"
scp.exe -o StrictHostKeyChecking=no admin_android_app\src\com\betwithnet\cashier\MainActivity.java "${server}:/root/admin_android_app/src/com/betwithnet/cashier/MainActivity.java"
scp.exe -o StrictHostKeyChecking=no admin_android_app\src\com\betwithnet\cashier\CashierBackgroundService.java "${server}:/root/admin_android_app/src/com/betwithnet/cashier/CashierBackgroundService.java"
scp.exe -o StrictHostKeyChecking=no admin_android_app\src\com\betwithnet\cashier\AlarmReceiver.java "${server}:/root/admin_android_app/src/com/betwithnet/cashier/AlarmReceiver.java"
scp.exe -o StrictHostKeyChecking=no admin_android_app\src\com\betwithnet\cashier\BootReceiver.java "${server}:/root/admin_android_app/src/com/betwithnet/cashier/BootReceiver.java"

Write-Host "4. Uploading build script to server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no build_cashier_apk_server.sh "${server}:/root/build_cashier_apk_server.sh"
ssh.exe -n -o StrictHostKeyChecking=no $server "sed -i 's/\r$//' /root/build_cashier_apk_server.sh && chmod +x /root/build_cashier_apk_server.sh"

Write-Host "5. Running remote Cashier APK build and signing pipeline on server..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "/root/build_cashier_apk_server.sh"

Write-Host "6. Downloading newly built Cashier APK back to local repository..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/admin/betwithnet_cashier_admin.apk" .\betwithnet_cashier_admin.apk

Write-Host "7. Verifying deployed Cashier APK..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/admin/betwithnet_cashier_admin.apk"

Write-Host "Cashier APK Build & Live Deployment Complete!" -ForegroundColor Green
