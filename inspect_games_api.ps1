$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/4379dbc210.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("getGamesByPartition")
while ($idx -ge 0) {
    $st = [Math]::Max(0, $idx - 50)
    $len = [Math]::Min(300, $text.Length - $st)
    Write-Host "=== MATCH ==="
    Write-Host $text.Substring($st, $len)
    $idx = $text.IndexOf("getGamesByPartition", $idx + 1)
}
