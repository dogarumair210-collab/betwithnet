<?php
require_once '/home/betwithnet.com/public_html/config/config.php';
require_once '/home/betwithnet.com/public_html/config/db.php';
$db = Database::getPdo();

try {
    if (Database::getInstance()->isMySQL()) {
        $db->exec("ALTER TABLE transactions MODIFY COLUMN proof_image LONGTEXT DEFAULT NULL");
    }
} catch (Exception $e) {
    echo "Schema note: " . $e->getMessage() . "\n";
}

$updEp = $db->prepare("UPDATE payment_methods SET account_title = 'Muhammad Ijaz', account_number = '03246533046', instructions = 'Transfer funds via EasyPaisa to 03246533046 (Muhammad Ijaz) and upload your transaction screenshot.' WHERE id LIKE '%easypaisa%' OR name LIKE '%EasyPaisa%'");
$updEp->execute();

$updJc = $db->prepare("UPDATE payment_methods SET account_title = 'Muhammad Ijaz', account_number = '03246533046', instructions = 'Transfer via JazzCash to 03246533046 (Muhammad Ijaz) and upload your transaction screenshot.' WHERE id LIKE '%jazzcash%' OR name LIKE '%JazzCash%'");
$updJc->execute();

echo "Updated EasyPaisa rows: " . $updEp->rowCount() . ", JazzCash rows: " . $updJc->rowCount() . "\n";
