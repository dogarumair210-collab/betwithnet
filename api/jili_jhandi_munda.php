<?php
/**
 * JILI Games - Jhandi Munda (1xBet Game ID 105801 / JILI Game ID 397)
 * Resolves the official JILI PlusTrial redirect chain server-side and redirects directly
 * to https://casino-wbgame.jiligames.com/jhandimunda/?ssoKey=... (which has no X-Frame-Options/CSP restriction).
 */
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

$trialUrl = 'https://jiligames.com/plusplayer/PlusTrial/397/en-US';

$ch = curl_init($trialUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS      => 6,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_USERAGENT      => $_SERVER['HTTP_USER_AGENT'] ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
]);
curl_exec($ch);
$finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
curl_close($ch);

if ($finalUrl && strpos($finalUrl, 'casino-wbgame.jiligames.com') !== false) {
    header('Location: ' . $finalUrl, true, 302);
    exit;
}

header('Location: ' . $trialUrl, true, 302);
exit;
