$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/341716ad8e.js'
$text = $wc.DownloadString($jsUrl)
$matches = [regex]::Matches($text, '[a-zA-Z0-9_]+\s*=\s*async\s*\([^\)]*\)\s*=>')
foreach ($m in $matches) {
    Write-Host $m.Value
    Write-Host $text.Substring($m.Index, [Math]::Min(300, $text.Length - $m.Index))
    Write-Host "---"
}
