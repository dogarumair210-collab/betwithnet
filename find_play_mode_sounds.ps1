$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

$matches = [regex]::Matches($c, '"([a-zA-Z0-9_]+)"\s*:\s*\{"nestedFieldType":"AudioClipPlayModeAware"[^}]+"clipNormal"\s*:\s*\{"fileID":\d+,"guid":"([a-f0-9]{32})"')
Write-Host "Found $($matches.Count) AudioClipPlayModeAware sounds:"
$dict = @{}
foreach ($m in $matches) {
    $prop = $m.Groups[1].Value
    $guid = $m.Groups[2].Value
    if (-not $dict.ContainsKey($prop)) {
        $dict[$prop] = $guid
        Write-Host "$prop => $guid"
    }
}
