<?php
header('Content-Type: application/json');
$raw = file_get_contents('php://input');
$json = json_decode($raw, true);
$headers = function_exists('getallheaders') ? getallheaders() : [];
echo json_encode([
    'raw_len' => strlen($raw),
    'raw' => $raw,
    'json' => $json,
    'json_error' => json_last_error_msg(),
    'headers' => $headers,
    'server' => [
        'CONTENT_TYPE' => $_SERVER['CONTENT_TYPE'] ?? null,
        'HTTP_X_ADMIN_PIN' => $_SERVER['HTTP_X_ADMIN_PIN'] ?? null,
        'REQUEST_METHOD' => $_SERVER['REQUEST_METHOD'] ?? null,
    ]
]);
