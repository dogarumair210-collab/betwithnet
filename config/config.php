<?php
/**
 * ============================================================
 * Bet With Net - Enterprise Configuration Engine
 * Environment reader, database presets & global security settings
 * ============================================================
 */

// Load .env file if it exists
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            if (!array_key_exists($key, $_ENV)) {
                putenv("{$key}={$val}");
                $_ENV[$key] = $val;
            }
        }
    }
}

date_default_timezone_set('UTC');

return [
    'app' => [
        'name' => getenv('APP_NAME') ?: 'Bet With Net VIP Casino',
        'env' => getenv('APP_ENV') ?: 'production',
        'debug' => filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN),
        'url' => getenv('APP_URL') ?: 'http://127.0.0.1:8080',
        'version' => '3.5.0-ENTERPRISE',
        'timezone' => 'UTC',
        'locale' => 'en',
    ],
    'database' => [
        'driver' => getenv('DB_CONNECTION') ?: (getenv('DB_DRIVER') ?: 'mysql'),
        'host' => getenv('DB_HOST') ?: '127.0.0.1',
        'port' => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_DATABASE') ?: 'betwithnet_casino',
        'username' => getenv('DB_USERNAME') ?: 'root',
        'password' => getenv('DB_PASSWORD') ?: '',
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'sqlite_path' => __DIR__ . '/../database.sqlite'
    ],
    'security' => [
        'admin_pin' => getenv('ADMIN_PIN') ?: '9824',
        'master_pin' => getenv('MASTER_PIN') ?: '8391',
        'admin_token' => getenv('ADMIN_RESTORE_TOKEN') ?: 'bwn_master_restore_key_2026',
        'session_lifetime' => 86400, // 24 hours
        'bcrypt_cost' => 10,
    ],
    'smtp' => [
        'host' => getenv('SMTP_HOST') ?: 'smtp.betwithnet.com',
        'port' => (int)(getenv('SMTP_PORT') ?: 587),
        'username' => getenv('SMTP_USERNAME') ?: 'support@betwithnet.com',
        'password' => getenv('SMTP_PASSWORD') ?: 'BwnSmtpSecret2026!',
        'encryption' => getenv('SMTP_ENCRYPTION') ?: 'tls',
        'from_address' => getenv('MAIL_FROM_ADDRESS') ?: 'cashier@betwithnet.com',
        'from_name' => getenv('MAIL_FROM_NAME') ?: 'Bet With Net VIP Desk'
    ]
];
