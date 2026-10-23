Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\as\Desktop\bet with net\manna_actual_game.png")
Write-Host "manna_actual_game size: $($img.Width) x $($img.Height)"

# Crop the MP Manna Play logo from center
# Screen is 1280x800, center is 640x400
# Logo is around X: 520..760, Y: 400..510
$rect = New-Object System.Drawing.Rectangle(520, 390, 240, 150)
$cropped = $img.Clone($rect, $img.PixelFormat)
$outPath = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images\manna_play_logo.png"
$cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropped.Dispose()
$img.Dispose()
Write-Host "Saved manna_play_logo.png"
