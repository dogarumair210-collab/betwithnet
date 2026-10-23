Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets"
$imagesDir = Join-Path $baseDir "images"
$outDir = "c:\Users\as\Desktop\bet with net\american_blackjack_template\standalone_game\assets\pragmatic_ui"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force }

function Slice-Sprite($texFile, $x, $y, $w, $h, $outFile) {
    $srcImg = [System.Drawing.Bitmap]::FromFile($texFile)
    $cropRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $targetBmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $g.DrawImage($srcImg, $destRect, $cropRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $srcImg.Dispose()
    
    $targetBmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    Write-Host "Sliced: $outFile ($w x $h)"
}

# 1. Authentic Action Buttons from texture_14 (1d36b0e0ec9766140834e7324680b5e6.png)
$texButtons = Join-Path $imagesDir "texture_14_1d36b0e0ec9766140834e7324680b5e6.png"

$buttonsList = @(
    @{ name = "s_deal_default.png"; x = 300; y = 81; w = 148; h = 146 },
    @{ name = "s_deal_active.png"; x = 0; y = 77; w = 148; h = 146 },
    @{ name = "s_hit_default.png"; x = 602; y = 673; w = 148; h = 146 },
    @{ name = "s_hit_active.png"; x = 150; y = 81; w = 148; h = 146 },
    @{ name = "s_stand_default.png"; x = 150; y = 377; w = 148; h = 146 },
    @{ name = "s_stand_active.png"; x = 602; y = 525; w = 148; h = 146 },
    @{ name = "s_double_default.png"; x = 600; y = 377; w = 148; h = 146 },
    @{ name = "s_double_active.png"; x = 300; y = 229; w = 148; h = 146 },
    @{ name = "s_split_default.png"; x = 452; y = 525; w = 148; h = 146 },
    @{ name = "s_split_active.png"; x = 0; y = 225; w = 148; h = 146 },
    @{ name = "s_clear_bet_default.png"; x = 300; y = 377; w = 148; h = 146 },
    @{ name = "s_clear_bet_active.png"; x = 450; y = 377; w = 148; h = 146 },
    @{ name = "s_rebet_deal_default.png"; x = 150; y = 229; w = 148; h = 146 },
    @{ name = "s_rebet_deal_active.png"; x = 0; y = 373; w = 148; h = 146 },
    @{ name = "s_new_bet_default.png"; x = 302; y = 525; w = 148; h = 146 },
    @{ name = "s_new_bet_active.png"; x = 302; y = 673; w = 148; h = 146 },
    @{ name = "s_insurance_yes_default.png"; x = 152; y = 673; w = 148; h = 146 },
    @{ name = "s_insurance_yes_active.png"; x = 452; y = 673; w = 148; h = 146 },
    @{ name = "s_insurance_no_default.png"; x = 0; y = 521; w = 148; h = 146 },
    @{ name = "s_insurance_no_active.png"; x = 152; y = 525; w = 148; h = 146 },
    @{ name = "s_circle.png"; x = 0; y = 669; w = 150; h = 150 }
)

foreach ($b in $buttonsList) {
    Slice-Sprite $texButtons $b.x $b.y $b.w $b.h (Join-Path $outDir $b.name)
}

# 2. Authentic Table Elements:
# Betting Box: texture_3 (5e24b8d60890d1243b65a93018494d7e.png)
$tex3 = Join-Path $imagesDir "texture_3_5e24b8d60890d1243b65a93018494d7e.png"
Slice-Sprite $tex3 0 431 200 280 (Join-Path $outDir "s_betting_box.png")

# Card Dispenser (Shoe): texture_5 (d3ba0d73f6de1634ba0446b46ea9f3bb.png)
$tex5 = Join-Path $imagesDir "texture_5_d3ba0d73f6de1634ba0446b46ea9f3bb.png"
Slice-Sprite $tex5 0 243 443 235 (Join-Path $outDir "s_card_dispenser.png")

# Table Logo: texture_2 (c860ebc1188c68544bd744b8939296d8.png)
$tex2 = Join-Path $imagesDir "texture_2_c860ebc1188c68544bd744b8939296d8.png"
Slice-Sprite $tex2 0 0 776 264 (Join-Path $outDir "s_logo.png")

# Blackjack Tag & Bet Tag: texture_9 (d696216bd381c9245ba3d0bddf940589.png)
$tex9 = Join-Path $imagesDir "texture_9_d696216bd381c9245ba3d0bddf940589.png"
Slice-Sprite $tex9 0 110 363 106 (Join-Path $outDir "s_blackjack_tag.png")
Slice-Sprite $tex9 252 63 103 45 (Join-Path $outDir "s_bet_tag.png")

Write-Host "All Pragmatic UI assets sliced successfully!"
