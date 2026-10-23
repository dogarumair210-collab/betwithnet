$b1 = Get-Content 'bundle_config.ce376.json' -Raw | ConvertFrom-Json
$b2 = Get-Content 'bundle_config.ebec1.json' -Raw | ConvertFrom-Json

Write-Host "=== BUNDLE MAIN PATHS ==="
$b1.paths.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $val = $_.Value
    Write-Host "$name -> $($val[0]) ($($val[1]))"
}

Write-Host "=== BUNDLE RESOURCES PATHS ==="
$b2.paths.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $val = $_.Value
    Write-Host "$name -> $($val[0]) ($($val[1]))"
}
