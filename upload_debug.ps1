$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"
$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

scp.exe -o StrictHostKeyChecking=no api\debug_input.php "${server}:${baseRemote}/api/debug_input.php"
