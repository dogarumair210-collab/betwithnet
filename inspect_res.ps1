$json = Get-Content "resources_config.json" -Raw | ConvertFrom-Json
Write-Output "Resources paths:"
foreach ($prop in $json.paths.PSObject.Properties) {
    Write-Output "$($prop.Name) => $($prop.Value | ConvertTo-Json -Compress)"
}
