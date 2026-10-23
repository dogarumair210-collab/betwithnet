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

$items = @(
    @{ name = "atlas_all_bg.png"; uuid = "a3rNJW6K5Dpaq0aVOC4Aq7"; ver = "25240" },
    @{ name = "atlas_mountain.png"; uuid = "a62Lsm5M1LRqAJOy+UGhcq"; ver = "0e05a" },
    @{ name = "atlas_Bg.png"; uuid = "6dqQsVdhtKCIYRuI3lZLMZ"; ver = "ec46a" }
)

foreach ($item in $items) {
    $dec = Decode-CocosUuid $item.uuid
    $prefix = $dec.Substring(0, 2)
    $ver = $item.ver
    $name = $item.name
    $url = "https://cors.mannagaming.com/games/MEGA_7042/assets/main/native/$prefix/$dec.$ver.png"
    $out = "$destDir/$name"
    Write-Host "Fetching $name from $url"
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UserAgent "Mozilla/5.0"
        Write-Host "SUCCESS: Saved $out ($((Get-Item $out).Length) bytes)"
    } catch {
        Write-Host "Failed: $_"
    }
}
