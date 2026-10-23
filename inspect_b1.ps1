$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
Write-Host "b1 keys: $($b1.PSObject.Properties.Name -join ', ')"
Write-Host "b1 uuids count: $($b1.uuids.Count)"
Write-Host "First 30 uuids in b1:"
$b1.uuids | Select-Object -First 30
Write-Host "b1 scenes:"
$b1.scenes | ConvertTo-Json
