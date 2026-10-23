$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
`$pdo = getDB();
`$q = `$pdo->query("
    SELECT t.id, t.user_id, t.type, t.method, t.amount_pkr, t.status, t.created_at, u.username, u.role
    FROM transactions t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'Pending'
    ORDER BY t.created_at DESC
");
`$rows = `$q->fetchAll(PDO::FETCH_ASSOC);
echo '=== ALL CURRENT PENDING TRANSACTIONS (' . count(`$rows) . ') ===' . PHP_EOL;
echo json_encode(`$rows, JSON_PRETTY_PRINT) . PHP_EOL;
"@

Set-Content -Path "check_pending.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no check_pending.php "root@212.47.76.113:/root/check_pending.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/check_pending.php"
