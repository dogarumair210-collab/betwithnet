$text = [System.IO.File]::ReadAllText("1xbet_163410.html")
$idx = $text.IndexOf("163410")
if ($idx -ge 0) {
    $start = [Math]::Max(0, $idx - 300)
    $len = [Math]::Min($text.Length - $start, 700)
    Write-Output $text.Substring($start, $len)
} else {
    Write-Output "163410 string not found in file"
}
