# Let's inspect s_card_12, 13, 25, 26, 38, 39, 51 to determine suits
Add-Type -AssemblyName System.Drawing

$cardsDir = "c:\Users\as\Desktop\bet with net\american_blackjack_extracted_assets\cards"
$testIndices = @(0, 12, 13, 25, 26, 38, 39, 51)
foreach ($i in $testIndices) {
    $idxStr = $i.ToString("D2")
    $file = Join-Path $cardsDir "s_card_$idxStr.png"
    Write-Host "Index $idxStr file exists: $(Test-Path $file)"
}
