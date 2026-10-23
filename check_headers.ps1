$path = (Resolve-Path "games/ab_engine/assets/main/index.js").Path
$content = [System.IO.File]::ReadAllText($path)
$idx = $content.IndexOf("defaults.headers")
while ($idx -ne -1) {
    Write-Host "Match at ${idx}:"
    Write-Host $content.Substring([Math]::Max(0, $idx - 50), [Math]::Min($content.Length - $idx + 50, 300))
    Write-Host "----------------"
    $idx = $content.IndexOf("defaults.headers", $idx + 1)
}
