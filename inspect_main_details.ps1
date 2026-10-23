$cfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json
Write-Output "Main config properties:"
$cfg.PSObject.Properties.Name -join ", "

Write-Output "`nMain Types:"
for ($i = 0; $i -lt $cfg.types.Count; $i++) {
    Write-Output "  [$i] $($cfg.types[$i])"
}

Write-Output "`nMain Native count: $($cfg.versions.native.Count)"
Write-Output "Main uuids count: $($cfg.uuids.Count)"

# Native list in main
Write-Output "`nFirst 30 native assets in main:"
for ($i = 0; $i -lt [Math]::Min(30, $cfg.versions.native.Count); $i += 2) {
    $uuidIdx = $cfg.versions.native[$i]
    $ver = $cfg.versions.native[$i+1]
    $uuid = $cfg.uuids[$uuidIdx]
    $prefix = $uuid.Substring(0, 2)
    Write-Output "[$i] idx $uuidIdx : $prefix/$uuid.$ver"
}
