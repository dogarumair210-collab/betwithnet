$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"

ssh.exe -n -o StrictHostKeyChecking=no $server "ls -la /home/betwithnet.com/public_html/games/ab_engine"
