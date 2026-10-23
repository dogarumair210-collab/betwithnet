Add-Type -AssemblyName System.Drawing
foreach ($f in @("spine_multiply_bomb_multiply_bomb.png", "spine_symbol_symbol_main.png", "spine_bigwin_big_win.png", "spine_background_bg_machine.png", "spine_charactor_charactor.png")) {
    $p = "gold_rush_template/standalone_game/assets/images/$f"
    if (Test-Path $p) {
        $img = [System.Drawing.Image]::FromFile($p)
        Write-Output "$f => $($img.Width) x $($img.Height)"
        $img.Dispose()
    }
}
