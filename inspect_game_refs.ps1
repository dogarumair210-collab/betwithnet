$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/ca39750374.js'
$text = $wc.DownloadString($jsUrl)
Write-Host "File length: $($text.Length)"
$idx = $text.IndexOf("game")
$count = 0
while ($idx -ge 0 -and $count -lt 10) {
    $start = [Math]::Max(0, $idx - 80)
    $len = [Math]::Min(200, $text.Length - $start)
    Write-Host "=== MATCH $count ==="
    Write-Host $text.Substring($start, $len)
    $idx = $text.IndexOf("game", $idx + 1)
    $count++
}
