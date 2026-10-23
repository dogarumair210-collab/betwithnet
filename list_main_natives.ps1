$mainCfg = Get-Content "main_config.json" -Raw | ConvertFrom-Json
Write-Host "Total native pairs in mainCfg: $($mainCfg.versions.native.Count / 2)"
for ($i = 0; $i -lt $mainCfg.versions.native.Count; $i += 2) {
    $u = $mainCfg.versions.native[$i]
    $ver = $mainCfg.versions.native[$i+1]
    $uuidStr = if ($u -match '^\d+$') { $mainCfg.uuids[[int]$u] } else { $u }
    
    $path = ""
    if ($mainCfg.paths) {
        foreach ($p in $mainCfg.paths.PSObject.Properties) {
            $idx = [int]$p.Name
            if ($mainCfg.uuids[$idx] -eq $uuidStr) {
                $path = $p.Value[0]
                break
            }
        }
    }
    Write-Host "$i : $uuidStr ($ver) -> $path"
}
