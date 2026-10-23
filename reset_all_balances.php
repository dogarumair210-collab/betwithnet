<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/config/db.php';

$db = Database::getPdo();
$stmt = $db->prepare("UPDATE users SET balance_usd = 0.00, balance_pkr = 0.00");
$stmt->execute();
$affected = $stmt->rowCount();

echo "RESET_SUCCESS: Updated {$affected} users. All balances set to 0.00 PKR / 0.00 USD." . PHP_EOL;

// Check sum
$totalPKR = $db->query("SELECT SUM(balance_pkr) FROM users")->fetchColumn();
echo "TOTAL_BALANCE_PKR_NOW: " . ($totalPKR !== null ? $totalPKR : '0.00') . PHP_EOL;

// List non-zero just in case
$nonZero = $db->query("SELECT COUNT(*) FROM users WHERE balance_pkr > 0 OR balance_usd > 0")->fetchColumn();
echo "NON_ZERO_USERS_COUNT: {$nonZero}" . PHP_EOL;
