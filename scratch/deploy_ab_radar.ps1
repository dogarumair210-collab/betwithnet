$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

$files = @(
    @{ local = "api\games.php"; remote = "api/games.php" },
    @{ local = "admin.html"; remote = "admin.html" },
    @{ local = "js\admin.js"; remote = "js/admin.js" },
    @{ local = "admin\index.html"; remote = "admin/index.html" },
    @{ local = "admin\crash-control.html"; remote = "admin/crash-control.html" },
    @{ local = "games\andarbahar.html"; remote = "games/andarbahar.html" },
    @{ local = "games\andar_bahar.html"; remote = "games/andar_bahar.html" },
    @{ local = "games\ab_engine\index.html"; remote = "games/ab_engine/index.html" },
    @{ local = "games\ab_engine\assets\main\index.js"; remote = "games/ab_engine/assets/main/index.js" }
)

foreach ($f in $files) {
    Write-Host "Uploading $($f.local) -> $($f.remote)..." -ForegroundColor Cyan
    scp.exe -o StrictHostKeyChecking=no $f.local "${server}:${baseRemote}/$($f.remote)"
}

Write-Host "Setting remote permissions..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/api ${baseRemote}/admin.html ${baseRemote}/js/admin.js ${baseRemote}/admin ${baseRemote}/games/andarbahar.html ${baseRemote}/games/andar_bahar.html ${baseRemote}/games/ab_engine && chmod 644 ${baseRemote}/api/games.php ${baseRemote}/admin.html ${baseRemote}/js/admin.js ${baseRemote}/admin/index.html ${baseRemote}/admin/crash-control.html ${baseRemote}/games/andarbahar.html ${baseRemote}/games/andar_bahar.html ${baseRemote}/games/ab_engine/index.html ${baseRemote}/games/ab_engine/assets/main/index.js"

Write-Host "Testing live API endpoint /api/games.php?action=ab_state..." -ForegroundColor Green
$resp = Invoke-RestMethod -Uri "https://betwithnet.com/api/games.php?action=ab_state" -Method Get
$resp | ConvertTo-Json -Depth 5
