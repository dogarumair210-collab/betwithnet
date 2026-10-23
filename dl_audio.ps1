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

$destDir = "gold_rush_template/standalone_game/assets/audio"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json
$baseUrl = "https://cors.mannagaming.com/games/MEGA_7042/assets/main/native"

$wc = New-Object System.Net.WebClient
$wc.Headers.Add("User-Agent", "Mozilla/5.0")

Write-Output "Scanning native files in main for MP3 audio..."
$audioCount = 0

for ($i = 0; $i -lt $mainCfg.versions.native.Count; $i += 2) {
    $uIdx = $mainCfg.versions.native[$i]
    $ver = $mainCfg.versions.native[$i+1]
    $uuid = $mainCfg.uuids[$uIdx]
    $dec = Decode-CocosUuid $uuid
    $prefix = $dec.Substring(0, 2)
    
    $url = "$baseUrl/$prefix/$dec.$ver.mp3"
    $localFile = "$destDir/sound_$audioCount.mp3"
    
    try {
        # Check HEAD first
        $req = [System.Net.WebRequest]::Create($url)
        $req.Method = "HEAD"
        $req.Timeout = 4000
        $req.UserAgent = "Mozilla/5.0"
        $resp = $req.GetResponse()
        $len = $resp.ContentLength
        $resp.Close()
        
        # Download
        $wc.DownloadFile($url, $localFile)
        Write-Output "Downloaded MP3 sound_$audioCount.mp3 ($len bytes)"
        $audioCount++
    } catch {
        # Not an MP3
    }
}

Write-Output "Total audio files downloaded: $audioCount"
