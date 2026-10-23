Add-Type -AssemblyName System.Drawing

$bmp = [System.Drawing.Bitmap]::FromFile("gold_rush_template/standalone_game/assets/images/spine_multiply_bomb_multiply_bomb.png")
Write-Output "Bomb bmp: $($bmp.Width) x $($bmp.Height)"

# In spine_multiply_bomb_multiply_bomb.png (385 x 253):
# Let's crop the main dynamite bomb
# Usually the bomb is centered or occupies the upper / left portion
# Let's find the bounding box of non-transparent pixels
$minX = $bmp.Width; $minY = $bmp.Height; $maxX = 0; $maxY = 0

for ($x = 0; $x -lt $bmp.Width; $x += 2) {
    for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.A -gt 20) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Non-transparent bounds: X=$minX..$maxX, Y=$minY..$maxY"

if ($maxX -gt $minX -and $maxY -gt $minY) {
    $cropW = $maxX - $minX + 1
    $cropH = $maxY - $minY + 1
    $cropRect = New-Object System.Drawing.Rectangle($minX, $minY, $cropW, $cropH)
    $cropped = $bmp.Clone($cropRect, $bmp.PixelFormat)
    
    # Create 140x140 square icon for consistency with other symbols
    $squareBmp = New-Object System.Drawing.Bitmap(140, 140)
    $g = [System.Drawing.Graphics]::FromImage($squareBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    
    $scale = [Math]::Min(130.0 / $cropW, 130.0 / $cropH)
    $destW = [int]($cropW * $scale)
    $destH = [int]($cropH * $scale)
    $destX = [int]((140 - $destW) / 2)
    $destY = [int]((140 - $destH) / 2)
    
    $g.DrawImage($cropped, $destX, $destY, $destW, $destH)
    $g.Dispose()
    $cropped.Dispose()
    
    $squareBmp.Save("gold_rush_template/standalone_game/assets/images/symbols/wild.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $squareBmp.Dispose()
    Write-Output "Saved centered 140x140 wild.png!"
}

$bmp.Dispose()
