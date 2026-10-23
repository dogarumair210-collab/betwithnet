$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = $c.IndexOf('balance:1e4')
while ($idx -ge 0) {
    Write-Host "--- Found balance:1e4 at $idx ---"
    Write-Host $c.Substring([Math]::Max(0, $idx - 150), 300)
    $idx = $c.IndexOf('balance:1e4', $idx + 1)
}
