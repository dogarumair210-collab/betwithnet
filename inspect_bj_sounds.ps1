$sounds = Get-ChildItem 'assets\games\blackjack\sounds\*.mp3' | Select-Object -First 20
foreach ($s in $sounds) {
    Write-Host "$($s.Name) ($($s.Length) bytes)"
}
