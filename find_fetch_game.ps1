$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/341716ad8e.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("fetchGameById")
if ($idx -ge 0) {
    Write-Host $text.Substring([Math]::Max(0, $idx - 300), 600)
}
$idx2 = $text.IndexOf("/service-api/")
while ($idx2 -ge 0) {
    Write-Host "API: " + $text.Substring($idx2, [Math]::Min(100, $text.Length - $idx2))
    $idx2 = $text.IndexOf("/service-api/", $idx2 + 1)
}
