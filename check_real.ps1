$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
`$pdo = getDB();
`$q = `$pdo->query("
    SELECT COUNT(*) AS total, 
           SUM(CASE WHEN user_id LIKE 'USR-1%' THEN 1 ELSE 0 END) AS seed_users,
           SUM(CASE WHEN user_id = 'USR-0001' OR user_id LIKE 'USR-TEST%' THEN 1 ELSE 0 END) AS test_users,
           SUM(CASE WHEN user_id LIKE 'usr_%' THEN 1 ELSE 0 END) AS real_users
    FROM transactions
");
print_r(`$q->fetch(PDO::FETCH_ASSOC));

`$q2 = `$pdo->query("
    SELECT id, user_id, type, amount_pkr, status, created_at, method, sender_account 
    FROM transactions 
    WHERE user_id LIKE 'usr_%' 
    ORDER BY created_at DESC 
    LIMIT 10
");
print_r(`$q2->fetchAll(PDO::FETCH_ASSOC));
"@

Set-Content -Path "check_real.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no check_real.php "root@212.47.76.113:/root/check_real.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/check_real.php"
