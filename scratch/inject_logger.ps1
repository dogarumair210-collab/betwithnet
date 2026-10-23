$file = "c:\Users\as\Desktop\bet with net\games\fg2_engine\index.html"
$content = Get-Content $file -Raw

$logger = @"
<script>
window.__bwn_errors = [];
window.onerror = function(msg, url, line, col, error) {
    var err = '[ERR] ' + msg + ' at ' + url + ':' + line + ':' + col;
    window.__bwn_errors.push(err);
    console.error(err);
    var d = document.getElementById('bwn_err_overlay');
    if (!d) {
        d = document.createElement('div');
        d.id = 'bwn_err_overlay';
        d.style = 'position:fixed;top:0;left:0;width:100%;max-height:50%;background:rgba(200,0,0,0.9);color:white;font-family:monospace;font-size:12px;z-index:999999;overflow:auto;padding:10px;pointer-events:none;';
        document.body.appendChild(d);
    }
    d.innerHTML += err + '<br>';
};
window.addEventListener('unhandledrejection', function(event) {
    var err = '[PROMISE REJ] ' + event.reason;
    window.__bwn_errors.push(err);
    console.error(err);
    var d = document.getElementById('bwn_err_overlay');
    if (d) d.innerHTML += err + '<br>';
});
</script>
"@

$injected = $content -replace "<head>", "<head>`n$logger"
Set-Content -Path $file -Value $injected -Encoding UTF8
Write-Host "Injected error logger into games/fg2_engine/index.html"
