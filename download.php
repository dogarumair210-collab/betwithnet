<?php
/**
 * Bet With Net - Official Android APK Secure Download Handler
 * Ensures proper MIME types and binary transfer headers for mobile browsers
 */

$apkPath = __DIR__ . '/betwithnet.apk';

if (!file_exists($apkPath)) {
    http_response_code(404);
    die('Error: Application package not found on server.');
}

$fileSize = filesize($apkPath);
$fileName = 'betwithnet.apk';

// Clear all active output buffers to avoid corrupting APK binary data
while (ob_get_level()) {
    ob_end_clean();
}

// Set standard headers for Android APK download
header('Content-Description: File Transfer');
header('Content-Type: application/vnd.android.package-archive');
header('Content-Disposition: attachment; filename="' . $fileName . '"');
header('Content-Transfer-Encoding: binary');
header('Expires: 0');
header('Cache-Control: must-revalidate, post-check=0, pre-check=0, public');
header('Pragma: public');
header('Content-Length: ' . $fileSize);
header('X-Content-Type-Options: nosniff');

// Read file directly to output
readfile($apkPath);
exit;
