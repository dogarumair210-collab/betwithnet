$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
$b2 = Get-Content 'bundle_config.ebec1.json' -Raw | ConvertFrom-Json

Write-Host "B1 types:"
$b1.types | ForEach-Object { Write-Host " - $_" }
Write-Host "B2 types:"
$b2.types | ForEach-Object { Write-Host " - $_" }

Write-Host "B1 paths with audio or sound:"
$b1.paths.PSObject.Properties | Where-Object { $_.Value[0] -match 'audio|sound|music|voice|bgm|sfx' } | ForEach-Object {
    Write-Host "$($_.Name) -> $($_.Value[0])"
}

Write-Host "B2 paths with audio or sound:"
$b2.paths.PSObject.Properties | Where-Object { $_.Value[0] -match 'audio|sound|music|voice|bgm|sfx' } | ForEach-Object {
    Write-Host "$($_.Name) -> $($_.Value[0])"
}
