$endpoints = @(
    "https://gamecms.admiralbet.ro/api/v1/games?category_id=89",
    "https://gamecms.admiralbet.ro/api/v1/games?provider=pragmatic-play&category_type=live-casino",
    "https://gamecms.admiralbet.ro/api/v1/games?category_slug=pragmatic-play",
    "https://gamecms.admiralbet.ro/api/v1/games?provider_slug=pragmatic-play",
    "https://gamecms.admiralbet.ro/api/v1/categories/89/games",
    "https://gamecms.admiralbet.ro/api/v1/games/category/89",
    "https://gamecms.admiralbet.ro/api/v1/games?slug=pragmatic-play"
)

foreach ($ep in $endpoints) {
    try {
        $res = Invoke-RestMethod -Uri $ep -Method Get -TimeoutSec 5 -Headers @{ "User-Agent" = "Mozilla/5.0" }
        Write-Host "Success for $ep"
        $json = $res | ConvertTo-Json -Depth 4
        [System.IO.File]::WriteAllText("scratch/games_found.json", $json)
        Write-Host "Saved scratch/games_found.json (Length: $($json.Length))"
        break
    } catch {
        Write-Host "Failed: $ep ($($_.Exception.Message))"
    }
}
