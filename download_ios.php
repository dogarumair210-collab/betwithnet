<?php
// Bet With Net - Apple iOS Profile Downloader
$file = __DIR__ . '/betwithnet.mobileconfig';

if (!file_exists($file)) {
    http_response_code(404);
    die('iOS Profile configuration file not found.');
}

header('Content-Description: File Transfer');
header('Content-Type: application/x-apple-aspen-config');
header('Content-Disposition: attachment; filename="betwithnet.mobileconfig"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($file));
readfile($file);
exit;
