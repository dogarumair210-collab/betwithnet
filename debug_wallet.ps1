$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
define('APP_DEBUG', true);
define('ENVIRONMENT', 'development');

`$_SERVER['REQUEST_METHOD'] = 'POST';
`$_GET['action'] = 'deposit';

`$input = [
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

`$_POST = `$input;

require_once '/home/betwithnet.com/public_html/api/wallet.php';
"@

Set-Content -Path "debug_wallet.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no debug_wallet.php "root@212.47.76.113:/root/debug_wallet.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/debug_wallet.php"
