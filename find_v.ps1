$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/341716ad8e.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("V=")
if ($idx -lt 0) { $idx = $text.IndexOf("V =") }
if ($idx -ge 0) {
    Write-Host $text.Substring([Math]::Max(0, $idx - 50), [Math]::Min(600, $text.Length - $idx + 50))
} else {
    $matches = [regex]::Matches($text, 'const V|let V|var V|function V')
    foreach ($m in $matches) {
        Write-Host $text.Substring($m.Index, [Math]::Min(300, $text.Length - $m.Index))
    }
}
