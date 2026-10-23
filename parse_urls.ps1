$text = Get-Content "temp_21.html" -Raw
$regex = [regex]'https?://[^\s"''<>]+\.(png|jpg|jpeg|webp|gif|mp4|webm|svg)'
$matches = $regex.Matches($text)
$matches | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 40
