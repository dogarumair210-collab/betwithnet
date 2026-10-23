$baseRemote = "/home/betwithnet.com/public_html/assets"

# Upload Binance SVG
.\run_scp.ps1 "assets\binance.svg" "${baseRemote}/binance.svg"

# Download the logos locally
$server = "root@212.47.76.113"
$askpass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askpass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/easypaisa.png" "assets\easypaisa.png"
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/jazzcash.png" "assets\jazzcash.png"
scp.exe -o StrictHostKeyChecking=no "${server}:${baseRemote}/nayapay.png" "assets\nayapay.png"

# Set remote permissions
.\run_ssh.ps1 "chown -R betwi4261:betwi4261 /home/betwithnet.com/public_html/assets/*.png /home/betwithnet.com/public_html/assets/*.svg && chmod 644 /home/betwithnet.com/public_html/assets/easypaisa.png /home/betwithnet.com/public_html/assets/jazzcash.png /home/betwithnet.com/public_html/assets/nayapay.png /home/betwithnet.com/public_html/assets/binance.svg"
Write-Output "LOGOS_SYNCED_OK"
