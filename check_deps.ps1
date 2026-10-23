$cfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Output "Deps:"
$cfg.deps -join ", "
