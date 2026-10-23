$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/ca39750374.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("query")
while ($idx -ge 0) {
    Write-Host "=== QUERY AT $idx ==="
    Write-Host $text.Substring([Math]::Max(0, $idx - 50), [Math]::Min(150, $text.Length - $idx + 50))
    $idx = $text.IndexOf("query", $idx + 1)
}
