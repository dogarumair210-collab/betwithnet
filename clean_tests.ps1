$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
`$pdo = getDB();
// Delete test transactions
`$pdo->exec("DELETE FROM transactions WHERE user_id IN ('USR-0001', 'USR-TEST-100') OR user_id LIKE 'USR-TEST%'");
`$pdo->exec("DELETE FROM users WHERE id LIKE 'USR-TEST%'");

echo 'Test transactions cleared.' . PHP_EOL;

// Check remaining pending transactions
`$q = `$pdo->query("
    SELECT t.id, t.user_id, t.type, t.method, t.amount_pkr, t.status, t.created_at, u.username, u.full_name, u.role
    FROM transactions t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'Pending'
      AND (u.role IS NULL OR u.role != 'admin')
      AND t.user_id NOT IN ('USR-0001')
      AND t.user_id NOT LIKE 'USR-TEST%'
    ORDER BY t.created_at DESC
");
`$rows = `$q->fetchAll(PDO::FETCH_ASSOC);
echo 'Remaining Real Pending Transactions: ' . count(`$rows) . PHP_EOL;
echo json_encode(`$rows, JSON_PRETTY_PRINT) . PHP_EOL;
"@

Set-Content -Path "clean_tests.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no clean_tests.php "root@212.47.76.113:/root/clean_tests.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/clean_tests.php"
