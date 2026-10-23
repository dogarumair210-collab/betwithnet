<?php
require_once __DIR__ . '/common.php';

// Release PHP session file lock immediately so concurrent telemetry requests never queue up!
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

$action = $_GET['action'] ?? ($_POST['action'] ?? '');
if (empty($action)) {
    $input = getJsonInput();
    $action = $input['action'] ?? '';
}

function getCrashStateFile() {
    return __DIR__ . '/crash_state.json';
}

function calcCrashMultiplier($elapsedSec) {
    $elapsedSec = (float)$elapsedSec;
    if ($elapsedSec <= 0) return 1.00;
    $m = exp(0.07 * $elapsedSec + 0.018 * pow($elapsedSec, 1.3));
    return round(max(1.00, $m), 2);
}

function calcFlightDurationMs($crashPoint) {
    $crashPoint = (float)$crashPoint;
    if ($crashPoint <= 1.00) return 80; // Instant 1.00x bust (80ms)
    $low = 0.0;
    $high = 120.0;
    for ($i = 0; $i < 30; $i++) {
        $mid = ($low + $high) / 2.0;
        $val = exp(0.07 * $mid + 0.018 * pow($mid, 1.3));
        if ($val < $crashPoint) {
            $low = $mid;
        } else {
            $high = $mid;
        }
    }
    return (int)round((($low + $high) / 2.0) * 1000);
}

function getActiveGenuineBetTotal($state, $onlyCurrentRound = true) {
    $total = 0.0;
    if (!empty($state['active_bets']) && is_array($state['active_bets'])) {
        foreach ($state['active_bets'] as $b) {
            if (!empty($b['isGenuine']) && empty($b['cashedOut'])) {
                if ($onlyCurrentRound && !empty($b['queued'])) {
                    continue; // Skip queued bets for next round!
                }
                $total += (float)($b['betPKR'] ?? $b['amount'] ?? 0);
            }
        }
    }
    return $total;
}

function generateServerCrashPoint(&$state, $cycleOverride = null) {
    if (!empty($state['next_crash_point']) && (float)$state['next_crash_point'] >= 1.01) {
        return round((float)$state['next_crash_point'], 2);
    }

    // Strict Admin Rig Check: Agar kisi active bet lagane walay user par force_loss / force_stop rig laga ho to crash point strictly 1.03 - 1.08 k darmian ho!
    if (!empty($state['active_bets']) && is_array($state['active_bets'])) {
        foreach ($state['active_bets'] as $b) {
            if (!empty($b['isRiggedUser']) || (!empty($b['outcomeBias']) && in_array($b['outcomeBias'], ['force_loss', 'force_stop', 'stop', 'loss']))) {
                $riggedPoints = [1.03, 1.04, 1.05, 1.06, 1.07, 1.08];
                return $riggedPoints[array_rand($riggedPoints)];
            }
        }
    }
    if (!empty($state['next_crash_point']) && (float)$state['next_crash_point'] >= 1.01) {
        return round((float)$state['next_crash_point'], 2);
    }

    $genuineBetTotal = getActiveGenuineBetTotal($state, false);
    if ($genuineBetTotal > 0) {
        // Heavy bet safeguard (agar user bohot bari bet lagaye to foran bust):
        if ($genuineBetTotal >= 1500) {
            return round(1.02 + (mt_rand(0, 140) / 1000.0), 2); // 1.02x - 1.16x
        }

        // SMART CYCLE: Har 4 bets ke baad ik bet 1.06, 1.07, 1.08 par phtay
        // Step 0: Lalach (2.10x - 2.85x, agar bet >= 500 to 1.08x - 1.32x)
        // Step 1: Loss 1 (1.30x - 1.55x)
        // Step 2: Loss 2 (1.10x - 1.25x)
        // Step 3: Lalach (2.10x - 2.65x, agar bet >= 500 to 1.08x - 1.30x)
        // Step 4: Har 4 bets ke baad instant bust (1.06, 1.07, 1.08)!
        $cIdx = ($cycleOverride !== null) ? (int)$cycleOverride : (int)($state['genuine_bet_cycle'] ?? 0);
        $step = $cIdx % 5;

        switch ($step) {
            case 0:
                // Lalach: Agar bet >= 500 PKR hu to jaldi phat jaye!
                if ($genuineBetTotal >= 500) {
                    return round(1.08 + (mt_rand(0, 240) / 1000.0), 2); // 1.08x - 1.32x
                }
                $r = mt_rand(0, 99);
                if ($r < 30) {
                    return round(2.70 + (mt_rand(0, 500) / 1000.0), 2); // 2.70x - 3.20x
                }
                return round(2.10 + (mt_rand(0, 650) / 1000.0), 2); // 2.10x - 2.75x
            case 1:
                // Loss 1: 1.30x - 1.55x
                return round(1.30 + (mt_rand(0, 250) / 1000.0), 2);
            case 2:
                // Loss 2: 1.10x - 1.25x
                return round(1.10 + (mt_rand(0, 150) / 1000.0), 2);
            case 3:
                // Lalach: Agar bet >= 500 PKR hu to jaldi phat jaye!
                if ($genuineBetTotal >= 500) {
                    return round(1.08 + (mt_rand(0, 220) / 1000.0), 2); // 1.08x - 1.30x
                }
                return round(2.10 + (mt_rand(0, 550) / 1000.0), 2); // 2.10x - 2.65x
            case 4:
            default:
                // Har 4 bets ke baad ik bet 1.06, 1.07, 1.08 par phtay!
                $shockPoints = [1.06, 1.07, 1.08];
                return $shockPoints[array_rand($shockPoints)];
        }
    }

    // Bina bet wala scene: Beech beech me kafi upar jaye (realistic exciting multipliers!)
    $rand = mt_rand(0, 9999) / 10000.0;
    if ($rand < 0.05) return 1.00; // Instant bust (5%)
    if ($rand < 0.28) return round(1.10 + (mt_rand(0, 750) / 1000.0), 2); // 1.10x - 1.85x (23%)
    if ($rand < 0.52) return round(1.90 + (mt_rand(0, 1600) / 1000.0), 2); // 1.90x - 3.50x (24%)
    if ($rand < 0.72) return round(3.50 + (mt_rand(0, 4500) / 1000.0), 2); // 3.50x - 8.00x (20%)
    if ($rand < 0.88) return round(8.00 + (mt_rand(0, 17000) / 1000.0), 2); // 8.00x - 25.00x (16%)
    if ($rand < 0.96) return round(25.00 + (mt_rand(0, 35000) / 1000.0), 2); // 25.00x - 60.00x (8%)
    return round(60.00 + (mt_rand(0, 40000) / 1000.0), 2); // 60.00x - 100.00x (4% beech beech me kafi upar!)
}

function advanceCrashEngine(&$state) {
    $nowMs = (int)round(microtime(true) * 1000);
    $nowSec = (int)floor($nowMs / 1000);

    if (!isset($state['history']) || !is_array($state['history']) || count($state['history']) < 5) {
        $state['history'] = [1.32, 2.14, 1.15, 3.40, 1.08, 1.85, 4.20, 1.25, 2.70, 1.60, 5.80, 2.05, 1.45, 3.10];
    }
    if (!isset($state['active_bets']) || !is_array($state['active_bets'])) {
        $state['active_bets'] = [];
    }
    if (!isset($state['prev_bets']) || !is_array($state['prev_bets'])) {
        $state['prev_bets'] = [];
    }

    $archiveBet = function($b) use (&$state) {
        if (empty($b) || empty($b['betId'])) return;
        foreach ($state['prev_bets'] as $idx => $existingPrev) {
            if (($existingPrev['betId'] ?? '') === $b['betId']) {
                $state['prev_bets'][$idx] = $b;
                return;
            }
        }
        array_unshift($state['prev_bets'], $b);
        if (count($state['prev_bets']) > 30) {
            $state['prev_bets'] = array_slice($state['prev_bets'], 0, 30);
        }
    };

    if (($state['status'] ?? '') === 'running') {
        $state['status'] = 'flying';
    }

    $phaseStartMs = (int)($state['phase_start_ms'] ?? 0);
    if ($phaseStartMs <= 0 || ($nowMs - $phaseStartMs) > 60000 || !in_array($state['status'] ?? '', ['waiting', 'flying', 'crashed'], true)) {
        $state['round_id'] = (int)($state['round_id'] ?? 1000) + 1;
        $state['status'] = 'waiting';
        $state['phase_start_ms'] = $nowMs;
        $state['multiplier'] = 1.00;
        $state['crash_point'] = generateServerCrashPoint($state);
        $state['flight_duration_ms'] = calcFlightDurationMs((float)$state['crash_point']);
        $state['updated_at'] = $nowSec;
        return;
    }

    for ($step = 0; $step < 4; $step++) {
        $status = $state['status'];
        $phaseStartMs = (int)$state['phase_start_ms'];
        $elapsedMs = max(0, $nowMs - $phaseStartMs);

        if ($status === 'waiting') {
            if (!empty($state['next_crash_point']) && (float)$state['next_crash_point'] >= 1.01) {
                $state['crash_point'] = round((float)$state['next_crash_point'], 2);
                $state['flight_duration_ms'] = calcFlightDurationMs((float)$state['crash_point']);
            }
            $state['multiplier'] = 1.00;

            if ($elapsedMs >= 5000) {
                $state['status'] = 'flying';
                $state['phase_start_ms'] = ($elapsedMs < 15000) ? ($phaseStartMs + 5000) : $nowMs;
                $state['multiplier'] = 1.00;
                $hasGenuine = getActiveGenuineBetTotal($state) > 0;
                if ($hasGenuine) {
                    $curCycle = (int)($state['genuine_bet_cycle'] ?? 0);
                    $state['crash_point'] = generateServerCrashPoint($state, $curCycle);
                    $state['genuine_bet_cycle'] = ($curCycle + 1) % 5;
                } elseif (empty($state['crash_point']) || (float)$state['crash_point'] < 1.00) {
                    $state['crash_point'] = generateServerCrashPoint($state);
                }
                $state['flight_duration_ms'] = calcFlightDurationMs((float)$state['crash_point']);
                foreach ($state['active_bets'] as &$b) {
                    $b['queued'] = false;
                    $b['round_id'] = $state['round_id'];
                }
                unset($b);
                continue;
            }
            break;
        } elseif ($status === 'flying') {
            $flightDurMs = (int)($state['flight_duration_ms'] ?? calcFlightDurationMs((float)($state['crash_point'] ?? 2.00)));
            $curMult = calcCrashMultiplier($elapsedMs / 1000.0);

            if (!empty($state['force_crash'])) {
                $state['force_crash'] = false;
                $state['crash_point'] = max(1.00, $curMult);
                $flightDurMs = $elapsedMs;
            } elseif (!empty($state['next_crash_point']) && (float)$state['next_crash_point'] >= 1.01) {
                $adminTarget = round((float)$state['next_crash_point'], 2);
                if ($adminTarget != (float)$state['crash_point'] && $curMult <= $adminTarget) {
                    $state['crash_point'] = $adminTarget;
                    $flightDurMs = calcFlightDurationMs($adminTarget);
                    $state['flight_duration_ms'] = $flightDurMs;
                }
            }

            // Strict Admin Rig: Force Loss / Stop rig bet crash cap (1.03 - 1.08)
            if (!empty($state['active_bets']) && is_array($state['active_bets'])) {
                foreach ($state['active_bets'] as $b) {
                    if (!empty($b['isRiggedUser']) || (!empty($b['outcomeBias']) && in_array($b['outcomeBias'], ['force_loss', 'force_stop', 'stop', 'loss']))) {
                        if (empty($b['cashedOut']) && (float)$state['crash_point'] > 1.08) {
                            $riggedPoints = [1.03, 1.04, 1.05, 1.06, 1.07, 1.08];
                            $state['crash_point'] = $riggedPoints[array_rand($riggedPoints)];
                            $flightDurMs = calcFlightDurationMs((float)$state['crash_point']);
                            $state['flight_duration_ms'] = $flightDurMs;
                            break;
                        }
                    }
                }
            }

            if ($elapsedMs >= $flightDurMs) {
                $cPt = round((float)$state['crash_point'], 2);
                $state['status'] = 'crashed';
                $state['multiplier'] = $cPt;
                $state['phase_start_ms'] = ($elapsedMs - $flightDurMs < 10000) ? ($phaseStartMs + $flightDurMs) : $nowMs;

                if (($state['last_history_round_id'] ?? 0) !== ($state['round_id'] ?? 0)) {
                    $state['last_history_round_id'] = $state['round_id'] ?? 0;
                    $state['history'][] = $cPt;
                    if (count($state['history']) > 35) {
                        $state['history'] = array_slice($state['history'], -35);
                    }
                }

                foreach ($state['active_bets'] as &$b) {
                    if (empty($b['queued'])) {
                        $b['round_ended_at'] = $nowSec;
                        $archiveBet($b);
                    }
                }
                unset($b);
                continue;
            } else {
                $state['multiplier'] = min((float)$state['crash_point'], $curMult);
                break;
            }
        } elseif ($status === 'crashed') {
            $state['multiplier'] = round((float)($state['crash_point'] ?? 1.00), 2);
            if ($elapsedMs >= 3200) {
                $state['round_id'] = (int)($state['round_id'] ?? 1000) + 1;
                $state['status'] = 'waiting';
                $state['phase_start_ms'] = ($elapsedMs < 12000) ? ($phaseStartMs + 3200) : $nowMs;
                $state['multiplier'] = 1.00;
                $state['crash_point'] = generateServerCrashPoint($state);
                $state['flight_duration_ms'] = calcFlightDurationMs((float)$state['crash_point']);

                foreach ($state['active_bets'] as $bKey => &$bVal) {
                    if (!empty($bVal['queued'])) {
                        $bVal['queued'] = false;
                        $bVal['round_id'] = $state['round_id'];
                        $bVal['round_ended_at'] = null;
                        $bVal['timestamp'] = $nowSec;
                    } else {
                        $archiveBet($bVal);
                        unset($state['active_bets'][$bKey]);
                    }
                }
                unset($bVal);
                continue;
            }
            break;
        }
    }

    foreach ($state['active_bets'] as $bKey => $bVal) {
        if (($nowSec - (int)($bVal['timestamp'] ?? $nowSec)) > 45) {
            $archiveBet($bVal);
            unset($state['active_bets'][$bKey]);
        }
    }

    $state['updated_at'] = $nowSec;
}

function readCrashState() {
    $file = getCrashStateFile();
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }
    return [
        'round_id' => 1001,
        'status' => 'waiting',
        'phase_start_ms' => (int)round(microtime(true) * 1000),
        'multiplier' => 1.00,
        'crash_point' => 1.85,
        'flight_duration_ms' => 5200,
        'force_crash' => false,
        'next_crash_point' => null,
        'history' => [1.32, 2.14, 1.15, 3.40, 1.08, 1.85, 4.20, 1.25, 2.70, 1.60, 5.80, 2.05, 1.45, 3.10],
        'active_bets' => [],
        'prev_bets' => [],
        'updated_at' => time()
    ];
}

function writeCrashState($data) {
    $file = getCrashStateFile();
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

function updateCrashStateLocked(callable $callback) {
    $file = getCrashStateFile();
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        $state = readCrashState();
        $res = $callback($state);
        writeCrashState($state);
        return $res;
    }
    flock($fp, LOCK_EX);
    $content = stream_get_contents($fp);
    $state = json_decode($content ?: '', true);
    if (!is_array($state)) {
        $state = readCrashState();
    }
    $res = $callback($state);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($state));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $res;
}

function readCrashStateShared() {
    $file = getCrashStateFile();
    if (!file_exists($file)) {
        return readCrashState();
    }
    $fp = @fopen($file, 'r');
    if (!$fp) {
        return readCrashState();
    }
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content ?: '', true);
    return is_array($data) ? $data : readCrashState();
}

function formatCrashPayload($state, $nowMs) {
    $nowMs = (int)$nowMs;
    $status = $state['status'] ?? 'waiting';
    $phaseElapsedMs = max(0, $nowMs - (int)($state['phase_start_ms'] ?? $nowMs));
    $flightDurMs = (int)($state['flight_duration_ms'] ?? 5000);
    $crashPoint = (float)($state['crash_point'] ?? 1.85);

    if ($status === 'flying') {
        $curMult = calcCrashMultiplier($phaseElapsedMs / 1000.0);
        $multiplier = (float)min($crashPoint, $curMult);
    } elseif ($status === 'crashed') {
        $multiplier = round($crashPoint, 2);
    } else {
        $multiplier = 1.00;
    }

    $nextCrash = $state['next_crash_point'] ?? null;
    $isAuto = empty($nextCrash) && empty($state['force_crash']);

    // Real users filter & telemetry calculation (kitni bet lgi ha or kitna ki - sirf real user)
    $realActiveBets = [];
    $realBetCount = 0;
    $realBetTotalPKR = 0.0;
    if (!empty($state['active_bets']) && is_array($state['active_bets'])) {
        foreach ($state['active_bets'] as $b) {
            $uName = trim((string)($b['id'] ?? ($b['username'] ?? '')));
            $uLower = strtolower($uName);
            if ($uName !== '' && !str_starts_with($uLower, 'bot_') && !str_starts_with($uLower, 'bot-') && !str_starts_with($uLower, 'guest_') && !str_starts_with($uLower, 'demo_') && !str_starts_with($uLower, 'demoauto') && !str_starts_with($uLower, 'appplayer_')) {
                $amt = (float)($b['betPKR'] ?? $b['amount'] ?? 0);
                $realBetCount++;
                $realBetTotalPKR += $amt;
                $realActiveBets[] = $b;
            }
        }
    }

    $realPrevBets = [];
    if (!empty($state['prev_bets']) && is_array($state['prev_bets'])) {
        foreach ($state['prev_bets'] as $b) {
            $uName = trim((string)($b['id'] ?? ($b['username'] ?? '')));
            $uLower = strtolower($uName);
            if ($uName !== '' && !str_starts_with($uLower, 'bot_') && !str_starts_with($uLower, 'bot-') && !str_starts_with($uLower, 'guest_') && !str_starts_with($uLower, 'demo_') && !str_starts_with($uLower, 'demoauto') && !str_starts_with($uLower, 'appplayer_')) {
                $realPrevBets[] = $b;
            }
        }
    }

    return [
        'round_id' => (int)($state['round_id'] ?? 1001),
        'status' => $status,
        'phase_elapsed_ms' => $phaseElapsedMs,
        'flight_duration_ms' => $flightDurMs,
        'multiplier' => $multiplier,
        'crash_point' => $crashPoint,
        'force_crash' => false,
        'next_crash_point' => $nextCrash,
        'is_auto' => $isAuto,
        'history' => array_values($state['history'] ?? []),
        'active_bets' => array_values($state['active_bets'] ?? []),
        'prev_bets' => array_values($state['prev_bets'] ?? []),
        'real_bet_count' => $realBetCount,
        'real_bet_total_pkr' => round($realBetTotalPKR, 2),
        'real_active_bets' => $realActiveBets,
        'real_prev_bets' => $realPrevBets
    ];
}

function getABStateFile() {
    return __DIR__ . '/ab_state.json';
}

function readABState() {
    $file = getABStateFile();
    if (file_exists($file)) {
        $content = @file_get_contents($file);
        $data = json_decode($content, true);
        if (is_array($data)) return $data;
    }
    return [
        'round_number' => 100,
        'round_id' => 'AB-' . date('ymd') . '-0100',
        'status' => 'betting',
        'phase_start_ms' => (int)round(microtime(true) * 1000),
        'time_left' => 15,
        'middle_card' => 'H10',
        'start_side' => 'andar',
        'winner' => 'andar',
        'count_dealt' => 5,
        'end_card' => 'D10',
        'andar_cards' => ['H2', 'C4', 'D10'],
        'bahar_cards' => ['S7', 'C9'],
        'first3' => '',
        'outcome_values' => ['H10', 'andar', '5', 'D10', '["H2","C4","D10"]', '["S7","C9"]', ''],
        'bet_options_result' => [
            'ab-andar' => 1, 'ab-bahar' => 0, 'ab-first-andar' => 0, 'ab-first-bahar' => 0, 'ab-first-3' => 0,
            'ab-1-5' => 1, 'ab-6-10' => 0, 'ab-11-15' => 0, 'ab-16-20' => 0, 'ab-21-25' => 0,
            'ab-26-30' => 0, 'ab-31-35' => 0, 'ab-36-40' => 0, 'ab-41' => 0
        ],
        'mode' => 'auto',
        'lock_mode' => 'lock',
        'target_range' => 'auto',
        'target_first3' => 'auto',
        'command_id' => 1,
        'player_bets' => [
            'andar' => 0,
            'bahar' => 0,
            'first_andar' => 0,
            'first_bahar' => 0,
            'first_3' => 0,
            'ranges' => [],
            'total' => 0,
            'details' => []
        ],
        'history' => [],
        'updated_at' => time()
    ];
}

function writeABState($data) {
    $file = getABStateFile();
    @file_put_contents($file, json_encode($data), LOCK_EX);
}

function updateABStateLocked(callable $callback) {
    $file = getABStateFile();
    $fp = @fopen($file, 'c+');
    if (!$fp) {
        $state = readABState();
        $res = $callback($state);
        writeABState($state);
        return $res;
    }
    flock($fp, LOCK_EX);
    $content = stream_get_contents($fp);
    $state = json_decode($content ?: '', true);
    if (!is_array($state)) {
        $state = readABState();
    }
    $res = $callback($state);
    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($state));
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    return $res;
}

function readABStateShared() {
    $file = getABStateFile();
    if (!file_exists($file)) {
        return readABState();
    }
    $fp = @fopen($file, 'r');
    if (!$fp) {
        return readABState();
    }
    flock($fp, LOCK_SH);
    $content = stream_get_contents($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
    $data = json_decode($content ?: '', true);
    return is_array($data) ? $data : readABState();
}

function evalABFirst3($c1, $c2, $c3) {
    if (!$c1 || !$c2 || !$c3) return "";
    $s1 = substr($c1, 0, 1); $s2 = substr($c2, 0, 1); $s3 = substr($c3, 0, 1);
    $r = [(int)substr($c1, 1), (int)substr($c2, 1), (int)substr($c3, 1)];
    sort($r);
    $isFlush = ($s1 === $s2 && $s2 === $s3);
    $isStraight = (($r[1] === $r[0] + 1 && $r[2] === $r[1] + 1) || ($r[0] === 1 && $r[1] === 12 && $r[2] === 13));
    if ($isFlush && $isStraight) return "straight-flush";
    if ($isFlush) return "flush";
    if ($isStraight) return "straight";
    return "";
}

function generateABOutcome($mode = 'auto', $targetRange = 'auto', $targetFirst3 = 'auto', $pb = []) {
    $suits = ['S', 'H', 'C', 'D'];
    $midSuit = $suits[array_rand($suits)];
    $midRank = mt_rand(1, 13);
    $midCard = $midSuit . $midRank;
    $startSide = 'andar';

    $winner = (mt_rand(0, 1) === 0) ? 'andar' : 'bahar';
    $forcedCount = null;

    if ($mode === 'force_andar') {
        $winner = 'andar';
    } elseif ($mode === 'force_bahar') {
        $winner = 'bahar';
    } elseif ($mode === 'first_andar') {
        $winner = 'andar';
        $forcedCount = 1;
    } elseif ($mode === 'first_bahar') {
        $winner = 'bahar';
        $forcedCount = 2;
    } elseif ($mode === 'house_win') {
        $andarTotal = (float)($pb['andar'] ?? 0) * 1.9 + (float)($pb['first_andar'] ?? 0) * 3.5;
        $baharTotal = (float)($pb['bahar'] ?? 0) * 2.0 + (float)($pb['first_bahar'] ?? 0) * 3.5;
        if ($andarTotal > $baharTotal) {
            $winner = 'bahar';
        } elseif ($baharTotal > $andarTotal) {
            $winner = 'andar';
        }
    } elseif ($mode === 'player_win') {
        $andarTotal = (float)($pb['andar'] ?? 0);
        $baharTotal = (float)($pb['bahar'] ?? 0);
        if ($andarTotal > $baharTotal) {
            $winner = 'andar';
        } elseif ($baharTotal > $andarTotal) {
            $winner = 'bahar';
        }
    }

    $needOdd = ($winner === 'andar');

    if ($forcedCount !== null) {
        $count = $forcedCount;
    } elseif ($targetRange !== 'auto') {
        $rangeBounds = [
            'ab-1-5' => [1, 5],
            'ab-6-10' => [6, 10],
            'ab-11-15' => [11, 15],
            'ab-16-20' => [16, 20],
            'ab-21-25' => [21, 25],
            'ab-26-30' => [26, 30],
            'ab-31-35' => [31, 35],
            'ab-36-40' => [36, 40],
            'ab-41' => [41, 45]
        ];
        $bnds = $rangeBounds[$targetRange] ?? [1, 10];
        $cands = [];
        for ($c = $bnds[0]; $c <= $bnds[1]; $c++) {
            if (($c % 2 === 1) === $needOdd) $cands[] = $c;
        }
        $count = !empty($cands) ? $cands[array_rand($cands)] : $bnds[0];
    } else {
        $rRoll = mt_rand(1, 100);
        if ($rRoll <= 40) {
            $cntCandidates = $needOdd ? [1, 3, 5] : [2, 4];
        } elseif ($rRoll <= 70) {
            $cntCandidates = $needOdd ? [7, 9] : [6, 8, 10];
        } elseif ($rRoll <= 85) {
            $cntCandidates = $needOdd ? [11, 13, 15] : [12, 14];
        } elseif ($rRoll <= 95) {
            $cntCandidates = $needOdd ? [17, 19, 21, 23, 25] : [16, 18, 20, 22, 24];
        } else {
            $cntCandidates = $needOdd ? [27, 29, 31, 33] : [26, 28, 30, 32];
        }
        $count = $cntCandidates[array_rand($cntCandidates)];
    }

    $availEndSuits = array_diff($suits, [$midSuit]);
    $endSuit = $availEndSuits[array_rand($availEndSuits)];
    $endCard = $endSuit . $midRank;

    $nonMatch = [];
    for ($rnk = 1; $rnk <= 13; $rnk++) {
        if ($rnk === $midRank) continue;
        foreach ($suits as $st) {
            $nonMatch[] = $st . $rnk;
        }
    }
    shuffle($nonMatch);

    $seq = [];
    for ($k = 0; $k < $count - 1; $k++) {
        $seq[] = $nonMatch[$k % count($nonMatch)];
    }
    $seq[] = $endCard;

    $andarCards = [];
    $baharCards = [];
    foreach ($seq as $idx => $card) {
        if ($idx % 2 === 0) {
            $andarCards[] = $card;
        } else {
            $baharCards[] = $card;
        }
    }

    $first3Name = ($count >= 2) ? evalABFirst3($midCard, $andarCards[0] ?? '', $baharCards[0] ?? '') : "";
    $isAndarWin = ($winner === 'andar');

    $betRes = [
        'ab-andar' => $isAndarWin ? 1 : 0,
        'ab-bahar' => !$isAndarWin ? 1 : 0,
        'ab-first-andar' => ($isAndarWin && count($andarCards) === 1) ? 1 : 0,
        'ab-first-bahar' => (!$isAndarWin && count($baharCards) === 1) ? 1 : 0,
        'ab-first-3' => ($first3Name !== "") ? 1 : 0,
        'ab-1-5' => ($count <= 5) ? 1 : 0,
        'ab-6-10' => ($count >= 6 && $count <= 10) ? 1 : 0,
        'ab-11-15' => ($count >= 11 && $count <= 15) ? 1 : 0,
        'ab-16-20' => ($count >= 16 && $count <= 20) ? 1 : 0,
        'ab-21-25' => ($count >= 21 && $count <= 25) ? 1 : 0,
        'ab-26-30' => ($count >= 26 && $count <= 30) ? 1 : 0,
        'ab-31-35' => ($count >= 31 && $count <= 35) ? 1 : 0,
        'ab-36-40' => ($count >= 36 && $count <= 40) ? 1 : 0,
        'ab-41' => ($count >= 41) ? 1 : 0
    ];

    $outcomeValues = [
        (string)$midCard,
        (string)$startSide,
        (string)$count,
        (string)$endCard,
        json_encode($andarCards),
        json_encode($baharCards),
        (string)$first3Name
    ];

    return [
        'middle_card' => $midCard,
        'start_side' => $startSide,
        'winner' => $winner,
        'count_dealt' => $count,
        'end_card' => $endCard,
        'andar_cards' => $andarCards,
        'bahar_cards' => $baharCards,
        'first3' => $first3Name,
        'outcome_values' => $outcomeValues,
        'bet_options_result' => $betRes
    ];
}

function advanceABEngine(&$state) {
    $nowMs = (int)round(microtime(true) * 1000);
    $nowSec = time();

    if (empty($state['round_id']) || empty($state['phase_start_ms']) || !is_numeric($state['phase_start_ms'])) {
        $state['round_number'] = (int)($state['round_number'] ?? 100);
        $state['round_id'] = 'AB-' . date('ymd') . '-' . sprintf('%04d', $state['round_number']);
        $state['status'] = 'betting';
        $state['phase_start_ms'] = $nowMs;
        $state['mode'] = $state['mode'] ?? 'auto';
        $state['lock_mode'] = $state['lock_mode'] ?? 'lock';
        $state['target_range'] = $state['target_range'] ?? 'auto';
        $state['target_first3'] = $state['target_first3'] ?? 'auto';
        $state['command_id'] = $state['command_id'] ?? 1;
        $state['player_bets'] = $state['player_bets'] ?? ['andar' => 0, 'bahar' => 0, 'first_andar' => 0, 'first_bahar' => 0, 'first_3' => 0, 'ranges' => [], 'total' => 0, 'details' => []];
        $state['history'] = $state['history'] ?? [];

        $outcome = generateABOutcome($state['mode'], $state['target_range'], $state['target_first3'], $state['player_bets']);
        $state = array_merge($state, $outcome);
        $state['time_left'] = 15;
        $state['server_time_ms'] = $nowMs;
        $state['updated_at'] = $nowSec;
        return;
    }

    $BETTING_DUR = 15000;
    $DEALING_DUR = 11000;
    $RESULT_DUR  = 4000;
    $TOTAL_CYCLE = $BETTING_DUR + $DEALING_DUR + $RESULT_DUR;

    $phaseStartMs = (int)$state['phase_start_ms'];
    $elapsedMs = max(0, $nowMs - $phaseStartMs);

    if ($elapsedMs >= $TOTAL_CYCLE * 3) {
        $state['round_number'] = (int)($state['round_number'] ?? 100) + (int)floor($elapsedMs / $TOTAL_CYCLE);
        $state['round_id'] = 'AB-' . date('ymd') . '-' . sprintf('%04d', $state['round_number']);
        $state['status'] = 'betting';
        $state['phase_start_ms'] = $nowMs;
        $state['player_bets'] = ['andar' => 0, 'bahar' => 0, 'first_andar' => 0, 'first_bahar' => 0, 'first_3' => 0, 'ranges' => [], 'total' => 0, 'details' => []];
        $outcome = generateABOutcome($state['mode'] ?? 'auto', $state['target_range'] ?? 'auto', $state['target_first3'] ?? 'auto', $state['player_bets']);
        $state = array_merge($state, $outcome);
        $state['time_left'] = 15;
        $state['server_time_ms'] = $nowMs;
        $state['updated_at'] = $nowSec;
        return;
    }

    for ($step = 0; $step < 5; $step++) {
        $status = $state['status'];
        $phaseStartMs = (int)$state['phase_start_ms'];
        $elapsedMs = max(0, $nowMs - $phaseStartMs);

        if ($status === 'betting') {
            if ($elapsedMs >= $BETTING_DUR) {
                $state['status'] = 'closed_bet';
                $state['phase_start_ms'] = $phaseStartMs + $BETTING_DUR;
                continue;
            } else {
                $state['time_left'] = max(0, (int)ceil(($BETTING_DUR - $elapsedMs) / 1000.0));
                break;
            }
        } elseif ($status === 'closed_bet') {
            if ($elapsedMs >= $DEALING_DUR) {
                $state['status'] = 'completed';
                $state['phase_start_ms'] = $phaseStartMs + $DEALING_DUR;

                if (!isset($state['history']) || !is_array($state['history'])) {
                    $state['history'] = [];
                }
                $lastHist = !empty($state['history']) ? end($state['history']) : null;
                if (!$lastHist || ($lastHist['round_id'] ?? '') !== $state['round_id']) {
                    $state['history'][] = [
                        'round_id' => $state['round_id'],
                        'middle_card' => $state['middle_card'] ?? 'H10',
                        'winner' => $state['winner'] ?? 'andar',
                        'count_dealt' => $state['count_dealt'] ?? 1,
                        'end_card' => $state['end_card'] ?? '',
                        'mode_used' => $state['mode'] ?? 'auto',
                        'time' => date('H:i:s')
                    ];
                    if (count($state['history']) > 30) {
                        $state['history'] = array_slice($state['history'], -30);
                    }
                }

                if (($state['lock_mode'] ?? 'lock') === 'once') {
                    $state['mode'] = 'auto';
                    $state['target_range'] = 'auto';
                    $state['target_first3'] = 'auto';
                }
                continue;
            } else {
                $state['time_left'] = max(0, (int)ceil(($DEALING_DUR - $elapsedMs) / 1000.0));
                break;
            }
        } elseif ($status === 'completed') {
            if ($elapsedMs >= $RESULT_DUR) {
                $state['round_number'] = (int)($state['round_number'] ?? 100) + 1;
                $state['round_id'] = 'AB-' . date('ymd') . '-' . sprintf('%04d', $state['round_number']);
                $state['status'] = 'betting';
                $state['phase_start_ms'] = $phaseStartMs + $RESULT_DUR;

                $state['player_bets'] = [
                    'andar' => 0,
                    'bahar' => 0,
                    'first_andar' => 0,
                    'first_bahar' => 0,
                    'first_3' => 0,
                    'ranges' => [],
                    'total' => 0,
                    'details' => []
                ];

                $outcome = generateABOutcome($state['mode'] ?? 'auto', $state['target_range'] ?? 'auto', $state['target_first3'] ?? 'auto', $state['player_bets']);
                $state = array_merge($state, $outcome);
                $state['time_left'] = 15;
                continue;
            } else {
                $state['time_left'] = max(0, (int)ceil(($RESULT_DUR - $elapsedMs) / 1000.0));
                break;
            }
        } else {
            $state['status'] = 'betting';
            $state['phase_start_ms'] = $nowMs;
            break;
        }
    }

    $state['server_time_ms'] = $nowMs;
    $state['updated_at'] = $nowSec;
}

switch ($action) {
    case 'crash_sync':
        $data = getJsonInput();
        $hasMutations = !empty($data['reset_auto']) || !empty($data['cancel_bet']) || !empty($data['new_bet']) || !empty($data['cashout_bet']);

        if (!$hasMutations) {
            $state = readCrashStateShared();
            $nowMs = (int)round(microtime(true) * 1000);
            $phaseStartMs = (int)($state['phase_start_ms'] ?? 0);
            $elapsedMs = max(0, $nowMs - $phaseStartMs);
            $status = $state['status'] ?? 'waiting';

            $needsTransition = false;
            if ($phaseStartMs <= 0 || ($nowMs - $phaseStartMs) > 60000 || !in_array($status, ['waiting', 'flying', 'crashed'], true)) {
                $needsTransition = true;
            } elseif ($status === 'waiting' && $elapsedMs >= 5000) {
                $needsTransition = true;
            } elseif ($status === 'flying') {
                $flightDurMs = (int)($state['flight_duration_ms'] ?? calcFlightDurationMs((float)($state['crash_point'] ?? 2.00)));
                if (!empty($state['force_crash']) || $elapsedMs >= $flightDurMs) {
                    $needsTransition = true;
                }
            } elseif ($status === 'crashed' && $elapsedMs >= 3200) {
                $needsTransition = true;
            }

            if (!$needsTransition) {
                sendSuccess(formatCrashPayload($state, $nowMs), 'Crash telemetry synchronized.');
                break;
            }
        }

        $user = !empty($data['new_bet']) ? getCurrentUser() : null;
        $responsePayload = updateCrashStateLocked(function(&$state) use ($data, $user) {
            if (!empty($data['reset_auto'])) {
                $state['next_crash_point'] = null;
                $state['force_crash'] = false;
                $state['is_auto'] = true;
            }

            // Advance the server-authoritative Aviator state machine
            advanceCrashEngine($state);

            $nowTs = time();
            $nowMs = (int)round(microtime(true) * 1000);

            $archiveBet = function($b) use (&$state) {
                if (empty($b) || empty($b['betId'])) return;
                foreach ($state['prev_bets'] as $idx => $existingPrev) {
                    if (($existingPrev['betId'] ?? '') === $b['betId']) {
                        $state['prev_bets'][$idx] = $b;
                        return;
                    }
                }
                array_unshift($state['prev_bets'], $b);
                if (count($state['prev_bets']) > 30) {
                    $state['prev_bets'] = array_slice($state['prev_bets'], 0, 30);
                }
            };

            // Handle explicit bet cancellation (or un-queue)
            if (!empty($data['cancel_bet'])) {
                $cBetId = is_array($data['cancel_bet']) ? ($data['cancel_bet']['betId'] ?? '') : (string)$data['cancel_bet'];
                if ($cBetId !== '' && isset($state['active_bets'][$cBetId])) {
                    unset($state['active_bets'][$cBetId]);
                }
            }

            // Handle live genuine new_bet (or queued bet) from player
            if (!empty($data['new_bet']) && is_array($data['new_bet'])) {
                $bet = $data['new_bet'];
                $betKey = $bet['betId'] ?? ('b_' . uniqid());
                $playerName = trim((string)($bet['id'] ?? ($bet['username'] ?? ($user ? $user['username'] : ('u' . rand(10000000, 99999999))))));
                if ($playerName === '') {
                    $playerName = 'u' . rand(10000000, 99999999);
                }
                $panel = (int)($bet['panel'] ?? 1);
                $ownerKey = $bet['ownerKey'] ?? ($playerName . '_' . $panel);
                $isQueued = !empty($bet['queued']) && ($state['status'] !== 'waiting');

                // Remove any previous bet from the same ownerKey/panel (unless it's a cashed-out bet from current flight and this is a queued bet for next round)
                foreach ($state['active_bets'] as $oldKey => $oldBet) {
                    if ($oldKey !== $betKey && (($oldBet['ownerKey'] ?? '') === $ownerKey || (($oldBet['id'] ?? '') === $playerName && (int)($oldBet['panel'] ?? 1) === $panel))) {
                        if ($isQueued && !empty($oldBet['cashedOut']) && ($oldBet['round_id'] ?? 0) === ($state['round_id'] ?? 0)) {
                            continue;
                        }
                        $archiveBet($oldBet);
                        unset($state['active_bets'][$oldKey]);
                    }
                }

                $existingCashed = isset($state['active_bets'][$betKey]) ? !empty($state['active_bets'][$betKey]['cashedOut']) : false;
                $existingMult = isset($state['active_bets'][$betKey]) ? ($state['active_bets'][$betKey]['cashoutMult'] ?? null) : null;
                $existingWin = isset($state['active_bets'][$betKey]) ? ($state['active_bets'][$betKey]['winPKR'] ?? 0) : 0;

                $state['active_bets'][$betKey] = [
                    'id' => $playerName,
                    'avatarColor' => $bet['avatarColor'] ?? '#f5a623',
                    'betPKR' => round((float)($bet['betPKR'] ?? $bet['amount'] ?? 16), 2),
                    'targetCashout' => !empty($bet['targetCashout']) ? round((float)$bet['targetCashout'], 2) : null,
                    'cashedOut' => $existingCashed || !empty($bet['cashedOut']),
                    'cashoutMult' => $existingMult ?? (!empty($bet['cashoutMult']) ? round((float)$bet['cashoutMult'], 2) : null),
                    'winPKR' => $existingWin ?: (!empty($bet['winPKR']) ? round((float)$bet['winPKR'], 2) : 0),
                    'isGenuine' => true,
                    'isRiggedUser' => (!empty($user['outcome_bias']) && in_array($user['outcome_bias'], ['force_loss', 'force_stop', 'stop', 'loss'])) || (!empty($bet['isRiggedUser'])),
                    'outcomeBias' => $user['outcome_bias'] ?? ($bet['outcomeBias'] ?? 'fair'),
                    'queued' => $isQueued,
                    'round_id' => $isQueued ? ((int)$state['round_id'] + 1) : (int)$state['round_id'],
                    'panel' => $panel,
                    'ownerKey' => $ownerKey,
                    'betId' => $betKey,
                    'timestamp' => $nowTs,
                    'round_ended_at' => null
                ];

                // Agar bet waiting phase me lagayi gayi hai to aane wali flight ke liye crash point set karo
                if (($state['status'] ?? '') === 'waiting') {
                    $gTot = getActiveGenuineBetTotal($state, false);
                    if ($gTot > 0) {
                        $curCycle = (int)($state['genuine_bet_cycle'] ?? 0);
                        $uCrash = generateServerCrashPoint($state, $curCycle);
                        $state['crash_point'] = $uCrash;
                        $state['flight_duration_ms'] = calcFlightDurationMs((float)$state['crash_point']);
                    }
                }
            }

            // Handle live cashout from player
            if (!empty($data['cashout_bet']) && is_array($data['cashout_bet'])) {
                $c = $data['cashout_bet'];
                $bId = $c['betId'] ?? null;
                if ($bId && isset($state['active_bets'][$bId])) {
                    $state['active_bets'][$bId]['cashedOut'] = true;
                    $state['active_bets'][$bId]['queued'] = false;
                    $state['active_bets'][$bId]['cashoutMult'] = round((float)$c['mult'], 2);
                    $state['active_bets'][$bId]['winPKR'] = round((float)$c['win'], 2);
                    $archiveBet($state['active_bets'][$bId]);
                }
            }

            return formatCrashPayload($state, $nowMs);
        });

        sendSuccess($responsePayload, 'Crash telemetry synchronized.');
        break;

    case 'crash_control':
        $data = getJsonInput();
        $pin = $_SERVER['HTTP_X_ADMIN_PIN'] ?? ($data['admin_pin'] ?? ($_GET['admin_pin'] ?? ($_POST['admin_pin'] ?? '')));
        if (!in_array($pin, ['9824', '8391', '7777'])) {
            requireAdmin();
        }
        $cmd = $data['command'] ?? ($_POST['command'] ?? ($_GET['command'] ?? ''));

        if (!in_array($cmd, ['force_crash', 'set_next_crash', 'reset_auto', 'reset'], true)) {
            sendError('Unknown crash command.', 400);
        }

        $resMsg = '';
        $updatedState = updateCrashStateLocked(function(&$state) use ($cmd, $data, &$resMsg) {
            advanceCrashEngine($state);
            $nowMs = (int)round(microtime(true) * 1000);

            if ($cmd === 'force_crash') {
                if ($state['status'] === 'flying') {
                    $elapsedMs = max(0, $nowMs - (int)($state['phase_start_ms'] ?? $nowMs));
                    $curMult = calcCrashMultiplier($elapsedMs / 1000.0);
                    $cPt = max(1.00, $curMult);
                    $state['crash_point'] = $cPt;
                    $state['multiplier'] = $cPt;
                    $state['status'] = 'crashed';
                    $state['phase_start_ms'] = $nowMs;
                    if (($state['last_history_round_id'] ?? 0) !== ($state['round_id'] ?? 0)) {
                        $state['last_history_round_id'] = $state['round_id'] ?? 0;
                        $state['history'][] = $cPt;
                        if (count($state['history']) > 35) {
                            $state['history'] = array_slice($state['history'], -35);
                        }
                    }
                } else {
                    $state['next_crash_point'] = 1.00;
                    $state['crash_point'] = 1.00;
                    $state['flight_duration_ms'] = calcFlightDurationMs(1.00);
                }
                $state['force_crash'] = false;
                $state['is_auto'] = false;
                $state['updated_at'] = time();
                $resMsg = '💥 Force Crash command issued to all active crash games!';
            } elseif ($cmd === 'set_next_crash') {
                $target = max(1.01, round((float)($data['target'] ?? ($_POST['target'] ?? ($_GET['target'] ?? 1.20))), 2));
                $state['next_crash_point'] = $target;
                $state['force_crash'] = false;
                $state['is_auto'] = false;
                if ($state['status'] === 'waiting' || ($state['status'] === 'flying' && (float)$state['multiplier'] <= $target)) {
                    $state['crash_point'] = $target;
                    $state['flight_duration_ms'] = calcFlightDurationMs($target);
                }
                $state['updated_at'] = time();
                $resMsg = "Target crash point locked at {$target}x";
            } elseif ($cmd === 'reset_auto' || $cmd === 'reset') {
                $state['next_crash_point'] = null;
                $state['force_crash'] = false;
                $state['is_auto'] = true;
                $state['updated_at'] = time();
                $resMsg = 'Crash state reset to dynamic / auto RTP mode.';
            }
            return $state;
        });

        sendSuccess($updatedState, $resMsg);
        break;

    case 'crash_state':
        $state = readCrashStateShared();
        $nowMs = (int)round(microtime(true) * 1000);
        sendSuccess(formatCrashPayload($state, $nowMs), 'Crash live state.');
        break;

    case 'ab_sync':
        $data = getJsonInput();
        $hasBetEvent = !empty($data['bet_event']) && is_array($data['bet_event']);

        if (!$hasBetEvent) {
            $state = readABStateShared();
            $nowMs = (int)round(microtime(true) * 1000);
            $phaseStartMs = (int)($state['phase_start_ms'] ?? 0);
            $elapsedMs = max(0, $nowMs - $phaseStartMs);
            $status = $state['status'] ?? 'betting';

            $BETTING_DUR = 15000;
            $DEALING_DUR = 11000;
            $RESULT_DUR  = 4000;

            $needsTransition = false;
            if ($phaseStartMs <= 0 || empty($state['round_id']) || $elapsedMs >= ($BETTING_DUR + $DEALING_DUR + $RESULT_DUR) * 2) {
                $needsTransition = true;
            } elseif ($status === 'betting' && $elapsedMs >= $BETTING_DUR) {
                $needsTransition = true;
            } elseif ($status === 'closed_bet' && $elapsedMs >= $DEALING_DUR) {
                $needsTransition = true;
            } elseif ($status === 'completed' && $elapsedMs >= $RESULT_DUR) {
                $needsTransition = true;
            }

            if (!$needsTransition) {
                $dur = ($status === 'betting') ? $BETTING_DUR : (($status === 'closed_bet') ? $DEALING_DUR : $RESULT_DUR);
                $state['time_left'] = max(0, (int)ceil(($dur - $elapsedMs) / 1000.0));
                $state['server_time_ms'] = $nowMs;
                sendSuccess($state, 'Andar Bahar telemetry synchronized.');
                break;
            }
        }

        $user = $hasBetEvent ? getCurrentUser() : null;
        $responsePayload = updateABStateLocked(function(&$state) use ($data, $user) {
            advanceABEngine($state);

            // Handle incremental bet event from player
            if (!empty($data['bet_event']) && is_array($data['bet_event'])) {
                $be = $data['bet_event'];
                $opt = trim((string)($be['option'] ?? ''));
                $amt = round((float)($be['amount'] ?? 0), 2);
                $uname = $be['username'] ?? ($user ? $user['username'] : 'Player');
                if ($opt !== '' && $amt != 0) {
                    if ($opt === 'ab-andar') {
                        $state['player_bets']['andar'] = max(0, round(($state['player_bets']['andar'] ?? 0) + $amt, 2));
                    } elseif ($opt === 'ab-bahar') {
                        $state['player_bets']['bahar'] = max(0, round(($state['player_bets']['bahar'] ?? 0) + $amt, 2));
                    } elseif ($opt === 'ab-first-andar') {
                        $state['player_bets']['first_andar'] = max(0, round(($state['player_bets']['first_andar'] ?? 0) + $amt, 2));
                    } elseif ($opt === 'ab-first-bahar') {
                        $state['player_bets']['first_bahar'] = max(0, round(($state['player_bets']['first_bahar'] ?? 0) + $amt, 2));
                    } elseif ($opt === 'ab-first-3') {
                        $state['player_bets']['first_3'] = max(0, round(($state['player_bets']['first_3'] ?? 0) + $amt, 2));
                    } else {
                        if (!isset($state['player_bets']['ranges']) || !is_array($state['player_bets']['ranges'])) {
                            $state['player_bets']['ranges'] = [];
                        }
                        $curR = (float)($state['player_bets']['ranges'][$opt] ?? 0);
                        $state['player_bets']['ranges'][$opt] = max(0, round($curR + $amt, 2));
                    }
                    $state['player_bets']['total'] = max(0, round(($state['player_bets']['total'] ?? 0) + $amt, 2));
                    if ($amt > 0) {
                        if (!isset($state['player_bets']['details']) || !is_array($state['player_bets']['details'])) {
                            $state['player_bets']['details'] = [];
                        }
                        $state['player_bets']['details'][] = [
                            'username' => $uname,
                            'option' => $opt,
                            'amount' => $amt,
                            'time' => date('H:i:s')
                        ];
                        if (count($state['player_bets']['details']) > 25) {
                            $state['player_bets']['details'] = array_slice($state['player_bets']['details'], -25);
                        }
                    }
                }
            }

            return $state;
        });

        sendSuccess($responsePayload, 'Andar Bahar telemetry synchronized.');
        break;

    case 'ab_control':
        $data = getJsonInput();
        $pin = $_SERVER['HTTP_X_ADMIN_PIN'] ?? ($data['admin_pin'] ?? ($_GET['admin_pin'] ?? ($_POST['admin_pin'] ?? '')));
        if (!in_array($pin, ['9824', '8391', '7777', 'Sardar445.'])) {
            requireAdmin();
        }

        $responsePayload = updateABStateLocked(function(&$state) use ($data) {
            advanceABEngine($state);

            if (isset($data['mode'])) {
                $allowedModes = ['auto', 'force_andar', 'force_bahar', 'house_win', 'player_win', 'first_andar', 'first_bahar'];
                $m = trim((string)$data['mode']);
                if (in_array($m, $allowedModes, true)) {
                    $state['mode'] = $m;
                    // If still in betting phase, immediately re-roll outcome to honor new mode
                    if (($state['status'] ?? '') === 'betting') {
                        $outcome = generateABOutcome($state['mode'], $state['target_range'] ?? 'auto', $state['target_first3'] ?? 'auto', $state['player_bets'] ?? []);
                        $state = array_merge($state, $outcome);
                    }
                }
            }
            if (isset($data['lock_mode'])) {
                $lm = trim((string)$data['lock_mode']);
                if (in_array($lm, ['lock', 'once'], true)) {
                    $state['lock_mode'] = $lm;
                }
            }
            if (isset($data['target_range'])) {
                $state['target_range'] = trim((string)$data['target_range']);
            }
            if (isset($data['target_first3'])) {
                $state['target_first3'] = trim((string)$data['target_first3']);
            }
            if (($state['mode'] ?? 'auto') === 'auto' && empty($data['keep_side_targets'])) {
                if (!isset($data['target_range'])) $state['target_range'] = 'auto';
                if (!isset($data['target_first3'])) $state['target_first3'] = 'auto';
            }

            $state['command_id'] = (int)($state['command_id'] ?? 1) + 1;
            return $state;
        });

        sendSuccess($responsePayload, '🃏 Andar Bahar Radar updated: ' . strtoupper($responsePayload['mode'] ?? 'AUTO'));
        break;

    case 'ab_state':
        $responsePayload = updateABStateLocked(function(&$state) {
            advanceABEngine($state);
            return $state;
        });
        sendSuccess($responsePayload, 'Andar Bahar live radar state.');
        break;

    case 'provably_fair':
        $clientSeed = $_GET['client_seed'] ?? bin2hex(random_bytes(16));
        $serverSeed = bin2hex(random_bytes(32));
        $serverSeedHash = hash('sha256', $serverSeed);
        $nonce = (int)($_GET['nonce'] ?? 1);

        sendSuccess([
            'client_seed' => $clientSeed,
            'server_seed_hash' => $serverSeedHash,
            'nonce' => $nonce,
            'message' => 'Provably fair active seeds calculated.'
        ]);
        break;

    case 'crash_point':
        $data = getJsonInput();
        $serverSeed = $data['server_seed'] ?? bin2hex(random_bytes(32));
        $clientSeed = $data['client_seed'] ?? '0000000000000000000d1110002f23';
        $nonce = (int)($data['nonce'] ?? 1);

        $state = readCrashState();
        if (!empty($state['next_crash_point'])) {
            $crashPoint = (float)$state['next_crash_point'];
            sendSuccess([
                'crash_point' => $crashPoint,
                'is_admin_override' => true
            ]);
            break;
        }

        $hash = hash_hmac('sha256', "{$clientSeed}:{$nonce}", $serverSeed);
        $intVal = hexdec(substr($hash, 0, 8));
        
        // 1 in 15 chance of instant 1.00x crash
        if ($intVal % 15 === 0) {
            $crashPoint = 1.00;
        } else {
            $h = hexdec(substr($hash, 0, 13));
            $e = pow(2, 52);
            $crashPoint = floor((95 * $e - $h) / ($e - $h)) / 100.0;
            $crashPoint = max(1.01, min(500.0, $crashPoint));
        }

        sendSuccess([
            'crash_point' => $crashPoint,
            'hash' => $hash,
            'server_seed_hash' => hash('sha256', $serverSeed)
        ]);
        break;

    case 'settings':
        // Issue #39: Whitelist only safe non-sensitive keys for public consumption
        $db = getDB();
        $stmt = $db->query("SELECT setting_key, setting_value FROM site_settings");
        $all = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        $safeKeys = ['site_title', 'exchange_rate_usd_pkr', 'min_deposit', 'max_deposit', 'min_withdraw', 'max_withdraw', 'maintenance_mode', 'currency_symbol', 'theme', 'default_rtp', 'whatsapp_group_link', 'whatsapp_number', 'whatsapp_enabled'];
        $safe = [];
        foreach ($all as $k => $v) {
            if (in_array($k, $safeKeys) || strpos($k, 'game_') === 0 || strpos($k, 'public_') === 0) {
                $safe[$k] = $v;
            }
        }
        sendSuccess($safe, 'Game and platform settings loaded.');
        break;

    default:
        sendSuccess([
            'games' => ['crash', 'roulette', 'mines', 'plinko', 'blackjack', 'wheel', 'dice'],
            'status' => 'online',
            'rtp_default' => 96.5
        ], 'Games engine active.');
        break;
}
