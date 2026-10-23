$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$str = $wc.DownloadString($baseUrl + 'src/chunks/bundle.e9cd5.js')
$matches = [regex]::Matches($str, '[a-zA-Z0-9_]*(?:audio|sound|music|voice)[a-zA-Z0-9_]*', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$matches | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 30
