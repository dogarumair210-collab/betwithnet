$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$server = "root@212.47.76.113"
$remotePath = "/home/betwithnet.com/public_html/games/ab_engine/lobby/config.json"

Write-Host "Fetching current remote config..." -ForegroundColor Cyan
ssh.exe -o StrictHostKeyChecking=no $server "cat $remotePath"

Write-Host "Updating dynamicDomain to false in remote config..." -ForegroundColor Cyan
$newConfig = '{"serverUrl":"https://demo8.kingmidasdev.net","socketServerUrl":"https://demo8.kingmidasdev.net","activeGameService":1,"serverUrlROR":"https://demo8.kingmidasdev.net","socketServerUrlROR":"https://demo8.kingmidasdev.net","dynamicDomain":false,"gameIdentifier":"andar-bahar","fontPath":"localizations/FontsAsset/fontsConfig/fontsConfig.json","errorLocalizationPath":"error-message.json","env":"DEMO","assetsHost":"https://cdn.kingmidasdev.net","syncBalanceInterval":10000,"languageSets":["id","test","my"],"authTokenKey":"params"}'

$escapedConfig = $newConfig.Replace('"', '\"')
ssh.exe -o StrictHostKeyChecking=no $server "echo '$newConfig' > $remotePath && chown betwi4261:betwi4261 $remotePath && chmod 644 $remotePath"

Write-Host "Verifying updated config..." -ForegroundColor Green
ssh.exe -o StrictHostKeyChecking=no $server "cat $remotePath"
