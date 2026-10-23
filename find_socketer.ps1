$text = [System.IO.File]::ReadAllText('games/ab_engine/assets/main/index.js')
$idx = $text.IndexOf('NetworkSocketer:[function')
if ($idx -lt 0) {
    $idx = $text.IndexOf('"NetworkSocketer"')
}
if ($idx -ge 0) {
    Write-Host "Found at $idx"
    Write-Host $text.Substring($idx, [Math]::Min(1500, $text.Length - $idx))
} else {
    Write-Host "Not found"
}
