$content = Get-Content "main_bundle.js" -Raw
$idx = $content.IndexOf("playMusicById")
if ($idx -ge 0) {
    Write-Output "playMusicById snippet:"
    $start = [Math]::Max(0, $idx - 300)
    $len = [Math]::Min(800, $content.Length - $start)
    Write-Output $content.Substring($start, $len)
}
$idx2 = $content.IndexOf("PlayBGM")
if ($idx2 -ge 0) {
    Write-Output "`nPlayBGM snippet:"
    $start = [Math]::Max(0, $idx2 - 300)
    $len = [Math]::Min(800, $content.Length - $start)
    Write-Output $content.Substring($start, $len)
}
