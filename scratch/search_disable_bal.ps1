$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = $c.IndexOf('disableBalance')
while ($idx -ge 0) {
    Write-Host "--- Found disableBalance at $idx ---"
    Write-Host $c.Substring([Math]::Max(0, $idx - 150), 300)
    $idx = $c.IndexOf('disableBalance', $idx + 1)
}
