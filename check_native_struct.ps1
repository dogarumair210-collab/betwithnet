$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Host "versions.native count: $($artCfg.versions.native.Count)"
for ($i = 0; $i -lt 30; $i += 2) {
    $idx = $artCfg.versions.native[$i]
    $ver = $artCfg.versions.native[$i+1]
    $u = $artCfg.uuids[$idx]
    Write-Host "Index $($idx) -> $($u) = $($ver)"
}
