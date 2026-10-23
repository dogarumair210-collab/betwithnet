$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$html = $wc.DownloadString('https://of6h19kb7qx84m.copiousplus.com/meowhilo/index.html')
Write-Host "Length: $($html.Length)"
$html | Out-File -FilePath 'meowhilo_index.html' -Encoding utf8
Write-Host "First 500 chars:"
Write-Host $html.Substring(0, [Math]::Min(500, $html.Length))
