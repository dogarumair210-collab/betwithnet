$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

$soundJsonPath = "american_blackjack_extracted_assets\sounds\sounds.mp3.json"
$obj = Get-Content $soundJsonPath -Raw | ConvertFrom-Json

Write-Host "Searching context for all 86 sound IDs in game_complete.json..."

$idx = 0
foreach ($s in $obj.sounds) {
    $idx++
    $id = $s.id
    $pos = 0
    $foundContexts = @()
    while (($pos = $c.IndexOf($id, $pos)) -ge 0) {
        $start = [Math]::Max(0, $pos - 150)
        $len = [Math]::Min(300, $c.Length - $start)
        $snippet = $c.Substring($start, $len) -replace '\s+', ' '
        # Look for property names or identifiers
        if ($snippet -match '"([a-zA-Z0-9_]+)"\s*:\s*\{[^}]*' + $id) {
            $foundContexts += $matches[1]
        } elseif ($snippet -match '"([a-zA-Z0-9_]+)"[^"]*' + $id) {
            $foundContexts += $matches[1]
        }
        $pos += $id.Length
    }
    $ctxStr = ($foundContexts | Select-Object -Unique) -join ', '
    if ($ctxStr) {
        Write-Host "Sound $idx ($id) => Context: $ctxStr"
    }
}
