Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("gold_rush_template/standalone_game/assets/images/atlas_symbols.png")
Write-Output "atlas_symbols.png dimensions: $($img.Width) x $($img.Height)"
$img.Dispose()
