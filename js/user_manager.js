// ============================================================
// Bet With Net - Multi-User Management & Outcome Bias Engine
// Handles Multi-User Directory, Add/Edit/Delete/View/Suspend,
// Individual Loss Average/Rigging, and User-Specific Bet Slips
// ============================================================

class UserManager {
    constructor() {
        this.STORAGE_KEY = 'bwn_users_v2';
        this.ACTIVE_USER_KEY = 'bwn_active_user_id';
        this.users = this.loadUsers();
        this.ensureActiveUser();
    }

    getDefaultUsers() {
        return [
        {
                "id": "USR-1001",
                "username": "vip_player_01",
                "fullName": "Muhammad Ali",
                "email": "ali.player@betwithnet.com",
                "phone": "0300-1234567",
                "balanceUSD": 1250.0,
                "balancePKR": 350000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-01 14:20",
                "totalWagered": 142000,
                "totalWon": 135000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-57358",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1001",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-87358",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1001",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-27358",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1001",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3358",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 140000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1001"
                        },
                        {
                                "id": "WTH-6358",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 35000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1001"
                        }
                ],
                "securityPinHash": "049e46b069469d0e355945945743b9d503f404ba56a92d2d06bf6dde5fde3a46",
                "salt": "ffffd485a73b3686",
                "passwordHash": "942cee58160bfac58d27766fd4277f179dfd56a60dc0c7ee9870cebdc801876b",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1002",
                "username": "target_loss_user",
                "fullName": "Hamza Khan",
                "email": "hamza.k@example.com",
                "phone": "0312-9876543",
                "balanceUSD": 120.0,
                "balancePKR": 33600,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "force_loss",
                "customWinRate": 15,
                "createdAt": "2026-09-05 11:05",
                "totalWagered": 68000,
                "totalWon": 14000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-96878",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1002",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-66878",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1002",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-76878",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1002",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-6878",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 13440,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1002"
                        },
                        {
                                "id": "WTH-1878",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 3360,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1002"
                        }
                ],
                "securityPinHash": "1cc04ad0c60d18f4e8bc42e44f412bf7f2086f4301392acb5d79a3fec9d9f4ef",
                "salt": "466eed5beedf2c9c",
                "passwordHash": "8f4b6b7f486c784bc0b2f3a817b69b6c3c462ebeba074dd80126de3d94a3eef5",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1003",
                "username": "vip_lucky_whale",
                "fullName": "Zeeshan Ahmed",
                "email": "zeeshan.ahmed@investor.pk",
                "phone": "0333-5554444",
                "balanceUSD": 15800.0,
                "balancePKR": 4424000,
                "vipTier": "Platinum VIP",
                "status": "active",
                "outcomeBias": "force_win",
                "customWinRate": 85,
                "createdAt": "2026-09-02 09:30",
                "totalWagered": 220000,
                "totalWon": 275000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-57027",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1003",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-37027",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1003",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-47027",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1003",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3027",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 1769600,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1003"
                        },
                        {
                                "id": "WTH-4027",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 442400,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1003"
                        }
                ],
                "securityPinHash": "11a7daf25e8c73238f2165ee6d009a87bcbbbcdb94aebb74bef64c6e36a312dc",
                "salt": "d2bb409219a5f78f",
                "passwordHash": "97b5d650abd7b9a83418131757287538c7ce96e3979fc0bef56e92dbda66bc72",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1004",
                "username": "suspended_fraud_flag",
                "fullName": "Malik Tariq (Suspended)",
                "email": "flagged@suspicious.org",
                "phone": "0321-0000000",
                "balanceUSD": 15.0,
                "balancePKR": 4200,
                "vipTier": "Bronze VIP",
                "status": "suspended",
                "outcomeBias": "force_loss",
                "customWinRate": 0,
                "createdAt": "2026-09-08 16:45",
                "totalWagered": 15000,
                "totalWon": 2000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-77885",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1004",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-67885",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1004",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-37885",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1004",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-5885",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 1680,
                                "status": "Approved",
                                "date": "2026-09-08 17:45",
                                "userId": "USR-1004"
                        },
                        {
                                "id": "WTH-2885",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 420,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1004"
                        }
                ],
                "securityPinHash": "d860ab4fad169a551fe9f13985c51852d9b24cd4b4776f358504b0989af23a91",
                "salt": "e5c01110d1152333",
                "passwordHash": "660954c0deb5c3f39b0018c2479f65bcfc8cd4f73750861bfccc3797921eeebd",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1005",
                "username": "bilal_crypto_king",
                "fullName": "Bilal Sheikh",
                "email": "bilal.sheikh@trader.ae",
                "phone": "0345-7788990",
                "balanceUSD": 28450.0,
                "balancePKR": 7966000,
                "vipTier": "Diamond VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-15 10:12",
                "totalWagered": 540000,
                "totalWon": 520000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-76176",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1005",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-16176",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1005",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-26176",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1005",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4176",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 3186400,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1005"
                        },
                        {
                                "id": "WTH-7176",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 796600,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1005"
                        }
                ],
                "securityPinHash": "841e8df186db06ca82dc84b1a407de400d4e397d09d7872d52ead62f8dd15b6b",
                "salt": "1b676f4362263b71",
                "passwordHash": "a929add21c8c65662d6570a34949875252ad09e7016e407a7ec789d59ede05a0",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1006",
                "username": "sarah_slots_pro",
                "fullName": "Sarah Jenkins",
                "email": "sarah.j@casino-fans.uk",
                "phone": "+44-7700-900123",
                "balanceUSD": 3400.0,
                "balancePKR": 952000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-20 18:40",
                "totalWagered": 89000,
                "totalWon": 84000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-96730",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1006",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-76730",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1006",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-36730",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1006",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-6730",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 380800,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1006"
                        },
                        {
                                "id": "WTH-3730",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 95200,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1006"
                        }
                ],
                "securityPinHash": "4c060283eed78a0eadd5deba7218279678fffbc5e6a286ace929d199b25e7f17",
                "salt": "c7e72de3c8ea8c72",
                "passwordHash": "584af3dd0490f36f78dd1ab7ce8934360202aa4badcf3891a6ae170e0de4db65",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1007",
                "username": "usman_highroller",
                "fullName": "Usman Raza",
                "email": "usman.raza@textilepk.com",
                "phone": "0301-8889911",
                "balanceUSD": 75000.0,
                "balancePKR": 21000000,
                "vipTier": "VIP Royale",
                "status": "active",
                "outcomeBias": "force_win",
                "customWinRate": 80,
                "createdAt": "2026-07-10 12:00",
                "totalWagered": 1450000,
                "totalWon": 1680000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-39688",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1007",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-19688",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1007",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-19689",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1007",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3688",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 8400000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1007"
                        },
                        {
                                "id": "WTH-2688",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 2100000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1007"
                        }
                ],
                "securityPinHash": "23321dabf6caeac639ab0dea01ac3aa6a59a2731e7f68ace41ee4fd7e64a28de",
                "salt": "7f1c187199be4eb9",
                "passwordHash": "0ba7da1dd1127119bf74c10b91e95c5085852ca70ba3d75ed18db9766e7240a5",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1008",
                "username": "ayesha_roulette",
                "fullName": "Ayesha Siddiqui",
                "email": "ayesha.sidd@gmail.com",
                "phone": "0314-2233445",
                "balanceUSD": 850.0,
                "balancePKR": 238000,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-03 14:15",
                "totalWagered": 42000,
                "totalWon": 39500,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-13034",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1008",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-63034",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1008",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-73034",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1008",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4034",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 95200,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1008"
                        },
                        {
                                "id": "WTH-6034",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 23800,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1008"
                        }
                ],
                "securityPinHash": "e624dcbb72b735408011608356d51607eea8b0924f1ef8069f7651eb63848c2b",
                "salt": "b62a04911e8d72db",
                "passwordHash": "11307298d7cffaab9d6976a3baf78891384c9d5729746c36ca36204379e3be31",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1009",
                "username": "007_casino_royale",
                "fullName": "Daniel Craig",
                "email": "bond007@mi6-vip.ch",
                "phone": "+41-79-123-4567",
                "balanceUSD": 120000.0,
                "balancePKR": 33600000,
                "vipTier": "VIP Royale",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 52,
                "createdAt": "2026-06-01 08:30",
                "totalWagered": 3200000,
                "totalWon": 3150000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-78875",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1009",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-28875",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1009",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-58875",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1009",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-6875",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 13440000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1009"
                        },
                        {
                                "id": "WTH-3875",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 3360000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1009"
                        }
                ],
                "securityPinHash": "055819698935e06d49d617bccdcc8bbfdec747d023a19cd8632904f1b98c0b37",
                "salt": "f70db23074f30117",
                "passwordHash": "b36354e9d44ef1a3d1fed7b46d5b289402ed7148bd014f40f14219e07ea45d4f",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1010",
                "username": "farhan_poker_ace",
                "fullName": "Farhan Akhtar",
                "email": "farhan.akhtar@pokerpro.in",
                "phone": "+91-98200-11223",
                "balanceUSD": 8900.0,
                "balancePKR": 2492000,
                "vipTier": "Platinum VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-28 22:10",
                "totalWagered": 195000,
                "totalWon": 188000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-16116",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1010",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-86116",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1010",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-26116",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1010",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7116",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 996800,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1010"
                        },
                        {
                                "id": "WTH-5116",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 249200,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1010"
                        }
                ],
                "securityPinHash": "0f6a7e8423ea918332c5abc2edeb8763da05eeac5c8802b19565e5c7c54b50e7",
                "salt": "8ee83313aa24533b",
                "passwordHash": "902afc39f2a3fcda2ed89843cff784352e060ba35acc937652c3ca4a37875bcd",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1011",
                "username": "kamran_fast_crash",
                "fullName": "Kamran Akmal",
                "email": "kamran.akmal@cricfan.pk",
                "phone": "0302-3344556",
                "balanceUSD": 340.0,
                "balancePKR": 95200,
                "vipTier": "Bronze VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-07 16:22",
                "totalWagered": 18500,
                "totalWon": 16200,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-48484",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1011",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-68484",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1011",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-78484",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1011",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3484",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 38080,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1011"
                        },
                        {
                                "id": "WTH-3484",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 9520,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1011"
                        }
                ],
                "securityPinHash": "8be5584b9faa7fbeb6838f2ef2c9e2b38f68f8bb2c810d0751050ea8e5c094a2",
                "salt": "e3676eea3ee7317c",
                "passwordHash": "ea91d9980a7cc0148b6a0422bb88547526ab014b6fa03019bf9f28fc40c07d99",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1012",
                "username": "rehan_multi_acct",
                "fullName": "Rehan Qureshi (Multi-Account Ban)",
                "email": "rehan.ban@badactors.net",
                "phone": "0315-0099887",
                "balanceUSD": 45.0,
                "balancePKR": 12600,
                "vipTier": "Bronze VIP",
                "status": "suspended",
                "outcomeBias": "force_loss",
                "customWinRate": 0,
                "createdAt": "2026-09-06 13:00",
                "totalWagered": 8400,
                "totalWon": 900,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-15884",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1012",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-75884",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1012",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-25884",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1012",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-6884",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 5040,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1012"
                        },
                        {
                                "id": "WTH-2884",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 1260,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1012"
                        }
                ],
                "securityPinHash": "282edf2ee842380ebcfcd8d98d8b5310477345209c920abbf758b6938a9c536a",
                "salt": "e6ec6c78a2511f1e",
                "passwordHash": "e2ceaefc2ecb8e3114031a871f88073de45ec71365d29e3f66c3d291a35d1d7c",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1013",
                "username": "black_widow_21",
                "fullName": "Natasha Romanoff",
                "email": "natasha.r@avengers.io",
                "phone": "+1-555-019-2834",
                "balanceUSD": 45200.0,
                "balancePKR": 12656000,
                "vipTier": "Diamond VIP",
                "status": "active",
                "outcomeBias": "force_win",
                "customWinRate": 75,
                "createdAt": "2026-07-25 19:45",
                "totalWagered": 890000,
                "totalWon": 1050000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-28160",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1013",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-18160",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1013",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-78160",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1013",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-1160",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 5062400,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1013"
                        },
                        {
                                "id": "WTH-1160",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 1265600,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1013"
                        }
                ],
                "securityPinHash": "d40ab846fcec6a048152e199bdeb6c77cb74ab13d57532e7dc39463edda2faa4",
                "salt": "3866b330cdce0ba6",
                "passwordHash": "fe451b1391dc3f6204f274e727da2fa0864a78e557541bc1f6b0667cf75147d5",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1014",
                "username": "omer_mines_hunter",
                "fullName": "Omer Farooq",
                "email": "omer.farooq@cybercorp.pk",
                "phone": "0331-9988112",
                "balanceUSD": 1150.0,
                "balancePKR": 322000,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-30 11:20",
                "totalWagered": 58000,
                "totalWon": 54000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-65846",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1014",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-45846",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1014",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-45847",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1014",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-2846",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 128800,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1014"
                        },
                        {
                                "id": "WTH-4846",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 32200,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1014"
                        }
                ],
                "securityPinHash": "d4fb660168fc3633c5cb2bb9787b779aed84907c5f74013ec16ed29f155b68e9",
                "salt": "92e97ccad4bcf573",
                "passwordHash": "1064887fdad2355b019cedfeb882de86ac3c44a6b4f62cb4d1a9d751a0ed0928",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1015",
                "username": "kashif_dice_roller",
                "fullName": "Kashif Mahmood",
                "email": "kashif.m@logistics.pk",
                "phone": "0300-6677889",
                "balanceUSD": 4200.0,
                "balancePKR": 1176000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-10 15:50",
                "totalWagered": 124000,
                "totalWon": 118000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-88542",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1015",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-48542",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1015",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-48543",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1015",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7542",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 470400,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1015"
                        },
                        {
                                "id": "WTH-7542",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 117600,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1015"
                        }
                ],
                "securityPinHash": "e6446a3186646d80c6624ef049d6ec8c1ce731bb9dfe26b06ce6e5a697cb16d9",
                "salt": "e669f7bfc20fce8a",
                "passwordHash": "1bbaf79eb2f06126e647fcd89347150158a791ceff997fbbe5d250e022d8a0b1",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1016",
                "username": "zainab_lucky777",
                "fullName": "Zainab Bibi",
                "email": "zainab.777@hotmail.com",
                "phone": "0342-1144778",
                "balanceUSD": 210.0,
                "balancePKR": 58800,
                "vipTier": "Bronze VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-09 09:10",
                "totalWagered": 9200,
                "totalWon": 8100,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-34936",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1016",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-14936",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1016",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-64936",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1016",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7936",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 23520,
                                "status": "Approved",
                                "date": "2026-09-09 10:10",
                                "userId": "USR-1016"
                        },
                        {
                                "id": "WTH-5936",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 5880,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1016"
                        }
                ],
                "securityPinHash": "cf7b0886a4ba8b56900902c9f8a18da6b2884ff6f4b69b0efbf7e81a4b3d2457",
                "salt": "2307a008135f837c",
                "passwordHash": "5fda75d8a0e2c57a03edc6fc857f3cc227e2a24953a7dc3a49cd3af95d9b8211",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1017",
                "username": "waqas_chargeback",
                "fullName": "Waqas Butt (Chargeback Abuse)",
                "email": "waqas.fraud@dispute.org",
                "phone": "0324-9900112",
                "balanceUSD": 0.0,
                "balancePKR": 0,
                "vipTier": "Bronze VIP",
                "status": "suspended",
                "outcomeBias": "force_loss",
                "customWinRate": 0,
                "createdAt": "2026-09-04 17:30",
                "totalWagered": 35000,
                "totalWon": 1200,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-81307",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1017",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-71307",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1017",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-51307",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1017",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-9307",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 50000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1017",
                                "amountUSD": 178.57
                        },
                        {
                                "id": "WTH-6307",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 20000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1017",
                                "amountUSD": 71.43
                        }
                ],
                "securityPinHash": "8c5dec1885b0925243ad0cc87658217c8667e94c4fe7b40c950adc9f8bfa3bc6",
                "salt": "4fa7c7ffb1e684f3",
                "passwordHash": "6c93f2d7f8f832bde36634f44909f54cffab0a1b7013329ed229b0bfa1608f74",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1018",
                "username": "hassan_crypto_whale",
                "fullName": "Hassan Ali",
                "email": "hassan.ali@blockchain.pk",
                "phone": "0305-4433221",
                "balanceUSD": 19500.0,
                "balancePKR": 5460000,
                "vipTier": "Platinum VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-05 21:00",
                "totalWagered": 480000,
                "totalWon": 465000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-16091",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1018",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-56091",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1018",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-26091",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1018",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7091",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 2184000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1018"
                        },
                        {
                                "id": "WTH-7091",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 546000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1018"
                        }
                ],
                "securityPinHash": "2b86a1d90d30223c862c68b0c0d0fabd985d7a415069fb4b469dd2ecc571183e",
                "salt": "e2d28f7cb9897762",
                "passwordHash": "df49b9aec7bc4ffd346cd1b73c11c78f7a13a8a4acbc5cf135f1997920773b71",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1019",
                "username": "ace_tennis_vip",
                "fullName": "Maria Sharapova",
                "email": "maria.s@slam-champs.com",
                "phone": "+7-916-555-0199",
                "balanceUSD": 6700.0,
                "balancePKR": 1876000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-18 14:10",
                "totalWagered": 172000,
                "totalWon": 164000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-86899",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1019",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-76899",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1019",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-16899",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1019",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-5899",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 750400,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1019"
                        },
                        {
                                "id": "WTH-3899",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 187600,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1019"
                        }
                ],
                "securityPinHash": "f203a6ee381dbe2d2e792c2c9712417c009ae69ba6927c3ede01fae0b746c71a",
                "salt": "3f97fb70779ac1c0",
                "passwordHash": "3cf7cc95f83ed2fb30a869d9a05288418ec81e7cd44cbe6acc467e68f9e4a3cc",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1020",
                "username": "tariq_keno_master",
                "fullName": "Tariq Jamil",
                "email": "tariq.j@investments.pk",
                "phone": "0313-8877665",
                "balanceUSD": 920.0,
                "balancePKR": 257600,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-02 16:40",
                "totalWagered": 45000,
                "totalWon": 41000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-38606",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1020",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-28606",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1020",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-28607",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1020",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-2606",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 103040,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1020"
                        },
                        {
                                "id": "WTH-3606",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 25760,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1020"
                        }
                ],
                "securityPinHash": "e8a37488c420ce31a71b5fe024069a5d9af32c9cd6bdefc1a41841268f91b641",
                "salt": "a6e042da8a95c4c5",
                "passwordHash": "48a4183543d08f62223222a7b9d8a825d9e8f4f79a93091d23138fe064e759a1",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1021",
                "username": "bhai_highstakes",
                "fullName": "Salman Khan",
                "email": "bhaijaan@bollywoodvip.com",
                "phone": "+91-99887-76655",
                "balanceUSD": 88000.0,
                "balancePKR": 24640000,
                "vipTier": "VIP Royale",
                "status": "active",
                "outcomeBias": "force_win",
                "customWinRate": 78,
                "createdAt": "2026-06-15 19:20",
                "totalWagered": 2100000,
                "totalWon": 2350000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-94684",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1021",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-74684",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1021",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-74685",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1021",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4684",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 9856000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1021"
                        },
                        {
                                "id": "WTH-1684",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 2464000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1021"
                        }
                ],
                "securityPinHash": "1b9170a417e7a1004eda3f92b286155d3e7e8011d924ad213b893b3382232d42",
                "salt": "c4eb15cd2f592677",
                "passwordHash": "eac54c97f01e1975ba47c7739d51d360ed5f949da1f100d83683a8e0894849d9",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1022",
                "username": "jeeto_pakistan_vip",
                "fullName": "Fahad Mustafa",
                "email": "fahad.m@mediahouse.pk",
                "phone": "0300-9911223",
                "balanceUSD": 32000.0,
                "balancePKR": 8960000,
                "vipTier": "Diamond VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-07-20 13:15",
                "totalWagered": 640000,
                "totalWon": 615000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-88431",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1022",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-78431",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1022",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-58431",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1022",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7431",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 3584000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1022"
                        },
                        {
                                "id": "WTH-5431",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 896000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1022"
                        }
                ],
                "securityPinHash": "7876c937c8a7c71ae7c8bc0d7f98b61a36383c5e90bd36e49ece70cb359f75a5",
                "salt": "bea5a30cb94eb86f",
                "passwordHash": "8b253b89c5cc6e23d0226bcee882c42363fe05287801d9bc0436af7df2763404",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1023",
                "username": "sixer_king_crash",
                "fullName": "Imran Nazir",
                "email": "imran.nazir@cricketlegend.pk",
                "phone": "0322-7711223",
                "balanceUSD": 5500.0,
                "balancePKR": 1540000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-22 17:35",
                "totalWagered": 138000,
                "totalWon": 131000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-36402",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1023",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-46402",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1023",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-66402",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1023",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-9402",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 616000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1023"
                        },
                        {
                                "id": "WTH-5402",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 154000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1023"
                        }
                ],
                "securityPinHash": "de9409d6bcbe1cac01b21cff9d2458decb4d628559ff514f204fc582e863c33d",
                "salt": "ea54a89d58851eca",
                "passwordHash": "c979a7bb55522e91484d9bb9c85d7e742ba417c6d532e49bffcaeb03a93c12ad",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1024",
                "username": "cover_drive_56",
                "fullName": "Babar Azam",
                "email": "babar.56@pcb-stars.pk",
                "phone": "0303-5656565",
                "balanceUSD": 14000.0,
                "balancePKR": 3920000,
                "vipTier": "Platinum VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-01 10:00",
                "totalWagered": 340000,
                "totalWon": 328000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-30390",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1024",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-30391",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1024",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-10390",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1024",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3390",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 1568000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1024"
                        },
                        {
                                "id": "WTH-5390",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 392000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1024"
                        }
                ],
                "securityPinHash": "ea4b5a01ebdadc62ea8bddb968ab4148ae180ce25ee7d758a6c31a46032a651c",
                "salt": "582aa1fee4068e84",
                "passwordHash": "3342d49f4f338017929743e70c395ea7c924e2afbd90a57b660f020eafd50ff1",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1025",
                "username": "eagle_strike_strike",
                "fullName": "Shaheen Afridi",
                "email": "shaheen.10@pcb-stars.pk",
                "phone": "0304-1010101",
                "balanceUSD": 7800.0,
                "balancePKR": 2184000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-12 12:45",
                "totalWagered": 182000,
                "totalWon": 175000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-97904",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1025",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-47904",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1025",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-47905",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1025",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7904",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 873600,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1025"
                        },
                        {
                                "id": "WTH-6904",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 218400,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1025"
                        }
                ],
                "securityPinHash": "e2ecc6d6396b9c76f7759698d826a745344c22a5cfc75d0623312489592c04cd",
                "salt": "5442adf9ee512b01",
                "passwordHash": "3d67b3e82be909a5598712129f9fe403847170792f807a28cb74e3738ccb826b",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1026",
                "username": "spin_king_roulette",
                "fullName": "Shadab Khan",
                "email": "shadab.7@pcb-stars.pk",
                "phone": "0316-7777777",
                "balanceUSD": 1600.0,
                "balancePKR": 448000,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-04 18:10",
                "totalWagered": 52000,
                "totalWon": 48000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-57693",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1026",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-37693",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1026",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-77693",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1026",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-3693",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 179200,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1026"
                        },
                        {
                                "id": "WTH-4693",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 44800,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1026"
                        }
                ],
                "securityPinHash": "cf8c5902a3e2130f7a4cde0de2b04f6ec7eb214383b246ecfd0355d9b5e76a42",
                "salt": "7fd1c0043f8e6c77",
                "passwordHash": "808d948376b09f055cecc55708069c983562ddd65d8811f481280325c6129fdf",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1027",
                "username": "turbo_speed_limbo",
                "fullName": "Naseem Shah",
                "email": "naseem.71@pcb-stars.pk",
                "phone": "0335-7171717",
                "balanceUSD": 2100.0,
                "balancePKR": 588000,
                "vipTier": "Silver VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-01 15:30",
                "totalWagered": 64000,
                "totalWon": 59000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-22686",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1027",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-42686",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1027",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-52686",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1027",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4686",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 235200,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1027"
                        },
                        {
                                "id": "WTH-1686",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 58800,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1027"
                        }
                ],
                "securityPinHash": "620fe47b5403c1a197b00ed4f03d5ffec50bf67f76b8d851d732b3adfd84d8a9",
                "salt": "5e2e107d19913b79",
                "passwordHash": "a7ab330a83c3fa977c632253c36526ddcb7bdf71a9c3d308fdffbdc5746090ab",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1028",
                "username": "150kph_blitz",
                "fullName": "Haris Rauf",
                "email": "haris.150@speedster.pk",
                "phone": "0346-1501501",
                "balanceUSD": 480.0,
                "balancePKR": 134400,
                "vipTier": "Bronze VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-09-08 20:00",
                "totalWagered": 22000,
                "totalWon": 19500,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-83329",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1028",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-63329",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1028",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-33329",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1028",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-2329",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 53760,
                                "status": "Approved",
                                "date": "2026-09-08 21:00",
                                "userId": "USR-1028"
                        },
                        {
                                "id": "WTH-6329",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 13440,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1028"
                        }
                ],
                "securityPinHash": "d8ec6ac79735afc7627f2980ebec8514cd99f87f805ed7e9269afb58574d0160",
                "salt": "400def8a00225fea",
                "passwordHash": "c449892e2f02abc6b7ebeea59fb18a261331c7db5711d101248ee7b108c5ee76",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1029",
                "username": "superman_wk_poker",
                "fullName": "Rizwan Ahmed",
                "email": "rizwan.wk@pcb-stars.pk",
                "phone": "0306-1616161",
                "balanceUSD": 6300.0,
                "balancePKR": 1764000,
                "vipTier": "Gold VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-16 11:15",
                "totalWagered": 156000,
                "totalWon": 149000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-76703",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1029",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-66703",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1029",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-56703",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1029",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4703",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 705600,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1029"
                        },
                        {
                                "id": "WTH-1703",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 176400,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1029"
                        }
                ],
                "securityPinHash": "d5ec1403574c4e901f4ad5589bdc149af84dfa283ece05d2296e43745677e115",
                "salt": "32989cd4f9e37c1b",
                "passwordHash": "364888957107dd83fb5cb4ffc39f669b94b2fe04111bdd063e5860714ca8e50e",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1030",
                "username": "double_ton_whale",
                "fullName": "Fakhar Zaman",
                "email": "fakhar.39@navy-pride.pk",
                "phone": "0320-3939393",
                "balanceUSD": 41000.0,
                "balancePKR": 11480000,
                "vipTier": "Diamond VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-07-28 14:00",
                "totalWagered": 820000,
                "totalWon": 790000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-52213",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1030",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-52214",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1030",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-32213",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1030",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-7213",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 4592000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1030"
                        },
                        {
                                "id": "WTH-3213",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 1148000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1030"
                        }
                ],
                "securityPinHash": "be2a4c8907eb180dab9eed4995b1a0356b565a13a64e623b0c45721c6813985f",
                "salt": "0061835d09beea29",
                "passwordHash": "e86db3c2c13c3f3f7923034a4ceb0dda9c857735646c4e98322452482f9035a3",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1031",
                "username": "chacha_powerhitter",
                "fullName": "Iftikhar Ahmed",
                "email": "iftikhar.chacha@sixers.pk",
                "phone": "0347-6666666",
                "balanceUSD": 11500.0,
                "balancePKR": 3220000,
                "vipTier": "Platinum VIP",
                "status": "active",
                "outcomeBias": "fair",
                "customWinRate": 48,
                "createdAt": "2026-08-08 19:10",
                "totalWagered": 290000,
                "totalWon": 278000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-13384",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1031",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-23384",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1031",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-13385",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1031",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-4384",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 1288000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1031"
                        },
                        {
                                "id": "WTH-6384",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 322000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1031"
                        }
                ],
                "securityPinHash": "371c0ab9bc6b3d416aacb081f4583411fcb75183561e940e46f6982d479844c1",
                "salt": "862f3edd06a611bc",
                "passwordHash": "8d09ef3c3d67ad4258cc52bc0449900f79cce7b6d8a7499b2638fa9c8b41ded1",
                "defaultPassword": "Player@2026!"
        },
        {
                "id": "USR-1032",
                "username": "outlaw_blackjack",
                "fullName": "Arthur Morgan",
                "email": "arthur.m@van-der-linde.us",
                "phone": "+1-555-189-9900",
                "balanceUSD": 95000.0,
                "balancePKR": 26600000,
                "vipTier": "VIP Royale",
                "status": "active",
                "outcomeBias": "force_win",
                "customWinRate": 82,
                "createdAt": "2026-06-10 16:45",
                "totalWagered": 2400000,
                "totalWon": 2650000,
                "currency": "USD",
                "betHistory": [
                        {
                                "id": "BET-80264",
                                "game": "Crash",
                                "bet": 25,
                                "payout": 55,
                                "multiplier": 2.2,
                                "status": "WIN",
                                "profit": 30,
                                "time": "18:24:10",
                                "userId": "USR-1032",
                                "multiplierFormatted": "2.20x"
                        },
                        {
                                "id": "BET-50264",
                                "game": "Roulette",
                                "bet": 50,
                                "payout": 0,
                                "multiplier": 0.0,
                                "status": "LOSS",
                                "profit": -50,
                                "time": "18:20:05",
                                "userId": "USR-1032",
                                "multiplierFormatted": "0.00x"
                        },
                        {
                                "id": "BET-40264",
                                "game": "Blackjack",
                                "bet": 100,
                                "payout": 250,
                                "multiplier": 2.5,
                                "status": "WIN",
                                "profit": 150,
                                "time": "18:15:30",
                                "userId": "USR-1032",
                                "multiplierFormatted": "2.50x"
                        }
                ],
                "transactions": [
                        {
                                "id": "DEP-8264",
                                "type": "deposit",
                                "method": "EasyPaisa",
                                "amountPKR": 10640000,
                                "status": "Approved",
                                "date": "2026-09-08 12:30",
                                "userId": "USR-1032"
                        },
                        {
                                "id": "WTH-1264",
                                "type": "withdraw",
                                "method": "JazzCash",
                                "amountPKR": 2660000,
                                "status": "Approved",
                                "date": "2026-09-10 09:15",
                                "userId": "USR-1032"
                        }
                ],
                "securityPinHash": "b06c87a8c425d3decb42a4001e9a9b81a92031e0d304c643c84f27831360c41e",
                "salt": "fcc97b2a5408ff5c",
                "passwordHash": "b5196eaaed20c92586861790113c573d18f79e42dd5c8e7eaf84bb9e74d99236",
                "defaultPassword": "Player@2026!"
        }
    ];
}

    loadUsers() {
        try {
            localStorage.removeItem('bwn_users_v2');
        } catch (e) {}

        const defaults = (this.getDefaultUsers() || []).map(u => ({
            ...u,
            balanceUSD: 0.00,
            balancePKR: 0.00
        }));

        this.fetchServerUsers();
        return defaults;
    }

    async fetchServerUsers() {
        try {
            const isSubDir = window.location.pathname.includes('/admin/') || window.location.pathname.includes('/games/');
            const apiUrl = (isSubDir ? '../' : '') + 'api/admin.php?action=users&limit=500&admin_pin=9824';
            const res = await fetch(apiUrl, {
                headers: { 'X-Admin-Pin': '9824' },
                credentials: 'include'
            });
            if (res.ok) {
                const json = await res.json();
                if (json && json.success && json.data && Array.isArray(json.data.users)) {
                    this.users = json.data.users.map(u => ({
                        id: String(u.id || ''),
                        username: String(u.username || ''),
                        fullName: String(u.full_name || u.fullName || u.username || ''),
                        email: String(u.email || ''),
                        phone: String(u.phone || ''),
                        balanceUSD: parseFloat(u.balance_usd || 0),
                        balancePKR: parseFloat(u.balance_pkr || 0),
                        vipTier: String(u.vip_tier || 'Bronze VIP'),
                        status: String(u.status || 'active'),
                        outcomeBias: String(u.outcome_bias || 'fair'),
                        customWinRate: parseInt(u.custom_win_rate || 48, 10),
                        totalWagered: parseFloat(u.total_wagered || 0),
                        totalWon: parseFloat(u.total_won || 0),
                        currency: String(u.currency || 'PKR'),
                        createdAt: String(u.created_at || ''),
                        betHistory: [],
                        transactions: []
                    }));
                }
            }
        } catch (e) {}
    }

    saveUsers(usersList = null) {
        if (usersList) this.users = usersList;
    }

    ensureActiveUser() {
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                const uname = String((u && u.username) || '');
                if (u && (u.role === 'guest' || uname.startsWith('Guest_') || uname.startsWith('AppPlayer_') || uname.startsWith('VIP_'))) {
                    localStorage.removeItem('bwn_session_user');
                    localStorage.removeItem(this.ACTIVE_USER_KEY);
                    this._currentUser = null;
                    if (window.wallet) {
                        window.wallet.state.balancePKR = 0.00;
                        window.wallet.state.balanceUSD = 0.00;
                        window.wallet.saveState();
                    }
                    return;
                }
                if (u && u.id) {
                    this._currentUser = u;
                    localStorage.setItem(this.ACTIVE_USER_KEY, u.id);
                    if (window.wallet) {
                        if (!sessionStorage.getItem('bwn_game_active')) {
                            window.wallet.syncWithUser(u);
                        } else {
                            // Live wallet is authoritative during gameplay: update user object with live balance
                            u.balance_pkr = window.wallet.state.balancePKR;
                            u.balance_usd = window.wallet.state.balanceUSD;
                            u.balancePKR = window.wallet.state.balancePKR;
                            u.balanceUSD = window.wallet.state.balanceUSD;
                            try { localStorage.setItem('bwn_session_user', JSON.stringify(u)); } catch(e) {}
                        }
                    }
                    return;
                }
            } else if (window.wallet) {
                window.wallet.state.balancePKR = 0.00;
                window.wallet.state.balanceUSD = 0.00;
                window.wallet.saveState();
            }
        } catch (e) {}
    }

    syncWithWallet(user) {
        if (!user || !window.wallet) return;
        window.wallet.syncWithUser(user);
    }

    getAllUsers() {
        return this.users;
    }

    getUserById(id) {
        return this.users.find(u => u.id === id) || null;
    }

    get currentUser() {
        if (this._currentUser) {
            const uname = String(this._currentUser.username || '');
            if (this._currentUser.role === 'guest' || uname.startsWith('Guest_') || uname.startsWith('AppPlayer_') || uname.startsWith('VIP_') || uname.startsWith('demo_auto')) {
                this._currentUser = null;
                return null;
            }
            return this._currentUser;
        }
        try {
            const sess = localStorage.getItem('bwn_session_user');
            if (sess) {
                const u = JSON.parse(sess);
                const uname = String((u && u.username) || '');
                if (u && (u.role === 'guest' || uname.startsWith('Guest_') || uname.startsWith('AppPlayer_') || uname.startsWith('VIP_') || uname.startsWith('demo_auto'))) {
                    localStorage.removeItem('bwn_session_user');
                    return null;
                }
                this._currentUser = u;
                return this._currentUser;
            }
        } catch(e) {}
        return null;
    }

    set currentUser(user) {
        this._currentUser = user;
        if (user) {
            try { localStorage.setItem('bwn_session_user', JSON.stringify(user)); } catch(e) {}
        } else {
            localStorage.removeItem('bwn_session_user');
        }
    }

    login(username, password) {
        const u = this.users.find(x => 
            (x.username && x.username.toLowerCase() === username.toLowerCase()) || 
            (x.email && x.email.toLowerCase() === username.toLowerCase())
        );
        if (u) {
            this.currentUser = u;
            this.setActiveUser(u.id);
            return { success: true, message: 'Login successful.', data: u };
        }
        return { success: false, message: 'Invalid username or password.' };
    }

    register(userData) {
        const newUser = this.addUser(userData);
        this.currentUser = newUser;
        this.setActiveUser(newUser.id);
        return { success: true, message: 'VIP account created successfully.', data: newUser };
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('bwn_session_user');
        if (window.APIBridge) window.APIBridge.activeUser = null;
        return { success: true, message: 'Logged out successfully.' };
    }

    getActiveUser() {
        const activeId = localStorage.getItem(this.ACTIVE_USER_KEY);
        return this.getUserById(activeId) || this.users[0];
    }

    setActiveUser(id) {
        const user = this.getUserById(id);
        if (!user) return false;
        localStorage.setItem(this.ACTIVE_USER_KEY, id);
        this.syncWithWallet(user);
        return true;
    }

    addUser(userData) {
        const newId = 'USR-' + Math.floor(1000 + Math.random() * 9000);
        const newUser = {
            id: newId,
            username: userData.username || ('user_' + newId.toLowerCase()),
            fullName: userData.fullName || 'New Player',
            email: userData.email || (userData.username + '@player.com'),
            phone: userData.phone || '0300-0000000',
            balancePKR: parseFloat(userData.balancePKR || 0),
            balanceUSD: parseFloat(userData.balanceUSD || 0),
            currency: userData.currency || 'PKR',
            vipTier: userData.vipTier || 'Bronze VIP',
            status: userData.status || 'active',
            outcomeBias: userData.outcomeBias || 'fair',
            customWinRate: parseInt(userData.customWinRate, 10) || 48,
            createdAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}),
            totalWagered: 0,
            totalWon: 0,
            betHistory: [],
            transactions: []
        };

        this.users.unshift(newUser);
        this.saveUsers();
        return newUser;
    }

    updateUser(id, updatedFields) {
        const idx = this.users.findIndex(u => u.id === id);
        if (idx === -1) return false;

        this.users[idx] = { ...this.users[idx], ...updatedFields };
        this.saveUsers();

        // If active user was updated, sync balance
        if (id === localStorage.getItem(this.ACTIVE_USER_KEY)) {
            this.syncWithWallet(this.users[idx]);
        }
        return true;
    }

    deleteUser(id) {
        if (this.users.length <= 1) {
            alert('Cannot delete the last remaining user in the system!');
            return false;
        }
        this.users = this.users.filter(u => u.id !== id);
        this.saveUsers();
        this.ensureActiveUser();
        return true;
    }

    toggleSuspend(id) {
        const user = this.getUserById(id);
        if (!user) return false;
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        return this.updateUser(id, { status: newStatus });
    }

    // Records a completed bet in the user's ledger
    recordBet(arg1, arg2) {
        let user = null;
        let record = null;
        if (typeof arg1 === 'string' && arg2) {
            user = this.getUserById(arg1);
            record = arg2;
        } else {
            user = this.getActiveUser();
            record = arg1;
        }
        if (!user || !record) return;

        if (!record.id) record.id = 'BET-' + Math.floor(10000 + Math.random() * 90000);
        if (!record.timestamp) record.timestamp = new Date().toISOString();

        if (!user.betHistory) user.betHistory = [];
        user.betHistory.unshift(record);
        if (user.betHistory.length > 100) user.betHistory.pop();

        const betAmt = parseFloat(record.bet || record.stake) || 0;
        const winAmt = parseFloat(record.payout) || 0;

        user.totalWagered = (user.totalWagered || 0) + betAmt;
        user.totalWon = (user.totalWon || 0) + winAmt;
        if (user.id === localStorage.getItem(this.ACTIVE_USER_KEY) && window.wallet) {
            user.balancePKR = window.wallet.state.balancePKR;
        }

        this.saveUsers();
    }

    // Outcome Rigging & Loss Average Engine
    // Determines if the current user should win or lose based on their individual profile
    shouldUserWin(gameId, optionalUserId = null, betAmount = 0) {
        const user = optionalUserId ? this.getUserById(optionalUserId) : this.getActiveUser();
        if (!user) return Math.random() < 0.48;

        // Account Suspension Check
        if (user.status === 'suspended') {
            return false;
        }

        // Individual User Rigging Profile
        const bias = user.outcomeBias || user.outcome_bias;
        if (bias === 'force_loss') {
            if (typeof window.checkLossRigOutcome === 'function') {
                const rigRes = window.checkLossRigOutcome(betAmount, user);
                if (rigRes !== null) return rigRes;
            }
            return false; // Guaranteed House Win / Loss for this user
        }
        if (bias === 'force_win') {
            return true; // Guaranteed Player Win
        }
        if (bias === 'custom') {
            const rate = user.customWinRate !== undefined ? user.customWinRate : (user.custom_win_rate !== undefined ? user.custom_win_rate : 48);
            return (Math.random() * 100) < rate;
        }

        // If User is 'fair', check global Admin Config
        if (window.adminConfig) {
            return window.adminConfig.shouldWin(gameId, betAmount);
        }

        return Math.random() < 0.48;
    }

    // Convenience Aliases & Helpers
    getUsers() {
        return this.getAllUsers();
    }

    getUser(id) {
        return this.getUserById(id);
    }

    toggleSuspendUser(id) {
        const user = this.getUserById(id);
        if (!user) return { status: 'active' };
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        this.updateUser(id, { status: newStatus });
        return this.getUserById(id);
    }

    updateBalance(id, delta) {
        const user = this.getUserById(id);
        if (!user) return 0;
        const newBal = Math.max(0, (user.balancePKR || 0) + Number(delta));
        this.updateUser(id, { balancePKR: newBal });
        return newBal;
    }
}

window.userManager = new UserManager();
