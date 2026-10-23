Add-Type -AssemblyName System.Drawing

$animDir = "gold_rush_template/standalone_game/assets/images/miner_anim"
New-Item -ItemType Directory -Force -Path $animDir | Out-Null

$src13 = "gold_rush_template/standalone_game/assets/images/spine_charactor_charactor13.png"
$bmp13 = [System.Drawing.Bitmap]::FromFile($src13)

# 4 columns x 4 rows in 2048x2048 -> each frame is 512x512
$frameW = 512
$frameH = 512

Write-Output "Slicing miner idle frames from sheet 13..."
# Column 0: 4 idle frames (row 0, 1, 2, 3)
for ($r = 0; $r -lt 4; $r++) {
    $rect = New-Object System.Drawing.Rectangle(0, $r * $frameH, $frameW, $frameH)
    $frame = $bmp13.Clone($rect, $bmp13.PixelFormat)
    $frame.Save("$animDir/miner_idle_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved miner_idle_$r.png"
}

# Column 1: 4 looking frames
for ($r = 0; $r -lt 4; $r++) {
    $rect = New-Object System.Drawing.Rectangle($frameW, $r * $frameH, $frameW, $frameH)
    $frame = $bmp13.Clone($rect, $bmp13.PixelFormat)
    $frame.Save("$animDir/miner_look_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved miner_look_$r.png"
}
$bmp13.Dispose()

# From sheet 14: plunger press and celebration frames
$src14 = "gold_rush_template/standalone_game/assets/images/spine_charactor_charactor14.png"
$bmp14 = [System.Drawing.Bitmap]::FromFile($src14)

# Column 0: plunger steps
for ($r = 0; $r -lt 4; $r++) {
    $rect = New-Object System.Drawing.Rectangle(0, $r * $frameH, $frameW, $frameH)
    $frame = $bmp14.Clone($rect, $bmp14.PixelFormat)
    $frame.Save("$animDir/miner_plunge_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved miner_plunge_$r.png"
}

# Column 2: plunge bottom & push
for ($r = 0; $r -lt 4; $r++) {
    $rect = New-Object System.Drawing.Rectangle(2 * $frameW, $r * $frameH, $frameW, $frameH)
    $frame = $bmp14.Clone($rect, $bmp14.PixelFormat)
    $frame.Save("$animDir/miner_cheer_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved miner_cheer_$r.png"
}
$bmp14.Dispose()

Write-Output "Sliced all miner animation frames!"
