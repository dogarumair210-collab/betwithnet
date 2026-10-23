$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/resources/index.js"
try {
    $c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content
    Write-Host "Resources bundle length: $($c.Length)"
    $idx = $c.IndexOf('10000')
    while ($idx -ge 0) {
        Write-Host "--- Found 10000 in resources at $idx ---"
        Write-Host $c.Substring([Math]::Max(0, $idx - 100), 200)
        $idx = $c.IndexOf('10000', $idx + 1)
    }
} catch {
    Write-Host "Error: $_"
}
