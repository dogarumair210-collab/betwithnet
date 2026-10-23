$ErrorActionPreference = "Continue"
$chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
$userData = "c:\Users\as\Desktop\bet with net\chrome_tmp2"

$proc = Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9227",
    "--user-data-dir=`"$userData`"",
    "--window-size=1440,900",
    "--disable-blink-features=AutomationControlled",
    "--user-agent=`"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36`"",
    "--no-first-run",
    "https://1x-betpk.mobi/en/casino-search?game=151203"
) -PassThru

Start-Sleep -Seconds 18

try {
    $tabs = Invoke-RestMethod -Uri "http://127.0.0.1:9227/json"
    Write-Output "All targets at 18s:"
    foreach ($t in $tabs) {
        Write-Output "  [$($t.type)] $($t.title) -> $($t.url)"
    }

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

    # Get iframe src from 1xBet page
    $jsIfr = "(Array.from(document.querySelectorAll('iframe')).map(f => f.src).find(s => s.includes('start-demo') || s.includes('uagg') || s.includes('galaxsys')) || '')"
    $evalIfr = Send-CDP $ws "Runtime.evaluate" "{`"expression`":$($jsIfr | ConvertTo-Json),`"returnByValue`":true}"
    $iframeUrl = $evalIfr.result.result.value
    Write-Output "Discovered Game Iframe URL: $iframeUrl"

    # Take screenshot of 1xBet page at 18s
    $shot1 = Send-CDP $ws "Page.captureScreenshot" "{`"format`":`"png`"}"
    if ($shot1.result.data) {
        [IO.File]::WriteAllBytes("c:\Users\as\Desktop\bet with net\tr_step1_18s.png", [Convert]::FromBase64String($shot1.result.data))
    }

    # Navigate main page directly to $iframeUrl so we can inspect inside the cross-origin game frame!
    if ($iframeUrl) {
        Write-Output "Navigating directly to game client URL..."
        $navJson = "{`"url`":$($iframeUrl | ConvertTo-Json)}"
        Send-CDP $ws "Page.navigate" $navJson | Out-Null

        for ($step = 1; $step -le 3; $step++) {
            Start-Sleep -Seconds 8
            $shot = Send-CDP $ws "Page.captureScreenshot" "{`"format`":`"png`"}"
            if ($shot.result.data) {
                $fn = "c:\Users\as\Desktop\bet with net\tr_game_step_$step.png"
                [IO.File]::WriteAllBytes($fn, [Convert]::FromBase64String($shot.result.data))
                Write-Output "Saved $fn"
            }
            $jsGame = @"
JSON.stringify({
    href: location.href,
    title: document.title,
    text: document.body ? document.body.innerText.slice(0, 1500) : '',
    html: document.body ? document.body.innerHTML.slice(0, 2000) : '',
    iframes: Array.from(document.querySelectorAll('iframe')).map(f => f.src),
    resources: performance.getEntriesByType('resource').map(r => r.name)
})
"@
            $ev = Send-CDP $ws "Runtime.evaluate" "{`"expression`":$($jsGame | ConvertTo-Json),`"returnByValue`":true}"
            [IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\tr_game_dump_$step.json", $ev.result.result.value)
            Write-Output "Saved tr_game_dump_$step.json"
        }
    }
} finally {
    if ($proc -and !$proc.HasExited) { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue }
}
