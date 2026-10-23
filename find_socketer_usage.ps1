$text = [System.IO.File]::ReadAllText('games/ab_engine/assets/main/index.js')
$idx = $text.IndexOf('"NetworkSocketer"')
# Find where NetworkSocketer is instantiated or referenced
$pattern = 'new [a-zA-Z0-9_\.]*NetworkSocketer'
$matches = [regex]::Matches($text, $pattern)
Write-Host "Matches count: $($matches.Count)"
foreach ($m in $matches) {
    $start = [Math]::Max(0, $m.Index - 200)
    $len = [Math]::Min(500, $text.Length - $start)
    Write-Host "--- AT $($m.Index) ---"
    Write-Host $text.Substring($start, $len)
}

# Also search for 'socketServerUrl' in index.js
$idx2 = 0
while ($true) {
    $idx2 = $text.IndexOf('socketServerUrl', $idx2)
    if ($idx2 -lt 0) { break }
    $start2 = [Math]::Max(0, $idx2 - 100)
    $len2 = [Math]::Min(300, $text.Length - $start2)
    Write-Host "--- socketServerUrl at $idx2 ---"
    Write-Host $text.Substring($start2, $len2)
    $idx2 += 'socketServerUrl'.Length
}
