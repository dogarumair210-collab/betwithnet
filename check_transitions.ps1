$files = Get-ChildItem -Path "gold_rush_template/standalone_game/assets/images" -Filter "*transition*"
Write-Output "Transition files count: $($files.Count)"
foreach ($f in $files) { Write-Output $f.Name }
