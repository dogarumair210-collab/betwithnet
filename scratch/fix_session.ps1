$url = "https://jiligames.com/plusplayer/PlusTrial/223/en-US"
Write-Host "Getting fresh session..."
$req = [System.Net.HttpWebRequest]::Create($url)
$req.AllowAutoRedirect = $true
$req.UserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
$req.Timeout = 15000
$resp = $req.GetResponse()
$effUrl = $resp.ResponseUri.AbsoluteUri
$reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
$html = $reader.ReadToEnd()
$reader.Close()
$resp.Close()

Write-Host "Effective URL: $effUrl"

# Extract query params from effUrl
$uri = [System.Uri]$effUrl
$queryString = $uri.Query.TrimStart('?')
Write-Host "Query string: $queryString"

# Base URL
$baseUrl = "https://casino-wbgame.jiligames.com/fgp/"

# Create JSON of default params
$dict = @{}
foreach ($part in $queryString.Split('&')) {
    $kv = $part.Split('=')
    if ($kv.Length -eq 2) {
        $dict[$kv[0]] = [System.Uri]::UnescapeDataString($kv[1])
    }
}
$paramsJson = $dict | ConvertTo-Json -Compress
Write-Host "Params JSON: $paramsJson"

# Inject bridge and default params into HTML
$bridge = @"
<base href="$baseUrl">
<script>
window.__BWN_DEFAULT_PARAMS = $paramsJson;
(function() {
    // Override urlParams_get to ensure fallback to valid JILI session parameters
    var origURLSearchParams = window.URLSearchParams;
    window.URLSearchParams = function(init) {
        var usp = new origURLSearchParams(init || window.location.search);
        var origGet = usp.get.bind(usp);
        usp.get = function(name) {
            var val = origGet(name);
            if (val !== null && val !== '') return val;
            if (window.__BWN_DEFAULT_PARAMS && window.__BWN_DEFAULT_PARAMS[name] !== undefined) {
                return window.__BWN_DEFAULT_PARAMS[name];
            }
            return null;
        };
        return usp;
    };

    console.log('[BWN-FG2] JILI Session Params injected:', window.__BWN_DEFAULT_PARAMS);
})();
</script>
"@

$injected = $html.Replace("<head>", "<head>`n" + $bridge)
[System.IO.File]::WriteAllText("c:\Users\as\Desktop\bet with net\games\fg2_engine\index.html", $injected, [System.Text.Encoding]::UTF8)
Write-Host "Saved index.html with live session params."
