# Complete Asset Downloader for Mega7 Gold Rush (Game 71040)

$BASE64_STR = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
$i_map = New-Object int[] 128
for ($idx = 0; $idx -lt 128; $idx++) { $i_map[$idx] = 64 }
for ($a = 0; $a -lt 64; $a++) {
    $code = [int][char]$BASE64_STR[$a]
    $i_map[$code] = $a
}
$hex_chars = "0123456789abcdef".ToCharArray()

function Decode-CocosUuid([string]$uuid) {
    if ($uuid.Length -ne 22) { return $uuid }
    $s = New-Object char[] 36
    $s[8] = '-'; $s[13] = '-'; $s[18] = '-'; $s[23] = '-'
    $indices = @(0,1,2,3,4,5,6,7, 9,10,11,12, 14,15,16,17, 19,20,21,22, 24,25,26,27,28,29,30,31,32,33,34,35)
    $s[0] = $uuid[0]; $s[1] = $uuid[1]
    $r = 2
    for ($e = 2; $e -lt 22; $e += 2) {
        $c1 = [int][char]$uuid[$e]
        $c2 = [int][char]$uuid[$e+1]
        $o = $i_map[$c1]; $l = $i_map[$c2]
        $s[$indices[$r++]] = $hex_chars[$o -shr 2]
        $s[$indices[$r++]] = $hex_chars[(($o -band 3) -shl 2) -bor ($l -shr 4)]
        $s[$indices[$r++]] = $hex_chars[$l -band 15]
    }
    return -join $s
}

$destDir = "gold_rush_template/standalone_game/assets"
$imgDir = "$destDir/images"
$audioDir = "$destDir/audio"
New-Item -ItemType Directory -Force -Path $imgDir | Out-Null
New-Item -ItemType Directory -Force -Path $audioDir | Out-Null

# 1. Download 1xBet Cover Logo
$logoUrl = "https://1x-betpk.mobi/genfiles/slots/games/1118/img71040.jpeg"
$logoPath = "$imgDir/cover_71040.jpeg"
try {
    Invoke-WebRequest -Uri $logoUrl -OutFile $logoPath -UserAgent "Mozilla/5.0"
    Write-Output "Downloaded cover: $logoPath"
} catch {
    Write-Output "Cover download failed: $_"
}

$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json

# Build main native map: uuid -> ver
$mainNativeMap = @{}
for ($i = 0; $i -lt $mainCfg.versions.native.Count; $i += 2) {
    $uIdx = $mainCfg.versions.native[$i]
    $ver = $mainCfg.versions.native[$i+1]
    $u = $mainCfg.uuids[$uIdx]
    $mainNativeMap[$u] = $ver
}

# Build art native map: uuid -> ver
$artNativeMap = @{}
for ($i = 0; $i -lt $artCfg.versions.native.Count; $i += 2) {
    $uIdx = $artCfg.versions.native[$i]
    $ver = $artCfg.versions.native[$i+1]
    $u = $artCfg.uuids[$uIdx]
    $artNativeMap[$u] = $ver
}

Write-Output "Main native count: $($mainNativeMap.Count), Art native count: $($artNativeMap.Count)"

# Function to download asset
function Fetch-NativeAsset($uuid, $folder, $filename) {
    $dec = Decode-CocosUuid $uuid
    $prefix = $dec.Substring(0, 2)
    
    # Try art first if present, then main
    $bundles = @()
    if ($artNativeMap.ContainsKey($uuid)) {
        $bundles += @{ name = "art_7042"; ver = $artNativeMap[$uuid] }
    }
    if ($mainNativeMap.ContainsKey($uuid)) {
        $bundles += @{ name = "main"; ver = $mainNativeMap[$uuid] }
    }
    
    foreach ($b in $bundles) {
        $ver = $b.ver
        $bName = $b.name
        foreach ($ext in @(".png", ".jpg", ".mp3", ".wav")) {
            $url = "https://cors.mannagaming.com/games/MEGA_7042/assets/$bName/native/$prefix/$dec.$ver$ext"
            $target = if ($ext -in @(".mp3", ".wav")) { "$audioDir/$filename$ext" } else { "$imgDir/$filename$ext" }
            if (Test-Path $target) { return $target }
            try {
                Invoke-WebRequest -Uri $url -OutFile $target -UserAgent "Mozilla/5.0"
                Write-Output "Downloaded: $filename$ext from $bName"
                return $target
            } catch {
                # try next
            }
        }
    }
    return $null
}

# 2. Download Named Visual Assets from paths
Write-Output "`nDownloading named assets..."
foreach ($p in $artCfg.paths.PSObject.Properties) {
    $idx = [int]$p.Name
    $pathName = $p.Value[0]
    $typeIdx = $p.Value[1]
    $typeName = $artCfg.types[$typeIdx]
    
    if ($typeName -in @("cc.Texture2D", "cc.SpriteAtlas", "sp.SkeletonData")) {
        $uuid = $artCfg.uuids[$idx]
        $cleanName = ($pathName -replace '[\\/]', '_')
        Fetch-NativeAsset $uuid "" $cleanName | Out-Null
    }
}

# 3. Download All Audio in main bundle
Write-Output "`nScanning all main native assets for audio..."
$audioIdx = 1
for ($i = 0; $i -lt $mainCfg.versions.native.Count; $i += 2) {
    $uIdx = $mainCfg.versions.native[$i]
    $ver = $mainCfg.versions.native[$i+1]
    $uuid = $mainCfg.uuids[$uIdx]
    $dec = Decode-CocosUuid $uuid
    $prefix = $dec.Substring(0, 2)
    
    $urlMp3 = "https://cors.mannagaming.com/games/MEGA_7042/assets/main/native/$prefix/$dec.$ver.mp3"
    $targetMp3 = "$audioDir/sfx_$audioIdx.mp3"
    
    try {
        $req = [System.Net.WebRequest]::Create($urlMp3)
        $req.Method = "HEAD"
        $req.UserAgent = "Mozilla/5.0"
        $resp = $req.GetResponse()
        $resp.Close()
        
        # It's an MP3!
        Invoke-WebRequest -Uri $urlMp3 -OutFile $targetMp3 -UserAgent "Mozilla/5.0"
        Write-Output "Downloaded MP3: sfx_$audioIdx.mp3 ($($resp.ContentLength) bytes)"
        $audioIdx++
    } catch {
        # Not an MP3
    }
}

Write-Output "`nDownloaded $($audioIdx - 1) audio files!"
$imgCount = (Get-ChildItem -Path $imgDir).Count
$sndCount = (Get-ChildItem -Path $audioDir).Count
Write-Output "Total Images: $imgCount"
Write-Output "Total Sounds: $sndCount"
