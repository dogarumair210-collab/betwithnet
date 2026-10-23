$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/341716ad8e.js'
$text = $wc.DownloadString($jsUrl)
Write-Host "File len: $($text.Length)"
$idx = $text.IndexOf("openGameById")
if ($idx -ge 0) {
    Write-Host $text.Substring([Math]::Max(0, $idx - 50), [Math]::Min(800, $text.Length - $idx + 50))
}
