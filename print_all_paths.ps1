$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json

Write-Host "=== ART CONFIG PATHS ==="
foreach ($prop in $artCfg.paths.PSObject.Properties) {
    $val = $prop.Value[0]
    Write-Host "$($prop.Name) : $val"
}

Write-Host "=== MAIN CONFIG PATHS ==="
foreach ($prop in $mainCfg.paths.PSObject.Properties) {
    $val = $prop.Value[0]
    Write-Host "$($prop.Name) : $val"
}
