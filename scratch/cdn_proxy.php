<?php
// King Midas High-Speed Asset Cache & Proxy
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, HEAD, OPTIONS");
header("Access-Control-Allow-Headers: *");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$file = $_GET['file'] ?? $_GET['p'] ?? '';
$file = ltrim($file, '/');

// Security check: prevent directory traversal
if (strpos($file, '..') !== false || empty($file)) {
    http_response_code(400);
    echo "Bad Request";
    exit;
}

$cacheDir = __DIR__ . '/cache/';
$cachePath = $cacheDir . $file;

$mimeMap = [
    'js' => 'application/javascript',
    'json' => 'application/json',
    'css' => 'text/css',
    'html' => 'text/html',
    'png' => 'image/png',
    'jpg' => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'webp' => 'image/webp',
    'mp3' => 'audio/mpeg',
    'ogg' => 'audio/ogg',
    'wav' => 'audio/wav',
    'atlas' => 'text/plain',
    'txt' => 'text/plain',
    'bin' => 'application/octet-stream',
    'wasm' => 'application/wasm'
];

$ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
$contentType = $mimeMap[$ext] ?? 'application/octet-stream';

// If cached on disk, serve directly
if (file_exists($cachePath) && filesize($cachePath) > 0) {
    header("Content-Type: " . $contentType);
    header("Cache-Control: public, max-age=2592000"); // 30 days
    readfile($cachePath);
    exit;
}

// Fetch from King Midas CDN
$remoteBase = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/";
$targetUrl = $remoteBase . $file;

$ch = curl_init($targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);

$data = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$remoteType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

if ($httpCode === 200 && $data !== false && strlen($data) > 0) {
    // Save to disk cache
    @mkdir(dirname($cachePath), 0777, true);
    @file_put_contents($cachePath, $data);

    if ($remoteType) {
        $contentType = $remoteType;
    }
    header("Content-Type: " . $contentType);
    header("Cache-Control: public, max-age=2592000");
    echo $data;
    exit;
} else {
    http_response_code($httpCode ?: 404);
    echo "Asset not found: " . htmlspecialchars($file);
    exit;
}
