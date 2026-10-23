// ============================================================
// Bet With Net - High-Frequency P2P Trading Engine
// Binance P2P-Inspired Decentralized Cash Desk & Escrow Desk
// Supports EasyPaisa, JazzCash, Meezan Bank, Raast, SadaPay
// ============================================================

class P2PManager {
    constructor() {
        this.STORAGE_KEY = 'bwn_p2p_state_v1';
        this.listeners = {};
        this.state = this.loadState();
    }

    getDefaultState() {
        return {
            commissionRate: 2.0, // 2.0% merchant commission by default
            merchants: [
                {
                    id: 'M-101',
                    name: 'Khan_Exchange_VIP',
                    avatar: '👑',
                    badge: '🏆 Super Merchant',
                    trades: 2410,
                    completion: 99.8,
                    avgReleaseMin: 2,
                    buyPrice: 280.50,
                    sellPrice: 278.50,
                    minLimitPKR: 2000,
                    maxLimitPKR: 150000,
                    channels: ['EasyPaisa', 'JazzCash', 'Raast'],
                    accounts: {
                        'EasyPaisa': { title: 'Tariq Khan', number: '0300-8844112' },
                        'JazzCash': { title: 'Tariq Khan', number: '0300-8844112' },
                        'Raast': { title: 'Khan Traders Raast', number: '03008844112' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-102',
                    name: 'Lahore_Crypto_Desk',
                    avatar: '⚡',
                    badge: '⚡ Instant Release',
                    trades: 1890,
                    completion: 99.4,
                    avgReleaseMin: 1,
                    buyPrice: 280.75,
                    sellPrice: 278.20,
                    minLimitPKR: 5000,
                    maxLimitPKR: 250000,
                    channels: ['Meezan Bank', 'Raast'],
                    accounts: {
                        'Meezan Bank': { title: 'Usman Rafiq', number: 'PK14MEZN009921789' },
                        'Raast': { title: 'Usman Rafiq Raast', number: '03149988771' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-103',
                    name: 'FastPay_Karachi',
                    avatar: '🛡️',
                    badge: '🛡️ Escrow Verified',
                    trades: 3120,
                    completion: 100.0,
                    avgReleaseMin: 3,
                    buyPrice: 280.20,
                    sellPrice: 278.80,
                    minLimitPKR: 1000,
                    maxLimitPKR: 80000,
                    channels: ['EasyPaisa', 'JazzCash'],
                    accounts: {
                        'EasyPaisa': { title: 'Bilal Ahmed', number: '0321-4455667' },
                        'JazzCash': { title: 'Bilal Ahmed', number: '0321-4455667' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-104',
                    name: 'Islamabad_Bull_P2P',
                    avatar: '🥇',
                    badge: '🥇 Pro Trader',
                    trades: 940,
                    completion: 98.9,
                    avgReleaseMin: 4,
                    buyPrice: 281.00,
                    sellPrice: 277.90,
                    minLimitPKR: 10000,
                    maxLimitPKR: 500000,
                    channels: ['Meezan Bank', 'Bank Alfalah', 'Raast'],
                    accounts: {
                        'Meezan Bank': { title: 'Shahid Malik', number: 'PK02ALFH00112233' },
                        'Raast': { title: 'Shahid Malik Raast', number: '03335566778' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-105',
                    name: 'Pak_Express_Cash',
                    avatar: '🚀',
                    badge: '⚡ 2 Min Release',
                    trades: 1430,
                    completion: 99.2,
                    avgReleaseMin: 2,
                    buyPrice: 280.40,
                    sellPrice: 278.40,
                    minLimitPKR: 1500,
                    maxLimitPKR: 60000,
                    channels: ['EasyPaisa', 'SadaPay'],
                    accounts: {
                        'EasyPaisa': { title: 'Hamza Ali', number: '0305-1122334' },
                        'SadaPay': { title: 'Hamza Ali SadaPay', number: '0305-1122334' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-106',
                    name: 'Rawalpindi_Whale_Desk',
                    avatar: '💎',
                    badge: '💎 VIP Partner',
                    trades: 4520,
                    completion: 99.9,
                    avgReleaseMin: 2,
                    buyPrice: 280.80,
                    sellPrice: 278.10,
                    minLimitPKR: 25000,
                    maxLimitPKR: 1000000,
                    channels: ['Meezan Bank', 'JazzCash', 'Raast'],
                    accounts: {
                        'Meezan Bank': { title: 'Rawal Securities', number: 'PK99MEZN00445566' },
                        'JazzCash': { title: 'Rawal Desk', number: '0301-7788990' },
                        'Raast': { title: 'Rawal Raast ID', number: '03017788990' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-107',
                    name: 'Multan_Raast_Traders',
                    avatar: '⚡',
                    badge: '⚡ Instant Release',
                    trades: 780,
                    completion: 99.1,
                    avgReleaseMin: 3,
                    buyPrice: 280.30,
                    sellPrice: 278.60,
                    minLimitPKR: 2000,
                    maxLimitPKR: 100000,
                    channels: ['Raast', 'JazzCash'],
                    accounts: {
                        'JazzCash': { title: 'Farhan Akram', number: '0302-9988112' },
                        'Raast': { title: 'Farhan Akram Raast', number: '03029988112' }
                    },
                    status: 'online'
                },
                {
                    id: 'M-108',
                    name: 'Peshawar_Global_Liquidity',
                    avatar: '🛡️',
                    badge: '🛡️ Verified Escrow',
                    trades: 1650,
                    completion: 99.6,
                    avgReleaseMin: 2,
                    buyPrice: 280.60,
                    sellPrice: 278.30,
                    minLimitPKR: 3000,
                    maxLimitPKR: 200000,
                    channels: ['EasyPaisa', 'Meezan Bank'],
                    accounts: {
                        'EasyPaisa': { title: 'Javed Khan', number: '0313-7766554' },
                        'Meezan Bank': { title: 'Javed Khan', number: 'PK88MEZN00113355' }
                    },
                    status: 'online'
                }
            ],
            orders: [
                {
                    id: 'P2P-ORD-901',
                    type: 'BUY',
                    merchantId: 'M-101',
                    merchantName: 'Khan_Exchange_VIP',
                    amountUSD: 100.0,
                    amountPKR: 28050,
                    price: 280.50,
                    channel: 'EasyPaisa',
                    status: 'COMPLETED',
                    trxId: 'EP89218820',
                    commissionEarnedUSD: 2.0,
                    date: '2026-09-11 18:25'
                },
                {
                    id: 'P2P-ORD-902',
                    type: 'SELL',
                    merchantId: 'M-102',
                    merchantName: 'Lahore_Crypto_Desk',
                    amountUSD: 50.0,
                    amountPKR: 13910,
                    price: 278.20,
                    channel: 'Raast',
                    status: 'COMPLETED',
                    trxId: 'FT9921401',
                    commissionEarnedUSD: 1.0,
                    date: '2026-09-11 16:40'
                }
            ]
        };
    }

    loadState() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const def = this.getDefaultState();
                const state = { ...def, ...parsed };
                if (!state.merchants || state.merchants.length < 8) {
                    state.merchants = def.merchants;
                }
                if (!state.orders || state.orders.length === 0) {
                    state.orders = def.orders;
                }
                return state;
            }
        } catch (e) {
            console.warn('Failed to load P2P state:', e);
        }
        return this.getDefaultState();
    }

    saveState() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Failed to save P2P state:', e);
        }
        this.emit('change', this.state);
    }

    on(event, cb) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(cb);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    getMerchants(tab = 'BUY', channel = 'ALL') {
        return this.state.merchants.filter(m => {
            if (channel !== 'ALL') {
                return m.channels.some(c => c.toLowerCase().includes(channel.toLowerCase()));
            }
            return true;
        });
    }

    getMerchantById(id) {
        return this.state.merchants.find(m => m.id === id);
    }

    getCommissionRate() {
        const adminRate = localStorage.getItem('bwn_p2p_commission_rate');
        return adminRate ? parseFloat(adminRate) : (this.state.commissionRate || 2.0);
    }

    setCommissionRate(rate) {
        this.state.commissionRate = parseFloat(rate) || 2.0;
        localStorage.setItem('bwn_p2p_commission_rate', this.state.commissionRate.toString());
        this.saveState();
    }

    // Create Buy Order (User buys USD with local PKR)
    createBuyOrder(merchantId, pkrAmount, channel) {
        const merchant = this.getMerchantById(merchantId);
        if (!merchant) throw new Error('Merchant not found');

        const rate = merchant.buyPrice;
        const usdAmount = parseFloat((pkrAmount / rate).toFixed(2));
        const commissionRate = this.getCommissionRate();
        const commissionUSD = parseFloat((usdAmount * (commissionRate / 100)).toFixed(2));

        const order = {
            id: 'P2P-ORD-' + Math.floor(100000 + Math.random() * 900000),
            type: 'BUY',
            merchantId: merchant.id,
            merchantName: merchant.name,
            amountUSD: usdAmount,
            amountPKR: pkrAmount,
            price: rate,
            channel: channel,
            accountDetails: merchant.accounts[channel] || Object.values(merchant.accounts)[0],
            status: 'PENDING_PAYMENT',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            commissionEarnedUSD: commissionUSD
        };

        this.state.orders.unshift(order);
        this.saveState();
        return order;
    }

    // Confirm Payment Sent for Buy Order
    confirmBuyerPayment(orderId, senderName, trxId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order) return null;

        order.senderName = senderName;
        order.trxId = trxId;
        order.status = 'ESCROW_LOCKED';
        order.paidAt = new Date().toISOString();
        this.saveState();

        // Issue #75, #119: Sync payment confirmation with backend server (no client-side simulation)
        try {
            fetch('/api/p2p.php?action=confirm_payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ order_id: order.id, proof_trx: trxId })
            });
        } catch (e) {
            console.warn('[P2P Manager] Server sync notice:', e);
        }

        return order;
    }

    // Release Buy Escrow to User Balance
    releaseBuyEscrow(orderId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order || order.status === 'COMPLETED') return;

        order.status = 'COMPLETED';
        order.completedAt = new Date().toISOString();
        this.saveState();

        // Credit User Wallet
        if (window.wallet) {
            window.wallet.addBalanceUSD(order.amountUSD);

            // Record in wallet transactions ledger
            const txn = {
                id: 'DEP-' + order.id.replace('P2P-ORD-', 'P2P-'),
                type: 'deposit',
                method: `P2P Desk (${order.channel})`,
                currency: 'USD',
                amountOriginal: order.amountPKR,
                exchangeRate: order.price,
                amountUSD: order.amountUSD,
                amountPKR: order.amountPKR,
                sender: `${order.senderName || 'P2P Buyer'} • Merchant: ${order.merchantName}`,
                trxId: order.trxId,
                status: 'Approved',
                date: new Date().toLocaleString()
            };
            if (!window.wallet.state.transactions) window.wallet.state.transactions = [];
            window.wallet.state.transactions.unshift(txn);
            window.wallet.saveState();
        }

        this.emit('orderCompleted', order);
        if (window.core && window.core.showToast) {
            window.core.showToast(`🎉 P2P Escrow Released! $${order.amountUSD} USD credited to your casino balance.`, 'success');
        }
    }

    // Create Sell Order (User sells USD for local PKR)
    createSellOrder(merchantId, usdAmount, channel, userAccountTitle, userAccountNumber) {
        const merchant = this.getMerchantById(merchantId);
        if (!merchant) throw new Error('Merchant not found');

        // Check if user has sufficient USD balance
        if (window.wallet) {
            const currentUSD = window.wallet.state.balanceUSD || 0;
            if (currentUSD < usdAmount) {
                throw new Error('Insufficient wallet balance for this sell order');
            }
            // Lock USD balance in escrow
            window.wallet.addBalanceUSD(-usdAmount);
        }

        const rate = merchant.sellPrice;
        const pkrAmount = Math.round(usdAmount * rate);
        const commissionRate = this.getCommissionRate();
        const commissionUSD = parseFloat((usdAmount * (commissionRate / 100)).toFixed(2));

        const order = {
            id: 'P2P-ORD-' + Math.floor(100000 + Math.random() * 900000),
            type: 'SELL',
            merchantId: merchant.id,
            merchantName: merchant.name,
            amountUSD: usdAmount,
            amountPKR: pkrAmount,
            price: rate,
            channel: channel,
            userAccount: { title: userAccountTitle, number: userAccountNumber },
            status: 'WAITING_MERCHANT_TRANSFER',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            commissionEarnedUSD: commissionUSD
        };

        this.state.orders.unshift(order);
        this.saveState();

        // Issue #75, #119: Server-side P2P order creation
        try {
            fetch('/api/p2p.php?action=create_order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    merchant_id: merchantId,
                    type: 'SELL',
                    amount_usd: usdAmount,
                    channel: channel
                })
            });
        } catch (e) {
            console.warn('[P2P Manager] Server sync notice:', e);
        }

        return order;
    }

    notifyMerchantPaid(orderId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order) return;

        order.status = 'MERCHANT_SENT_PAYMENT';
        order.merchantTrx = 'TRX-' + Math.floor(10000000 + Math.random() * 90000000);
        this.saveState();
        this.emit('merchantPaid', order);

        if (window.core && window.core.showToast) {
            window.core.showToast(`🔔 Merchant @${order.merchantName} sent ₨ ${order.amountPKR.toLocaleString()} to your ${order.channel} account! Please verify and release escrow.`, 'info');
        }
    }

    // User confirms receipt and completes sell order
    confirmSellReceived(orderId) {
        const order = this.state.orders.find(o => o.id === orderId);
        if (!order) return null;

        order.status = 'COMPLETED';
        order.completedAt = new Date().toISOString();
        this.saveState();

        // Record in wallet transactions ledger
        if (window.wallet) {
            const txn = {
                id: 'WTH-' + order.id.replace('P2P-ORD-', 'P2P-'),
                type: 'withdraw',
                method: `P2P Desk (${order.channel})`,
                currency: 'USD',
                amountOriginal: order.amountPKR,
                exchangeRate: order.price,
                amountUSD: order.amountUSD,
                amountPKR: order.amountPKR,
                accountTitle: order.userAccount ? order.userAccount.title : 'User',
                accountNumber: order.userAccount ? order.userAccount.number : 'Local Desk',
                status: 'Approved',
                date: new Date().toLocaleString()
            };
            if (!window.wallet.state.transactions) window.wallet.state.transactions = [];
            window.wallet.state.transactions.unshift(txn);
            window.wallet.saveState();
        }

    }

    // Admin Merchant Management CRUD
    addMerchant(data) {
        const newMerchant = {
            id: 'M-' + (this.state.merchants.length + 101),
            name: data.name || 'New_Merchant_OTC',
            avatar: data.avatar || '🏪',
            badge: data.badge || 'Verified Desk',
            trades: parseInt(data.trades || 0, 10),
            completion: parseFloat(data.completion || 100.0),
            avgReleaseMin: parseInt(data.avgReleaseMin || 2, 10),
            buyPrice: parseFloat(data.buyPrice || 280.50),
            sellPrice: parseFloat(data.sellPrice || 278.50),
            minLimitPKR: parseInt(data.minLimitPKR || 2000, 10),
            maxLimitPKR: parseInt(data.maxLimitPKR || 100000, 10),
            channels: data.channels || ['EasyPaisa', 'JazzCash'],
            accounts: data.accounts || {
                'EasyPaisa': { title: data.accountTitle || data.name, number: data.accountNumber || '0300-0000000' }
            },
            status: data.status || 'online',
            createdAt: new Date().toISOString()
        };
        this.state.merchants.unshift(newMerchant);
        this.saveState();
        return newMerchant;
    }

    updateMerchant(id, data) {
        const idx = this.state.merchants.findIndex(m => m.id === id);
        if (idx === -1) return null;
        this.state.merchants[idx] = { ...this.state.merchants[idx], ...data };
        this.saveState();
        return this.state.merchants[idx];
    }

    deleteMerchant(id) {
        const idx = this.state.merchants.findIndex(m => m.id === id);
        if (idx === -1) return false;
        this.state.merchants.splice(idx, 1);
        this.saveState();
        return true;
    }

    toggleMerchantStatus(id) {
        const m = this.getMerchantById(id);
        if (!m) return null;
        m.status = m.status === 'online' ? 'offline' : 'online';
        this.saveState();
        return m.status;
    }

    // Admin Orders & Disputes Resolution
    getOrders(status = 'ALL') {
        if (status === 'ALL') return this.state.orders;
        return this.state.orders.filter(o => o.status === status);
    }

    getOrderById(id) {
        return this.state.orders.find(o => o.id === id);
    }

    adminForceComplete(orderId, note = '') {
        const order = this.getOrderById(orderId);
        if (!order) return { success: false, message: 'Order not found' };

        order.status = 'COMPLETED';
        order.adminNote = note;
        order.completedAt = new Date().toISOString();
        order.resolvedBy = 'ADMIN_SUPERVISOR';
        this.saveState();

        if (order.type === 'BUY' && window.wallet) {
            window.wallet.addBalanceUSD(order.amountUSD);
        }

        return { success: true, order };
    }

    adminForceCancel(orderId, note = '') {
        const order = this.getOrderById(orderId);
        if (!order) return { success: false, message: 'Order not found' };

        order.status = 'CANCELLED';
        order.adminNote = note;
        order.cancelledAt = new Date().toISOString();
        order.resolvedBy = 'ADMIN_SUPERVISOR';
        this.saveState();

        // Refund escrow to user if SELL order was cancelled
        if (order.type === 'SELL' && window.wallet) {
            window.wallet.addBalanceUSD(order.amountUSD);
        }

        return { success: true, order };
    }

    raiseDispute(orderId, reason, proof = '') {
        const order = this.getOrderById(orderId);
        if (!order) return { success: false, message: 'Order not found' };

        order.status = 'DISPUTED';
        order.dispute = {
            reason: reason,
            proof: proof,
            openedAt: new Date().toISOString(),
            status: 'UNDER_REVIEW'
        };
        this.saveState();
        return { success: true, order };
    }

    resolveDispute(orderId, decision, note = '') {
        const order = this.getOrderById(orderId);
        if (!order || !order.dispute) return { success: false, message: 'Dispute ticket not found' };

        order.dispute.status = 'RESOLVED';
        order.dispute.decision = decision; // 'RELEASE_TO_BUYER' or 'REFUND_TO_SELLER'
        order.dispute.adminNote = note;
        order.dispute.resolvedAt = new Date().toISOString();

        if (decision === 'RELEASE_TO_BUYER') {
            order.status = 'COMPLETED';
            if (window.wallet) {
                window.wallet.addBalanceUSD(order.amountUSD);
            }
        } else {
            order.status = 'CANCELLED';
            if (order.type === 'SELL' && window.wallet) {
                window.wallet.addBalanceUSD(order.amountUSD);
            }
        }

        this.saveState();
        return { success: true, decision, order };
    }

    getDisputes() {
        return this.state.orders.filter(o => o.status === 'DISPUTED' || (o.dispute && o.dispute.status === 'UNDER_REVIEW'));
    }
}

window.p2pManager = new P2PManager();

