$url = "https://cors.mannagaming.com/games/MEGA_7042/assets/art_7042/import/07/07f9b45ce.aaa33.json"
try {
    $json = Invoke-RestMethod -Uri $url -UserAgent "Mozilla/5.0"
    $json | ConvertTo-Json -Depth 6 | Out-File -FilePath "pack_07f9b45ce.json" -Encoding utf8
    Write-Output "Downloaded pack_07f9b45ce.json!"
} catch {
    Write-Output "Error: $_"
}
