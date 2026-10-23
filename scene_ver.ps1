$cfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json
$uuid114 = $cfg.uuids[114]
$uuid113 = $cfg.uuids[113]
Write-Output "Scene 114 UUID: $uuid114"
Write-Output "Scene 113 UUID: $uuid113"

Write-Output "Native or import versions:"
for ($i = 0; $i -lt $cfg.versions.import.Count; $i += 2) {
    if ($cfg.versions.import[$i] -eq 114 -or $cfg.versions.import[$i] -eq 113) {
        Write-Output "Import ver for $($cfg.versions.import[$i]): $($cfg.versions.import[$i+1])"
    }
}
