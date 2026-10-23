Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo\all_assets\resources_11_17ed3ed5f.png'
$destDir = 'C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo'

# 1. Copy the complete authentic full background screen
Copy-Item $srcPath "$destDir\meow_bg_full.png" -Force

# 2. Crop the cat & coin stage (upper part with lanterns, cat and gold coins)
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
Write-Host "Source Width: $($src.Width), Height: $($src.Height)"

# The cat and coin pile sits roughly in the range Y: 90 to 530, Width: 0 to $src.Width
$catRect = New-Object System.Drawing.Rectangle(0, 95, $src.Width, 435)
$catBmp = $src.Clone($catRect, $src.PixelFormat)
$catBmp.Save("$destDir\cat_coins_stage.png", [System.Drawing.Imaging.ImageFormat]::Png)
$catBmp.Dispose()

# 3. Also crop just the cat and coin stack cleanly (X: 50 to 520, Y: 180 to 525)
$catOnlyRect = New-Object System.Drawing.Rectangle(60, 185, $src.Width - 120, 340)
$catOnlyBmp = $src.Clone($catOnlyRect, $src.PixelFormat)
$catOnlyBmp.Save("$destDir\cat_coins_clean.png", [System.Drawing.Imaging.ImageFormat]::Png)
$catOnlyBmp.Dispose()

$src.Dispose()

Write-Host "Cropped stage and cat images successfully!"
