$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/ca39750374.js'
$text = $wc.DownloadString($jsUrl)
Write-Host $text.Substring(0, [Math]::Min(3000, $text.Length))
