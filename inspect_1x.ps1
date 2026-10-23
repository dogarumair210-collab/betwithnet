$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
ssh.exe -n -o StrictHostKeyChecking=no $server "curl -s -L --max-time 15 'https://1x-betpk.mobi/en/casino-search?game=52358&demo=1' | grep -i -E 'game|aviator|spribe|iframe|url|launch' | head -n 30"
