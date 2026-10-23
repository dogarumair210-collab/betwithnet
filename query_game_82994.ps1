$headers = @{
    'User-Agent' = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    'Accept' = 'application/json, text/plain, */*'
    'Referer' = 'https://1x-betpk.mobi/en/casino-search?game=82994'
}

$urls = @(
    'https://1x-betpk.mobi/service-api/third-party/content-aggregator/agg_v3/api/v2/Games/List?whence=520&lng=en&fcountry=PK&gr=0&ref=1&gamesIds=82994',
    'https://1x-betpk.mobi/service-api/third-party/content-aggregator/agg_v3/api/v2/Games/List?whence=520&lng=en&fcountry=PK&gr=0&ref=1&id=82994',
    'https://1x-betpk.mobi/service-api/third-party/content-aggregator/agg_v3/api/v2/Games/List?whence=520&lng=en&fcountry=PK&gr=0&ref=1&gameId=82994',
    'https://1x-betpk.mobi/service-api/third-party/aggregator/Games/Search?whence=520&lng=en&fcountry=PK&nameSubstr=82994',
    'https://1x-betpk.mobi/service-api/third-party/content-aggregator/agg_v3/api/v2/Games/GetGroupedByPartitions?whence=520&lng=en&fcountry=PK&nameSubstr=82994'
)

foreach ($u in $urls) {
    try {
        $res = Invoke-RestMethod -Uri $u -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Write-Host "SUCCESS: $u"
        $res | ConvertTo-Json -Depth 4 | Write-Host
        break
    } catch {
        Write-Host "Failed: $u -> $($_.Exception.Message)"
    }
}
