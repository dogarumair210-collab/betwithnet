$content = Get-Content "main_bundle.js" -Raw
$matches = [regex]::Matches($content, '(?i)(playMusic|playEffect|audioClip|AudioClip|audioSource|playBgm|playSound|bgm|sfx)\w*')
Write-Output "Sound keyword matches: $($matches.Count)"
$unique = $matches | ForEach-Object { $_.Value } | Select-Object -Unique
$unique | Select-Object -First 30 | ForEach-Object { Write-Output "  $_" }
