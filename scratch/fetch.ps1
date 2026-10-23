$url = 'https://www.admiralbet.ro/casino-live/pragmatic-play'
$html = curl.exe -s -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' $url

$matches = [regex]::Matches($html, 'https://assets\.admiralbet\.ro/PCMS/[^\s\"''\<\>]+')
Write-Host "PCMS assets found: $($matches.Count)"
$matches | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 30 | ForEach-Object {
    Write-Host "Asset: $_"
}

# Look for script tags with id or ng
$scriptMatches = [regex]::Matches($html, '<script[^>]*id="([^"]+)"[^>]*>(.*?)</script>', [System.Text.RegularExpressions.RegexOptions]::Singleline)
Write-Host "Identified scripts: $($scriptMatches.Count)"
foreach ($m in $scriptMatches) {
    Write-Host "Script ID: $($m.Groups[1].Value), Length: $($m.Groups[2].Value.Length)"
    if ($m.Groups[1].Value -match "state") {
        [System.IO.File]::WriteAllText("scratch/server_state.json", $m.Groups[2].Value)
        Write-Host "Saved scratch/server_state.json"
    }
}
