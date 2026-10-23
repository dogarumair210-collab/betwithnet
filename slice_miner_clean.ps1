Add-Type -AssemblyName System.Drawing

$animDir = "gold_rush_template/standalone_game/assets/images/miner_anim"
if (-not (Test-Path $animDir)) {
    New-Item -ItemType Directory -Force -Path $animDir | Out-Null
}

# Sheet 13: 2048 x 2048
$bmp13 = [System.Drawing.Bitmap]::FromFile("gold_rush_template/standalone_game/assets/images/spine_charactor_charactor13.png")

# Extract 4 idle frames from col 0
for ($r = 0; $r -lt 4; $r++) {
    $x = [int]0
    $y = [int]($r * 512)
    $w = [int]512
    $h = [int]512
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $frame = $bmp13.Clone($rect, $bmp13.PixelFormat)
    $frame.Save("$animDir/idle_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved idle_$r.png"
}
$bmp13.Dispose()

# Sheet 14: 2048 x 2048
$bmp14 = [System.Drawing.Bitmap]::FromFile("gold_rush_template/standalone_game/assets/images/spine_charactor_charactor14.png")

# Extract 4 plunge frames from col 0
for ($r = 0; $r -lt 4; $r++) {
    $x = [int]0
    $y = [int]($r * 512)
    $w = [int]512
    $h = [int]512
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $frame = $bmp14.Clone($rect, $bmp14.PixelFormat)
    $frame.Save("$animDir/plunge_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved plunge_$r.png"
}

# Extract 4 celebrate frames from col 2
for ($r = 0; $r -lt 4; $r++) {
    $x = [int]1024
    $y = [int]($r * 512)
    $w = [int]512
    $h = [int]512
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $frame = $bmp14.Clone($rect, $bmp14.PixelFormat)
    $frame.Save("$animDir/cheer_$r.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $frame.Dispose()
    Write-Output "Saved cheer_$r.png"
}
$bmp14.Dispose()

Write-Output "All frames extracted successfully!"
