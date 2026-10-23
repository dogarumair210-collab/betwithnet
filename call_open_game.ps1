$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'Content-Type' = 'application/json'
    'Accept' = 'application/json, text/plain, */*'
    'Origin' = 'https://1x-betpk.mobi'
    'Referer' = 'https://1x-betpk.mobi/en/casino-search?game=82994'
}

$body = @{
    GameId = 82994
    Whence = 520
    Lang = "en"
    RefId = 1
    Country = "PK"
    SubCategoryId = 1111
    LobbyUrl = "https://1x-betpk.mobi/"
    Domen = "https://1x-betpk.mobi/"
    Demo = $true
    PlayerId = 0
} | ConvertTo-Json

$endpoints = @(
    "https://1x-betpk.mobi/service-api/third-party/integration-aggregator/OpenGameSecure",
    "https://1x-betpk.mobi/service-api/third-party/aggregator-gateway/game-session/create-session"
)

foreach ($url in $endpoints) {
    Write-Host "Testing $url..."
    try {
        $res = Invoke-RestMethod -Uri $url -Method Post -Body $body -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Write-Host "SUCCESS from $url!"
        $res | ConvertTo-Json -Depth 6 | Write-Host
        break
    } catch {
        Write-Host "Failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host "Body: $($reader.ReadToEnd())"
        }
    }
}
