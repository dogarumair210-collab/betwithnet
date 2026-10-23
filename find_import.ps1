$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/ca39750374.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("getGamesByPartition as xe")
if ($idx -ge 0) {
    $st = [Math]::Max(0, $idx - 100)
    $len = [Math]::Min(300, $text.Length - $st)
    Write-Host $text.Substring($st, $len)
}
