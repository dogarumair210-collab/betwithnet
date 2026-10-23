<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
$db = getDB();
$rows = $db->query("SELECT t.id, t.user_id, t.type, t.amount_pkr, t.status, t.created_at FROM transactions t ORDER BY t.created_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo "FIRST 5 BY CREATED_AT DESC:" . PHP_EOL;
echo json_encode($rows, JSON_PRETTY_PRINT) . PHP_EOL;

// Check pending transactions specifically
$pRows = $db->query("SELECT t.id, t.user_id, t.type, t.amount_pkr, t.status, t.created_at FROM transactions t WHERE t.status = 'Pending'")->fetchAll(PDO::FETCH_ASSOC);
echo "ALL PENDING TRANSACTIONS:" . PHP_EOL;
echo json_encode($pRows, JSON_PRETTY_PRINT) . PHP_EOL;
