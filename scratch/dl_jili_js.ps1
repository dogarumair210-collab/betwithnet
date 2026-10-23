$urls = @(
    "https://jiligames.com/plusplayer/PlusTrial/223/en-US/index.24ef7.js",
    "https://jiligames.com/plusplayer/PlusTrial/223/index.24ef7.js"
)
foreach ($u in $urls) {
    try {
        $res = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 10
        Write-Host "Success $u : $($res.Content.Length) bytes"
        [System.IO.File]::WriteAllText("scratch/index.24ef7.js", $res.Content)
        break
    } catch {
        Write-Host "Failed $u : $_"
    }
}
