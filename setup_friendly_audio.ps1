$audioDir = "gold_rush_template/standalone_game/assets/audio"

$map = @{
    "sound_35.mp3" = "bgm_main.mp3"
    "sound_16.mp3" = "bgm_freespin.mp3"
    "sound_21.mp3" = "win_big.mp3"
    "sound_0.mp3"  = "spin.mp3"
    "sound_2.mp3"  = "stop.mp3"
    "sound_3.mp3"  = "win.mp3"
    "sound_4.mp3"  = "multiplier.mp3"
    "sound_5.mp3"  = "scatter.mp3"
    "sound_1.mp3"  = "click.mp3"
    "sound_12.mp3" = "payout.mp3"
    "sound_7.mp3"  = "pickaxe.mp3"
}

foreach ($src in $map.Keys) {
    $dst = $map[$src]
    $srcPath = "$audioDir/$src"
    $dstPath = "$audioDir/$dst"
    if (Test-Path $srcPath) {
        Copy-Item -Path $srcPath -Destination $dstPath -Force
        Write-Output "Copied $src -> $dst"
    }
}
