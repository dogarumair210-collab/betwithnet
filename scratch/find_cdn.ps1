$txt = Get-Content 'C:\Users\as\.gemini\antigravity\brain\b4266380-86c0-4133-aa57-2205f4dbbe4d\.system_generated\steps\7856\content.md' -Raw
$matches = [regex]::Matches($txt, 'https://(?:assets|cdn)\.admiralbet\.ro/[^\s\"''\<\>]+')
$unique = $matches | ForEach-Object { $_.Value } | Select-Object -Unique
Write-Host "Total unique CDN links: $($unique.Count)"
$unique | ForEach-Object { Write-Host $_ }
