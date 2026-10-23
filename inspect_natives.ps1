$json = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json

Write-Output "Types:"
for ($i = 0; $i -lt $json.types.Count; $i++) {
    Write-Output "  [$i] $($json.types[$i])"
}

Write-Output "`nVersions properties:"
$json.versions.PSObject.Properties.Name -join ", "

Write-Output "`nNative files count: $($json.versions.native.Count)"
Write-Output "`nFirst 20 native entries:"
for ($i = 0; $i -lt [Math]::Min(20, $json.versions.native.Count); $i += 2) {
    $uuidIdx = $json.versions.native[$i]
    $ver = $json.versions.native[$i+1]
    $uuid = $json.uuids[$uuidIdx]
    Write-Output "UUID idx: $uuidIdx ($uuid) -> ver: $ver"
}
