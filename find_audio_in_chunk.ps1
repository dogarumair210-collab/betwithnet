$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$str = $wc.DownloadString($baseUrl + 'src/chunks/bundle.e9cd5.js')
Write-Host "chunk len: $($str.Length)"
$matches = [regex]::Matches($str, '["''][^"'']+\.(?:mp3|wav|ogg|m4a|aac)["'']')
Write-Host "Audio references count: $($matches.Count)"
$matches | ForEach-Object { $_.Value } | Select-Object -Unique
