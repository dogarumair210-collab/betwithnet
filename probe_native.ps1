$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

# Check versions.native
# It's an array of [idx, hash, idx, hash, ...]
$arr = $b1.versions.native
for ($i = 0; $i -lt $arr.Count; $i += 2) {
    $idx = [int]$arr[$i]
    $hash = $arr[$i + 1]
    $uuid = $b1.uuids[$idx]
    
    # Try extensions .png, .jpg
    $dir = $uuid.Substring(0, 2)
    foreach ($ext in @('png', 'jpg', 'jpeg', 'webp', 'mp3')) {
        $url1 = "$baseUrl" + "assets/main/native/$dir/$uuid.$hash.$ext"
        $url2 = "$baseUrl" + "assets/main/native/$dir/$uuid.$ext"
        foreach ($u in @($url1, $url2)) {
            try {
                $headReq = [System.Net.HttpWebRequest]::Create($u)
                $headReq.Method = "HEAD"
                $headReq.UserAgent = "Mozilla/5.0"
                $resp = $headReq.GetResponse()
                $len = $resp.ContentLength
                $resp.Close()
                Write-Host "FOUND: $u ($len bytes)"
                break
            } catch {
                # continue
            }
        }
    }
}
