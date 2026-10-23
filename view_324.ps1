$content = Get-Content "cocos2d-js-min.js" -Raw
$idx = $content.IndexOf("324:[(function")
if ($idx -ge 0) {
    Write-Output "Found module 324 at $idx"
    Write-Output $content.Substring($idx, 600)
}
