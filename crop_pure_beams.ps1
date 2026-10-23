Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images"
$mach = [System.Drawing.Bitmap]::FromFile("$dir\spine_background_bg_machine.png")

# Right beam pure: X: 615..711, Y: 235..790
$rRight = New-Object System.Drawing.Rectangle(615, 235, 96, 555)
$bRight = $mach.Clone($rRight, $mach.PixelFormat)
$bRight.Save("$dir\cabinet_right_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bRight.Dispose()

# Top beam pure: X: 140..710, Y: 18..98
$rTop = New-Object System.Drawing.Rectangle(140, 18, 570, 80)
$bTop = $mach.Clone($rTop, $mach.PixelFormat)
$bTop.Save("$dir\cabinet_top_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bTop.Dispose()

# Left beam pure: X: 0..120, Y: 105..965
$rLeft = New-Object System.Drawing.Rectangle(0, 105, 120, 860)
$bLeft = $mach.Clone($rLeft, $mach.PixelFormat)
$bLeft.Save("$dir\cabinet_left_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bLeft.Dispose()

$mach.Dispose()
Write-Host "Perfect cabinet beams cropped!"
