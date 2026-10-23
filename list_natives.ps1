$cfg = Get-Content "art_7042_config.json" -Raw | ConvertFrom-Json
$baseUrl = "https://cors.mannagaming.com/games/MEGA_7042/assets/art_7042/native"

# Map uuid to path and type
$pathToUuid = @{}
foreach ($p in $cfg.paths.PSObject.Properties) {
    $uuidIdx = [int]$p.Name
    $pathName = $p.Value[0]
    $typeIdx = $p.Value[1]
    $typeName = $cfg.types[$typeIdx]
    $pathToUuid[$uuidIdx] = @{
        path = $pathName
        type = $typeName
    }
}

Write-Output "Native assets list:"
for ($i = 0; $i -lt $cfg.versions.native.Count; $i += 2) {
    $uuidIdx = $cfg.versions.native[$i]
    $ver = $cfg.versions.native[$i+1]
    $uuid = $cfg.uuids[$uuidIdx]
    $prefix = $uuid.Substring(0, 2)
    $info = $pathToUuid[$uuidIdx]
    $name = if ($info) { "$($info.path) ($($info.type))" } else { "raw" }
    Write-Output "[$i] idx $uuidIdx : $prefix/$uuid.$ver => $name"
}
