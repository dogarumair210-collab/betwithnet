$url = "https://v3.traincdn.com/sys-static/sys-nuxt-third-party-static/Desktop/Default/379b8eaf55.js"
$content = (Invoke-WebRequest -Uri $url -Headers @{"User-Agent"="Mozilla/5.0"} -UseBasicParsing).Content

Write-Host "Search component JS length: $($content.Length)"
[regex]::Matches($content, 'https?://[^\s"''`]+|/[a-zA-Z0-9_\-\./]+api[a-zA-Z0-9_\-\./]*') | ForEach-Object { $_.Value } | Select-Object -Unique | Select-Object -First 30
