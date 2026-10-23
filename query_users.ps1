$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"
$server = "root@212.47.76.113"

ssh.exe -o StrictHostKeyChecking=no $server "mysql -u betw_user -p'BwN_2026!DbSecure982' -D betw_casino -e 'SELECT id, username, balance_usd, balance_pkr, role, status FROM users;'"
