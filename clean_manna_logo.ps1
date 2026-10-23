Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\as\Desktop\bet with net\manna_actual_game.png")

$rx = 520
$ry = 320
$rw = 250
$rh = 190

$rect = New-Object System.Drawing.Rectangle($rx, $ry, $rw, $rh)
$cropped = $img.Clone($rect, $img.PixelFormat)

# Make pure black background transparent
$outBmp = New-Object System.Drawing.Bitmap($rw, $rh, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $rh; $y++) {
    for ($x = 0; $x -lt $rw; $x++) {
        $c = $cropped.GetPixel($x, $y)
        if ($c.R -lt 25 -and $c.G -lt 25 -and $c.B -lt 25) {
            $outBmp.SetPixel($x, $y, [System.Drawing.Color]::Transparent)
        } else {
            $outBmp.SetPixel($x, $y, $c)
        }
    }
}

$outPath = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images\manna_play_logo.png"
$outBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$outBmp.Dispose()
$cropped.Dispose()
$img.Dispose()
Write-Host "Saved transparent manna_play_logo.png"
