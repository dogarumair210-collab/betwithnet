import subprocess
import json

php_code = """
require '/home/betwithnet.com/public_html/api/common.php';
$db = getDB();

$stmt = $db->prepare('SELECT id, username, balance_pkr FROM users WHERE username = :u LIMIT 1');
$stmt->execute([':u' => 'qa_tester']);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    $id = 'usr_qa_test99';
    $now = date('Y-m-d H:i:s');
    $ins = $db->prepare('
        INSERT INTO users (id, username, full_name, email, phone, balance_usd, balance_pkr, password_hash, salt, created_at, status)
        VALUES (:id, :u, :fn, :em, :ph, 3.57, 1000.00, :pw, :salt, :now, "active")
    ');
    $ins->execute([
        ':id' => $id,
        ':u' => 'qa_tester',
        ':fn' => 'QA Tester',
        ':em' => 'qa_tester@betwithnet.com',
        ':ph' => '+923001234567',
        ':pw' => password_hash('QaTest123!', PASSWORD_BCRYPT),
        ':salt' => bin2hex(random_bytes(8)),
        ':now' => $now
    ]);
    echo json_encode(['action' => 'created', 'id' => $id, 'balance_pkr' => 1000.00]);
} else {
    $upd = $db->prepare('UPDATE users SET balance_pkr = 1000.00, balance_usd = 3.57 WHERE id = :id');
    $upd->execute([':id' => $user['id']]);
    echo json_encode(['action' => 'reset_balance', 'id' => $user['id'], 'balance_pkr' => 1000.00]);
}
"""

res = subprocess.run(["php", "-r", php_code], capture_output=True, text=True)
print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
