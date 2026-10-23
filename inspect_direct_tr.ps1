$ErrorActionPreference = "Continue"
$chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$userData = "c:\Users\as\Desktop\bet with net\chrome_tmp2"
$gameUrl = "https://gx-games-54rg78cw-allalt1.click/fg-towerrush-client/game/?activeGameId=0&partnerId=50175&token=&playerId=0&culture=en&isDemo=true&isMobile=false&referer=launchdigi.net&isFeatureMessagePackEnabled=true&isMessagePackEnabled=false&backUrl=gx-games-54rg78cw-allalt1.click/fg-towerrush-api&gameKindName=TowerRush&gameTypeName=TowerRush&mode=2&partnerPlayerId="

$proc = Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9228",
    "--user-data-dir=`"$userData`"",
    "--window-size=1440,900",
    "--disable-blink-features=AutomationControlled",
    "--no-first-run",
    $gameUrl
) -PassThru

Start-Sleep -Seconds 15

try {
    $tabs = Invoke-RestMethod -Uri "http://127.0.0.1:9228/json"
    $tab = $tabs | Where-Object { $_.type -eq "page" } | Select-Object -First 1
    $wsUrl = $tab.webSocketDebuggerUrl

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $ct = [System.Threading.CancellationToken]::None
    $ws.ConnectAsync([Uri]$wsUrl, $ct).Wait()

    $script:msgId = 0
    function Send-CDP($sock, $method, $paramsJson = "{}") {
        $script:msgId++
        $payload = "{`"id`":$script:msgId,`"method`":`"$method`",`"params`":$paramsJson}"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
        $seg = New-Object System.ArraySegment[byte] -ArgumentList @(,$bytes)
        $sock.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()

        $buf = New-Object byte[] 65536
        $sb = New-Object System.Text.StringBuilder
        while ($true) {
            $rseg = New-Object System.ArraySegment[byte] -ArgumentList @(,$buf)
            $res = $sock.ReceiveAsync($rseg, $ct).Result
            $sb.Append([System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)) | Out-Null
            if ($res.EndOfMessage) {
                $str = $sb.ToString()
                $sb.Clear() | Out-Null
                if ($str -match "`"id`":$script:msgId") {
                    return ($str | ConvertFrom-Json)
                }
            }
        }
    }

    $shot = Send-CDP $ws "Page.captureScreenshot" "{`"format`":`"png`"}"
    if ($shot.result.data) {
        [IO.File]::WriteAllBytes("c:\Users\as\Desktop\bet with net\tr_direct_15s.png", [Convert]::FromBase64String($shot.result.data))
        Write-Output "Saved tr_direct_15s.png"
    }

    $js = @"
JSON.stringify({
    href: location.href,
    title: document.title,
    html: document.body ? document.body.innerHTML : '',
    resources: performance.getEntriesByType('resource').map(r => ({name: r.name, type: r.initiatorType}))
}, null, 2)
"@
    $ev = Send-CDP $ws "Runtime.evaluate" "{`"expression`":$($js | ConvertTo-Json),`"returnByValue`":true}"
    [IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\tr_direct_dump.json", $ev.result.result.value)
    Write-Output "Saved tr_direct_dump.json ($($ev.result.result.value.Length) chars)"

} finally {
    if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
}
