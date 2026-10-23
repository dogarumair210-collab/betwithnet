$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
$b2 = Get-Content 'bundle_config.ebec1.json' -Raw | ConvertFrom-Json
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'
$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$destDir = "C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo\all_assets"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

function Download-BundleAssets($bundleObj, $bundleName) {
    $arr = $bundleObj.versions.native
    for ($i = 0; $i -lt $arr.Count; $i += 2) {
        $idx = [int]$arr[$i]
        $hash = $arr[$i + 1]
        $uuid = $bundleObj.uuids[$idx]
        $dir = $uuid.Substring(0, 2)
        foreach ($ext in @('png', 'jpg', 'jpeg', 'webp')) {
            $u = "$baseUrl" + "assets/$bundleName/native/$dir/$uuid.$hash.$ext"
            try {
                $headReq = [System.Net.HttpWebRequest]::Create($u)
                $headReq.Method = "HEAD"
                $headReq.UserAgent = "Mozilla/5.0"
                $headReq.Timeout = 3000
                $resp = $headReq.GetResponse()
                $len = $resp.ContentLength
                $resp.Close()
                
                $outFile = "$destDir\${bundleName}_${idx}_${uuid}.${ext}"
                $wc.DownloadFile($u, $outFile)
                Write-Host "DOWNLOADED: $bundleName [idx $idx] -> $outFile ($len bytes)"
                break
            } catch {}
        }
    }
}

Download-BundleAssets $b1 "main"
Download-BundleAssets $b2 "resources"
