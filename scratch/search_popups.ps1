$url = "https://cdn.kingmidasdev.net/games/demo8/teen-patti-versus/2026-01-13-09-57-01/assets/main/index.js"
$c = (Invoke-WebRequest -Uri $url -UseBasicParsing).Content

$keywords = @("10,000", "10000", "Coins", "coins", "Free", "Bonus", "Instruction", "instruction", "Popup", "popup", "banner")
foreach ($kw in $keywords) {
    $idx = $c.IndexOf($kw)
    $cnt = 0
    while ($idx -ge 0 -and $cnt -lt 3) {
        Write-Host "[$kw at $idx]: " -NoNewline
        Write-Host $c.Substring([Math]::Max(0, $idx - 40), [Math]::Min(140, $c.Length - $idx + 40))
        $idx = $c.IndexOf($kw, $idx + 1)
        $cnt++
    }
}
