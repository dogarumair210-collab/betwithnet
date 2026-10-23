$vPath = "C:\Users\as\Downloads\WhatsApp Video 2026-09-27 at 2.48.01 AM.mp4"
$targetDir = "gold_rush_template/standalone_game/assets/video"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
$targetFile = "$targetDir/gold_rush_trailer.mp4"

Copy-Item -Path $vPath -Destination $targetFile -Force
Write-Host "Copied $vPath to $targetFile ($((Get-Item $targetFile).Length) bytes)"
