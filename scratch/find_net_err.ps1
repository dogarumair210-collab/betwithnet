$text = [System.IO.File]::ReadAllText('scratch/main_index.js')
$idx = $text.IndexOf("overideDomain")
Write-Host $text.Substring($idx - 20, 40)
