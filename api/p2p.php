<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (empty($action)) {
    $input = getJsonInput();
    $action = $input['action'] ?? '';
}

$db = getDB();

switch ($action) {
    case 'merchants':
        $stmt = $db->query("SELECT * FROM p2p_merchants WHERE status = 'online' ORDER BY orders_completed DESC, completion_rate DESC");
        $merchants = $stmt->fetchAll(PDO::FETCH_ASSOC);
        sendSuccess($merchants, 'P2P merchants loaded.');
        break;

    case 'create_order':
        // Issue #32: Strictly bind order creation to authenticated session user
        $currentUser = requireAuth();
        $userId = $currentUser['id'];

        $data = getJsonInput();
        $merchantId = trim($data['merchant_id'] ?? '');
        $type = strtoupper(trim($data['type'] ?? 'BUY'));
        $channel = trim($data['channel'] ?? ($data['payment_method'] ?? 'EasyPaisa'));

        if (empty($merchantId)) {
            sendError('Merchant ID is required.', 422);
        }

        if (!in_array($type, ['BUY', 'SELL'])) {
            sendError('Order type must be BUY or SELL.', 422);
        }

        // Issue #92: Validate merchant min/max limits and online status
        $mStmt = $db->prepare("SELECT * FROM p2p_merchants WHERE id = :id LIMIT 1");
        $mStmt->execute([':id' => $merchantId]);
        $merchant = $mStmt->fetch(PDO::FETCH_ASSOC);

        if (!$merchant) {
            sendError('Selected merchant not found.', 404);
        }
        if ($merchant['status'] !== 'online') {
            sendError('This merchant is currently offline and not accepting orders.', 400);
        }

        $rate = $type === 'BUY' ? (float)$merchant['buy_price'] : (float)$merchant['sell_price'];
        if ($rate <= 0) $rate = 280.0;

        if (isset($data['amount_usd'])) {
            $amountUsd = round((float)$data['amount_usd'], 2);
            $amountPkr = round($amountUsd * $rate, 2);
        } elseif (isset($data['amount_pkr'])) {
            $amountPkr = round((float)$data['amount_pkr'], 2);
            $amountUsd = round($amountPkr / $rate, 2);
        } else {
            $amt = (float)($data['amount'] ?? 0);
            if ($amt >= (float)$merchant['min_limit']) {
                $amountPkr = $amt;
                $amountUsd = round($amountPkr / $rate, 2);
            } else {
                $amountUsd = $amt;
                $amountPkr = round($amountUsd * $rate, 2);
            }
        }

        if ($amountUsd <= 0 || $amountPkr <= 0) {
            sendError('Order amount must be greater than zero.', 422);
        }

        $minPkr = (float)$merchant['min_limit'];
        $maxPkr = (float)$merchant['max_limit'];
        if ($amountPkr < $minPkr || $amountPkr > $maxPkr) {
            sendError("Order amount must be between PKR {$minPkr} and PKR {$maxPkr}.", 422);
        }

        $db->beginTransaction();
        try {
            // Issue #93: If selling, lock & deduct seller balance (authoritative USD) to platform escrow
            if ($type === 'SELL') {
                $forUpdate = Database::getInstance()->isMySQL() ? ' FOR UPDATE' : '';
                $uStmt = $db->prepare("SELECT balance_usd FROM users WHERE id = :id{$forUpdate}");
                $uStmt->execute([':id' => $userId]);
                $user = $uStmt->fetch(PDO::FETCH_ASSOC);

                if (!$user || (float)$user['balance_usd'] < $amountUsd) {
                    $db->rollBack();
                    sendError('Insufficient balance to escrow for sell order.', 400);
                }

                $newBalanceUsd = round((float)$user['balance_usd'] - $amountUsd, 2);
                $newBalancePkr = round($newBalanceUsd * 280.0, 2);

                $uUpd = $db->prepare("UPDATE users SET balance_usd = :usd, balance_pkr = :pkr WHERE id = :id");
                $uUpd->execute([':usd' => $newBalanceUsd, ':pkr' => $newBalancePkr, ':id' => $userId]);
            }

            $orderId = 'ord_' . bin2hex(random_bytes(6));
            $now = date('Y-m-d H:i:s');
            $ins = $db->prepare("
                INSERT INTO p2p_orders (id, type, user_id, merchant_id, merchant_name, amount_usd, amount_pkr, rate, channel, status, created_at)
                VALUES (:id, :type, :uid, :mid, :mname, :usd, :pkr, :rate, :chan, 'PENDING_PAYMENT', :created_at)
            ");
            $ins->execute([
                ':id' => $orderId,
                ':type' => $type,
                ':uid' => $userId,
                ':mid' => $merchantId,
                ':mname' => $merchant['name'],
                ':usd' => $amountUsd,
                ':pkr' => $amountPkr,
                ':rate' => $rate,
                ':chan' => $channel,
                ':created_at' => $now
            ]);

            $db->commit();
            sendSuccess([
                'order_id' => $orderId,
                'amount_usd' => $amountUsd,
                'amount_pkr' => $amountPkr,
                'merchant' => $merchant['name'],
                'status' => 'PENDING_PAYMENT'
            ], 'P2P order created. Proceed with payment.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to create P2P order: ' . $e->getMessage(), 500);
        }
        break;

    case 'confirm_payment':
        // Issue #33: Verify caller is the buyer on the order
        $currentUser = requireAuth();
        $userId = $currentUser['id'];

        $data = getJsonInput();
        $orderId = $data['order_id'] ?? '';
        $proofTrx = trim($data['proof_trx'] ?? 'TRX' . strtoupper(bin2hex(random_bytes(4))));

        if (empty($orderId)) {
            sendError('Order ID required.', 422);
        }

        $stmt = $db->prepare("
            UPDATE p2p_orders 
            SET status = 'ESCROW_LOCKED', proof_trx = :proof 
            WHERE id = :id AND user_id = :uid AND status = 'PENDING_PAYMENT'
        ");
        $stmt->execute([':proof' => $proofTrx, ':id' => $orderId, ':uid' => $userId]);

        if ($stmt->rowCount() === 0) {
            sendError('Order not in pending payment state or does not belong to your account.', 400);
        }

        sendSuccess(['order_id' => $orderId, 'status' => 'ESCROW_LOCKED'], 'Payment marked sent. Awaiting release.');
        break;

    case 'release_escrow':
        // Issues #34, #95: Verify caller is seller or admin, and order is ESCROW_LOCKED
        $currentUser = requireAuth();
        $userId = $currentUser['id'];
        $isAdmin = !empty($_SESSION['is_admin']);

        $data = getJsonInput();
        $orderId = $data['order_id'] ?? '';

        if (empty($orderId)) {
            sendError('Order ID required.', 422);
        }

        $db->beginTransaction();
        try {
            $forUpdate = Database::getInstance()->isMySQL() ? ' FOR UPDATE' : '';
            $stmt = $db->prepare("SELECT * FROM p2p_orders WHERE id = :id{$forUpdate}");
            $stmt->execute([':id' => $orderId]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                $db->rollBack();
                sendError('Order not found.', 404);
            }

            // Must be in ESCROW_LOCKED state
            if ($order['status'] !== 'ESCROW_LOCKED') {
                $db->rollBack();
                sendError("Cannot release escrow: order status is {$order['status']}.", 400);
            }

            // Authorization: User selling or Admin arbitrating
            $isSeller = (strtoupper($order['type']) === 'SELL' && $order['user_id'] === $userId);
            if (!$isSeller && !$isAdmin) {
                // If it's a BUY order, merchant or admin releases
                // In production, user cannot release their own BUY order
                $db->rollBack();
                sendError('Only the seller or an administrator can release escrow.', 403);
            }

            // Credit buyer if order was BUY
            if (strtoupper($order['type']) === 'BUY') {
                $usd = (float)$order['amount_usd'];
                $pkr = round($usd * 280.0, 2);
                $uUpd = $db->prepare("UPDATE users SET balance_usd = balance_usd + :usd, balance_pkr = balance_pkr + :pkr WHERE id = :id");
                $uUpd->execute([
                    ':usd' => $usd,
                    ':pkr' => $pkr,
                    ':id' => $order['user_id']
                ]);
            }

            // Update order status
            $now = date('Y-m-d H:i:s');
            $oUpd = $db->prepare("UPDATE p2p_orders SET status = 'COMPLETED', escrow_released_at = :now WHERE id = :id");
            $oUpd->execute([':now' => $now, ':id' => $orderId]);

            // Increment merchant stats
            $mUpd = $db->prepare("UPDATE p2p_merchants SET orders_completed = orders_completed + 1 WHERE id = :id");
            $mUpd->execute([':id' => $order['merchant_id']]);

            $db->commit();
            sendSuccess(['order_id' => $orderId, 'status' => 'COMPLETED'], 'Escrow released and order completed successfully.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to release escrow: ' . $e->getMessage(), 500);
        }
        break;

    case 'dispute':
        // Issues #35, #59, #94: Persist dispute reason and timeline into p2p_disputes table
        $currentUser = requireAuth();
        $userId = $currentUser['id'];

        $data = getJsonInput();
        $orderId = $data['order_id'] ?? '';
        $reason = trim($data['reason'] ?? 'Payment discrepancy');
        $evidence = trim($data['evidence'] ?? '');

        if (empty($orderId)) {
            sendError('Order ID required.', 422);
        }

        // Verify order exists and caller is party to order
        $oStmt = $db->prepare("SELECT * FROM p2p_orders WHERE id = :id LIMIT 1");
        $oStmt->execute([':id' => $orderId]);
        $order = $oStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            sendError('Order not found.', 404);
        }

        if ($order['user_id'] !== $userId && empty($_SESSION['is_admin'])) {
            sendError('Only participants in this order can file a dispute.', 403);
        }

        $db->beginTransaction();
        try {
            $stmt = $db->prepare("UPDATE p2p_orders SET status = 'DISPUTED' WHERE id = :id");
            $stmt->execute([':id' => $orderId]);

            $disputeId = 'disp_' . bin2hex(random_bytes(6));
            $now = date('Y-m-d H:i:s');
            $evidenceUrl = trim($data['evidence_url'] ?? ($data['evidence'] ?? ''));
            $dIns = $db->prepare("
                INSERT INTO p2p_disputes (id, order_id, user_id, reason, evidence_url, status, created_at)
                VALUES (:id, :oid, :uid, :reason, :evidence, 'OPEN', :now)
            ");
            $dIns->execute([
                ':id' => $disputeId,
                ':oid' => $orderId,
                ':uid' => $userId,
                ':reason' => $reason,
                ':evidence' => $evidenceUrl,
                ':now' => $now
            ]);

            $db->commit();
            sendSuccess(['order_id' => $orderId, 'dispute_id' => $disputeId, 'status' => 'DISPUTED'], 'Dispute registered. Platform administrator has been notified for arbitration.');
        } catch (Exception $e) {
            $db->rollBack();
            sendError('Failed to register dispute: ' . $e->getMessage(), 500);
        }
        break;

    case 'orders':
        // Issue #36: Privacy filter check !empty($_SESSION['is_admin'])
        $currentUser = requireAuth();
        $userId = $currentUser['id'];
        $isAdmin = !empty($_SESSION['is_admin']);

        $query = "SELECT * FROM p2p_orders";
        $params = [];
        if (!$isAdmin) {
            $query .= " WHERE user_id = :uid";
            $params[':uid'] = $userId;
        }
        $query .= " ORDER BY created_at DESC LIMIT 50";

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendSuccess($orders, 'Orders retrieved.');
        break;

    default:
        sendError('Invalid P2P action specified.', 400);
        break;
}
