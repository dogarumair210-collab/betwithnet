$url = "https://cors.mannagaming.com/gassets/slot20x21/js/main.js"
try {
    $res = Invoke-WebRequest -Uri $url -UserAgent "Mozilla/5.0"
    $res.Content.Substring(0, [Math]::Min(1500, $res.Content.Length)) | Out-File -FilePath "manna_main_js_snip.txt" -Encoding utf8
    Write-Output "Downloaded main.js ($($res.Content.Length) bytes)"
} catch {
    Write-Output "Error: $_"
}
