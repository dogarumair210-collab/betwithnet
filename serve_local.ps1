$port = 3000
$root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "SUCCESS: Local server listening on http://localhost:$port/"
    Write-Host "Game URL: http://localhost:$port/games/garuda.html"
} catch {
    Write-Host "Port $port error: $($_.Exception.Message)"
    $port = 5500
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()
    Write-Host "SUCCESS: Local server listening on http://localhost:$port/"
    Write-Host "Game URL: http://localhost:$port/games/garuda.html"
}

# Serve requests in loop
while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    $path = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
    $localFile = [System.IO.Path]::Combine($root, $path.Replace('/', [System.IO.Path]::DirectorySeparatorChar))

    if ([System.IO.File]::Exists($localFile)) {
        $ext = [System.IO.Path]::GetExtension($localFile).ToLower()
        $mime = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".jpeg" { "image/jpeg" }
            ".webp" { "image/webp" }
            ".svg"  { "image/svg+xml" }
            ".mp4"  { "video/mp4" }
            ".mp3"  { "audio/mpeg" }
            ".json" { "application/json; charset=utf-8" }
            default { "application/octet-stream" }
        }
        $res.ContentType = $mime
        $res.AddHeader("Access-Control-Allow-Origin", "*")
        $bytes = [System.IO.File]::ReadAllBytes($localFile)
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $path")
        $res.OutputStream.Write($msg, 0, $msg.Length)
    }
    $res.Close()
}
