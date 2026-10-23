$json = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Output "Keys:"
$json.PSObject.Properties.Name -join ", "

Write-Output "`nPaths sample (first 40):"
$count = 0
foreach ($prop in $json.paths.PSObject.Properties) {
    if ($count -ge 40) { break }
    Write-Output "$($prop.Name) => $($prop.Value | ConvertTo-Json -Compress)"
    $count++
}

Write-Output "`nTotal paths: $($json.paths.PSObject.Properties.Count)"
Write-Output "Total uuids: $($json.uuids.Count)"
