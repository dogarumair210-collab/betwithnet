$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
$baseUrl = 'https://of6h19kb7qx84m.copiousplus.com/meowhilo/'

$files = @(
    'src/settings.json',
    'src/settings.c3893.json',
    'index.65a65.js',
    'style.css'
)

foreach ($f in $files) {
    try {
        $str = $wc.DownloadString($baseUrl + $f)
        Write-Host "FOUND: $f (len $($str.Length))"
        $str | Out-File -FilePath "meowhilo_$([System.IO.Path]::GetFileName($f))" -Encoding utf8
    } catch {
        Write-Host "Failed: $f"
    }
}
