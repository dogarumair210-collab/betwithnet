<?php
$ch = curl_init("https://jiligames.com/plusplayer/PlusTrial/223/en-US");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_USERAGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
$html = curl_exec($ch);
$effUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
echo "EFFECTIVE URL: " . $effUrl . "\n";
echo "HTML LEN: " . strlen($html) . "\n";
curl_close($ch);
