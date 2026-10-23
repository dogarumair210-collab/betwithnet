Add-Type -AssemblyName System.Drawing

$animDir = "gold_rush_template/standalone_game/assets/images/miner_anim"

function Crop-Tight($inFile, $outFile) {
    $src = [System.Drawing.Bitmap]::FromFile($inFile)
    # 335px width prevents touching the next column
    $rect = New-Object System.Drawing.Rectangle(50, 60, 335, 452)
    $cropped = $src.Clone($rect, $src.PixelFormat)
    $cropped.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    $src.Dispose()
    Write-Output "Saved $outFile"
}

Crop-Tight "$animDir/idle_0.png" "$animDir/miner_state_idle.png"
Crop-Tight "$animDir/plunge_2.png" "$animDir/miner_state_spin.png"
Crop-Tight "$animDir/cheer_2.png" "$animDir/miner_state_win.png"
