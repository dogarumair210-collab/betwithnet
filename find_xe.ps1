$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
$jsUrl = 'https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/ca39750374.js'
$text = $wc.DownloadString($jsUrl)
$idx = $text.IndexOf("xe=")
if ($idx -lt 0) { $idx = $text.IndexOf("xe =") }
if ($idx -lt 0) { $idx = $text.IndexOf("function xe") }
if ($idx -ge 0) {
    Write-Host $text.Substring($idx, [Math]::Min(500, $text.Length - $idx))
} else {
    Write-Host "Searching for imports or xe definition..."
    $matches = [regex]::Matches($text, '\bxe\b')
    Write-Host "xe match count: $($matches.Count)"
    foreach ($m in $matches | Select-Object -First 5) {
        $st = [Math]::Max(0, $m.Index - 50)
        $len = [Math]::Min(100, $text.Length - $st)
        Write-Host $text.Substring($st, $len)
        Write-Host "---"
    }
}
