$videos = Get-ChildItem -Path "C:\Users\as\Desktop" -Filter "*.mp4" | Sort-Object LastWriteTime -Descending | Select-Object -First 10
foreach ($v in $videos) {
    Write-Output "$($v.LastWriteTime) | $($v.Length) bytes | $($v.Name)"
}
