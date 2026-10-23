$json = Get-Content "pack_07f9b45ce.json" -Raw | ConvertFrom-Json
Write-Output "Pack items count: $($json.Count)"

foreach ($item in $json) {
    if ($item -is [System.Array]) {
        foreach ($sub in $item) {
            if ($sub._name -or $sub.name) {
                $n = if ($sub._name) { $sub._name } else { $sub.name }
                $rect = if ($sub._rect) { $sub._rect | ConvertTo-Json -Compress } else { "" }
                Write-Output "SpriteFrame: $n => $rect"
            }
        }
    }
}
