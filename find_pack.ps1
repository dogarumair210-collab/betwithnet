$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
foreach ($packName in $artCfg.packs.PSObject.Properties.Name) {
    $items = $artCfg.packs.$packName
    if ($items -contains 34 -or $items -contains "34") {
        Write-Output "UUID 34 is in pack: $packName"
    }
}
Write-Output "Packs details:"
foreach ($prop in $artCfg.packs.PSObject.Properties) {
    Write-Output "Pack $($prop.Name): $($prop.Value -join ', ')"
}
