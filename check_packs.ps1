$cfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Output "Packs count: $($cfg.packs.PSObject.Properties.Count)"
foreach ($prop in $cfg.packs.PSObject.Properties) {
    Write-Output "Pack $($prop.Name): $($prop.Value.Count) items"
}
Write-Output "Redirect count: $($cfg.redirect.Count)"
for ($i = 0; $i -lt [Math]::Min(20, $cfg.redirect.Count); $i += 2) {
    Write-Output "Redirect $($cfg.redirect[$i]) -> $($cfg.redirect[$i+1])"
}
