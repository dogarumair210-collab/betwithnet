$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"
$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

Write-Host "Uploading reset_all_balances.php..."
scp.exe -o StrictHostKeyChecking=no reset_all_balances.php "${server}:${baseRemote}/reset_all_balances.php"

Write-Host "Executing reset_all_balances.php..."
ssh.exe -o StrictHostKeyChecking=no $server "php ${baseRemote}/reset_all_balances.php && rm -f ${baseRemote}/reset_all_balances.php"
