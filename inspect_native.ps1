$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
$b2 = Get-Content 'bundle_config.ebec1.json' -Raw | ConvertFrom-Json

Write-Host "b1 extensionMap: $($b1.extensionMap | ConvertTo-Json)"
Write-Host "b1 versions.native count: $($b1.versions.native.Count)"
Write-Host "b2 extensionMap: $($b2.extensionMap | ConvertTo-Json)"
Write-Host "b2 versions.native count: $($b2.versions.native.Count)"

Write-Host "Sample b1 native entries:"
$b1.versions.native | Select-Object -First 20 | ForEach-Object {
    Write-Host "$_"
}
