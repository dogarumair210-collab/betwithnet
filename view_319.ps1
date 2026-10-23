$content = Get-Content "cocos2d-js-min.js" -Raw
$idx = $content.IndexOf("319:[(function")
if ($idx -ge 0) {
    Write-Output "Found module 319 at $idx"
    Write-Output $content.Substring($idx, 1200)
}
