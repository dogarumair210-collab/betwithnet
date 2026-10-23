$content = Get-Content "cocos2d-js-min.js" -Raw
$idx = $content.IndexOf("decode-uuid")
if ($idx -ge 0) {
    Write-Output "decode-uuid found around $idx"
    $start = [Math]::Max(0, $idx - 100)
    $len = [Math]::Min(1500, $content.Length - $start)
    Write-Output $content.Substring($start, $len)
}
