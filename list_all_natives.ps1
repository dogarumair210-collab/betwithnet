$artCfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
Write-Host "Total native pairs: $($artCfg.versions.native.Count / 2)"
for ($i = 0; $i -lt $artCfg.versions.native.Count; $i += 2) {
    $u = $artCfg.versions.native[$i]
    $ver = $artCfg.versions.native[$i+1]
    
    # Check if $u is an index in uuids or the string
    $uuidStr = if ($u -match '^\d+$') { $artCfg.uuids[[int]$u] } else { $u }
    
    # Check path
    $path = ""
    foreach ($p in $artCfg.paths.PSObject.Properties) {
        $idx = [int]$p.Name
        if ($artCfg.uuids[$idx] -eq $uuidStr) {
            $path = $p.Value[0]
            break
        }
    }
    Write-Host "$i : $uuidStr ($ver) -> $path"
}
