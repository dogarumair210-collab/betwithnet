$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

# Search for any clips under voice or announcer or audio
$matches = [regex]::Matches($c, '"([a-zA-Z0-9_]*)"\s*:\s*\{"fileID":8300000,"guid":"([a-f0-9]{32})"}')
Write-Host "Found $($matches.Count) direct 8300000 AudioClip references:"
$dict = @{}
foreach ($m in $matches) {
    $name = $m.Groups[1].Value
    $guid = $m.Groups[2].Value
    if (-not $dict.ContainsKey($name)) {
        $dict[$name] = $guid
        Write-Host "$name => $guid"
    }
}
