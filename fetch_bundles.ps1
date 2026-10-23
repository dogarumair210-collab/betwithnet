$baseUrl = "https://cors.mannagaming.com/games/MEGA_7042"
$artConfigUrl = "$baseUrl/assets/art_7042/config.fccb3.json"
try {
    $artConfig = Invoke-RestMethod -Uri $artConfigUrl -UserAgent 'Mozilla/5.0'
    $artConfig | ConvertTo-Json -Depth 6 | Out-File -FilePath "art_7042_config.json" -Encoding utf8
    Write-Output "Downloaded art_7042 config successfully. Paths count: $($artConfig.paths.PSObject.Properties.Count)"
} catch {
    Write-Output "Art config error: $_"
}

$resConfigUrl = "$baseUrl/assets/resources/config.24561.json"
try {
    $resConfig = Invoke-RestMethod -Uri $resConfigUrl -UserAgent 'Mozilla/5.0'
    $resConfig | ConvertTo-Json -Depth 6 | Out-File -FilePath "resources_config.json" -Encoding utf8
    Write-Output "Downloaded resources config successfully. Paths count: $($resConfig.paths.PSObject.Properties.Count)"
} catch {
    Write-Output "Res config error: $_"
}
