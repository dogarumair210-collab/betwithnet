<?php
define('APP_DEBUG', true);
define('ENVIRONMENT', 'development');

$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'deposit';

$input = [
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
    'proof_image' => 'test_proof_base64'
];

$_POST = $input;

require_once '/home/betwithnet.com/public_html/api/wallet.php';
