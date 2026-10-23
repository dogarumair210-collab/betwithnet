$text = [System.IO.File]::ReadAllText('games/ab_engine/assets/main/index.js')
$idx = 1673668
$start = $text.LastIndexOf('instantiateHttper', $idx)
if ($start -lt 0) { $start = [Math]::Max(0, $idx - 1500) }
$len = [Math]::Min(1500, $idx - $start)
Write-Host $text.Substring($start, $len)
