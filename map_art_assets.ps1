$json = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json

# Build uuid to native map
$nativeMap = @{}
for ($i = 0; $i -lt $json.versions.native.Count; $i += 2) {
    $uuidIdx = $json.versions.native[$i]
    $ver = $json.versions.native[$i+1]
    $nativeMap[$uuidIdx] = $ver
}

Write-Output "Mapping paths to native assets:"
foreach ($prop in $json.paths.PSObject.Properties) {
    $idx = [int]$prop.Name
    $val = $prop.Value
    $pathStr = $val[0]
    $typeIdx = $val[1]
    $typeName = $json.types[$typeIdx]
    
    if ($nativeMap.ContainsKey($idx)) {
        $uuid = $json.uuids[$idx]
        $ver = $nativeMap[$idx]
        $prefix = $uuid.Substring(0, 2)
        Write-Output "[$typeName] $pathStr => native/$prefix/$uuid.$ver"
    } else {
        # Check if type is SpriteFrame or Atlas or SkeletonData
        Write-Output "[$typeName] $pathStr (uuid idx $idx)"
    }
}
