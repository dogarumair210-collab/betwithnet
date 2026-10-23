$stream = [System.IO.File]::OpenRead("american_blackjack_extracted_assets\sounds\sounds.mp3.json")
$reader = New-Object System.IO.StreamReader($stream)
$buf = New-Object char[] 2000
$count = $reader.Read($buf, 0, 2000)
$reader.Close()
$stream.Close()
$text = -join $buf[0..($count-1)]
Write-Host "First 2000 chars of sounds.mp3.json:"
Write-Host $text
