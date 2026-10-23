$baseUrl = "https://cors.mannagaming.com/games/MEGA_7042"
$mainJsUrl = "$baseUrl/assets/main/index.ba8e2.js"
try {
    $mainJs = Invoke-WebRequest -Uri $mainJsUrl -UserAgent 'Mozilla/5.0'
    $mainJs.Content | Out-File -FilePath "main_bundle.js" -Encoding utf8
    Write-Output "Downloaded main bundle JS: $($mainJs.Content.Length) bytes"
} catch {
    Write-Output "Main bundle JS error: $_"
}
