$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Host "Keys in artCfg: $($artCfg.PSObject.Properties.Name -join ', ')"
if ($artCfg.paths) {
    Write-Host "Paths type: $($artCfg.paths.GetType().FullName)"
    $keys = $artCfg.paths.PSObject.Properties | Select-Object -First 10
    foreach ($k in $keys) {
        Write-Host "Key: $($k.Name) -> $($k.Value -join ', ')"
    }
}
