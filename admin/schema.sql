-- ============================================================
-- BET WITH NET - DATABASE SCHEMA DEFINITION (DDL)
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `system_migrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(32) NOT NULL,
  `migration_name` VARCHAR(128) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uq_migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(32) NOT NULL PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `full_name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `phone` VARCHAR(32) NOT NULL,
  `balance_usd` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `balance_pkr` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `vip_tier` VARCHAR(32) NOT NULL DEFAULT 'Bronze VIP',
  `status` ENUM('active','suspended','pending','deleted') NOT NULL DEFAULT 'active',
  `outcome_bias` ENUM('fair','force_win','force_loss','custom') NOT NULL DEFAULT 'fair',
  `custom_win_rate` INT NOT NULL DEFAULT 48,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'USD',
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `security_pin_hash` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(128) NOT NULL,
  `salt` VARCHAR(32) NOT NULL,
  `total_wagered` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_won` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bets` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL,
  `game` VARCHAR(64) NOT NULL,
  `bet_amount` DECIMAL(12,2) NOT NULL,
  `payout` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `multiplier` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `multiplier_formatted` VARCHAR(16) NOT NULL DEFAULT '0.00x',
  `status` ENUM('WIN','LOSS','PUSH','VOID','PENDING','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `profit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bet_time` VARCHAR(64) NOT NULL,
  `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bets_user_id` (`user_id`),
  INDEX `idx_bets_game` (`game`),
  INDEX `idx_bets_status` (`status`),
  CONSTRAINT `fk_bets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL,
  `type` ENUM('deposit','withdraw') NOT NULL,
  `method` VARCHAR(64) NOT NULL,
  `sender_account` VARCHAR(128) DEFAULT NULL,
  `trx_id`         VARCHAR(128) DEFAULT NULL,
  `proof_image`    TEXT DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `amount_pkr` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `amount_usd` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Approved','Pending','Rejected','Completed') NOT NULL DEFAULT 'Pending',
  `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_txns_user_id` (`user_id`),
  INDEX `idx_txns_type` (`type`),
  INDEX `idx_txns_status` (`status`),
  UNIQUE KEY `idx_txns_trx_id` (`trx_id`),
  CONSTRAINT `fk_txns_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `type` ENUM('deposit','withdraw','both') NOT NULL DEFAULT 'both',
  `account_title` VARCHAR(128) NOT NULL,
  `account_number` VARCHAR(128) NOT NULL,
  `instructions` TEXT,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'PKR',
  `fixed_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `percent_fee` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  `processing_time` VARCHAR(64) NOT NULL DEFAULT 'Instant (1-5 Mins)',
  `badge` VARCHAR(64) NOT NULL DEFAULT '',
  `deposit_instructions` TEXT,
  `withdraw_instructions` TEXT,
  `min_limit` DECIMAL(14,2) NOT NULL DEFAULT 500.00,
  `max_limit` DECIMAL(14,2) NOT NULL DEFAULT 500000.00,
  `exchange_rate` DECIMAL(10,4) NOT NULL DEFAULT 280.0000,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `is_crypto` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `p2p_merchants` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `avatar` VARCHAR(32) NOT NULL DEFAULT 'default',
  `badge` VARCHAR(128) NOT NULL DEFAULT 'Super Merchant',
  `status` ENUM('online','offline') NOT NULL DEFAULT 'online',
  `buy_price` DECIMAL(10,2) NOT NULL DEFAULT 279.50,
  `sell_price` DECIMAL(10,2) NOT NULL DEFAULT 281.20,
  `min_limit` DECIMAL(14,2) NOT NULL DEFAULT 5000.00,
  `max_limit` DECIMAL(14,2) NOT NULL DEFAULT 500000.00,
  `orders_completed` INT NOT NULL DEFAULT 0,
  `completion_rate` DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  `avg_release_min` DECIMAL(5,2) NOT NULL DEFAULT 2.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `p2p_orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `type` ENUM('BUY','SELL') NOT NULL,
  `user_id` VARCHAR(32) NOT NULL,
  `merchant_id` VARCHAR(64) NOT NULL,
  `merchant_name` VARCHAR(128) NOT NULL,
  `amount_usd` DECIMAL(12,2) NOT NULL,
  `amount_pkr` DECIMAL(14,2) NOT NULL,
  `rate` DECIMAL(10,2) NOT NULL,
  `channel` VARCHAR(64) NOT NULL,
  `status` ENUM('PENDING_PAYMENT','ESCROW_LOCKED','COMPLETED','DISPUTED','CANCELLED') NOT NULL DEFAULT 'PENDING_PAYMENT',
  `proof_trx` VARCHAR(128),
  `created_at` DATETIME NOT NULL,
  `escrow_released_at` DATETIME,
  INDEX `idx_p2p_orders_user` (`user_id`),
  INDEX `idx_p2p_orders_merch` (`merchant_id`),
  INDEX `idx_p2p_orders_status` (`status`),
  CONSTRAINT `fk_p2p_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_p2p_orders_merch` FOREIGN KEY (`merchant_id`) REFERENCES `p2p_merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `p2p_disputes` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(32) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `evidence_url` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('OPEN','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN',
  `admin_notes` TEXT DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME DEFAULT NULL,
  INDEX `idx_disputes_order` (`order_id`),
  INDEX `idx_disputes_status` (`status`),
  CONSTRAINT `fk_disputes_order` FOREIGN KEY (`order_id`) REFERENCES `p2p_orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_disputes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `cms_pages` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(128) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'general',
  `content` LONGTEXT NOT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(128) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;