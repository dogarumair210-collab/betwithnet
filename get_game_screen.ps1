$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}
Write-Host "Edge path: $edgePath"
$targetUrl = "https://1x-betpk.mobi/en/casino-search?game=82994"
$outPng = "C:\Users\as\Desktop\bet with net\game_82994.png"
& $edgePath --headless --disable-gpu --window-size=1280,800 --virtual-time-budget=8000 --screenshot=$outPng $targetUrl
Write-Host "Screenshot done. Exists: $(Test-Path $outPng)"
