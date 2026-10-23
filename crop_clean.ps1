Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo\all_assets\resources_11_17ed3ed5f.png'
$destDir = 'C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo'

$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# 1. Cat on coins without top pill (X: 55, Y: 190, Width: 480, Height: 340)
$catRect = New-Object System.Drawing.Rectangle(55, 190, 480, 340)
$catBmp = $src.Clone($catRect, $src.PixelFormat)
$catBmp.Save("$destDir\cat_coins_hd.png", [System.Drawing.Imaging.ImageFormat]::Png)
$catBmp.Dispose()

# 2. Entire background layout
Copy-Item $srcPath "$destDir\meow_bg.png" -Force

$src.Dispose()
Write-Host "Created cat_coins_hd.png and meow_bg.png"
