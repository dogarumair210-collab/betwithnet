<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
$db = getDB();
$tx = $db->query("SELECT * FROM transactions WHERE id = 'trx_3378c8914a52'")->fetch(PDO::FETCH_ASSOC);
echo "TRANSACTION DETAILS:" . PHP_EOL;
print_r($tx);

// Now execute the EXACT query in pending_notifications:
$depStmt = $db->query("
    SELECT COUNT(*) FROM transactions t 
    LEFT JOIN users u ON u.id = t.user_id 
    WHERE t.type = 'deposit' AND t.status = 'Pending' 
      AND t.user_id NOT LIKE 'USR-TEST%'
");
echo "DEPOSIT COUNT QUERY: " . $depStmt->fetchColumn() . PHP_EOL;

// Now check if user exists in users table:
$u = $db->query("SELECT * FROM users WHERE id = '" . $tx['user_id'] . "'")->fetch(PDO::FETCH_ASSOC);
echo "USER IN USERS TABLE:" . PHP_EOL;
print_r($u);
