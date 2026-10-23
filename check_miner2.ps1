Add-Type -AssemblyName System.Drawing
$dir = "C:\Users\as\Desktop\bet with net\gold_rush_template\standalone_game\assets\images\miner_anim"
Get-ChildItem $dir -Filter "miner_state*.png" | ForEach-Object {
    Write-Host "Found $($_.Name)"
}
