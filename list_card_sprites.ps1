$baseDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets"
$gameJsonText = [System.IO.File]::ReadAllText((Join-Path $baseDir "game_complete.json"))

$idx = $gameJsonText.IndexOf('"s_card_00"')
$slIdx = $gameJsonText.LastIndexOf('"spriteList"', $idx)
$startBrace = $gameJsonText.IndexOf('{', $slIdx)
$depth = 0
$endBrace = -1
for ($i = $startBrace; $i -lt [Math]::Min($gameJsonText.Length, $startBrace + 80000); $i++) {
    if ($gameJsonText[$i] -eq '{') { $depth++ }
    elseif ($gameJsonText[$i] -eq '}') {
        $depth--
        if ($depth -eq 0) {
            $endBrace = $i
            break
        }
    }
}
$cardsList = $gameJsonText.Substring($startBrace, $endBrace - $startBrace + 1) | ConvertFrom-Json
$props = $cardsList | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
Write-Host "All sprite names in Cards Atlas ($($props.Count)):"
$props | ForEach-Object { Write-Host $_ }
