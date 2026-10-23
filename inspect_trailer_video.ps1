$shell = New-Object -ComObject Shell.Application
$folder = $shell.Namespace((Resolve-Path "gold_rush_template/standalone_game/assets/video").Path)
$item = $folder.ParseName("gold_rush_trailer.mp4")

# Extended properties: 27=Duration, 316=Frame width, 314=Frame height
Write-Host "Name: $($folder.GetDetailsOf($item, 0))"
Write-Host "Duration: $($folder.GetDetailsOf($item, 27))"
Write-Host "Dimensions: $($folder.GetDetailsOf($item, 316)) x $($folder.GetDetailsOf($item, 314))"
