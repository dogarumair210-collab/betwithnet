$askPass = (Resolve-Path "askpass.bat").Path
$env:SSH_ASKPASS = $askPass
$env:SSH_ASKPASS_REQUIRE = "force"
$env:DISPLAY = "dummy:0"

$phpCode = @"
<?php
echo 'post_max_size: ' . ini_get('post_max_size') . PHP_EOL;
echo 'upload_max_filesize: ' . ini_get('upload_max_filesize') . PHP_EOL;
echo 'memory_limit: ' . ini_get('memory_limit') . PHP_EOL;
echo 'max_execution_time: ' . ini_get('max_execution_time') . PHP_EOL;
"@

Set-Content -Path "test_check.php" -Value $phpCode -Encoding UTF8
scp.exe -o StrictHostKeyChecking=no test_check.php "root@212.47.76.113:/root/test_check.php"
ssh.exe -n -o StrictHostKeyChecking=no root@212.47.76.113 "php /root/test_check.php"
