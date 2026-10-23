Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\as\.gemini\antigravity\brain\bedfc063-c6d1-4010-9010-2f11dc0de3b2\.user_uploaded\media_1790326462412.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Icon($size, $outPath, $safeScale = 0.90) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    # Background deep dark casino color #060208
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 6, 2, 8))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    $bgBrush.Dispose()

    # Apply safe-zone scaling so golden ring never gets clipped by Android mask
    $innerSize = [int]($size * $safeScale)
    $offset = [int](($size - $innerSize) / 2)

    $destRect = New-Object System.Drawing.Rectangle($offset, $offset, $innerSize, $innerSize)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # Save PNG
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated icon: $outPath ($size x $size, scale=$safeScale)"
}

# Ensure directory for temp output
New-Item -ItemType Directory -Force -Path "temp_icons" | Out-Null

Resize-Icon 512 "temp_icons\ic_launcher_512.png" 0.92
Resize-Icon 192 "temp_icons\ic_launcher_192.png" 0.92
Resize-Icon 144 "temp_icons\ic_launcher_144.png" 0.92
Resize-Icon 96  "temp_icons\ic_launcher_96.png" 0.92
Resize-Icon 72  "temp_icons\ic_launcher_72.png" 0.92
Resize-Icon 48  "temp_icons\ic_launcher_48.png" 0.92

# Also update project website assets
Resize-Icon 512 "assets\icons\app_launcher.png" 0.96
Resize-Icon 1024 "assets\icons\betwithnet_profile_4k.png" 0.96

$src.Dispose()
Write-Output "ALL_ICONS_CREATED_SAFE"
