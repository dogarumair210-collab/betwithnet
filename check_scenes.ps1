$cfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json
Write-Output "Main scenes:"
$cfg.scenes | ConvertTo-Json

$art = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Output "Art scenes:"
$art.scenes | ConvertTo-Json
