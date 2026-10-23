$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/341716ad8e.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("fetchGameById")
Write-Host "Index of fetchGameById: $idx, Total len: $($text.Length)"
if ($idx -ge 0) {
    $st = [Math]::Max(0, $idx - 300)
    $len = [Math]::Min(300, $text.Length - $st)
    Write-Host $text.Substring($st, $len)
}
