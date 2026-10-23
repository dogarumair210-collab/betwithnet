$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$str = $wc.DownloadString($baseUrl + 'src/settings.45848.json')
Write-Host "settings len: $($str.Length)"
$str | Out-File -FilePath 'meowhilo_settings.json' -Encoding utf8
$matches = [regex]::Matches($str, '["''][^"'']*(?:bg|background|table|desk|board|room|wallpaper|cat)[^"'']*["'']', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
Write-Host "Matches found: $($matches.Count)"
$matches | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 30
