<?php
/**
 * Bet With Net - 7 Days VIP Daily Check-in Bonus API
 * Day 1 - Day 6: ₨ 5 PKR
 * Day 7: ₨ 20 PKR (Mega VIP Reward)
 */
require_once __DIR__ . '/common.php';

header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? ($_POST['action'] ?? 'status');

function sendJson($data, int $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $db = getDB();
} catch (Exception $e) {
    sendJson(['success' => false, 'message' => 'Database connection failed.'], 500);
}

// Identify user from GET/POST parameter or active session
$userId = $_GET['user_id'] ?? null;
if (!$userId) {
    $input = getJsonInput();
    $userId = $input['user_id'] ?? null;
}
if (!$userId && !empty($_SESSION['user_id'])) {
    $userId = $_SESSION['user_id'];
}
if (!$userId && !empty($_SESSION['user']['id'])) {
    $userId = $_SESSION['user']['id'];
}

// Helper: resolve real user from database
function resolveUser(PDO $db, ?string $inputUserId): ?array {
    if (!empty($inputUserId)) {
        $uStmt = $db->prepare("SELECT id, username, balance_pkr, balance_usd, bonus_balance_pkr, bonus_balance_usd, has_deposited, status FROM users WHERE (id = :id OR username = :u) AND username NOT LIKE 'VIP_%' LIMIT 1");
        $uStmt->execute([':id' => $inputUserId, ':u' => $inputUserId]);
        $found = $uStmt->fetch(PDO::FETCH_ASSOC);
        if ($found) {
            return $found;
        }
    }
    return null;
}

if ($action === 'status') {
    $user = resolveUser($db, $userId);

    if (!$user) {
        // Return default status for visitors without accounts
        sendJson([
            'success' => true,
            'is_logged_in' => false,
            'can_claim' => true,
            'already_claimed' => false,
            'claim_date' => date('Y-m-d'),
            'streak_day' => 1,
            'reward_today' => 5,
            'claimed_days' => []
        ]);
    }

    $actualUserId = $user['id'];

    // Get the most recent claim
    $cStmt = $db->prepare("SELECT streak_day, claim_date FROM daily_bonus_claims WHERE user_id = :id ORDER BY id DESC LIMIT 1");
    $cStmt->execute([':id' => $actualUserId]);
    $lastClaim = $cStmt->fetch(PDO::FETCH_ASSOC);

    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));

    $alreadyClaimed = false;
    $currentStreakDay = 1;
    $claimedDays = [];

    if ($lastClaim) {
        $lastDate = $lastClaim['claim_date'];
        $lastStreak = (int)$lastClaim['streak_day'];

        if ($lastDate === $today) {
            $alreadyClaimed = true;
            $currentStreakDay = $lastStreak;
            for ($i = 1; $i <= $lastStreak; $i++) {
                $claimedDays[] = $i;
            }
        } elseif ($lastDate === $yesterday) {
            $alreadyClaimed = false;
            $currentStreakDay = ($lastStreak % 7) + 1;
            for ($i = 1; $i <= $lastStreak; $i++) {
                $claimedDays[] = $i;
            }
        } else {
            // Streak broken -> restarts at Day 1
            $alreadyClaimed = false;
            $currentStreakDay = 1;
            $claimedDays = [];
        }
    }

    $rewardToday = ($currentStreakDay === 7) ? 20.00 : 5.00;

    sendJson([
        'success' => true,
        'is_logged_in' => true,
        'user_id' => $actualUserId,
        'username' => $user['username'],
        'can_claim' => !$alreadyClaimed,
        'already_claimed' => $alreadyClaimed,
        'claim_date' => $today,
        'last_claim_date' => $lastClaim ? $lastClaim['claim_date'] : null,
        'streak_day' => $currentStreakDay,
        'reward_today' => $rewardToday,
        'claimed_days' => $claimedDays,
        'balance_pkr' => (float)$user['balance_pkr'],
        'balance_usd' => (float)$user['balance_usd'],
        'bonus_balance_pkr' => (float)($user['bonus_balance_pkr'] ?? 0),
        'bonus_balance_usd' => (float)($user['bonus_balance_usd'] ?? 0),
        'has_deposited' => (int)($user['has_deposited'] ?? 0),
        'withdraw_locked' => empty($user['has_deposited'])
    ]);
}

if ($action === 'claim') {
    $user = resolveUser($db, $userId);
    if (!$user) {
        sendJson([
            'success' => false,
            'auth_required' => true,
            'message' => 'Bonus claim karne ke liye pehle apna Account Register ya Sign In karein!'
        ], 401);
    }

    try {
        $db->beginTransaction();

        $actualUserId = $user['id'];

        // Re-lock row for atomic balance update
        $uStmt = $db->prepare("SELECT id, username, balance_pkr, balance_usd, bonus_balance_pkr, bonus_balance_usd, has_deposited, status FROM users WHERE id = :id FOR UPDATE");
        $uStmt->execute([':id' => $actualUserId]);
        $user = $uStmt->fetch(PDO::FETCH_ASSOC);

        $today = date('Y-m-d');
        $yesterday = date('Y-m-d', strtotime('-1 day'));

        // Check if already claimed today
        $cStmt = $db->prepare("SELECT streak_day, claim_date FROM daily_bonus_claims WHERE user_id = :id ORDER BY id DESC LIMIT 1 FOR UPDATE");
        $cStmt->execute([':id' => $actualUserId]);
        $lastClaim = $cStmt->fetch(PDO::FETCH_ASSOC);

        if ($lastClaim && $lastClaim['claim_date'] === $today) {
            $db->rollBack();
            sendJson([
                'success' => false,
                'already_claimed' => true,
                'message' => 'Aap aaj ka bonus pehle hi claim kar chuke hain. Kal agla bonus milega!'
            ], 400);
        }

        $nextStreakDay = 1;
        if ($lastClaim) {
            $lastDate = $lastClaim['claim_date'];
            $lastStreak = (int)$lastClaim['streak_day'];

            if ($lastDate === $yesterday) {
                $nextStreakDay = ($lastStreak % 7) + 1;
            } else {
                $nextStreakDay = 1;
            }
        }

        // Days 1-6 = Rs 5, Day 7 = Rs 20
        $rewardPkr = ($nextStreakDay === 7) ? 20.00 : 5.00;
        $rewardUsd = round($rewardPkr / 280.0, 2);

        // 1. Record claim in daily_bonus_claims
        $ins = $db->prepare("INSERT INTO daily_bonus_claims (user_id, streak_day, reward_pkr, claim_date) VALUES (:uid, :day, :reward, :cdate)");
        $ins->execute([
            ':uid' => $actualUserId,
            ':day' => $nextStreakDay,
            ':reward' => $rewardPkr,
            ':cdate' => $today
        ]);

        // 2. Update user bonus balance atomically (separated from playable balance)
        $newBonusPkr = round((float)($user['bonus_balance_pkr'] ?? 0) + $rewardPkr, 2);
        $newBonusUsd = round((float)($user['bonus_balance_usd'] ?? 0) + $rewardUsd, 2);

        $uUpd = $db->prepare("UPDATE users SET bonus_balance_pkr = :bpkr, bonus_balance_usd = :busd WHERE id = :id");
        $uUpd->execute([
            ':bpkr' => $newBonusPkr,
            ':busd' => $newBonusUsd,
            ':id' => $actualUserId
        ]);

        // 3. Log in transactions ledger as promotional bonus (NOT playable deposit)
        $trxId = 'BONUS_' . strtoupper(bin2hex(random_bytes(5)));
        $now = date('Y-m-d H:i:s');
        $tIns = $db->prepare("INSERT INTO transactions (id, user_id, type, method, amount_pkr, amount_usd, status, notes, transaction_date) VALUES (:id, :uid, 'bonus', 'Daily Bonus', :pkr, :usd, 'Approved', :notes, :tdate)");
        $tIns->execute([
            ':id' => $trxId,
            ':uid' => $actualUserId,
            ':pkr' => $rewardPkr,
            ':usd' => $rewardUsd,
            ':notes' => "Day {$nextStreakDay} Daily Bonus (₨{$rewardPkr}) - Non-playable promotional bonus",
            ':tdate' => $now
        ]);

        $db->commit();

        // Build claimed days list
        $claimedDays = [];
        for ($i = 1; $i <= $nextStreakDay; $i++) {
            $claimedDays[] = $i;
        }

        sendJson([
            'success' => true,
            'message' => "🎉 Mubarak ho! Day {$nextStreakDay} ka ₨{$rewardPkr} Daily Bonus aap ke Bonus Wallet mein credit ho gaya hai! (Games khelne ke liye real deposit zaroori hai).",
            'reward_pkr' => $rewardPkr,
            'reward_usd' => $rewardUsd,
            'streak_day' => $nextStreakDay,
            'can_claim' => false,
            'already_claimed' => true,
            'claim_date' => $today,
            'claimed_days' => $claimedDays,
            'balance_pkr' => (float)$user['balance_pkr'],
            'balance_usd' => (float)$user['balance_usd'],
            'bonus_balance_pkr' => $newBonusPkr,
            'bonus_balance_usd' => $newBonusUsd,
            'user' => [
                'id' => $actualUserId,
                'username' => $user['username'],
                'balance_pkr' => (float)$user['balance_pkr'],
                'balance_usd' => (float)$user['balance_usd'],
                'bonus_balance_pkr' => $newBonusPkr,
                'bonus_balance_usd' => $newBonusUsd
            ]
        ]);
    } catch (Exception $e) {
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        sendJson(['success' => false, 'message' => 'Bonus claim process failed: ' . $e->getMessage()], 500);
    }
}

sendJson(['success' => false, 'message' => 'Invalid action specified.'], 400);
