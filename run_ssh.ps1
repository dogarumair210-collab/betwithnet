param (
    [Parameter(Mandatory=$true)]
    [string]$Command
)

$askpass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "$Command"
