[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
try {
    $html = $wc.DownloadString("https://1x-betpk.mobi/en/casino-search?game=71040")
    Write-Output "Downloaded length: $($html.Length)"
    $html.Substring(0, [Math]::Min(1500, $html.Length)) | Out-File -FilePath "live_search_snippet.html" -Encoding utf8
    Write-Output "Saved snippet to live_search_snippet.html"
} catch {
    Write-Output "Error: $_"
}
