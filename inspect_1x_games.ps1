$text = Get-Content "temp_1xbet_card.html" -Raw
$regex = [regex]'"id":([0-9]+),"name":"([^"]+)"'
$matches = $regex.Matches($text)
$matches | ForEach-Object { 
    [PSCustomObject]@{
        Id = $_.Groups[1].Value
        Name = $_.Groups[2].Value
    }
} | Select-Object -Unique -First 30
