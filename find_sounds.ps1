$content = Get-Content "main_bundle.js" -Raw
$matches = [regex]::Matches($content, '["''"][^"''\s]+\.(mp3|ogg|wav)["''"]')
Write-Output "Sound references in main_bundle.js: $($matches.Count)"
$unique = $matches | ForEach-Object { $_.Value } | Select-Object -Unique
$unique | ForEach-Object { Write-Output "  Sound: $_" }
