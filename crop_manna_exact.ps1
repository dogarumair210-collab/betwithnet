Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\as\Desktop\bet with net\manna_actual_game.png")

# Find non-black pixels in center area
$minX = 1280; $maxX = 0; $minY = 800; $maxY = 0
for ($y = 350; $y -lt 550; $y++) {
    for ($x = 480; $x -lt 800; $x++) {
        $c = $img.GetPixel($x, $y)
        if ($c.R -gt 50 -or $c.G -gt 50 -or $c.B -gt 50) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}
Write-Host "Exact bounds: X: $minX..$maxX, Y: $minY..$maxY"

$padding = 20
$rx = [Math]::Max(0, $minX - $padding)
$ry = [Math]::Max(0, $minY - $padding)
$rw = [Math]::Min($img.Width - $rx, ($maxX - $minX) + ($padding * 2))
$rh = [Math]::Min($img.Height - $ry, ($maxY - $minY) + ($padding * 2))

$rect = New-Object System.Drawing.Rectangle($rx, $ry, $rw, $rh)
$cropped = $img.Clone($rect, $img.PixelFormat)
$outPath = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images\manna_play_logo.png"
$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
$img.Dispose()
Write-Host "Saved perfect manna_play_logo.png ($rw x $rh)"
