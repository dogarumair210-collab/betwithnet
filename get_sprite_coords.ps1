$baseDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets"
$gameJsonText = [System.IO.File]::ReadAllText((Join-Path $baseDir "game_complete.json"))

function Get-Sprite-Info($spriteName) {
    $idx = $gameJsonText.IndexOf("`"$spriteName`"")
    if ($idx -lt 0) { Write-Host "Not found: $spriteName"; return }
    $sub = $gameJsonText.Substring($idx, [Math]::Min(1500, $gameJsonText.Length - $idx))
    $end = $sub.IndexOf('}')
    Write-Host "--- $spriteName ---"
    Write-Host $sub.Substring(0, $end + 1)
}

Get-Sprite-Info "s_betting_box"
Get-Sprite-Info "s_card_dispenser"
Get-Sprite-Info "s_logo"
Get-Sprite-Info "s_blackjack_tag"
Get-Sprite-Info "s_bet_tag"
Get-Sprite-Info "s_clear_bet_default"
