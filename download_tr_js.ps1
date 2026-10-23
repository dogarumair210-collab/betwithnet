$ErrorActionPreference = "Continue"
New-Item -ItemType Directory -Force -Path "c:\Users\as\Desktop\bet with net\tr_client_js" | Out-Null

$jsUrls = @(
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/main.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/896.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/540.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/961.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/556.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/854.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-client/prd/fg-towerrush-client/v112/396.js",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-cdn/prd/root/images/towerrush/global/beforeLoad/global.json",
    "https://cdn.gx-games-54rg78cw-allalt1.click/fg-cdn/prd/root/spines/towerrush/v2/tr_all.atlas"
)

foreach ($u in $jsUrls) {
    $fn = [IO.Path]::GetFileName($u)
    $out = "c:\Users\as\Desktop\bet with net\tr_client_js\$fn"
    Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing
    Write-Output "Downloaded $fn ($((Get-Item $out).Length) bytes)"
}
