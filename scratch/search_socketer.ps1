$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = $c.IndexOf('RoomSocketer')
while ($idx -ge 0) {
    Write-Host "--- RoomSocketer at $idx ---"
    Write-Host $c.Substring([Math]::Max(0, $idx - 100), 250)
    $idx = $c.IndexOf('RoomSocketer', $idx + 1)
}
