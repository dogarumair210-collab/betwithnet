$proc = Start-Process -FilePath "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" -ArgumentList '--headless=new --remote-debugging-port=9222 --user-data-dir="C:\Users\as\AppData\Local\Temp\edge_profile_test" --window-size=1280,850 "https://1xbet.com.gh/en/casino-search?game=108297"' -PassThru
Start-Sleep -Seconds 24

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json" -UseBasicParsing
    $tab = $tabs | Where-Object { $_.url -like "*1xbet.com.gh*" } | Select-Object -First 1
    if (!$tab) {
        Write-Host "Tab not found"
        return
    }

    $wsUrl = $tab.webSocketDebuggerUrl
    Write-Host "WebSocket URL: $wsUrl"

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $task = $ws.ConnectAsync([uri]$wsUrl, $cts.Token)
    $task.Wait()

    function Send-Cdp($method, $params = @{}) {
        $id = [System.Random]::new().Next(1000, 9999)
        $msg = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 5 -Compress
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [System.ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $ms = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 65536
        do {
            $recvSegment = [System.ArraySegment[byte]]::new($buffer)
            $result = $ws.ReceiveAsync($recvSegment, $cts.Token)
            $result.Wait()
            $ms.Write($buffer, 0, $result.Result.Count)
        } while (-not $result.Result.EndOfMessage)

        $jsonStr = [System.Text.Encoding]::UTF8.GetString($ms.ToArray())
        return ($jsonStr | ConvertFrom-Json)
    }

    # Hide all modals and overlays
    $evalJs = 'document.querySelectorAll("#modals-container, .modal, .ui-modal, [class*=\"modal\"], [class*=\"popup\"], [class*=\"dialog\"], [class*=\"overlay\"], [class*=\"backdrop\"], [data-v-059add4c]").forEach(e => e.remove()); true;'
    $resEval = Send-Cdp "Runtime.evaluate" @{ expression = $evalJs }
    Start-Sleep -Seconds 2

    # Take clean screenshot
    $ss = Send-Cdp "Page.captureScreenshot" @{ format = "png" }
    if ($ss.result.data) {
        $pngBytes = [System.Convert]::FromBase64String($ss.result.data)
        $targetPath = "C:\Users\as\Desktop\bet with net\games\racing\clean_game_screenshot.png"
        [System.IO.File]::WriteAllBytes($targetPath, $pngBytes)
        Write-Host "Clean screenshot saved successfully! Size: $($pngBytes.Length) bytes"
    } else {
        Write-Host "Failed: $($ss.error | ConvertTo-Json)"
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Error: $_"
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
