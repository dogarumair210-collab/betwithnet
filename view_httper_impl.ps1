$path = (Resolve-Path "games/ab_engine/assets/main/index.js").Path
$content = [System.IO.File]::ReadAllText($path)
$idx = $content.IndexOf("instantiateHttper=")
if ($idx -lt 0) { $idx = $content.IndexOf(".instantiateHttper") }
Write-Host "Found at ${idx}:"
Write-Host $content.Substring([Math]::Max(0, $idx - 100), 1200)
