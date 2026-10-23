$baseDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets"
$gameJsonText = [System.IO.File]::ReadAllText((Join-Path $baseDir "game_complete.json"))

# Find all spriteList matches and their texture names
$matches = [regex]::Matches($gameJsonText, '"spriteList"\s*:\s*\{')
Write-Host "Found $($matches.Count) spriteList instances in game_complete.json"

foreach ($m in $matches) {
    # Find preceding texture name or id
    $sub = $gameJsonText.Substring([Math]::Max(0, $m.Index - 500), [Math]::Min(500, $m.Index))
    $texMatch = [regex]::Match($sub, '"(texture_[^"]+|[a-f0-9]{32})"')
    Write-Host "--- Texture: $($texMatch.Value) at index $($m.Index) ---"
    
    # Grab the spriteList object
    $startBrace = $m.Index + $m.Length - 1
    $depth = 0
    $endBrace = -1
    for ($i = $startBrace; $i -lt [Math]::Min($gameJsonText.Length, $startBrace + 150000); $i++) {
        if ($gameJsonText[$i] -eq '{') { $depth++ }
        elseif ($gameJsonText[$i] -eq '}') {
            $depth--
            if ($depth -eq 0) {
                $endBrace = $i
                break
            }
        }
    }
    if ($endBrace -gt 0) {
        $jsonChunk = $gameJsonText.Substring($startBrace, $endBrace - $startBrace + 1)
        try {
            $parsed = $jsonChunk | ConvertFrom-Json
            $props = ($parsed | Get-Member -MemberType NoteProperty).Name
            Write-Host "  Sprites count: $($props.Count)"
            Write-Host "  Sample sprites: $(($props | Select-Object -First 10) -join ', ')"
        } catch {
            Write-Host "  JSON parse error: $($_.Exception.Message)"
        }
    }
}
