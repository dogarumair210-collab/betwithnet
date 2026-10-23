Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\as\.gemini\antigravity\brain\bedfc063-c6d1-4010-9010-2f11dc0de3b2\.user_uploaded\media_1790320907840.jpg"
$src = [System.Drawing.Image]::FromFile($srcPath)

function Generate-Splash($targetW, $targetH, $outPath, $quality = 95) {
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $scale = [double]$targetH / [double]$src.Height
    $scaledW = [int]($src.Width * $scale)
    $cropX = [int](($scaledW - $targetW) / 2.0)

    $destRect = New-Object System.Drawing.Rectangle(-$cropX, 0, $scaledW, $targetH)
    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $src.Width, $src.Height)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
    $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)

    $bmp.Save($outPath, $codec, $encoderParams)
    $bmp.Dispose()
    Write-Output "Saved: $outPath ($targetW x $targetH)"
}

# 1. Full 4K Mobile Wallpaper (2160 x 3840)
Generate-Splash 2160 3840 "assets\icons\betwithnet_4k_wallpaper_mobile.jpg" 95

# 2. Optimized Android Splash Screen (1080 x 1920)
Generate-Splash 1080 1920 "splash_bg.jpg" 92

$src.Dispose()
Write-Output "ALL_SAVED"
