$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

# Search for any properties ending in Sound or starting with snd or containing audio
$matches = [regex]::Matches($c, '"([a-zA-Z0-9_]*(?:Sound|Audio|snd|Voice)[a-zA-Z0-9_]*)"\s*:\s*\{([^\{\}]+)\}')
Write-Host "Matched $($matches.Count) candidate audio properties:"
$results = @{}
foreach ($m in $matches) {
    $propName = $m.Groups[1].Value
    $content = $m.Groups[2].Value
    if ($content -match '"guid"\s*:\s*"([a-f0-9]{32})"') {
        $guid = $matches[0].Groups[1].Value
        $guid = [regex]::Match($content, '"guid"\s*:\s*"([a-f0-9]{32})"').Groups[1].Value
        if ($guid -ne "00000000000000000000000000000000" -and $guid -ne "") {
            $results[$propName] = $guid
        }
    }
}
$results.GetEnumerator() | ForEach-Object { Write-Host "$($_.Key) => $($_.Value)" }
