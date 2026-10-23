$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$destDir = "C:\Users\as\Desktop\bet with net\assets\games\meow_hi_lo\raw"
if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force }

$urls = @(
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/13/1343bb4f1.d775b.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/17/1741fe7da.4a9b6.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/19/196a87f70.0e7c7.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/19/19be3fa79.0b401.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1b/1b47a25b7.239cd.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1b/1b6f43737.7d056.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1c/1c297a497.e636b.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1d/1d8fd2659.97e0c.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1e/1e37c56ae.49016.png',
    'https://of6h19kb7qx84m.copiousplus.com/meowhilo/assets/main/native/1e/1e72bf381.10136.png'
)

$i = 1
foreach ($u in $urls) {
    $fn = "$destDir\asset_$i.png"
    try {
        $wc.DownloadFile($u, $fn)
        Write-Host "Saved asset_$i.png ($((Get-Item $fn).Length) bytes)"
    } catch {
        Write-Host "Failed: $u"
    }
    $i++
}
