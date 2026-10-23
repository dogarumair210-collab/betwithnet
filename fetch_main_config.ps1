$baseUrl = "https://cors.mannagaming.com/games/MEGA_7042"
$mainConfigUrl = "$baseUrl/assets/main/config.ba8e2.json"
try {
    $mainConfig = Invoke-RestMethod -Uri $mainConfigUrl -UserAgent 'Mozilla/5.0'
    $mainConfig | ConvertTo-Json -Depth 6 | Out-File -FilePath "main_config.json" -Encoding utf8
    Write-Output "Downloaded main config successfully."
} catch {
    Write-Output "Main config error: $_"
}
