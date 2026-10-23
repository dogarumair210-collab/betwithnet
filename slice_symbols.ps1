Add-Type -AssemblyName System.Drawing

$atlasPath = "gold_rush_template/standalone_game/assets/images/atlas_symbols.png"
$symbolsDir = "gold_rush_template/standalone_game/assets/images/symbols"
New-Item -ItemType Directory -Force -Path $symbolsDir | Out-Null

$atlasImg = [System.Drawing.Bitmap]::FromFile($atlasPath)

$packRaw = Get-Content "pack_07f9b45ce.json" -Raw

# Search for all objects with "name" and "rect"
$matches = [regex]::Matches($packRaw, '\{\s*"name":\s*"([^"]+)",\s*"rect":\s*\[\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\s*\]')

Write-Output "Found $($matches.Count) sprite rects in pack:"

foreach ($m in $matches) {
    $name = $m.Groups[1].Value
    $x = [int]$m.Groups[2].Value
    $y = [int]$m.Groups[3].Value
    $w = [int]$m.Groups[4].Value
    $h = [int]$m.Groups[5].Value
    
    Write-Output "  $name => [$x, $y, $w, $h]"
    
    # Crop bitmap
    $cropRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $atlasImg.Clone($cropRect, $atlasImg.PixelFormat)
    $outFile = "$symbolsDir/$name.png"
    $cropped.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Output "  Saved: $outFile ($w x $h)"
}

$atlasImg.Dispose()
Write-Output "Sliced all symbols successfully!"
