<?php
// 1. Test Deposit Submission
echo '=== 1. TESTING DEPOSIT SUBMISSION ===' . PHP_EOL;
$depPayload = json_encode([
    'user_id' => 'USR-TEST-100',
    'username' => 'TestPlayer_Ali',
    'phone' => '0321-9876543',
    'amount' => 2000,
    'amount_pkr' => 2000,
    'amount_usd' => 7.14,
    'currency' => 'PKR',
    'method' => 'EasyPaisa Direct',
    'sender_account' => '0321-9876543',
    'sender' => '0321-9876543',
    'trx_id' => 'TID_' . time(),
    'proof_image' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
]);

$ch1 = curl_init('https://127.0.0.1/api/wallet.php?action=deposit');
curl_setopt($ch1, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch1, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch1, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch1, CURLOPT_POST, true);
curl_setopt($ch1, CURLOPT_POSTFIELDS, $depPayload);
curl_setopt($ch1, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Host: betwithnet.com']);
$depRes = curl_exec($ch1);
curl_close($ch1);
echo 'Deposit Response: ' . $depRes . PHP_EOL;

// 2. Test Withdrawal Submission
echo '=== 2. TESTING WITHDRAWAL SUBMISSION ===' . PHP_EOL;
$withPayload = json_encode([
    'user_id' => 'USR-TEST-100',
    'username' => 'TestPlayer_Ali',
    'phone' => '0321-9876543',
    'amount' => 1200,
    'amount_pkr' => 1200,
    'currency' => 'PKR',
    'method' => 'JazzCash Mobile Account',
    'account_title' => 'Ali Raza',
    'account_number' => '0301-7654321'
]);

$ch2 = curl_init('https://127.0.0.1/api/wallet.php?action=withdraw');
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch2, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_POSTFIELDS, $withPayload);
curl_setopt($ch2, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Host: betwithnet.com']);
$withRes = curl_exec($ch2);
curl_close($ch2);
echo 'Withdrawal Response: ' . $withRes . PHP_EOL;

// 3. Test Cashier Background App Polling (With Android App User-Agent)
echo '=== 3. TESTING CASHIER BACKGROUND APP POLLING ===' . PHP_EOL;
$ch3 = curl_init('https://127.0.0.1/api/admin.php?action=pending_notifications');
curl_setopt($ch3, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch3, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch3, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch3, CURLOPT_HTTPHEADER, [
    'Host: betwithnet.com',
    'User-Agent: BWN-Cashier-Android/1.1',
    'X-Admin-Pin: 7777'
]);
$notifRes = curl_exec($ch3);
curl_close($ch3);
$notifJson = json_decode($notifRes, true);
echo 'Success: ' . ($notifJson['success'] ? 'YES' : 'NO') . PHP_EOL;
echo 'Pending Deposits: ' . $notifJson['data']['pending_deposits_count'] . PHP_EOL;
echo 'Pending Withdrawals: ' . $notifJson['data']['pending_withdrawals_count'] . PHP_EOL;
echo 'Total Pending: ' . $notifJson['data']['total_pending'] . PHP_EOL;
echo 'Top 2 Items in Queue: ' . PHP_EOL;
$topItems = array_slice($notifJson['data']['items'], 0, 2);
print_r($topItems);
