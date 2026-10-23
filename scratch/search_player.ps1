$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = $c.IndexOf('CurrentPlayer')
$count = 0
while ($idx -ge 0 -and $count -lt 15) {
    $start = [Math]::Max(0, $idx - 50)
    $len = [Math]::Min(250, $c.Length - $start)
    Write-Host "Match $count at $($idx):"
    Write-Host $c.Substring($start, $len)
    Write-Host "----------------------------------"
    $idx = $c.IndexOf('CurrentPlayer', $idx + 1)
    $count++
}
