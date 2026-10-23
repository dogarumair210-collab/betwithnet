<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (empty($action)) {
    $input = getJsonInput();
    $action = $input['action'] ?? '';
}

$db = getDB();

// Client IP helper for rate limiting
$clientIp = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$rateKey = sys_get_temp_dir() . '/bwn_rate_' . md5($clientIp . '_auth');

function checkRateLimit(string $key, int $maxAttempts = 5, int $window = 900): void {
    if (file_exists($key)) {
        $data = @json_decode(@file_get_contents($key), true);
        if (is_array($data)) {
            $attempts = $data['attempts'] ?? 0;
            $time = $data['time'] ?? 0;
            if ($attempts >= $maxAttempts && (time() - $time) < $window) {
                $wait = $window - (time() - $time);
                sendError("Too many failed attempts. Please try again in {$wait} seconds.", 429);
            }
        }
    }
}

function recordFailedAttempt(string $key): void {
    $attempts = 1;
    if (file_exists($key)) {
        $data = @json_decode(@file_get_contents($key), true);
        if (is_array($data) && (time() - ($data['time'] ?? 0)) < 900) {
            $attempts = ($data['attempts'] ?? 0) + 1;
        }
    }
    @file_put_contents($key, json_encode(['attempts' => $attempts, 'time' => time()]));
}

function clearRateLimit(string $key): void {
    if (file_exists($key)) {
        @unlink($key);
    }
}

function getClientRealIp(): string {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) return $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
}

function detectDeviceType(string $ua, bool $isAppHint = false): string {
    if ($isAppHint || stripos($ua, 'BetWithNetApp') !== false || stripos($ua, 'wv') !== false) {
        if (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) {
            return 'iOS App';
        }
        return 'Android App';
    }
    if (stripos($ua, 'Android') !== false) return 'Android Mobile';
    if (stripos($ua, 'iPhone') !== false || stripos($ua, 'iPad') !== false) return 'iOS Mobile';
    if (stripos($ua, 'Mobile') !== false) return 'Mobile Web';
    return 'Desktop Web';
}

switch ($action) {
    case 'track_visit':
        $data = getJsonInput();
        $userId = trim($data['user_id'] ?? ($data['id'] ?? ''));
        $isApp = !empty($data['is_app']);
        $ip = getClientRealIp();
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);
        $device = detectDeviceType($ua, $isApp);

        if (!empty($userId)) {
            $stmt = $db->prepare("SELECT id, username, full_name, email, phone, balance_pkr, balance_usd, vip_tier, status, role FROM users WHERE id = :id AND role != 'guest' LIMIT 1");
            $stmt->execute([':id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $upd = $db->prepare("UPDATE users SET last_active = NOW(), ip_address = :ip, device_type = :dev, user_agent = :ua WHERE id = :id");
                $upd->execute([':ip' => $ip, ':dev' => $device, ':ua' => $ua, ':id' => $userId]);
                sendSuccess($user, 'Active user visit recorded.');
                break;
            }
        }

        // Do NOT auto-create guest accounts
        sendSuccess(null, 'Unauthenticated visit.');
        break;

    case 'register':
        $data = getJsonInput();
        $username = trim($data['username'] ?? '');
        $emailOrPhone = trim($data['email'] ?? ($data['phone'] ?? ''));
        $fullName = trim($data['full_name'] ?? ($data['fullName'] ?? $username));
        if (empty($fullName)) $fullName = $username;
        $phone = trim($data['phone'] ?? '');
        $password = $data['password'] ?? '';
        $pin = trim((string)($data['security_pin'] ?? ($data['pin'] ?? '')));
        $isApp = !empty($data['is_app']);

        if (empty($username) || empty($emailOrPhone) || empty($password)) {
            sendError('Username, email or mobile number, and password are required.', 422);
        }

        // Determine if input is a phone number or email address
        $email = '';
        if (strpos($emailOrPhone, '@') !== false) {
            $email = $emailOrPhone;
            if (empty($phone)) $phone = '0300-0000000';
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                sendError('Please provide a valid email address.', 422);
            }
        } else {
            // Mobile Phone input (e.g. 03001234567, 0312-3456789)
            $phone = $emailOrPhone;
            $cleanDigits = preg_replace('/[^0-9]/', '', $phone);
            $email = 'usr_' . $cleanDigits . '@betwithnet.local';
        }

        // Block registration of reserved administrative usernames
        $reservedUsernames = ['admin', 'super_admin', 'administrator', 'root', 'support', 'cashier', 'operator', 'mod', 'moderator', 'system'];
        if (in_array(strtolower($username), $reservedUsernames)) {
            sendError('This username is reserved and cannot be registered.', 422);
        }

        if (strlen($password) < 6) {
            sendError('Password must be at least 6 characters long.', 422);
        }
        if (empty($pin)) {
            $pin = '1234';
        }

        // Check duplicates (exclude placeholder defaults)
        $check = $db->prepare("SELECT id FROM users WHERE username = :u OR (email = :e AND email NOT LIKE '%@betwithnet.local') OR (phone = :p AND phone != '0300-0000000' AND phone != '-') LIMIT 1");
        $check->execute([':u' => $username, ':e' => $email, ':p' => $phone]);
        if ($check->fetch()) {
            sendError('Username or mobile/email is already registered. Please sign in instead.', 409);
        }

        $userId = 'usr_' . bin2hex(random_bytes(6));
        $salt = bin2hex(random_bytes(16));
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $pinHash = hash('sha256', $salt . $pin);
        $now = date('Y-m-d H:i:s');
        $ip = getClientRealIp();
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);
        $device = detectDeviceType($ua, $isApp);

        $stmt = $db->prepare("
            INSERT INTO users (id, username, full_name, email, phone, password_hash, salt, security_pin_hash, balance_usd, balance_pkr, vip_tier, status, currency, role, created_at, last_active, ip_address, device_type, user_agent)
            VALUES (:id, :username, :full_name, :email, :phone, :pw, :salt, :pin_hash, 0.00, 0.00, 'Bronze VIP', 'active', 'PKR', 'user', :created_at, :last_active, :ip, :device, :ua)
        ");
        $stmt->execute([
            ':id' => $userId,
            ':username' => $username,
            ':full_name' => $fullName,
            ':email' => $email,
            ':phone' => $phone,
            ':pw' => $passwordHash,
            ':salt' => $salt,
            ':pin_hash' => $pinHash,
            ':created_at' => $now,
            ':last_active' => $now,
            ':ip' => $ip,
            ':device' => $device,
            ':ua' => $ua
        ]);

        session_regenerate_id(true);
        $_SESSION['user_id'] = $userId;
        $_SESSION['is_admin'] = false;

        $stmt = $db->prepare("SELECT id, username, full_name, email, phone, balance_usd, balance_pkr, vip_tier, status, outcome_bias, custom_win_rate, currency, role, total_wagered, total_won, created_at, device_type, last_active FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        sendSuccess($user, 'Registration successful. Welcome to Bet With Net!');
        break;

    case 'login':
        checkRateLimit($rateKey, 10, 900);

        $data = getJsonInput();
        $identifier = trim($data['username'] ?? ($data['email'] ?? ($data['phone'] ?? '')));
        $password = $data['password'] ?? '';
        $isApp = !empty($data['is_app']);

        if (empty($identifier) || empty($password)) {
            sendError('Username, email or mobile number, and password are required.', 422);
        }

        $stmt = $db->prepare("
            SELECT id, username, full_name, email, phone, balance_usd, balance_pkr, vip_tier, status, 
                   outcome_bias, custom_win_rate, currency, role, total_wagered, total_won, created_at, 
                   password_hash, salt, device_type, ip_address, last_active 
            FROM users 
            WHERE username = :u1 OR email = :u2 OR (phone = :u3 AND phone != '0300-0000000' AND phone != '-')
            LIMIT 1
        ");
        $stmt->execute([
            ':u1' => $identifier,
            ':u2' => $identifier,
            ':u3' => $identifier
        ]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            recordFailedAttempt($rateKey);
            sendError('Invalid username or password.', 401);
        }

        $verified = false;
        if (!empty($user['password_hash'])) {
            if (password_verify($password, $user['password_hash'])) {
                $verified = true;
            } elseif (hash('sha256', ($user['salt'] ?? '') . $password) === $user['password_hash']) {
                $verified = true;
            }
        }

        if (!$verified) {
            recordFailedAttempt($rateKey);
            sendError('Invalid username or password.', 401);
        }

        if ($user['status'] === 'suspended' || $user['status'] === 'pending') {
            sendError('This account has been suspended or is pending review.', 403);
        }

        clearRateLimit($rateKey);

        $ip = getClientRealIp();
        $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 250);
        $device = detectDeviceType($ua, $isApp);
        $upd = $db->prepare("UPDATE users SET last_active = NOW(), ip_address = :ip, device_type = :device, user_agent = :ua WHERE id = :id");
        $upd->execute([':ip' => $ip, ':device' => $device, ':ua' => $ua, ':id' => $user['id']]);

        $user['last_active'] = date('Y-m-d H:i:s');
        $user['ip_address'] = $ip;
        $user['device_type'] = $device;
        unset($user['password_hash'], $user['salt']);

        session_regenerate_id(true);
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['is_admin'] = ($user['role'] === 'admin');

        sendSuccess($user, 'Login successful.');
        break;



    case 'logout':
        $_SESSION = [];
        if (session_id()) {
            session_destroy();
        }
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        sendSuccess(null, 'Logged out successfully.');
        break;

    case 'status':
    case 'check':
    case 'me':
        $user = getCurrentUser();
        sendSuccess($user, $user ? 'Authenticated user session.' : 'No active session.');
        break;

    case 'verify_pin':
        // Issue #19: Strictly scope PIN verification to current session user
        $currentUser = requireAuth();
        $targetUserId = $currentUser['id'];

        $data = getJsonInput();
        $pin = trim((string)($data['pin'] ?? ''));

        if (empty($pin)) {
            sendError('Security PIN is required.', 422);
        }

        // Issue #20: Check salted SHA256 hash only; zero plaintext PIN query
        $stmt = $db->prepare("SELECT security_pin_hash, salt FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $targetUserId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            sendError('User not found.', 404);
        }

        $matched = false;
        if (!empty($user['security_pin_hash'])) {
            $salt = $user['salt'] ?? '';
            if (hash('sha256', $salt . $pin) === $user['security_pin_hash'] ||
                hash('sha256', "{$pin}:{$salt}") === $user['security_pin_hash'] ||
                hash('sha256', "{$salt}:{$pin}") === $user['security_pin_hash']) {
                $matched = true;
            }
        }

        sendSuccess(['verified' => $matched], $matched ? 'PIN verified.' : 'Invalid PIN.');
        break;

    default:
        sendError('Invalid auth action specified.', 400);
        break;
}
