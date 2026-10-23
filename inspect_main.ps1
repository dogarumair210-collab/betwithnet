$json = Get-Content "main_config.json" -Raw | ConvertFrom-Json
Write-Output "Main paths sample (first 50):"
$count = 0
foreach ($prop in $json.paths.PSObject.Properties) {
    if ($count -ge 50) { break }
    Write-Output "$($prop.Name) => $($prop.Value | ConvertTo-Json -Compress)"
    $count++
}
Write-Output "Total paths: $($json.paths.PSObject.Properties.Count)"
