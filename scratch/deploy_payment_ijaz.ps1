$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$baseRemote = "/home/betwithnet.com/public_html"

$files = @(
    @{ local = "deposit.html"; remote = "deposit.html" },
    @{ local = "index.html"; remote = "index.html" },
    @{ local = "casino.html"; remote = "casino.html" },
    @{ local = "history.html"; remote = "history.html" },
    @{ local = "js\payment_manager.js"; remote = "js/payment_manager.js" },
    @{ local = "js\core.js"; remote = "js/core.js" },
    @{ local = "js\app.js"; remote = "js/app.js" },
    @{ local = "api\wallet.php"; remote = "api/wallet.php" },
    @{ local = "admin.html"; remote = "admin.html" },
    @{ local = "js\admin.js"; remote = "js/admin.js" },
    @{ local = "admin\deposits.html"; remote = "admin/deposits.html" },
    @{ local = "admin\payment-methods.html"; remote = "admin/payment-methods.html" },
    @{ local = "admin\database.sql"; remote = "admin/database.sql" }
)

foreach ($f in $files) {
    Write-Host "Uploading $($f.local) -> $($f.remote)..." -ForegroundColor Cyan
    scp.exe -o StrictHostKeyChecking=no $f.local "${server}:${baseRemote}/$($f.remote)"
}

Write-Host "Setting permissions on live server..." -ForegroundColor Cyan
ssh.exe -n -o StrictHostKeyChecking=no $server "chown -R betwi4261:betwi4261 ${baseRemote}/deposit.html ${baseRemote}/index.html ${baseRemote}/casino.html ${baseRemote}/history.html ${baseRemote}/js ${baseRemote}/api ${baseRemote}/admin.html ${baseRemote}/admin && chmod 644 ${baseRemote}/deposit.html ${baseRemote}/index.html ${baseRemote}/casino.html ${baseRemote}/history.html ${baseRemote}/js/payment_manager.js ${baseRemote}/js/core.js ${baseRemote}/js/app.js ${baseRemote}/api/wallet.php ${baseRemote}/admin.html ${baseRemote}/js/admin.js ${baseRemote}/admin/deposits.html ${baseRemote}/admin/payment-methods.html"

Write-Host "Done!" -ForegroundColor Green
