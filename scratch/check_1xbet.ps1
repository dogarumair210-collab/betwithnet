$c = [System.IO.File]::ReadAllText('C:\Users\as\.gemini\antigravity\brain\83e6763d-5a70-4c9f-ba4c-cc5ba7b67826\.system_generated\steps\5338\content.md')
$m = [regex]::Matches($c, 'https?://[^\s"''<>\\]+')
$unique = $m | ForEach-Object { $_.Value } | Select-Object -Unique
foreach ($u in $unique) {
    if ($u -match 'api|service|game|casino') {
        Write-Host $u
    }
}
