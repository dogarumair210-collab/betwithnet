$req = [System.Net.HttpWebRequest]::Create("https://funkygames.io/demo?gameCode=602711&lang=EN")
$req.AllowAutoRedirect = $true
$req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
$res = $req.GetResponse()
Write-Host "Final URL: $($res.ResponseUri.AbsoluteUri)"
Write-Host "Status: $($res.StatusCode)"
$res.Close()
