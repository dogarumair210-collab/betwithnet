[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12 -bor [System.Net.SecurityProtocolType]::Tls13

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

$destDir = "gold_rush_template/standalone_game/assets/images"
$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json

$mainMap = @{}
for ($i = 0; $i -lt $mainCfg.versions.native.Count; $i += 2) {
    $uIdx = $mainCfg.versions.native[$i]
    $ver = $mainCfg.versions.native[$i+1]
    $u = $mainCfg.uuids[$uIdx]
    $mainMap[$u] = $ver
}

$artMap = @{}
for ($i = 0; $i -lt $artCfg.versions.native.Count; $i += 2) {
    $uIdx = $artCfg.versions.native[$i]
    $ver = $artCfg.versions.native[$i+1]
    $u = $artCfg.uuids[$uIdx]
    $artMap[$u] = $ver
}

$animationTargets = @(
    "spine/free_transitions/free_transitions",
    "spine/free_transitions/free_transitions_word",
    "spine/settlement/settlement",
    "spine/settlement/settlement_word",
    "spine/settlement/settlement_charactor",
    "spine/symbol/symbol_explosion",
    "spine/symbol/fx",
    "spine/charactor/charactor4",
    "spine/charactor/charactor8",
    "spine/charactor/charactor13",
    "spine/charactor/charactor14",
    "spine/charactor/charactor16"
)

$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

foreach ($t in $animationTargets) {
    foreach ($prop in $artCfg.paths.PSObject.Properties) {
        $pName = $prop.Value[0]
        $pType = $artCfg.types[$prop.Value[1]]
        if ($pName -eq $t -and $pType -in @("cc.Texture2D", "cc.Asset")) {
            $uuidIdx = [int]$prop.Name
            $uuid = $artCfg.uuids[$uuidIdx]
            $dec = Decode-CocosUuid $uuid
            $prefix = $dec.Substring(0, 2)
            $cleanName = ($t -replace '[\\/]', '_')
            
            $ver = $null
            $bundle = "main"
            if ($mainMap.ContainsKey($uuid)) {
                $ver = $mainMap[$uuid]
                $bundle = "main"
            } elseif ($artMap.ContainsKey($uuid)) {
                $ver = $artMap[$uuid]
                $bundle = "art_7042"
            }
            
            if ($ver) {
                foreach ($ext in @(".png", ".jpg")) {
                    $url = "https://cors.mannagaming.com/games/MEGA_7042/assets/$bundle/native/$prefix/$dec.$ver$ext"
                    $outPath = "$destDir/$cleanName$ext"
                    if (-not (Test-Path $outPath)) {
                        try {
                            $wc.DownloadFile($url, $outPath)
                            Write-Output "Downloaded: $cleanName$ext ($((Get-Item $outPath).Length) bytes)"
                            break
                        } catch {}
                    } else {
                        Write-Output "Already exists: $cleanName$ext"
                        break
                    }
                }
            }
        }
    }
}
Write-Output "Done downloading animation targets."
