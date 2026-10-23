Add-Type -AssemblyName System.Drawing
$file13 = 'C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo\all_assets\resources_13_19e249810.png'
$img13 = [System.Drawing.Image]::FromFile($file13)
Write-Host "Width: $($img13.Width), Height: $($img13.Height)"
$img13.Dispose()
