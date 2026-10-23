$wc = New-Object System.Net.WebClient
$wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
try {
    $wc.DownloadFile('https://1x-betpk.mobi/genfiles/slots/games/1238/img82994.jpeg', 'C:\Users\as\Desktop\bet with net\meow_hi_lo_logo.jpeg')
    Write-Host "Logo downloaded successfully!"
} catch {
    Write-Host "Failed logo: $($_.Exception.Message)"
}

try {
    $html = $wc.DownloadString('https://funkygames.io/demo?gameCode=602711&lang=EN')
    Write-Host "Demo HTML length: $($html.Length)"
    $html | Out-File -FilePath 'meow_hilo_demo.html' -Encoding utf8
} catch {
    Write-Host "Failed demo: $($_.Exception.Message)"
}
