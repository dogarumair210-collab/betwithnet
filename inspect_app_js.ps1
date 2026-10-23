$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$str = $wc.DownloadString($baseUrl + 'application.82ccd.js')
Write-Host "application len: $($str.Length)"
$str | Out-File -FilePath 'meowhilo_application.js' -Encoding utf8
$matches = [regex]::Matches($str, '["''][^"'']+\.(?:png|jpg|jpeg|webp|json|mp3|mp4|wav)["'']')
$matches | ForEach-Object { $_.Value } | Select-Object -Unique
