Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\as\.gemini\antigravity\brain\bedfc063-c6d1-4010-9010-2f11dc0de3b2\.user_uploaded\media_1790326462412.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

function MakeAppleIcon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 6, 2, 8))
    $g.FillRectangle($bgBrush, 0, 0, $size, $size)
    $bgBrush.Dispose()

    $inner = [int]($size * 0.94)
    $offset = [int](($size - $inner) / 2)
    $dest = New-Object System.Drawing.Rectangle($offset, $offset, $inner, $inner)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
    $g.DrawImage($src, $dest, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Created: $path"
}

MakeAppleIcon 180 "assets\icons\apple_touch_icon_180.png"
MakeAppleIcon 152 "assets\icons\apple_touch_icon_152.png"
MakeAppleIcon 120 "assets\icons\apple_touch_icon_120.png"

$src.Dispose()
Write-Output "IOS_ICONS_READY"
