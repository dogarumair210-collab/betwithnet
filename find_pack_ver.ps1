$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
for ($i = 0; $i -lt $artCfg.versions.import.Count; $i += 2) {
    $id = $artCfg.versions.import[$i]
    $ver = $artCfg.versions.import[$i+1]
    if ($id -eq "07f9b45ce" -or "$id" -like "*07f9*") {
        Write-Output "Pack 07f9b45ce version: $ver"
    }
}
