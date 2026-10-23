$path = (Resolve-Path "games/ab_engine/assets/main/index.js").Path
$content = [System.IO.File]::ReadAllText($path)
$keywords = @("getURLParameter", "URLSearchParams", "authTokenKey", "isTest", "authenticateHttper")
foreach ($kw in $keywords) {
    $idx = $content.IndexOf($kw)
    Write-Host "Searching: $kw (found: $(if($idx -ge 0){'YES'}else{'NO'}))"
    if ($idx -ge 0) {
        Write-Host $content.Substring([Math]::Max(0, $idx - 50), [Math]::Min($content.Length - $idx + 50, 200))
        Write-Host "----------------"
    }
}
