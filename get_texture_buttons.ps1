$baseDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets"
$gameJsonText = [System.IO.File]::ReadAllText((Join-Path $baseDir "game_complete.json"))

$idx = $gameJsonText.IndexOf('"1d36b0e0ec9766140834e7324680b5e6"')
$slIdx = $gameJsonText.IndexOf('"spriteList"', $idx)
$startBrace = $gameJsonText.IndexOf('{', $slIdx)
$depth = 0
$endBrace = -1
for ($i = $startBrace; $i -lt [Math]::Min($gameJsonText.Length, $startBrace + 30000); $i++) {
    if ($gameJsonText[$i] -eq '{') { $depth++ }
    elseif ($gameJsonText[$i] -eq '}') {
        $depth--
        if ($depth -eq 0) {
            $endBrace = $i
            break
        }
    }
}
$list = $gameJsonText.Substring($startBrace, $endBrace - $startBrace + 1) | ConvertFrom-Json
($list | Get-Member -MemberType NoteProperty) | ForEach-Object {
    $sp = $list."$($_.Name)"
    Write-Host "$($_.Name) => x:$($sp.x), y:$($sp.y), w:$($sp.width), h:$($sp.height)"
}
