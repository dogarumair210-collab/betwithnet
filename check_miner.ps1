Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images\miner_anim"
Get-ChildItem $dir -Filter "*.png" | ForEach-Object {
    $img = [System.Drawing.Image]::FromFile($_.FullName)
    Write-Host "$($_.Name) : $($img.Width) x $($img.Height)"
    $img.Dispose()
}
