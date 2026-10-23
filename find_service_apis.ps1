$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/4379dbc210.js'
$text = $wc.DownloadString($jsUrl)
$matches = [regex]::Matches($text, '"/service-api/[^"]+"')
$matches | ForEach-Object { $_.Value } | Select-Object -Unique
