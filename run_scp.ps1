param (
    [Parameter(Mandatory=$true)]
    [string]$Source,
    [Parameter(Mandatory=$true)]
    [string]$Destination
)

$askpass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

scp.exe -o StrictHostKeyChecking=no -p $Source "root@212.47.76.113:$Destination"
