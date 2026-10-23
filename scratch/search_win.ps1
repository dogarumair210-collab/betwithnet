$text = [System.IO.File]::ReadAllText('scratch/main_index.js')
$idx = 1087700
$len = 1200
Write-Host $text.Substring($idx, $len)
