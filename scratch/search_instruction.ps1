$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = 1014748
Write-Host $c.Substring([Math]::Max(0, $idx - 300), 800)
