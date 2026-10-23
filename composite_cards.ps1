Add-Type -AssemblyName System.Drawing

$cardsDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets\cards"
$templateCards = "c:\Users\as\Desktop\bet with net\american_blackjack_template\standalone_game\assets\cards"

$baseImg = [System.Drawing.Bitmap]::FromFile((Join-Path $cardsDir "s_card_52.png"))
$outlineImg = [System.Drawing.Bitmap]::FromFile((Join-Path $cardsDir "s_card_outline.png"))

$suits = @("spades", "clubs", "diamonds", "hearts")
$ranks = @("2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace")

Write-Host "Compositing 52 complete cards..."

for ($s = 0; $s -lt 4; $s++) {
    for ($r = 0; $r -lt 13; $r++) {
        $idx = ($s * 13) + $r
        $idxStr = $idx.ToString("D2")
        $spriteFile = Join-Path $cardsDir "s_card_$idxStr.png"
        
        if (Test-Path $spriteFile) {
            $faceImg = [System.Drawing.Bitmap]::FromFile($spriteFile)
            
            # Create composite image with base card dimensions
            $w = $baseImg.Width
            $h = $baseImg.Height
            $composite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            $g = [System.Drawing.Graphics]::FromImage($composite)
            $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
            
            # 1. Draw base white card
            $g.DrawImage($baseImg, 0, 0, $w, $h)
            
            # 2. Draw card face
            $g.DrawImage($faceImg, 0, 0, $w, $h)
            
            # 3. Draw card outline/shadow
            $g.DrawImage($outlineImg, 0, 0, $w, $h)
            
            $g.Dispose()
            $faceImg.Dispose()
            
            # Save readable name
            $cardName = "$($ranks[$r])_of_$($suits[$s]).png"
            $outPath1 = Join-Path $cardsDir $cardName
            $outPath2 = Join-Path $templateCards $cardName
            
            $composite.Save($outPath1, [System.Drawing.Imaging.ImageFormat]::Png)
            $composite.Save($outPath2, [System.Drawing.Imaging.ImageFormat]::Png)
            
            # Also save as final_card_XX.png
            $composite.Save((Join-Path $cardsDir "final_card_$idxStr.png"), [System.Drawing.Imaging.ImageFormat]::Png)
            $composite.Save((Join-Path $templateCards "final_card_$idxStr.png"), [System.Drawing.Imaging.ImageFormat]::Png)
            
            $composite.Dispose()
            Write-Host "Composited: $cardName (Index $idxStr)"
        }
    }
}

$baseImg.Dispose()
$outlineImg.Dispose()
Write-Host "All 52 cards composited into authentic high-res cards!"
