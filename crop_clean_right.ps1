Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images"
$mach = [System.Drawing.Bitmap]::FromFile("$dir\spine_background_bg_machine.png")

# Right beam: X: 638..711, Y: 235..780
$rRight = New-Object System.Drawing.Rectangle(638, 235, 73, 545)
$bRight = $mach.Clone($rRight, $mach.PixelFormat)
$bRight.Save("$dir\cabinet_right_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bRight.Dispose()
$mach.Dispose()
Write-Host "Right beam updated!"
