[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13

$destDir = "gold_rush_template/standalone_game/assets"
$imgDir = "$destDir/images"
$audioDir = "$destDir/audio"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null

# Clean 0-byte files
Get-ChildItem -Path $destDir -Recurse -File | Where-Object { $_.Length -eq 0 } | Remove-Item

# 1. Download symbols atlas directly!
$symbolsAtlasUrl = "https://cors.mannagaming.com/games/MEGA_7042/assets/main/native/ee/ee3f19a6-7a61-4e92-8f50-4ed979a19863.b4844.png"
$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")
Write-Output "Downloading atlas_symbols.png..."
$wc.DownloadFile($symbolsAtlasUrl, "$imgDir/atlas_symbols.png")
Write-Output "Downloaded atlas_symbols.png: $((Get-Item "$imgDir/atlas_symbols.png").Length) bytes"

# 2. Download 1xBet Cover Logo
$coverUrl = "https://1x-betpk.mobi/genfiles/slots/games/1118/img71040.jpeg"
try {
    $wc2 = New-Object System.Net.WebClient
    $wc2.Headers.Add("User-Agent", "Mozilla/5.0")
    $wc2.DownloadFile($coverUrl, "$imgDir/cover_71040.jpeg")
    Write-Output "Downloaded cover: $((Get-Item "$imgDir/cover_71040.jpeg").Length) bytes"
} catch {
    Write-Output "Cover via 1xBet failed: $_"
}
