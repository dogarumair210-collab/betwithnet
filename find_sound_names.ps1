$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

$matches = [regex]::Matches($c, '"m_Name"\s*:\s*"([^"]*(?:blackjack|deal|win|bust|chip|card|insurance|push)[^"]*)"', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
Write-Host "Found $($matches.Count) named audio/event clips:"
foreach ($m in $matches | Select-Object -Unique -First 40) {
    Write-Host " - $($m.Groups[1].Value)"
}
