$jsonPath = "american_blackjack_extracted_assets\sounds\sounds.mp3.json"
$raw = [System.IO.File]::ReadAllText($jsonPath)

# Check keys or structure
$matches = [regex]::Matches($raw, '"([^"]+)":\s*(\[[^\]]+\]|\{[^\}]+\})')
Write-Host "Found $($matches.Count) sound definitions"
foreach ($m in $matches | Select-Object -First 30) {
    Write-Host $m.Value
}
