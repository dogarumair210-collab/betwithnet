$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "1. Uploading updated Android App source files to server..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no android_app\AndroidManifest.xml "${server}:/root/android_app/AndroidManifest.xml"
scp.exe -o StrictHostKeyChecking=no android_app\src\com\betwithnet\app\MainActivity.java "${server}:/root/android_app/src/com/betwithnet/app/MainActivity.java"

Write-Host "2. Uploading updated js/core.js to public_html..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no js\core.js "${server}:${baseRemote}/js/core.js"
ssh.exe -n -o StrictHostKeyChecking=no $server "chown betwi4261:betwi4261 ${baseRemote}/js/core.js && chmod 644 ${baseRemote}/js/core.js"

Write-Host "3. Running remote APK build and signing pipeline on server..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "/root/build_apk_server.sh"

Write-Host "4. Downloading newly built APK back to local repository..." -ForegroundColor Cyan
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/betwithnet.apk" .\betwithnet.apk

Write-Host "5. Verifying deployed APK..." -ForegroundColor Green
ssh.exe -n -o StrictHostKeyChecking=no $server "ls -lh ${baseRemote}/betwithnet.apk"

Write-Host "APK Build & Live Deployment Complete!" -ForegroundColor Green
