$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/entry-18b374a3fb.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("whence:e,geoCurrency:a")
if ($idx -ge 0) {
    Write-Host $text.Substring($idx - 300, 400)
}
