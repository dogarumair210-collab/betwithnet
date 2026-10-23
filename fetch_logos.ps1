# Fetch direct image URLs from Wikimedia pages
$epPage = (Invoke-WebRequest -Uri "https://commons.wikimedia.org/wiki/File:Easypaisa_Digital_Bank_logo.png" -UserAgent "Mozilla/5.0").Content
if ($epPage -match '(https://upload\.wikimedia\.org/wikipedia/commons/[^"]+Easypaisa_Digital_Bank_logo\.png)') {
    $epUrl = $matches[1]
    Write-Output "EP_URL: $epUrl"
    Invoke-WebRequest -Uri $epUrl -OutFile "assets/easypaisa.png" -UserAgent "Mozilla/5.0"
    Write-Output "Saved assets/easypaisa.png"
}

$jcPage = (Invoke-WebRequest -Uri "https://commons.wikimedia.org/wiki/File:JazzCash_logo_(2025).png" -UserAgent "Mozilla/5.0").Content
if ($jcPage -match '(https://upload\.wikimedia\.org/wikipedia/commons/[^"]+JazzCash_logo[^\.]*\.png)') {
    $jcUrl = $matches[1]
    Write-Output "JC_URL: $jcUrl"
    Invoke-WebRequest -Uri $jcUrl -OutFile "assets/jazzcash.png" -UserAgent "Mozilla/5.0"
    Write-Output "Saved assets/jazzcash.png"
}
