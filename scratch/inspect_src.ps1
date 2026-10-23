$t = [System.IO.File]::ReadAllText('scratch/main_index.js')
$idx = $t.IndexOf('isCurrentPlayer=function')
Write-Host "Index: $idx"
if ($idx -ge 0) {
    Write-Host $t.Substring([Math]::Max(0, $idx - 30), 200)
}
