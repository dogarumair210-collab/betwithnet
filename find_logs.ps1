$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "tail -n 60 /home/betwithnet.com/logs/betwithnet.com.access_log"
