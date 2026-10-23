<?php
/**
 * ============================================================
 * Bet With Net - Enterprise Database Connection Manager (PDO)
 * MySQL 8.0+ / MariaDB / SQLite Hybrid Connection Singleton
 * Features: utf8mb4, Persistent Transactions, Auto-Failover
 * ============================================================
 */

class Database {
    private static ?Database $instance = null;
    private ?PDO $pdo = null;
    private string $driver = 'mysql';
    private array $config = [];

    private function __construct() {
        $fullConfig = require __DIR__ . '/config.php';
        $this->config = $fullConfig['database'];
        $this->connect();
    }

    public static function getInstance(): Database {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public static function getPdo(): PDO {
        return self::getInstance()->pdo;
    }

    private function connect(): void {
        $driver = $this->config['driver'] ?? 'mysql';

        if ($driver === 'mysql') {
            try {
                $dsn = "mysql:host={$this->config['host']};port={$this->config['port']};dbname={$this->config['database']};charset={$this->config['charset']}";
                $this->pdo = new PDO($dsn, $this->config['username'], $this->config['password'], [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$this->config['charset']} COLLATE {$this->config['collation']}"
                ]);
                $this->driver = 'mysql';
                return;
            } catch (PDOException $e) {
                // If MySQL connection fails, attempt SQLite fallback for zero-downtime local preview
                $sqlitePath = $this->config['sqlite_path'] ?? (__DIR__ . '/../database.sqlite');
                try {
                    $this->pdo = new PDO("sqlite:{$sqlitePath}", null, null, [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                    ]);
                    $this->driver = 'sqlite';
                    $this->registerSqliteFunctions();
                    $this->initSqliteSchema();
                    return;
                } catch (PDOException $sqliteEx) {
                    throw new Exception("Database Connection Error (MySQL: {$e->getMessage()}; SQLite: {$sqliteEx->getMessage()})");
                }
            }
        } else {
            $sqlitePath = $this->config['sqlite_path'] ?? (__DIR__ . '/../database.sqlite');
            $this->pdo = new PDO("sqlite:{$sqlitePath}", null, null, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
            $this->driver = 'sqlite';
            $this->registerSqliteFunctions();
            $this->initSqliteSchema();
        }
    }

    private function registerSqliteFunctions(): void {
        if ($this->pdo && $this->driver === 'sqlite') {
            // Compatibility bridges for MySQL-specific functions in SQLite
            $this->pdo->sqliteCreateFunction('NOW', function() {
                return date('Y-m-d H:i:s');
            }, 0);
            $this->pdo->sqliteCreateFunction('GREATEST', function(...$args) {
                return max($args);
            });
        }
    }

    public function getDriver(): string {
        return $this->driver;
    }

    public function isMySQL(): bool {
        return $this->driver === 'mysql';
    }

    public function beginTransaction(): bool {
        if ($this->pdo && !$this->pdo->inTransaction()) {
            return $this->pdo->beginTransaction();
        }
        return false;
    }

    public function commit(): bool {
        if ($this->pdo && $this->pdo->inTransaction()) {
            return $this->pdo->commit();
        }
        return false;
    }

    public function rollBack(): bool {
        if ($this->pdo && $this->pdo->inTransaction()) {
            return $this->pdo->rollBack();
        }
        return false;
    }

    public static function testConnection(string $host, string $port, string $dbname, string $user, string $pass): array {
        try {
            $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 5
            ]);
            
            // Check if database exists or can be created
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbname}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            return [
                'success' => true,
                'message' => "Successfully connected to MySQL server at {$host}:{$port} and database '{$dbname}' is accessible!"
            ];
        } catch (PDOException $e) {
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    private function initSqliteSchema(): void {
        // Automatically ensure essential tables exist in SQLite mode matching MySQL schema
        $schema = "
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE,
            full_name TEXT,
            email TEXT UNIQUE,
            phone TEXT,
            balance_usd REAL DEFAULT 0.0,
            balance_pkr REAL DEFAULT 0.0,
            vip_tier TEXT DEFAULT 'Bronze VIP',
            status TEXT DEFAULT 'active',
            outcome_bias TEXT DEFAULT 'fair',
            custom_win_rate INTEGER DEFAULT 48,
            currency TEXT DEFAULT 'USD',
            role TEXT DEFAULT 'user',
            security_pin TEXT,
            security_pin_hash TEXT,
            password_hash TEXT,
            salt TEXT,
            total_wagered REAL DEFAULT 0.0,
            total_won REAL DEFAULT 0.0,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS bets (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            game TEXT,
            bet_amount REAL,
            payout REAL DEFAULT 0.0,
            multiplier REAL DEFAULT 0.0,
            multiplier_formatted TEXT,
            status TEXT,
            profit REAL DEFAULT 0.0,
            bet_time TEXT,
            played_at TEXT
        );
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT,
            type TEXT,
            method TEXT,
            sender_account TEXT,
            trx_id TEXT,
            proof_image TEXT,
            notes TEXT,
            amount_pkr REAL DEFAULT 0.0,
            amount_usd REAL DEFAULT 0.0,
            status TEXT DEFAULT 'Pending',
            transaction_date TEXT,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS p2p_merchants (
            id TEXT PRIMARY KEY,
            name TEXT,
            avatar TEXT,
            badge TEXT,
            status TEXT DEFAULT 'online',
            buy_price REAL,
            sell_price REAL,
            min_limit REAL,
            max_limit REAL,
            orders_completed INTEGER DEFAULT 0,
            completion_rate REAL DEFAULT 100.0,
            avg_release_min REAL DEFAULT 2.0,
            created_at TEXT
        );
        CREATE TABLE IF NOT EXISTS p2p_orders (
            id TEXT PRIMARY KEY,
            type TEXT,
            user_id TEXT,
            merchant_id TEXT,
            merchant_name TEXT,
            amount_usd REAL,
            amount_pkr REAL,
            rate REAL,
            channel TEXT,
            status TEXT DEFAULT 'COMPLETED',
            proof_trx TEXT,
            created_at TEXT,
            escrow_released_at TEXT
        );
        CREATE TABLE IF NOT EXISTS site_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS payment_methods (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT DEFAULT 'both',
            account_title TEXT,
            account_number TEXT,
            instructions TEXT,
            min_limit REAL DEFAULT 500.0,
            max_limit REAL DEFAULT 500000.0,
            exchange_rate REAL DEFAULT 280.0,
            status TEXT DEFAULT 'active',
            is_crypto INTEGER DEFAULT 0,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS cms_pages (
            id TEXT PRIMARY KEY,
            slug TEXT UNIQUE,
            title TEXT,
            content TEXT,
            category TEXT DEFAULT 'general',
            is_published INTEGER DEFAULT 1,
            updated_at TEXT
        );
        CREATE TABLE IF NOT EXISTS system_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT,
            migration_name TEXT,
            applied_at TEXT
        );
        ";
        $this->pdo->exec($schema);
    }
}
