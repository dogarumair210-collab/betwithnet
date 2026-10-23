$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

$matches = [regex]::Matches($c, '"(snd[A-Za-z0-9_]+)"\s*:\s*\{[\s\S]*?"guid"\s*:\s*"([a-f0-9]{32})"')
Write-Host "Found $($matches.Count) sound events mapped to GUIDs:"
$seen = @{}
foreach ($m in $matches) {
    $sndName = $m.Groups[1].Value
    $guid = $m.Groups[2].Value
    if (-not $seen.ContainsKey($sndName)) {
        $seen[$sndName] = $guid
        Write-Host "$sndName => $guid"
    }
}
