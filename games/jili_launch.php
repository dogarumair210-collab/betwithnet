<?php
/**
 * JILI Official Trial Game SSO Resolver
 * Resolves the 302 redirect chain server-side so the browser iframe loads
 * the final casino-wbgame.jiligames.com URL directly without hitting
 * intermediate frame-ancestors CSP headers.
 */
$gameId = isset($_GET['gameId']) ? preg_replace('/[^0-9]/', '', $_GET['gameId']) : '223';
if (empty($gameId)) {
    $gameId = '223';
}
$lang = isset($_GET['lang']) ? preg_replace('/[^a-zA-Z\-]/', '', $_GET['lang']) : 'en-US';
$startUrl = "https://tadagaming.com/PlusTrial/{$gameId}/en-us";

$ch = curl_init($startUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_NOBODY         => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 5,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT      => $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
]);
curl_exec($ch);
$finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (!empty($finalUrl) && (strpos($finalUrl, 'casino-wbgame.tadagaming.com') !== false || strpos($finalUrl, 'casino-wbgame.jiligames.com') !== false)) {
    header("Location: " . $finalUrl, true, 302);
    exit;
}

header("Location: " . $startUrl, true, 302);
exit;
