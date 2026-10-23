$text = Get-Content "21_desktop.css" -Raw
$regex = [regex]'url\([^)]+\)'
$matches = $regex.Matches($text)
$matches | ForEach-Object { $_.Value } | Select-Object -Unique
