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

$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json

# Check atlas/symbols import json
$uuid34 = $artCfg.uuids[34]
$dec34 = Decode-CocosUuid $uuid34
$prefix = $dec34.Substring(0, 2)

# Check import ver in main or art
$ver34 = $null
for ($i = 0; $i -lt $artCfg.versions.import.Count; $i += 2) {
    if ($artCfg.versions.import[$i] -eq 34) { $ver34 = $artCfg.versions.import[$i+1] }
}

Write-Output "Atlas UUID 34: $uuid34 ($dec34), ver: $ver34"

# Let's try downloading the import JSON
if ($ver34) {
    $url = "https://cors.mannagaming.com/games/MEGA_7042/assets/art_7042/import/$prefix/$dec34.$ver34.json"
    Write-Output "Url: $url"
    try {
        $json = Invoke-RestMethod -Uri $url -UserAgent "Mozilla/5.0"
        $json | ConvertTo-Json -Depth 5 | Out-File -FilePath "symbols_atlas_meta.json" -Encoding utf8
        Write-Output "Downloaded symbols_atlas_meta.json!"
    } catch {
        Write-Output "Error: $_"
    }
}
