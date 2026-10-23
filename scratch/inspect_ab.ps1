$c = [System.IO.File]::ReadAllText("c:\Users\as\Desktop\bet with net\games\ab_engine\assets\main\index.js")
$matches = [regex]::Matches($c, "Logic:\[|GameNetwork:\[|GameNetworkSocket:\[|ingame_ui_controller:\[|MidController:\[|game_detail_result:\[|network_manager:\[")
$out = ""
foreach ($m in $matches) {
    $idx = $m.Index
    $start = [Math]::Max(0, $idx - 50)
    $len = [Math]::Min(6000, $c.Length - $start)
    $out += "=== MATCH: $($m.Value) at $idx ===`r`n"
    $out += $c.Substring($start, $len) + "`r`n`r`n"
}
[System.IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\scratch\ab_logic.txt", $out)
Write-Host "Wrote $($matches.Count) matches to scratch/ab_logic.txt"
