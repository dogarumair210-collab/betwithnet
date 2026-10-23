$url = 'https://cors.mannagaming.com/games/MEGA_7042?lan=en-us&brand=manna'
try {
    $res = Invoke-WebRequest -Uri $url -UserAgent 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    Write-Output "Status: $($res.StatusCode)"
    Write-Output "Length: $($res.Content.Length)"
    Write-Output "Content snippet:"
    $res.Content.Substring(0, [Math]::Min(2000, $res.Content.Length)) | Out-File -FilePath "manna_game_snippet.html" -Encoding utf8
    Write-Output "Saved to manna_game_snippet.html"
    $res.Content | Out-File -FilePath "manna_game_full.html" -Encoding utf8
} catch {
    Write-Output "ERROR: $_"
}
