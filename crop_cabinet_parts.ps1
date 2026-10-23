Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images"

$mach = [System.Drawing.Bitmap]::FromFile("$dir\spine_background_bg_machine.png")
$front = [System.Drawing.Bitmap]::FromFile("$dir\spine_background_bg_front.png")

# 1. Top Beam (CAUTION sign)
# spine_background_bg_machine is 711x1026
# Top beam is roughly X: 140..710, Y: 15..110
$rTop = New-Object System.Drawing.Rectangle(140, 15, 570, 95)
$bTop = $mach.Clone($rTop, $mach.PixelFormat)
$bTop.Save("$dir\cabinet_top_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bTop.Dispose()

# 2. Left Wooden Pillar
# X: 0..130, Y: 105..970
$rLeft = New-Object System.Drawing.Rectangle(0, 105, 130, 865)
$bLeft = $mach.Clone($rLeft, $mach.PixelFormat)
$bLeft.Save("$dir\cabinet_left_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bLeft.Dispose()

# 3. Right Wooden Pillar ("1024 WAYS")
# X: 595..710, Y: 240..800
$rRight = New-Object System.Drawing.Rectangle(595, 240, 115, 560)
$bRight = $mach.Clone($rRight, $mach.PixelFormat)
$bRight.Save("$dir\cabinet_right_beam.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bRight.Dispose()

# 4. Brass Gear
# X: 470..605, Y: 550..685
$rGear = New-Object System.Drawing.Rectangle(470, 555, 135, 135)
$bGear = $mach.Clone($rGear, $mach.PixelFormat)
$bGear.Save("$dir\cabinet_gear.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bGear.Dispose()

# 5. Rock Pedestal from front
# spine_background_bg_front is 1051x387
# Left rock: X: 0..470, Y: 25..380
$rRock = New-Object System.Drawing.Rectangle(0, 25, 470, 360)
$bRock = $front.Clone($rRock, $front.PixelFormat)
$bRock.Save("$dir\miner_rock_pedestal.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bRock.Dispose()

$mach.Dispose()
$front.Dispose()
Write-Host "Cropped all authentic machine cabinet elements!"
