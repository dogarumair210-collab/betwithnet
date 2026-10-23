$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
`$pdo = getDB();
`$q = `$pdo->query('DESCRIBE users');
echo json_encode(`$q->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT);
"@

Set-Content -Path "test_users_schema.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no test_users_schema.php "root@212.47.76.113:/root/test_users_schema.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/test_users_schema.php"
