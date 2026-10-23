<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
$db = getDB();
$rows = $db->query("SELECT t.id, t.user_id, t.type, t.method, t.amount_pkr, t.status, t.created_at, u.username, u.role FROM transactions t LEFT JOIN users u ON u.id = t.user_id ORDER BY t.created_at DESC LIMIT 25")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT);
