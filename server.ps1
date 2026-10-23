$baseDir = "c:\Users\as\Desktop\bet with net"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
$listener.Prefixes.Add("http://localhost:8085/")

try {
    $listener.Start()
    Write-Output "LOCAL_SERVER_STARTED: http://localhost:8080/ and http://localhost:8085/"
} catch {
    Write-Error "Failed to start listener: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rel = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($rel) -or $rel -eq "template" -or $rel -eq "templates" -or $rel -eq "demo") {
            $rel = "fortune_gems_2_template/index.html"
        } elseif ($rel -eq "standalone") {
            $rel = "fortune_gems_2_template/standalone_game/index.html"
        } elseif ($rel -eq "portal" -or $rel -eq "1xbet-embed") {
            $rel = "fortune_gems_2_template/1xbet_portal_embed/index.html"
        } elseif ($rel -eq "coinflip") {
            $rel = "games/coinflip.html"
        } elseif ($rel -eq "casino") {
            $rel = "casino.html"
        } elseif ($rel -eq "fortune-gems-2" -or $rel -eq "fortunegems2" -or $rel -eq "fortunegems") {
            $rel = "games/fortunegems2.html"
        } elseif ($rel -eq "assets" -or $rel -eq "theme" -or $rel -eq "fortune-gems-assets" -or $rel -eq "fg2") {
            $rel = "fortune_gems_2_extracted_assets/index.html"
        } elseif ($rel -eq "roulettex" -or $rel -eq "roulette" -or $rel -eq "roulette-x") {
            $rel = "games/roulette.html"
        } elseif ($rel -eq "plinko" -or $rel -eq "plinkox" -or $rel -eq "plinko-x") {
            $rel = "games/plinko.html"
        } elseif ($rel -eq "dice" -or $rel -eq "dicegame") {
            $rel = "games/dice.html"
        } elseif ($rel -match "177041" -or $rel -eq "en/slots/game/177041/fortune-garuda-500" -or $rel -eq "1xbet-garuda") {
            $rel = "fortune_garuda_500_template/1xbet_portal_embed/index.html"
        } elseif ($rel -eq "garuda-standalone" -or $rel -eq "garuda-game") {
            $rel = "fortune_garuda_500_template/standalone_game/index.html"
        } elseif ($rel -eq "garuda" -or $rel -eq "garuda-500" -or $rel -eq "fortune-garuda" -or $rel -eq "fortune-garuda-500" -or $rel -eq "garuda500" -or $rel -eq "garuda-template") {
            $rel = "fortune_garuda_500_template/1xbet_portal_embed/index.html"
        } elseif (($rel -eq "71040" -or $rel -eq "en/casino-search" -or $rel -eq "en/slots/game/71040/gold-rush" -or $rel -eq "gold-rush" -or $rel -eq "goldrush" -or $rel -eq "gold-rush-template") -and -not ($rel -like "*.*" -and -not ($rel -like "*.html"))) {
            $rel = "gold_rush_template/1xbet_portal_embed/index.html"
        } elseif ($rel -eq "gold-rush-standalone" -or $rel -eq "goldrush-game") {
            $rel = "gold_rush_template/standalone_game/index.html"
        } elseif ($rel -eq "gold-rush-showcase") {
            $rel = "gold_rush_template/index.html"
        }

        $filePath = [System.IO.Path]::Combine($baseDir, $rel.Replace('/', '\'))
        if ([System.IO.Directory]::Exists($filePath)) {
            $filePath = [System.IO.Path]::Combine($filePath, "index.html")
        }

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".webp" { "image/webp" }
                ".svg"  { "image/svg+xml" }
                ".mp3"  { "audio/mpeg" }
                ".wav"  { "audio/wav" }
                ".mp4"  { "video/mp4" }
                ".webm" { "video/webm" }
                ".woff2" { "font/woff2" }
                ".woff" { "font/woff" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $contentType
            $response.Headers.Add("Accept-Ranges", "bytes")
            $fileLen = (New-Object System.IO.FileInfo($filePath)).Length
            $rangeHeader = $request.Headers["Range"]

            if ($rangeHeader -and $rangeHeader.StartsWith("bytes=")) {
                $rangeParts = $rangeHeader.Substring(6).Split('-')
                $start = [long]::Parse($rangeParts[0])
                $end = if ($rangeParts.Length -gt 1 -and -not [string]::IsNullOrEmpty($rangeParts[1])) { [long]::Parse($rangeParts[1]) } else { $fileLen - 1 }
                if ($end -ge $fileLen) { $end = $fileLen - 1 }
                $length = $end - $start + 1

                $response.StatusCode = 206
                $response.Headers.Add("Content-Range", "bytes $start-$end/$fileLen")
                $response.ContentLength64 = $length

                if ($request.HttpMethod -ne "HEAD") {
                    $fs = [System.IO.File]::OpenRead($filePath)
                    $null = $fs.Seek($start, [System.IO.SeekOrigin]::Begin)
                    $buffer = New-Object byte[] 65536
                    $bytesRemaining = $length
                    while ($bytesRemaining -gt 0) {
                        $toRead = [Math]::Min($bytesRemaining, $buffer.Length)
                        $read = $fs.Read($buffer, 0, $toRead)
                        if ($read -le 0) { break }
                        $response.OutputStream.Write($buffer, 0, $read)
                        $bytesRemaining -= $read
                    }
                    $fs.Close()
                }
            } else {
                $response.ContentLength64 = $fileLen
                if ($request.HttpMethod -ne "HEAD") {
                    $bytes = [System.IO.File]::ReadAllBytes($filePath)
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            }
        } else {
            $response.StatusCode = 404
            $err = [System.Text.Encoding]::UTF8.GetBytes("File Not Found: $rel")
            $response.OutputStream.Write($err, 0, $err.Length)
        }
        $response.Close()
    } catch {
        # ignore client disconnect errors
    }
}
