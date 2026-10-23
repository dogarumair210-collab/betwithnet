$text = [System.IO.File]::ReadAllText('games/ab_engine/assets/main/index.js')
$idx = 1673668
$start = [Math]::Max(0, $idx - 500)
$len = [Math]::Min(2000, $text.Length - $start)
Write-Host $text.Substring($start, $len)
