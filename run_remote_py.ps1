param (
    [Parameter(Mandatory=$true)]
    [string]$ScriptFile
)

$askpass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$code = [System.IO.File]::ReadAllText((Resolve-Path $ScriptFile).Path)
$code | ssh.exe -o StrictHostKeyChecking=no root@212.47.76.113 "python3 -"
