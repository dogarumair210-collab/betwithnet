$eps = @(
    "https://gamecms.admiralbet.ro/api/v1/games?per_page=100&category_type=live-casino",
    "https://gamecms.admiralbet.ro/api/v1/games?type=live-casino&per_page=100",
    "https://gamecms.admiralbet.ro/api/v1/games?product=live-casino&per_page=100",
    "https://gamecms.admiralbet.ro/api/v1/games?provider_id=pragmatic-play",
    "https://gamecms.admiralbet.ro/api/v1/providers",
    "https://gamecms.admiralbet.ro/api/v1/games?page=1&per_page=50"
)

foreach ($ep in $eps) {
    try {
        $res = Invoke-RestMethod -Uri $ep -Method Get -TimeoutSec 5 -Headers @{ "User-Agent" = "Mozilla/5.0" }
        Write-Host "Success for $ep -> Total:" $res.total "Data count:" $res.data.Count
        if ($res.data.Count -gt 0) {
            $json = $res | ConvertTo-Json -Depth 4
            [System.IO.File]::WriteAllText("scratch/games_sample.json", $json)
            Write-Host "Saved scratch/games_sample.json"
            break
        }
    } catch {
        Write-Host "Failed: $ep ($($_.Exception.Message))"
    }
}
