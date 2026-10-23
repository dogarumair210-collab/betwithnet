-- ============================================================
-- BET WITH NET - ENTERPRISE RELATIONAL DATABASE EXPORT
-- High-Fidelity Schema, Foreign Keys, Indexes & Master Seed Data
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- Generated: 2026-09-12 05:25:00 UTC | Version: 3.1.0-ENTERPRISE
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
START TRANSACTION;
SET time_zone = '+00:00';

-- ------------------------------------------------------------
-- Table structure for table `system_migrations`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `system_migrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(32) NOT NULL,
  `migration_name` VARCHAR(128) NOT NULL,
  `applied_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `system_migrations` (`version`, `migration_name`, `applied_at`) VALUES ('3.1.0', '001_initial_enterprise_schema', NOW()) ON DUPLICATE KEY UPDATE `version`='3.1.0';

-- ------------------------------------------------------------
-- Table structure for table `users`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(32) NOT NULL PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `full_name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(128) NOT NULL UNIQUE,
  `phone` VARCHAR(32) NOT NULL,
  `balance_usd` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `balance_pkr` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `vip_tier` VARCHAR(32) NOT NULL DEFAULT 'Bronze VIP',
  `status` ENUM('active','suspended','pending') NOT NULL DEFAULT 'active',
  `outcome_bias` ENUM('fair','force_win','force_loss') NOT NULL DEFAULT 'fair',
  `custom_win_rate` INT NOT NULL DEFAULT 48,
  `currency` VARCHAR(8) NOT NULL DEFAULT 'USD',
  `role` VARCHAR(32) NOT NULL DEFAULT 'user',
  `security_pin` VARCHAR(16) NOT NULL,
  `security_pin_hash` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(128) NOT NULL,
  `salt` VARCHAR(32) NOT NULL,
  `total_wagered` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `total_won` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `users` (`id`, `username`, `full_name`, `email`, `phone`, `balance_usd`, `balance_pkr`, `vip_tier`, `status`, `outcome_bias`, `custom_win_rate`, `currency`, `security_pin`, `security_pin_hash`, `password_hash`, `salt`, `total_wagered`, `total_won`, `created_at`) VALUES
('USR-1001', 'vip_player_01', 'Muhammad Ali', 'ali.player@betwithnet.com', '0300-1234567', 1250.0, 350000, 'Gold VIP', 'active', 'fair', 48, 'USD', '4821', '049e46b069469d0e355945945743b9d503f404ba56a92d2d06bf6dde5fde3a46', '942cee58160bfac58d27766fd4277f179dfd56a60dc0c7ee9870cebdc801876b', 'ffffd485a73b3686', 142000, 135000, '2026-09-01 14:20:00'),
('USR-1002', 'target_loss_user', 'Hamza Khan', 'hamza.k@example.com', '0312-9876543', 120.0, 33600, 'Silver VIP', 'active', 'force_loss', 15, 'USD', '7392', '1cc04ad0c60d18f4e8bc42e44f412bf7f2086f4301392acb5d79a3fec9d9f4ef', '8f4b6b7f486c784bc0b2f3a817b69b6c3c462ebeba074dd80126de3d94a3eef5', '466eed5beedf2c9c', 68000, 14000, '2026-09-05 11:05:00'),
('USR-1003', 'vip_lucky_whale', 'Zeeshan Ahmed', 'zeeshan.ahmed@investor.pk', '0333-5554444', 15800.0, 4424000, 'Platinum VIP', 'active', 'force_win', 85, 'USD', '2918', '11a7daf25e8c73238f2165ee6d009a87bcbbbcdb94aebb74bef64c6e36a312dc', '97b5d650abd7b9a83418131757287538c7ce96e3979fc0bef56e92dbda66bc72', 'd2bb409219a5f78f', 220000, 275000, '2026-09-02 09:30:00'),
('USR-1004', 'suspended_fraud_flag', 'Malik Tariq (Suspended)', 'flagged@suspicious.org', '0321-0000000', 15.0, 4200, 'Bronze VIP', 'suspended', 'force_loss', 0, 'USD', '6043', 'd860ab4fad169a551fe9f13985c51852d9b24cd4b4776f358504b0989af23a91', '660954c0deb5c3f39b0018c2479f65bcfc8cd4f73750861bfccc3797921eeebd', 'e5c01110d1152333', 15000, 2000, '2026-09-08 16:45:00'),
('USR-1005', 'bilal_crypto_king', 'Bilal Sheikh', 'bilal.sheikh@trader.ae', '0345-7788990', 28450.0, 7966000, 'Diamond VIP', 'active', 'fair', 48, 'USD', '8172', '841e8df186db06ca82dc84b1a407de400d4e397d09d7872d52ead62f8dd15b6b', 'a929add21c8c65662d6570a34949875252ad09e7016e407a7ec789d59ede05a0', '1b676f4362263b71', 540000, 520000, '2026-08-15 10:12:00'),
('USR-1006', 'sarah_slots_pro', 'Sarah Jenkins', 'sarah.j@casino-fans.uk', '+44-7700-900123', 3400.0, 952000, 'Gold VIP', 'active', 'fair', 48, 'USD', '3904', '4c060283eed78a0eadd5deba7218279678fffbc5e6a286ace929d199b25e7f17', '584af3dd0490f36f78dd1ab7ce8934360202aa4badcf3891a6ae170e0de4db65', 'c7e72de3c8ea8c72', 89000, 84000, '2026-08-20 18:40:00'),
('USR-1007', 'usman_highroller', 'Usman Raza', 'usman.raza@textilepk.com', '0301-8889911', 75000.0, 21000000, 'VIP Royale', 'active', 'force_win', 80, 'USD', '5261', '23321dabf6caeac639ab0dea01ac3aa6a59a2731e7f68ace41ee4fd7e64a28de', '0ba7da1dd1127119bf74c10b91e95c5085852ca70ba3d75ed18db9766e7240a5', '7f1c187199be4eb9', 1450000, 1680000, '2026-07-10 12:00:00'),
('USR-1008', 'ayesha_roulette', 'Ayesha Siddiqui', 'ayesha.sidd@gmail.com', '0314-2233445', 850.0, 238000, 'Silver VIP', 'active', 'fair', 48, 'USD', '9417', 'e624dcbb72b735408011608356d51607eea8b0924f1ef8069f7651eb63848c2b', '11307298d7cffaab9d6976a3baf78891384c9d5729746c36ca36204379e3be31', 'b62a04911e8d72db', 42000, 39500, '2026-09-03 14:15:00'),
('USR-1009', '007_casino_royale', 'Daniel Craig', 'bond007@mi6-vip.ch', '+41-79-123-4567', 120000.0, 33600000, 'VIP Royale', 'active', 'fair', 52, 'USD', '1835', '055819698935e06d49d617bccdcc8bbfdec747d023a19cd8632904f1b98c0b37', 'b36354e9d44ef1a3d1fed7b46d5b289402ed7148bd014f40f14219e07ea45d4f', 'f70db23074f30117', 3200000, 3150000, '2026-06-01 08:30:00'),
('USR-1010', 'farhan_poker_ace', 'Farhan Akhtar', 'farhan.akhtar@pokerpro.in', '+91-98200-11223', 8900.0, 2492000, 'Platinum VIP', 'active', 'fair', 48, 'USD', '6724', '0f6a7e8423ea918332c5abc2edeb8763da05eeac5c8802b19565e5c7c54b50e7', '902afc39f2a3fcda2ed89843cff784352e060ba35acc937652c3ca4a37875bcd', '8ee83313aa24533b', 195000, 188000, '2026-08-28 22:10:00'),
('USR-1011', 'kamran_fast_crash', 'Kamran Akmal', 'kamran.akmal@cricfan.pk', '0302-3344556', 340.0, 95200, 'Bronze VIP', 'active', 'fair', 48, 'USD', '4091', '8be5584b9faa7fbeb6838f2ef2c9e2b38f68f8bb2c810d0751050ea8e5c094a2', 'ea91d9980a7cc0148b6a0422bb88547526ab014b6fa03019bf9f28fc40c07d99', 'e3676eea3ee7317c', 18500, 16200, '2026-09-07 16:22:00'),
('USR-1012', 'rehan_multi_acct', 'Rehan Qureshi (Multi-Account Ban)', 'rehan.ban@badactors.net', '0315-0099887', 45.0, 12600, 'Bronze VIP', 'suspended', 'force_loss', 0, 'USD', '8356', '282edf2ee842380ebcfcd8d98d8b5310477345209c920abbf758b6938a9c536a', 'e2ceaefc2ecb8e3114031a871f88073de45ec71365d29e3f66c3d291a35d1d7c', 'e6ec6c78a2511f1e', 8400, 900, '2026-09-06 13:00:00'),
('USR-1013', 'black_widow_21', 'Natasha Romanoff', 'natasha.r@avengers.io', '+1-555-019-2834', 45200.0, 12656000, 'Diamond VIP', 'active', 'force_win', 75, 'USD', '2749', 'd40ab846fcec6a048152e199bdeb6c77cb74ab13d57532e7dc39463edda2faa4', 'fe451b1391dc3f6204f274e727da2fa0864a78e557541bc1f6b0667cf75147d5', '3866b330cdce0ba6', 890000, 1050000, '2026-07-25 19:45:00'),
('USR-1014', 'omer_mines_hunter', 'Omer Farooq', 'omer.farooq@cybercorp.pk', '0331-9988112', 1150.0, 322000, 'Silver VIP', 'active', 'fair', 48, 'USD', '5183', 'd4fb660168fc3633c5cb2bb9787b779aed84907c5f74013ec16ed29f155b68e9', '1064887fdad2355b019cedfeb882de86ac3c44a6b4f62cb4d1a9d751a0ed0928', '92e97ccad4bcf573', 58000, 54000, '2026-08-30 11:20:00'),
('USR-1015', 'kashif_dice_roller', 'Kashif Mahmood', 'kashif.m@logistics.pk', '0300-6677889', 4200.0, 1176000, 'Gold VIP', 'active', 'fair', 48, 'USD', '9630', 'e6446a3186646d80c6624ef049d6ec8c1ce731bb9dfe26b06ce6e5a697cb16d9', '1bbaf79eb2f06126e647fcd89347150158a791ceff997fbbe5d250e022d8a0b1', 'e669f7bfc20fce8a', 124000, 118000, '2026-08-10 15:50:00'),
('USR-1016', 'zainab_lucky777', 'Zainab Bibi', 'zainab.777@hotmail.com', '0342-1144778', 210.0, 58800, 'Bronze VIP', 'active', 'fair', 48, 'USD', '3472', 'cf7b0886a4ba8b56900902c9f8a18da6b2884ff6f4b69b0efbf7e81a4b3d2457', '5fda75d8a0e2c57a03edc6fc857f3cc227e2a24953a7dc3a49cd3af95d9b8211', '2307a008135f837c', 9200, 8100, '2026-09-09 09:10:00'),
('USR-1017', 'waqas_chargeback', 'Waqas Butt (Chargeback Abuse)', 'waqas.fraud@dispute.org', '0324-9900112', 0.0, 0, 'Bronze VIP', 'suspended', 'force_loss', 0, 'USD', '7025', '8c5dec1885b0925243ad0cc87658217c8667e94c4fe7b40c950adc9f8bfa3bc6', '6c93f2d7f8f832bde36634f44909f54cffab0a1b7013329ed229b0bfa1608f74', '4fa7c7ffb1e684f3', 35000, 1200, '2026-09-04 17:30:00'),
('USR-1018', 'hassan_crypto_whale', 'Hassan Ali', 'hassan.ali@blockchain.pk', '0305-4433221', 19500.0, 5460000, 'Platinum VIP', 'active', 'fair', 48, 'USD', '1958', '2b86a1d90d30223c862c68b0c0d0fabd985d7a415069fb4b469dd2ecc571183e', 'df49b9aec7bc4ffd346cd1b73c11c78f7a13a8a4acbc5cf135f1997920773b71', 'e2d28f7cb9897762', 480000, 465000, '2026-08-05 21:00:00'),
('USR-1019', 'ace_tennis_vip', 'Maria Sharapova', 'maria.s@slam-champs.com', '+7-916-555-0199', 6700.0, 1876000, 'Gold VIP', 'active', 'fair', 48, 'USD', '8641', 'f203a6ee381dbe2d2e792c2c9712417c009ae69ba6927c3ede01fae0b746c71a', '3cf7cc95f83ed2fb30a869d9a05288418ec81e7cd44cbe6acc467e68f9e4a3cc', '3f97fb70779ac1c0', 172000, 164000, '2026-08-18 14:10:00'),
('USR-1020', 'tariq_keno_master', 'Tariq Jamil', 'tariq.j@investments.pk', '0313-8877665', 920.0, 257600, 'Silver VIP', 'active', 'fair', 48, 'USD', '4307', 'e8a37488c420ce31a71b5fe024069a5d9af32c9cd6bdefc1a41841268f91b641', '48a4183543d08f62223222a7b9d8a825d9e8f4f79a93091d23138fe064e759a1', 'a6e042da8a95c4c5', 45000, 41000, '2026-09-02 16:40:00'),
('USR-1021', 'bhai_highstakes', 'Salman Khan', 'bhaijaan@bollywoodvip.com', '+91-99887-76655', 88000.0, 24640000, 'VIP Royale', 'active', 'force_win', 78, 'USD', '6259', '1b9170a417e7a1004eda3f92b286155d3e7e8011d924ad213b893b3382232d42', 'eac54c97f01e1975ba47c7739d51d360ed5f949da1f100d83683a8e0894849d9', 'c4eb15cd2f592677', 2100000, 2350000, '2026-06-15 19:20:00'),
('USR-1022', 'jeeto_pakistan_vip', 'Fahad Mustafa', 'fahad.m@mediahouse.pk', '0300-9911223', 32000.0, 8960000, 'Diamond VIP', 'active', 'fair', 48, 'USD', '2814', '7876c937c8a7c71ae7c8bc0d7f98b61a36383c5e90bd36e49ece70cb359f75a5', '8b253b89c5cc6e23d0226bcee882c42363fe05287801d9bc0436af7df2763404', 'bea5a30cb94eb86f', 640000, 615000, '2026-07-20 13:15:00'),
('USR-1023', 'sixer_king_crash', 'Imran Nazir', 'imran.nazir@cricketlegend.pk', '0322-7711223', 5500.0, 1540000, 'Gold VIP', 'active', 'fair', 48, 'USD', '9570', 'de9409d6bcbe1cac01b21cff9d2458decb4d628559ff514f204fc582e863c33d', 'c979a7bb55522e91484d9bb9c85d7e742ba417c6d532e49bffcaeb03a93c12ad', 'ea54a89d58851eca', 138000, 131000, '2026-08-22 17:35:00'),
('USR-1024', 'cover_drive_56', 'Babar Azam', 'babar.56@pcb-stars.pk', '0303-5656565', 14000.0, 3920000, 'Platinum VIP', 'active', 'fair', 48, 'USD', '3682', 'ea4b5a01ebdadc62ea8bddb968ab4148ae180ce25ee7d758a6c31a46032a651c', '3342d49f4f338017929743e70c395ea7c924e2afbd90a57b660f020eafd50ff1', '582aa1fee4068e84', 340000, 328000, '2026-08-01 10:00:00'),
('USR-1025', 'eagle_strike_strike', 'Shaheen Afridi', 'shaheen.10@pcb-stars.pk', '0304-1010101', 7800.0, 2184000, 'Gold VIP', 'active', 'fair', 48, 'USD', '5147', 'e2ecc6d6396b9c76f7759698d826a745344c22a5cfc75d0623312489592c04cd', '3d67b3e82be909a5598712129f9fe403847170792f807a28cb74e3738ccb826b', '5442adf9ee512b01', 182000, 175000, '2026-08-12 12:45:00'),
('USR-1026', 'spin_king_roulette', 'Shadab Khan', 'shadab.7@pcb-stars.pk', '0316-7777777', 1600.0, 448000, 'Silver VIP', 'active', 'fair', 48, 'USD', '8923', 'cf8c5902a3e2130f7a4cde0de2b04f6ec7eb214383b246ecfd0355d9b5e76a42', '808d948376b09f055cecc55708069c983562ddd65d8811f481280325c6129fdf', '7fd1c0043f8e6c77', 52000, 48000, '2026-09-04 18:10:00'),
('USR-1027', 'turbo_speed_limbo', 'Naseem Shah', 'naseem.71@pcb-stars.pk', '0335-7171717', 2100.0, 588000, 'Silver VIP', 'active', 'fair', 48, 'USD', '1760', '620fe47b5403c1a197b00ed4f03d5ffec50bf67f76b8d851d732b3adfd84d8a9', 'a7ab330a83c3fa977c632253c36526ddcb7bdf71a9c3d308fdffbdc5746090ab', '5e2e107d19913b79', 64000, 59000, '2026-09-01 15:30:00'),
('USR-1028', '150kph_blitz', 'Haris Rauf', 'haris.150@speedster.pk', '0346-1501501', 480.0, 134400, 'Bronze VIP', 'active', 'fair', 48, 'USD', '6438', 'd8ec6ac79735afc7627f2980ebec8514cd99f87f805ed7e9269afb58574d0160', 'c449892e2f02abc6b7ebeea59fb18a261331c7db5711d101248ee7b108c5ee76', '400def8a00225fea', 22000, 19500, '2026-09-08 20:00:00'),
('USR-1029', 'superman_wk_poker', 'Rizwan Ahmed', 'rizwan.wk@pcb-stars.pk', '0306-1616161', 6300.0, 1764000, 'Gold VIP', 'active', 'fair', 48, 'USD', '4052', 'd5ec1403574c4e901f4ad5589bdc149af84dfa283ece05d2296e43745677e115', '364888957107dd83fb5cb4ffc39f669b94b2fe04111bdd063e5860714ca8e50e', '32989cd4f9e37c1b', 156000, 149000, '2026-08-16 11:15:00'),
('USR-1030', 'double_ton_whale', 'Fakhar Zaman', 'fakhar.39@navy-pride.pk', '0320-3939393', 41000.0, 11480000, 'Diamond VIP', 'active', 'fair', 48, 'USD', '9271', 'be2a4c8907eb180dab9eed4995b1a0356b565a13a64e623b0c45721c6813985f', 'e86db3c2c13c3f3f7923034a4ceb0dda9c857735646c4e98322452482f9035a3', '0061835d09beea29', 820000, 790000, '2026-07-28 14:00:00'),
('USR-1031', 'chacha_powerhitter', 'Iftikhar Ahmed', 'iftikhar.chacha@sixers.pk', '0347-6666666', 11500.0, 3220000, 'Platinum VIP', 'active', 'fair', 48, 'USD', '3815', '371c0ab9bc6b3d416aacb081f4583411fcb75183561e940e46f6982d479844c1', '8d09ef3c3d67ad4258cc52bc0449900f79cce7b6d8a7499b2638fa9c8b41ded1', '862f3edd06a611bc', 290000, 278000, '2026-08-08 19:10:00'),
('USR-1032', 'outlaw_blackjack', 'Arthur Morgan', 'arthur.m@van-der-linde.us', '+1-555-189-9900', 95000.0, 26600000, 'VIP Royale', 'active', 'force_win', 82, 'USD', '7496', 'b06c87a8c425d3decb42a4001e9a9b81a92031e0d304c643c84f27831360c41e', 'b5196eaaed20c92586861790113c573d18f79e42dd5c8e7eaf84bb9e74d99236', 'fcc97b2a5408ff5c', 2400000, 2650000, '2026-06-10 16:45:00')
ON DUPLICATE KEY UPDATE `balance_pkr`=VALUES(`balance_pkr`), `balance_usd`=VALUES(`balance_usd`), `status`=VALUES(`status`);

-- ------------------------------------------------------------
-- Table structure for table `bets` (De-duplicated & User Relational)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bets` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL,
  `game` VARCHAR(64) NOT NULL,
  `bet_amount` DECIMAL(12,2) NOT NULL,
  `payout` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `multiplier` DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `multiplier_formatted` VARCHAR(16) NOT NULL DEFAULT '0.00x',
  `status` ENUM('WIN','LOSS','PENDING','CANCELLED') NOT NULL,
  `profit` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `bet_time` VARCHAR(64) NOT NULL,
  `played_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_bets_user_id` (`user_id`),
  INDEX `idx_bets_game` (`game`),
  INDEX `idx_bets_status` (`status`),
  CONSTRAINT `fk_bets_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bets` (`id`, `user_id`, `game`, `bet_amount`, `payout`, `multiplier`, `multiplier_formatted`, `status`, `profit`, `bet_time`, `played_at`) VALUES
('BET-57358', 'USR-1001', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-87358', 'USR-1001', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-27358', 'USR-1001', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-96878', 'USR-1002', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-66878', 'USR-1002', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-76878', 'USR-1002', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-57027', 'USR-1003', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-37027', 'USR-1003', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-47027', 'USR-1003', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-77885', 'USR-1004', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-67885', 'USR-1004', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-37885', 'USR-1004', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-76176', 'USR-1005', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-16176', 'USR-1005', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-26176', 'USR-1005', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-96730', 'USR-1006', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-76730', 'USR-1006', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-36730', 'USR-1006', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-39688', 'USR-1007', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-19688', 'USR-1007', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-19689', 'USR-1007', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-13034', 'USR-1008', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-63034', 'USR-1008', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-73034', 'USR-1008', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-78875', 'USR-1009', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-28875', 'USR-1009', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-58875', 'USR-1009', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-16116', 'USR-1010', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-86116', 'USR-1010', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-26116', 'USR-1010', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-48484', 'USR-1011', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-68484', 'USR-1011', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-78484', 'USR-1011', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-15884', 'USR-1012', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-75884', 'USR-1012', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-25884', 'USR-1012', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-28160', 'USR-1013', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-18160', 'USR-1013', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-78160', 'USR-1013', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-65846', 'USR-1014', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-45846', 'USR-1014', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-45847', 'USR-1014', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-88542', 'USR-1015', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-48542', 'USR-1015', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-48543', 'USR-1015', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-34936', 'USR-1016', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-14936', 'USR-1016', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-64936', 'USR-1016', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-81307', 'USR-1017', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-71307', 'USR-1017', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-51307', 'USR-1017', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-16091', 'USR-1018', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-56091', 'USR-1018', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-26091', 'USR-1018', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-86899', 'USR-1019', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-76899', 'USR-1019', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-16899', 'USR-1019', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-38606', 'USR-1020', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-28606', 'USR-1020', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-28607', 'USR-1020', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-94684', 'USR-1021', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-74684', 'USR-1021', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-74685', 'USR-1021', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-88431', 'USR-1022', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-78431', 'USR-1022', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-58431', 'USR-1022', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-36402', 'USR-1023', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-46402', 'USR-1023', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-66402', 'USR-1023', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-30390', 'USR-1024', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-30391', 'USR-1024', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-10390', 'USR-1024', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-97904', 'USR-1025', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-47904', 'USR-1025', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-47905', 'USR-1025', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-57693', 'USR-1026', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-37693', 'USR-1026', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-77693', 'USR-1026', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-22686', 'USR-1027', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-42686', 'USR-1027', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-52686', 'USR-1027', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-83329', 'USR-1028', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-63329', 'USR-1028', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-33329', 'USR-1028', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-76703', 'USR-1029', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-66703', 'USR-1029', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-56703', 'USR-1029', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-52213', 'USR-1030', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-52214', 'USR-1030', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-32213', 'USR-1030', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-13384', 'USR-1031', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-23384', 'USR-1031', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-13385', 'USR-1031', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW()),
('BET-80264', 'USR-1032', 'Crash', 25, 55, 2.2, '2.20x', 'WIN', 30, '18:24:10', NOW()),
('BET-50264', 'USR-1032', 'Roulette', 50, 0, 0.0, '0.00x', 'LOSS', -50, '18:20:05', NOW()),
('BET-40264', 'USR-1032', 'Blackjack', 100, 250, 2.5, '2.50x', 'WIN', 150, '18:15:30', NOW())
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`), `payout`=VALUES(`payout`);

-- ------------------------------------------------------------
-- Table structure for table `transactions` (Clean Chronology & Non-Zero)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(32) NOT NULL,
  `type` ENUM('deposit','withdraw') NOT NULL,
  `method` VARCHAR(64) NOT NULL,
  `sender_account` VARCHAR(128) DEFAULT NULL,
  `trx_id`         VARCHAR(128) DEFAULT NULL,
  `proof_image`    LONGTEXT DEFAULT NULL,
  `notes`          TEXT DEFAULT NULL,
  `amount_pkr` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `amount_usd` DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Approved','Pending','Rejected','Completed') NOT NULL DEFAULT 'Pending',
  `transaction_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_txns_user_id` (`user_id`),
  INDEX `idx_txns_type` (`type`),
  INDEX `idx_txns_status` (`status`),
  CONSTRAINT `fk_txns_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `transactions` (`id`, `user_id`, `type`, `method`, `amount_pkr`, `amount_usd`, `status`, `transaction_date`, `created_at`) VALUES
('DEP-3358', 'USR-1001', 'deposit', 'EasyPaisa', 140000.00, 500.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-6358', 'USR-1001', 'withdraw', 'JazzCash', 35000.00, 125.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-6878', 'USR-1002', 'deposit', 'EasyPaisa', 13440.00, 48.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1878', 'USR-1002', 'withdraw', 'JazzCash', 3360.00, 12.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-3027', 'USR-1003', 'deposit', 'EasyPaisa', 1769600.00, 6320.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-4027', 'USR-1003', 'withdraw', 'JazzCash', 442400.00, 1580.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-5885', 'USR-1004', 'deposit', 'EasyPaisa', 1680.00, 6.00, 'Approved', '2026-09-08 17:45:00', '2026-09-08 17:45:00'),
('WTH-2885', 'USR-1004', 'withdraw', 'JazzCash', 420.00, 1.50, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4176', 'USR-1005', 'deposit', 'EasyPaisa', 3186400.00, 11380.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-7176', 'USR-1005', 'withdraw', 'JazzCash', 796600.00, 2845.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-6730', 'USR-1006', 'deposit', 'EasyPaisa', 380800.00, 1360.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3730', 'USR-1006', 'withdraw', 'JazzCash', 95200.00, 340.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-3688', 'USR-1007', 'deposit', 'EasyPaisa', 8400000.00, 30000.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-2688', 'USR-1007', 'withdraw', 'JazzCash', 2100000.00, 7500.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4034', 'USR-1008', 'deposit', 'EasyPaisa', 95200.00, 340.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-6034', 'USR-1008', 'withdraw', 'JazzCash', 23800.00, 85.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-6875', 'USR-1009', 'deposit', 'EasyPaisa', 13440000.00, 48000.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3875', 'USR-1009', 'withdraw', 'JazzCash', 3360000.00, 12000.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7116', 'USR-1010', 'deposit', 'EasyPaisa', 996800.00, 3560.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-5116', 'USR-1010', 'withdraw', 'JazzCash', 249200.00, 890.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-3484', 'USR-1011', 'deposit', 'EasyPaisa', 38080.00, 136.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3484', 'USR-1011', 'withdraw', 'JazzCash', 9520.00, 34.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-6884', 'USR-1012', 'deposit', 'EasyPaisa', 5040.00, 18.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-2884', 'USR-1012', 'withdraw', 'JazzCash', 1260.00, 4.50, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-1160', 'USR-1013', 'deposit', 'EasyPaisa', 5062400.00, 18080.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1160', 'USR-1013', 'withdraw', 'JazzCash', 1265600.00, 4520.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-2846', 'USR-1014', 'deposit', 'EasyPaisa', 128800.00, 460.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-4846', 'USR-1014', 'withdraw', 'JazzCash', 32200.00, 115.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7542', 'USR-1015', 'deposit', 'EasyPaisa', 470400.00, 1680.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-7542', 'USR-1015', 'withdraw', 'JazzCash', 117600.00, 420.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7936', 'USR-1016', 'deposit', 'EasyPaisa', 23520.00, 84.00, 'Approved', '2026-09-09 10:10:00', '2026-09-09 10:10:00'),
('WTH-5936', 'USR-1016', 'withdraw', 'JazzCash', 5880.00, 21.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-9307', 'USR-1017', 'deposit', 'EasyPaisa', 50000.00, 178.57, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-6307', 'USR-1017', 'withdraw', 'JazzCash', 20000.00, 71.43, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7091', 'USR-1018', 'deposit', 'EasyPaisa', 2184000.00, 7800.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-7091', 'USR-1018', 'withdraw', 'JazzCash', 546000.00, 1950.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-5899', 'USR-1019', 'deposit', 'EasyPaisa', 750400.00, 2680.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3899', 'USR-1019', 'withdraw', 'JazzCash', 187600.00, 670.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-2606', 'USR-1020', 'deposit', 'EasyPaisa', 103040.00, 368.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3606', 'USR-1020', 'withdraw', 'JazzCash', 25760.00, 92.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4684', 'USR-1021', 'deposit', 'EasyPaisa', 9856000.00, 35200.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1684', 'USR-1021', 'withdraw', 'JazzCash', 2464000.00, 8800.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7431', 'USR-1022', 'deposit', 'EasyPaisa', 3584000.00, 12800.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-5431', 'USR-1022', 'withdraw', 'JazzCash', 896000.00, 3200.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-9402', 'USR-1023', 'deposit', 'EasyPaisa', 616000.00, 2200.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-5402', 'USR-1023', 'withdraw', 'JazzCash', 154000.00, 550.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-3390', 'USR-1024', 'deposit', 'EasyPaisa', 1568000.00, 5600.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-5390', 'USR-1024', 'withdraw', 'JazzCash', 392000.00, 1400.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7904', 'USR-1025', 'deposit', 'EasyPaisa', 873600.00, 3120.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-6904', 'USR-1025', 'withdraw', 'JazzCash', 218400.00, 780.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-3693', 'USR-1026', 'deposit', 'EasyPaisa', 179200.00, 640.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-4693', 'USR-1026', 'withdraw', 'JazzCash', 44800.00, 160.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4686', 'USR-1027', 'deposit', 'EasyPaisa', 235200.00, 840.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1686', 'USR-1027', 'withdraw', 'JazzCash', 58800.00, 210.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-2329', 'USR-1028', 'deposit', 'EasyPaisa', 53760.00, 192.00, 'Approved', '2026-09-08 21:00:00', '2026-09-08 21:00:00'),
('WTH-6329', 'USR-1028', 'withdraw', 'JazzCash', 13440.00, 48.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4703', 'USR-1029', 'deposit', 'EasyPaisa', 705600.00, 2520.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1703', 'USR-1029', 'withdraw', 'JazzCash', 176400.00, 630.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-7213', 'USR-1030', 'deposit', 'EasyPaisa', 4592000.00, 16400.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-3213', 'USR-1030', 'withdraw', 'JazzCash', 1148000.00, 4100.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-4384', 'USR-1031', 'deposit', 'EasyPaisa', 1288000.00, 4600.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-6384', 'USR-1031', 'withdraw', 'JazzCash', 322000.00, 1150.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00'),
('DEP-8264', 'USR-1032', 'deposit', 'EasyPaisa', 10640000.00, 38000.00, 'Approved', '2026-09-08 12:30:00', '2026-09-08 12:30:00'),
('WTH-1264', 'USR-1032', 'withdraw', 'JazzCash', 2660000.00, 9500.00, 'Approved', '2026-09-10 09:15:00', '2026-09-10 09:15:00')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`), `amount_pkr`=VALUES(`amount_pkr`);

-- ------------------------------------------------------------
-- Table structure for table `payment_methods`
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `payment_methods` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `type` ENUM('deposit','withdraw','both') NOT NULL DEFAULT 'both',
  `account_title` VARCHAR(128) NOT NULL,
  `account_number` VARCHAR(128) NOT NULL,
  `instructions` TEXT,
  `min_limit` DECIMAL(14,2) NOT NULL DEFAULT 500.00,
  `max_limit` DECIMAL(14,2) NOT NULL DEFAULT 500000.00,
  `exchange_rate` DECIMAL(10,4) NOT NULL DEFAULT 280.0000,
  `status` ENUM('active','inactive') NOT NULL DEFAULT 'active',
  `is_crypto` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payment_methods` (`id`, `name`, `type`, `account_title`, `account_number`, `instructions`, `min_limit`, `max_limit`, `exchange_rate`, `status`, `is_crypto`) VALUES
('pm-easypaisa', 'EasyPaisa Direct', 'both', 'Muhammad Ijaz', '03246533046', 'Transfer funds via EasyPaisa to 03246533046 (Muhammad Ijaz) and upload your transaction screenshot.', 500, 500000, 280.0, 'active', 0),
('pm-jazzcash', 'JazzCash Mobile Account', 'both', 'Muhammad Ijaz', '03246533046', 'Transfer via JazzCash to 03246533046 (Muhammad Ijaz) and upload your transaction screenshot.', 500, 500000, 280.0, 'active', 0),
('pm-meezan', 'Meezan Bank Raast', 'both', 'Bet With Net Corporate', '0101-0203040506', 'Interbank online fund transfer via 1Link/Raast.', 2000, 5000000, 280.0, 'active', 0),
('pm-sadapay', 'SadaPay Instant', 'both', 'Bet With Net VIP', '0312-9988776', 'Send to SadaBiz account without fees.', 1000, 1000000, 280.0, 'active', 0),
('pm-usdt', 'Tether USDT (TRC-20)', 'both', 'Corporate Multi-Sig Wallet', 'TYD6xK9qZsBq5qVjF8t2G7s3mNpLwXr4Vq', 'Send only USDT TRC20 network. Minimum $10.', 10, 100000, 1.0, 'active', 1)
ON DUPLICATE KEY UPDATE `exchange_rate`=VALUES(`exchange_rate`), `status`=VALUES(`status`);

-- ------------------------------------------------------------
-- Table structure for table `p2p_merchants`
-- ------------------------------------------------------------
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

INSERT INTO `p2p_merchants` (`id`, `name`, `avatar`, `badge`, `status`, `buy_price`, `sell_price`, `min_limit`, `max_limit`, `orders_completed`, `completion_rate`, `avg_release_min`) VALUES
('MERCH-001', 'Lahore_Crypto_Bull', '👑', '🏆 Super Merchant', 'online', 279.5, 281.2, 5000, 500000, 1842, 99.8, 1.8),
('MERCH-002', 'Karachi_OTC_Whale', '💎', '⚡ Verified Pro', 'online', 279.8, 281.5, 10000, 1500000, 2910, 100.0, 1.4),
('MERCH-003', 'Islamabad_Cash_Desk', '⚡', '🛡️ 100% Escrow', 'online', 279.2, 281.0, 2000, 250000, 940, 99.1, 2.1),
('MERCH-004', 'Faisalabad_Trading_Hub', '🦁', '🔥 Fast Release', 'online', 279.4, 281.3, 5000, 800000, 1420, 99.5, 1.9),
('MERCH-005', 'Rawalpindi_Exchange', '🦅', '⭐ High Volume', 'online', 279.6, 281.4, 10000, 1000000, 1680, 99.7, 1.7),
('MERCH-006', 'Multan_Express_Cash', '🌟', '⚡ Instant', 'online', 279.1, 280.9, 1000, 150000, 780, 98.9, 2.5),
('MERCH-007', 'Peshawar_Khyber_Crypto', '🛡️', '🏆 Super Merchant', 'online', 279.7, 281.6, 15000, 2000000, 2150, 100.0, 1.5),
('MERCH-008', 'Sialkot_Prime_Liquidity', '⚽', '💎 VIP Partner', 'online', 279.5, 281.3, 5000, 600000, 1120, 99.4, 1.9)
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`), `buy_price`=VALUES(`buy_price`), `sell_price`=VALUES(`sell_price`);

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
  `status` ENUM('PENDING_PAYMENT','ESCROW_LOCKED','COMPLETED','DISPUTED','CANCELLED') NOT NULL DEFAULT 'COMPLETED',
  `proof_trx` VARCHAR(128),
  `created_at` DATETIME NOT NULL,
  `escrow_released_at` DATETIME,
  INDEX `idx_p2p_orders_user` (`user_id`),
  INDEX `idx_p2p_orders_merch` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `p2p_orders` (`id`, `type`, `user_id`, `merchant_id`, `merchant_name`, `amount_usd`, `amount_pkr`, `rate`, `channel`, `status`, `proof_trx`, `created_at`, `escrow_released_at`) VALUES
('P2P-ORD-98241', 'BUY', 'USR-1001', 'MERCH-001', 'Lahore_Crypto_Bull', 100.0, 27950.0, 279.5, 'EasyPaisa', 'COMPLETED', 'TID8849201948', '2026-09-10 14:20:00', '2026-09-10 14:22:15'),
('P2P-ORD-98242', 'SELL', 'USR-1002', 'MERCH-002', 'Karachi_OTC_Whale', 250.0, 70375.0, 281.5, 'Meezan Bank', 'COMPLETED', 'MB9924810294', '2026-09-11 11:15:00', '2026-09-11 11:16:30')
ON DUPLICATE KEY UPDATE `status`=VALUES(`status`);

CREATE TABLE IF NOT EXISTS `cms_pages` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `slug` VARCHAR(128) NOT NULL UNIQUE,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'general',
  `content` LONGTEXT NOT NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `cms_pages` (`id`, `slug`, `title`, `category`, `content`, `is_published`, `updated_at`) VALUES
('cms-terms', 'terms', 'Terms & Conditions of Service', 'legal', 'Official Terms of Service for Bet With Net VIP Casino and P2P Liquidity Desk. Users must be 18+ to register and play.', 1, '2026-09-10 12:00:00'),
('cms-privacy', 'privacy', 'Privacy & Data Protection Policy', 'legal', 'Bet With Net uses industry-standard 256-bit AES encryption to protect user credentials, bank details, and wager history.', 1, '2026-09-10 12:00:00'),
('cms-responsible', 'responsible-gaming', 'Responsible Gaming & Self-Exclusion', 'compliance', 'Play responsibly. Set deposit limits, loss limits, or request immediate voluntary self-exclusion at any time.', 1, '2026-09-10 12:00:00'),
('cms-fair-play', 'fair-play', 'Provably Fair & RNG Cryptographic Auditing', 'gaming', 'All games use cryptographic SHA-256 seed pairs. Players can independently verify every round outcome on the blockchain.', 1, '2026-09-10 12:00:00'),
('cms-faq', 'faq', 'Frequently Asked Questions & Help Center', 'help', 'Answers to common questions regarding EasyPaisa deposits, JazzCash cashouts, P2P escrow protection, and game rules.', 1, '2026-09-10 12:00:00')
ON DUPLICATE KEY UPDATE `title`=VALUES(`title`), `content`=VALUES(`content`);

CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(128) NOT NULL PRIMARY KEY,
  `setting_value` LONGTEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`setting_key`, `setting_value`, `updated_at`) VALUES
('site_title', '"BET WITH NET"', NOW()),
('tagline', '"Pakistan''s #1 Luxury Online Casino & P2P Desk"', NOW()),
('logo_url', '"assets/images/logo.png"', NOW()),
('favicon_url', '"assets/images/favicon.png"', NOW()),
('background_image', '"assets/backgrounds/casino_main_bg.jpg"', NOW()),
('smtp_host', '"smtp.betwithnet.com"', NOW()),
('smtp_port', '"587"', NOW()),
('smtp_user', '"support@betwithnet.com"', NOW()),
('smtp_pass', '"BwnSmtpSecret2026!"', NOW()),
('admin_pin', '"9824"', NOW()),
('master_pin', '"8391"', NOW()),
('p2p_commission_rate', '2.0', NOW()),
('theme_active_preset', '"emerald_royale"', NOW())
ON DUPLICATE KEY UPDATE `setting_value`=VALUES(`setting_value`);

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;

-- END OF RELATIONAL DUMP --
