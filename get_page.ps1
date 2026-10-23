$uri = "https://1xbet.com.gh/en/casino-search?game=163410"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
try {
    $html = $wc.DownloadString($uri)
    [IO.File]::WriteAllText("1xbet_page.html", $html)
    Write-Host "Downloaded $($html.Length) bytes"
} catch {
    Write-Host "Error: $_"
}
