$files = Get-ChildItem "gold_rush_template/standalone_game/assets/images/symbols/*.png"
Write-Output "Symbols count: $($files.Count)"
foreach ($f in $files) {
    Write-Output "  $($f.Name) ($($f.Length) bytes)"
}
