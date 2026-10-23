$path = (Resolve-Path "games/ab_engine/assets/main/index.js").Path
$content = [System.IO.File]::ReadAllText($path)
Write-Host $content.Substring(1683444, 1500)
