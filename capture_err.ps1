$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$url = 'file:///' + ((Resolve-Path 'games\teenpatti.html').Path -replace '\\', '/')
$pinfo = New-Object System.Diagnostics.ProcessStartInfo
$pinfo.FileName = $edge
$pinfo.Arguments = "--headless --no-sandbox --disable-gpu --enable-logging=stderr --v=1 `"$url`""
$pinfo.RedirectStandardError = $true
$pinfo.UseShellExecute = $false
$p = [System.Diagnostics.Process]::Start($pinfo)
Start-Sleep -Seconds 4
if (-not $p.HasExited) { $p.Kill() }
$err = $p.StandardError.ReadToEnd()
[IO.File]::WriteAllText('edge_stderr.txt', $err)
Write-Host "Captured $($err.Length) bytes of log"
