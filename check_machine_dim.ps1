Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images"
foreach ($f in @("spine_background_bg_machine.png", "spine_background_bg_front.png", "spine_background_bg_back.png")) {
    $img = [System.Drawing.Image]::FromFile("$dir\$f")
    Write-Host "$f : $($img.Width) x $($img.Height)"
    $img.Dispose()
}
