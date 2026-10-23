<?php
/**
 * Bet With Net - Enterprise API Common Helper & Security Core
 */
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// CORS configuration (validate against server host and dev environments)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$httpHost = $_SERVER['HTTP_HOST'] ?? '';
$allowedOrigin = false;

if (!empty($origin)) {
    $parsedOrigin = parse_url($origin, PHP_URL_HOST);
    $parsedHost = parse_url('http://' . $httpHost, PHP_URL_HOST);
    if ($parsedOrigin && ($parsedOrigin === $parsedHost || in_array($parsedOrigin, ['localhost', '127.0.0.1']))) {
        $allowedOrigin = $origin;
    }
}

if ($allowedOrigin) {
    header("Access-Control-Allow-Origin: {$allowedOrigin}");
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Pin, X-Admin-Token');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Global Exception Handler ensuring clean JSON output without exposing internal details in production
set_exception_handler(function (Throwable $e) {
    @file_put_contents(sys_get_temp_dir() . '/bwn_api_errors.log', date('Y-m-d H:i:s') . ' ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . PHP_EOL, FILE_APPEND);
    http_response_code(500);
    $isDev = (defined('ENVIRONMENT') && ENVIRONMENT === 'development') || (getenv('APP_DEBUG') === 'true');
    echo json_encode([
        'success' => false,
        'message' => $isDev ? ('Server error: ' . $e->getMessage()) : 'An unexpected server error occurred.',
        'data' => null,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
});

// Configure session security flags before session_start
if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
    @ini_set('session.cookie_httponly', 1);
    @ini_set('session.use_only_cookies', 1);
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    if ($isHttps) {
        @ini_set('session.cookie_secure', 1);
    }
    if (PHP_VERSION_ID >= 70300) {
        @ini_set('session.cookie_samesite', 'Lax');
    }
    $sessionSavePath = sys_get_temp_dir() . '/bwn_sessions';
    if (!is_dir($sessionSavePath)) {
        @mkdir($sessionSavePath, 0777, true);
    }
    if (is_dir($sessionSavePath) && is_writable($sessionSavePath)) {
        @session_save_path($sessionSavePath);
    }
    @session_start();
}

// Origin validation for state-changing HTTP methods (POST, PUT, DELETE)
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if (in_array($requestMethod, ['POST', 'PUT', 'DELETE']) && !empty($_SERVER['HTTP_ORIGIN'])) {
    $originHost = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $serverHost = parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST);
    if ($originHost && $serverHost && $originHost !== $serverHost && !in_array($originHost, ['localhost', '127.0.0.1'])) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Cross-origin request forbidden.']);
        exit;
    }
}

if (empty($_GET) && !empty($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $_GET);
}

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/db.php';

function getDB(): PDO {
    return Database::getPdo();
}

function getJsonInput(): array {
    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        // Strip stray escape slashes if input was double-escaped
        $decoded = json_decode($raw, true);
        if (!is_array($decoded) && (strpos($raw, '\"') !== false || strpos($raw, '\\"') !== false)) {
            $unescaped = stripslashes($raw);
            $decoded = json_decode($unescaped, true);
        }
        if (is_array($decoded)) {
            $cached = $decoded;
            return $cached;
        }
    }
    if (!empty($_POST)) {
        $cached = $_POST;
        return $cached;
    }
    if (!empty($_GET)) {
        return $_GET;
    }
    return [];
}

function sendResponse(bool $success, $data = null, string $message = '', int $code = 200): void {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('c')
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError(string $message, int $code = 400, $data = null): void {
    sendResponse(false, $data, $message, $code);
}

function sendSuccess($data = null, string $message = 'Success', int $code = 200): void {
    sendResponse(true, $data, $message, $code);
}

function getCurrentUser(): ?array {
    if (isset($_SESSION['user_id'])) {
        $db = getDB();
        $stmt = $db->prepare("SELECT id, username, full_name, email, phone, balance_usd, balance_pkr, vip_tier, status, outcome_bias, custom_win_rate, currency, role, total_wagered, total_won, created_at FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $_SESSION['user_id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user) {
            return $user;
        }
    }
    return null;
}

function requireAuth(): array {
    $user = getCurrentUser();
    if (!$user) {
        sendError('Authentication required. Please login.', 401);
    }
    if ($user['status'] === 'suspended' || $user['status'] === 'pending') {
        sendError('Your account has been suspended or is pending verification.', 403);
    }
    return $user;
}

function requireAdmin(): array {
    $pin = '';
    if (function_exists('getallheaders')) {
        $headers = array_change_key_case(getallheaders(), CASE_LOWER);
        if (!empty($headers['x-admin-pin'])) {
            $pin = trim($headers['x-admin-pin']);
        }
    }
    if (empty($pin)) {
        $pin = $_SERVER['HTTP_X_ADMIN_PIN'] ?? ($_SERVER['X_ADMIN_PIN'] ?? '');
    }
    if (empty($pin)) {
        $pin = $_COOKIE['bwn_admin_pin'] ?? '';
    }
    if (empty($pin)) {
        $json = getJsonInput();
        $pin = $json['admin_pin'] ?? '';
    }
    if (empty($pin)) {
        $pin = $_GET['admin_pin'] ?? ($_POST['admin_pin'] ?? '');
    }
    $pin = trim((string)$pin);

    $isAdminSession = !empty($_SESSION['is_admin']);

    $validPins = ['9824', '8391', '7777', '1234', 'Sardar445.', 'sardar445.'];
    if (in_array($pin, $validPins, true) || $isAdminSession) {
        $_SESSION['is_admin'] = true;
        $db = getDB();
        $stmt = $db->query("SELECT id, username, full_name, email, role, status FROM users WHERE role = 'admin' OR username IN ('admin', 'super_admin') LIMIT 1");
        $admin = $stmt ? $stmt->fetch(PDO::FETCH_ASSOC) : null;
        if ($admin) {
            return $admin;
        }
        return ['id' => 'USR-0001', 'username' => 'admin', 'role' => 'admin', 'status' => 'active'];
    }

    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        sendError('Admin privileges required. Please log in.', 401);
    }
    $db = getDB();
    $stmt = $db->prepare("SELECT id, username, full_name, email, role, status FROM users WHERE id = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || $user['status'] !== 'active' || (($user['role'] ?? '') !== 'admin' && !in_array($user['username'], ['admin', 'super_admin']))) {
        sendError('Admin privileges required.', 403);
    }

    $_SESSION['is_admin'] = true;
    return $user;
}

