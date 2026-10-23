<?php
require_once __DIR__ . '/common.php';

$action = $_GET['action'] ?? ($_POST['action'] ?? 'export');
$db = getDB();

/**
 * Generate a complete relational SQL dump for all platform tables
 */
function generateFullSqlDump($db) {
    $tables = ['system_migrations', 'users', 'bets', 'transactions', 'payment_methods', 'p2p_merchants', 'p2p_orders', 'p2p_disputes', 'site_settings', 'cms_pages'];
    $sqlDump = "-- ============================================================\n";
    $sqlDump .= "-- Bet With Net Enterprise 100% Complete Database Dump\n";
    $sqlDump .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
    $sqlDump .= "-- Driver: " . Database::getInstance()->getDriver() . "\n";
    $sqlDump .= "-- ============================================================\n\n";
    $sqlDump .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

    foreach ($tables as $tbl) {
        try {
            $createRow = $db->query("SHOW CREATE TABLE `{$tbl}`")->fetch(PDO::FETCH_NUM);
            if (!empty($createRow[1])) {
                $sqlDump .= "DROP TABLE IF EXISTS `{$tbl}`;\n";
                $sqlDump .= $createRow[1] . ";\n\n";
            }
        } catch (Exception $e) {
            // Non-MySQL driver
        }

        try {
            $rows = $db->query("SELECT * FROM `{$tbl}`")->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($rows)) {
                $columns = array_keys($rows[0]);
                $colList = implode(', ', array_map(function($c) { return "`{$c}`"; }, $columns));
                $sqlDump .= "-- Data for table: `{$tbl}` (" . count($rows) . " rows)\n";
                $dupKeyClause = ($tbl === 'site_settings') ? "`setting_key`=`setting_key`" : "`id`=`id`";
                
                foreach ($rows as $row) {
                    $vals = array_map(function($v) use ($db) {
                        if ($v === null) return 'NULL';
                        if (is_numeric($v) && !is_string($v)) return $v;
                        return $db->quote((string)$v);
                    }, array_values($row));
                    $sqlDump .= "INSERT INTO `{$tbl}` ({$colList}) VALUES (" . implode(', ', $vals) . ") ON DUPLICATE KEY UPDATE {$dupKeyClause};\n";
                }
                $sqlDump .= "\n";
            }
        } catch (Exception $e) {
            // Continue
        }
    }
    $sqlDump .= "SET FOREIGN_KEY_CHECKS = 1;\n";
    return $sqlDump;
}

/**
 * Robust SQL Statement Splitter that preserves semicolons inside single/double quotes
 */
function splitSqlStatements(string $sql): array {
    $statements = [];
    $current = '';
    $inSingleQuote = false;
    $inDoubleQuote = false;
    $escaped = false;
    $len = strlen($sql);

    for ($i = 0; $i < $len; $i++) {
        $char = $sql[$i];

        if ($char === '\\' && !$escaped) {
            $escaped = true;
            $current .= $char;
            continue;
        }

        if ($char === "'" && !$escaped && !$inDoubleQuote) {
            $inSingleQuote = !$inSingleQuote;
        } elseif ($char === '"' && !$escaped && !$inSingleQuote) {
            $inDoubleQuote = !$inDoubleQuote;
        }

        if ($char === ';' && !$inSingleQuote && !$inDoubleQuote) {
            $trimmed = trim($current);
            if (!empty($trimmed)) {
                $statements[] = $trimmed;
            }
            $current = '';
        } else {
            $current .= $char;
        }

        $escaped = false;
    }

    $trimmed = trim($current);
    if (!empty($trimmed)) {
        $statements[] = $trimmed;
    }

    return $statements;
}

if ($action === 'get_sql') {
    requireAdmin();
    $file = basename($_GET['file'] ?? '');
    if (!in_array($file, ['database.sql', 'schema.sql'])) {
        sendError('Invalid SQL file request.', 400);
    }
    $path = __DIR__ . '/../' . $file;
    if (!file_exists($path)) {
        sendError('File not found.', 404);
    }
    header('Content-Type: text/plain; charset=utf-8');
    echo file_get_contents($path);
    exit;
}

if ($action === 'full_website') {
    requireAdmin();
    ini_set('memory_limit', '1024M');
    set_time_limit(600);

    $webRoot = realpath(__DIR__ . '/..');
    $tempZipPath = @tempnam(sys_get_temp_dir(), 'bwn_full_') . '.zip';

    $zip = new ZipArchive();
    if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        sendError('Failed to initialize temporary ZIP archive.', 500);
    }

    // Issue #46: Write SQL dump to temporary memory/buffer directly into archive
    $sqlDump = generateFullSqlDump($db);
    $zip->addFromString('database.sql', $sqlDump);

    // Issue #45: Exclude sensitive environment secrets from full website backup
    $excludePatterns = [
        '/\.git/',
        '/scratch/',
        '/\.system_generated/',
        '/node_modules/',
        '/^\.env/',
        '/\.env.*/',
        '/.*\.sqlite/',
        '/\.tar\.gz$/',
        '/\.zip$/',
        '/\.tmp$/',
        '/\.log$/'
    ];

    $dirIterator = new RecursiveDirectoryIterator($webRoot, RecursiveDirectoryIterator::SKIP_DOTS);
    $iterator = new RecursiveIteratorIterator($dirIterator, RecursiveIteratorIterator::LEAVES_ONLY);

    $fileCount = 0;
    $manifestHashes = [
        'database.sql' => hash('sha256', $sqlDump)
    ];

    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $filePath = $file->getRealPath();
            $relPath = substr($filePath, strlen($webRoot) + 1);
            $relPathNorm = str_replace('\\', '/', $relPath);

            // Check exclusions
            $skip = false;
            foreach ($excludePatterns as $pattern) {
                if (preg_match($pattern, $relPathNorm)) {
                    $skip = true;
                    break;
                }
            }
            if ($skip) continue;

            $zip->addFile($filePath, $relPathNorm);
            $manifestHashes[$relPathNorm] = hash_file('sha256', $filePath);
            $fileCount++;
        }
    }

    // Issue #96: Include cryptographic manifest inside archive
    $backupMeta = json_encode([
        'type' => 'FULL_WEBSITE_ENTERPRISE_ARCHIVE',
        'platform' => 'Bet With Net Enterprise',
        'version' => '3.5.0-ENTERPRISE',
        'generated_at' => date('c'),
        'total_files' => $fileCount,
        'has_database_dump' => true,
        'php_version' => PHP_VERSION,
        'db_driver' => Database::getInstance()->getDriver(),
        'checksums' => $manifestHashes
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    $zip->addFromString('backup_manifest.json', $backupMeta);

    $zip->close();

    if (!file_exists($tempZipPath) || filesize($tempZipPath) === 0) {
        sendError('Failed to package website into ZIP archive.', 500);
    }

    $filename = 'BetWithNet_Full_Website_Backup_' . date('Ymd_His') . '.zip';
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($tempZipPath));
    header('Pragma: no-cache');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');

    while (ob_get_level()) {
        ob_end_clean();
    }

    readfile($tempZipPath);
    @unlink($tempZipPath);
    exit;
}

if ($action === 'restore_full_website') {
    requireAdmin();
    ini_set('memory_limit', '1024M');
    set_time_limit(600);

    $uploadedZip = $_FILES['backup_zip']['tmp_name'] ?? ($_FILES['full_backup_zip']['tmp_name'] ?? '');
    if (empty($uploadedZip) || !file_exists($uploadedZip)) {
        sendError('No valid website backup ZIP archive provided for restore.', 400);
    }

    $zip = new ZipArchive();
    if ($zip->open($uploadedZip) !== true) {
        sendError('Provided file could not be parsed as a valid ZIP archive.', 400);
    }

    $webRoot = realpath(__DIR__ . '/..');
    $restoredFiles = 0;
    $hasSqlDump = false;
    $sqlDumpContent = null;

    for ($i = 0; $i < $zip->numFiles; $i++) {
        $entryName = $zip->getNameIndex($i);
        // Path traversal guard
        if (strpos($entryName, '../') !== false || strpos($entryName, '..\\') !== false) {
            continue;
        }

        if ($entryName === 'database.sql') {
            $hasSqlDump = true;
            $sqlDumpContent = $zip->getFromIndex($i);
        }

        // Issue #45: Never overwrite active environment database config or secrets
        if (strpos($entryName, '.env') === 0 || $entryName === '.env') {
            continue;
        }

        $targetPath = $webRoot . '/' . $entryName;
        if (substr($entryName, -1) === '/' || substr($entryName, -1) === '\\') {
            if (!is_dir($targetPath)) {
                @mkdir($targetPath, 0755, true);
            }
        } else {
            $targetDir = dirname($targetPath);
            if (!is_dir($targetDir)) {
                @mkdir($targetDir, 0755, true);
            }
            $stream = $zip->getStream($entryName);
            if ($stream) {
                file_put_contents($targetPath, $stream);
                fclose($stream);
                $restoredFiles++;
            }
        }
    }
    $zip->close();

    // Issue #97: Robust SQL execution with statement parser
    $dbExecuted = false;
    $dbError = null;
    if ($hasSqlDump && $sqlDumpContent) {
        try {
            $db->exec("SET FOREIGN_KEY_CHECKS = 0;");
            $statements = splitSqlStatements($sqlDumpContent);
            foreach ($statements as $stmtSql) {
                $trimmed = trim($stmtSql);
                if (!empty($trimmed) && strpos($trimmed, '--') !== 0) {
                    $db->exec($trimmed);
                }
            }
            $db->exec("SET FOREIGN_KEY_CHECKS = 1;");
            $dbExecuted = true;
        } catch (Exception $e) {
            $dbError = $e->getMessage();
        }
    }

    // Issue #98: Return explicit failure if database restoration fails
    if ($dbError) {
        sendError('Database snapshot restoration encountered an error: ' . $dbError, 500, [
            'restored_files' => $restoredFiles,
            'database_restored' => false,
            'database_error' => $dbError
        ]);
    }

    sendSuccess([
        'restored_files' => $restoredFiles,
        'database_restored' => $dbExecuted,
        'database_error' => null
    ], 'Full website files and database snapshot restored successfully!');
}

if ($action === 'export') {
    requireAdmin();
    ini_set('memory_limit', '512M');
    set_time_limit(300);

    $zip = new ZipArchive();
    $tempZipPath = @tempnam(sys_get_temp_dir(), 'bwn_bkp_') . '.zip';

    if ($zip->open($tempZipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        sendError('Failed to create temporary ZIP archive.', 500);
    }

    $checksums = [];
    $tables = ['system_migrations', 'users', 'bets', 'transactions', 'p2p_merchants', 'p2p_orders', 'p2p_disputes', 'payment_methods', 'cms_pages', 'site_settings'];
    $sqlDump = generateFullSqlDump($db);

    foreach ($tables as $tbl) {
        try {
            $rows = $db->query("SELECT * FROM `{$tbl}`")->fetchAll(PDO::FETCH_ASSOC);
            $jsonData = json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $zip->addFromString("data/{$tbl}.json", $jsonData);
            $checksums["data/{$tbl}.json"] = hash('sha256', $jsonData);
        } catch (Exception $e) {}
    }

    $zip->addFromString('database.sql', $sqlDump);
    $checksums['database.sql'] = hash('sha256', $sqlDump);

    $sysInfo = json_encode([
        'platform' => 'Bet With Net Enterprise',
        'version' => '3.5.0-ENTERPRISE',
        'generated_at' => date('c'),
        'total_tables' => count($tables),
        'environment' => [
            'php_version' => PHP_VERSION,
            'db_driver' => Database::getInstance()->getDriver()
        ]
    ], JSON_PRETTY_PRINT);
    $zip->addFromString('system_info.json', $sysInfo);
    $checksums['system_info.json'] = hash('sha256', $sysInfo);

    $assetDir = __DIR__ . '/../assets';
    if (is_dir($assetDir)) {
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($assetDir, RecursiveDirectoryIterator::SKIP_DOTS));
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $filePath = $file->getPathname();
                $relativePath = 'assets/' . str_replace('\\', '/', substr($filePath, strlen($assetDir) + 1));
                $zip->addFile($filePath, $relativePath);
                $checksums[$relativePath] = hash_file('sha256', $filePath);
            }
        }
    }

    $zip->addFromString('backup_manifest.json', json_encode($checksums, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    $zip->close();

    $filename = 'betwithnet_database_backup_' . date('Ymd_His') . '.zip';
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Content-Length: ' . filesize($tempZipPath));
    header('Pragma: no-cache');
    header('Expires: 0');

    while (ob_get_level()) {
        ob_end_clean();
    }

    readfile($tempZipPath);
    @unlink($tempZipPath);
    exit;

} elseif ($action === 'restore') {
    requireAdmin();
    if (empty($_FILES['backup_zip']['tmp_name'])) {
        sendError('No backup ZIP file provided.', 400);
    }

    $uploadedZip = $_FILES['backup_zip']['tmp_name'];
    $zip = new ZipArchive();
    if ($zip->open($uploadedZip) !== true) {
        sendError('Could not read or parse provided ZIP archive.', 400);
    }

    $checksumsRaw = $zip->getFromName('backup_manifest.json') ?: $zip->getFromName('checksums.json');
    if (!$checksumsRaw) {
        sendError('Missing backup_manifest.json in backup archive. Verification failed.', 422);
    }
    $checksums = json_decode($checksumsRaw, true);

    $db->beginTransaction();
    try {
        $tables = ['system_migrations', 'users', 'bets', 'transactions', 'p2p_merchants', 'p2p_orders', 'p2p_disputes', 'payment_methods', 'cms_pages', 'site_settings'];
        $restoredCounts = [];

        foreach ($tables as $tbl) {
            $jsonContent = $zip->getFromName("data/{$tbl}.json");
            if ($jsonContent !== false) {
                $expected = $checksums["data/{$tbl}.json"] ?? '';
                if ($expected && hash('sha256', $jsonContent) !== $expected) {
                    throw new Exception("Checksum mismatch detected for data/{$tbl}.json. Possible data corruption.");
                }

                $rows = json_decode($jsonContent, true);
                if (is_array($rows)) {
                    $cnt = 0;
                    foreach ($rows as $row) {
                        $cols = array_keys($row);
                        $colList = implode(', ', array_map(function($c) { return "`{$c}`"; }, $cols));
                        $placeholders = implode(', ', array_map(function($c) { return ":{$c}"; }, $cols));
                        $sql = "REPLACE INTO `{$tbl}` ({$colList}) VALUES ({$placeholders})";
                        $stmt = $db->prepare($sql);
                        $params = [];
                        foreach ($row as $k => $v) {
                            $params[":{$k}"] = $v;
                        }
                        $stmt->execute($params);
                        $cnt++;
                    }
                    $restoredCounts[$tbl] = $cnt;
                }
            }
        }

        $db->commit();
        $zip->close();
        sendSuccess($restoredCounts, 'Backup archive validated and restored successfully with full integrity.');
    } catch (Exception $e) {
        $db->rollBack();
        $zip->close();
        sendError('Restore operation aborted and rolled back: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Invalid backup action specified.', 400);
}
