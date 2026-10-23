$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$idx = $c.IndexOf('getUrlParameter')
while ($idx -ge 0) {
    Write-Host $c.Substring([Math]::Max(0, $idx - 30), [Math]::Min(120, $c.Length - $idx + 30))
    Write-Host "---"
    $idx = $c.IndexOf('getUrlParameter', $idx + 1)
}
