$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"
$server = "root@212.47.76.113"

ssh.exe -o StrictHostKeyChecking=no $server "sed -n '900,935p' /home/betwithnet.com/public_html/admin/users.html"
