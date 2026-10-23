$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json

Write-Host "Art paths count: $($artCfg.paths.PSObject.Properties.Count)"
foreach ($prop in $artCfg.paths.PSObject.Properties) {
    if ($prop.Name -match 'bg|back|scene|wall|sky|canyon|trailer|video') {
        Write-Host "Art Path: $($prop.Name) -> $($prop.Value)"
    }
}

if ($mainCfg.paths) {
    Write-Host "Main paths count: $($mainCfg.paths.PSObject.Properties.Count)"
    foreach ($prop in $mainCfg.paths.PSObject.Properties) {
        if ($prop.Name -match 'bg|back|scene|wall|sky|canyon|trailer|video') {
            Write-Host "Main Path: $($prop.Name) -> $($prop.Value)"
        }
    }
}
