<?php
require_once '/home/betwithnet.com/public_html/api/common.php';
$pdo = getDB();
$q = $pdo->query("
    SELECT t.id, t.user_id, t.type, t.method, t.amount_pkr, t.status, t.created_at, u.username, u.full_name, u.role
    FROM transactions t
    LEFT JOIN users u ON u.id = t.user_id
    WHERE t.status = 'Pending'
    ORDER BY t.created_at DESC
");
print_r($q->fetchAll(PDO::FETCH_ASSOC));
