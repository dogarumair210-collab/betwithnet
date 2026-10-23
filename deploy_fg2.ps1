$env:SSH_ASKPASS = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS_REQUIRE = 'force'
$env:DISPLAY = 'dummy:0'

Write-Host "Creating remote fg2_engine directory..."
ssh -o StrictHostKeyChecking=no root@212.47.76.113 "mkdir -p /home/betwithnet.com/public_html/games/fg2_engine"

Write-Host "Uploading fg2_engine files..."
scp -o StrictHostKeyChecking=no games/fg2_engine/index.html root@212.47.76.113:/home/betwithnet.com/public_html/games/fg2_engine/index.html
scp -o StrictHostKeyChecking=no games/fg2_engine/index.php root@212.47.76.113:/home/betwithnet.com/public_html/games/fg2_engine/index.php

Write-Host "Uploading game page files..."
scp -o StrictHostKeyChecking=no games/fortunegems2.html root@212.47.76.113:/home/betwithnet.com/public_html/games/fortunegems2.html
scp -o StrictHostKeyChecking=no games/fortune-gems-2.html root@212.47.76.113:/home/betwithnet.com/public_html/games/fortune-gems-2.html
scp -o StrictHostKeyChecking=no games/fortune_gems_2.html root@212.47.76.113:/home/betwithnet.com/public_html/games/fortune_gems_2.html

Write-Host "Setting permissions..."
ssh -o StrictHostKeyChecking=no root@212.47.76.113 "chown -R betwi4261:betwi4261 /home/betwithnet.com/public_html/games/fg2_engine /home/betwithnet.com/public_html/games/fortune*.html && chmod 644 /home/betwithnet.com/public_html/games/fortune*.html /home/betwithnet.com/public_html/games/fg2_engine/*"

Write-Host "Deployment completed successfully!"
