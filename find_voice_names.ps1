$jsonPath = "american_blackjack_extracted_assets\game_complete.json"
$c = [System.IO.File]::ReadAllText($jsonPath)

$soundJsonPath = "american_blackjack_extracted_assets\sounds\sounds.mp3.json"
$obj = Get-Content $soundJsonPath -Raw | ConvertFrom-Json

Write-Host "Inspecting voice clips..."
for ($i = 11; $i -le 69; $i++) {
    $s = $obj.sounds[$i]
    $id = $s.id
    $idx = $c.IndexOf($id)
    if ($idx -ge 0) {
        $start = [Math]::Max(0, $idx - 350)
        $len = [Math]::Min(500, $c.Length - $start)
        $snip = $c.Substring($start, $len)
        $voiceName = [regex]::Match($snip, '"([a-zA-Z0-9_]*(?:Blackjack|Bust|Win|Push|Insurance|Card|Stand|Soft|Hard|Total|Twenty|Dealer|Player)[a-zA-Z0-9_]*)"').Value
        Write-Host "Sound $($i+1) ($id) => $voiceName"
    }
}
