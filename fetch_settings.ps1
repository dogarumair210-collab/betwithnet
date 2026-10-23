$url = 'https://cors.mannagaming.com/games/MEGA_7042/src/settings.fb193.js'
try {
    $res = Invoke-WebRequest -Uri $url -UserAgent 'Mozilla/5.0'
    $res.Content | Out-File -FilePath "manna_settings.js" -Encoding utf8
    Write-Output "Downloaded settings. Length: $($res.Content.Length)"
} catch {
    Write-Output "ERROR: $_"
}
