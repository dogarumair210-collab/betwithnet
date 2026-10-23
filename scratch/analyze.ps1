$text = [System.IO.File]::ReadAllText('scratch/main_index.js')
$idx = $text.IndexOf("addToWinningBetsWithoutBonusWithValidator")
Write-Host $text.Substring($idx + 530, 100)
