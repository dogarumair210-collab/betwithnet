// ============================================================
// Bet With Net - Payment Gateway & Multi-Currency Engine
// Full Add, Edit, Delete, Toggle for Deposit & Withdraw Gateways
// Includes Multi-Currency Exchange Conversion Rates into USD
// ============================================================

class PaymentManager {
    constructor() {
        this.STORAGE_KEY = 'bwn_payment_methods_v1';
        this.data = this.load();
    }

    getDefaults() {
        return {
            depositMethods: [
                {
                    id: 'dep-jazzcash',
                    name: 'JazzCash Wallet',
                    type: 'Mobile Wallet',
                    currency: 'PKR',
                    exchangeRateToUSD: 280,
                    icon: '⚡',
                    accountTitle: 'Muhammad Ijaz',
                    accountNumber: '03246533046',
                    minDeposit: 500,
                    maxDeposit: 100000,
                    processingTime: 'Instant (0-60s)',
                    instructions: 'Transfer via JazzCash to 03246533046 (Muhammad Ijaz). Upload the transaction screenshot below for immediate verification.',
                    status: 'active'
                },
                {
                    id: 'dep-nayapay',
                    name: 'NayaPay Wallet',
                    type: 'Mobile Wallet',
                    currency: 'PKR',
                    exchangeRateToUSD: 280,
                    icon: '💳',
                    accountTitle: 'Muhammad Ijaz',
                    accountNumber: '03246533046',
                    minDeposit: 500,
                    maxDeposit: 100000,
                    processingTime: 'Instant (0-60s)',
                    instructions: 'Transfer funds via NayaPay to 03246533046 (Muhammad Ijaz). Upload transaction screenshot below for immediate verification.',
                    status: 'active'
                },
                {
                    id: 'dep-binance',
                    name: 'Binance Pay ID (Zero Fee)',
                    type: 'Cryptocurrency',
                    currency: 'USD',
                    exchangeRateToUSD: 1.0,
                    icon: '🟡',
                    accountTitle: 'BetWithNet VIP PayID',
                    accountNumber: '987654321',
                    minDeposit: 10,
                    maxDeposit: 25000,
                    processingTime: 'Instant (30s)',
                    instructions: 'Use Binance App -> Pay -> Send to Pay ID 987654321.',
                    status: 'active'
                }
            ],
            withdrawMethods: [
                {
                    id: 'wth-easypaisa',
                    name: 'EasyPaisa Cashout',
                    type: 'Mobile Wallet',
                    currency: 'PKR',
                    exchangeRateToUSD: 280,
                    icon: '📱',
                    minWithdraw: 5.0, // Min $5 USD
                    maxWithdraw: 500.0,
                    feePercent: 0,
                    processingTime: '5 - 30 Minutes',
                    fields: ['Account Title', 'EasyPaisa Mobile Number (03XX-XXXXXXX)'],
                    status: 'active'
                },
                {
                    id: 'wth-jazzcash',
                    name: 'JazzCash Cashout',
                    type: 'Mobile Wallet',
                    currency: 'PKR',
                    exchangeRateToUSD: 280,
                    icon: '⚡',
                    minWithdraw: 5.0,
                    maxWithdraw: 500.0,
                    feePercent: 0,
                    processingTime: '5 - 30 Minutes',
                    fields: ['Account Title', 'JazzCash Mobile Number (03XX-XXXXXXX)'],
                    status: 'active'
                },
                {
                    id: 'wth-bank-wire',
                    name: 'Pakistani Bank IBFT / Raast',
                    type: 'Bank Transfer',
                    currency: 'PKR',
                    exchangeRateToUSD: 280,
                    icon: '🏦',
                    minWithdraw: 10.0,
                    maxWithdraw: 2000.0,
                    feePercent: 0,
                    processingTime: '15 - 60 Minutes',
                    fields: ['Bank Name', 'Account Title', 'Account Number / 24-digit IBAN'],
                    status: 'active'
                },
                {
                    id: 'wth-usdt',
                    name: 'USDT (TRC-20 Crypto Cashout)',
                    type: 'Cryptocurrency',
                    currency: 'USDT',
                    exchangeRateToUSD: 1.0,
                    icon: '🪙',
                    minWithdraw: 20.0,
                    maxWithdraw: 10000.0,
                    feePercent: 1.5,
                    processingTime: 'Instant (5-15 Minutes)',
                    fields: ['TRC-20 Wallet Address (Starts with T)'],
                    status: 'active'
                }
            ]
        };
    }

    load() {
        const defaults = this.getDefaults();
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.depositMethods) && Array.isArray(parsed.withdrawMethods)) {
                    // Filter out EasyPaisa completely
                    parsed.depositMethods = parsed.depositMethods.filter(m => m.id !== 'dep-easypaisa' && !(m.name && m.name.toLowerCase().includes('easypaisa')));

                    let jc = parsed.depositMethods.find(m => m.id === 'dep-jazzcash');
                    if (!jc) {
                        parsed.depositMethods.unshift({ ...defaults.depositMethods[0] });
                    } else {
                        jc.id = 'dep-jazzcash';
                        jc.name = 'JazzCash Wallet';
                        jc.accountNumber = '03246533046';
                        jc.accountTitle = 'Muhammad Ijaz';
                        jc.status = 'active';
                    }

                    let np = parsed.depositMethods.find(m => m.id === 'dep-nayapay');
                    if (!np) {
                        parsed.depositMethods.push({ ...defaults.depositMethods[1] });
                    }

                    let bp = parsed.depositMethods.find(m => m.id === 'dep-binance');
                    if (!bp) {
                        parsed.depositMethods.push({ ...defaults.depositMethods[2] });
                    }

                    // Order: JazzCash, NayaPay, Binance
                    const jcItem = parsed.depositMethods.find(m => m.id === 'dep-jazzcash');
                    const npItem = parsed.depositMethods.find(m => m.id === 'dep-nayapay');
                    const bpItem = parsed.depositMethods.find(m => m.id === 'dep-binance');
                    parsed.depositMethods = [jcItem, npItem, bpItem].filter(Boolean);

                    this.save(parsed);
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('Failed to load payment methods, resetting defaults');
        }
        this.save(defaults);
        return defaults;
    }

    save(data = null) {
        if (data) this.data = data;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
            window.dispatchEvent(new Event('bwn_payments_updated'));
        } catch (e) {
            console.error('Failed to save payment methods:', e);
        }
    }

    // --- DEPOSIT METHODS CRUD ---
    getDepositMethods(onlyActive = false) {
        const list = (this.data.depositMethods || []).map(m => {
            const isEpOrJc = (m.id === 'dep-easypaisa' || m.id === 'dep-jazzcash' || /easypaisa|jazzcash/i.test(m.name || ''));
            if (isEpOrJc) {
                m.accountTitle = 'Muhammad Ijaz';
                m.accountNumber = '03246533046';
            }
            return m;
        });
        return onlyActive ? list.filter(m => m.status === 'active') : list;
    }

    getDepositMethodById(id) {
        const m = (this.data.depositMethods || []).find(m => m.id === id) || null;
        if (m) {
            const isEpOrJc = (m.id === 'dep-easypaisa' || m.id === 'dep-jazzcash' || /easypaisa|jazzcash/i.test(m.name || ''));
            if (isEpOrJc) {
                m.accountTitle = 'Muhammad Ijaz';
                m.accountNumber = '03246533046';
            }
        }
        return m;
    }

    addDepositMethod(method) {
        const newId = 'dep-' + (method.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now());
        const newMethod = {
            id: newId,
            name: method.name || 'New Deposit Method',
            type: method.type || 'Mobile Wallet',
            currency: method.currency || 'PKR',
            exchangeRateToUSD: parseFloat(method.exchangeRateToUSD) || 280,
            icon: method.icon || '💳',
            accountTitle: method.accountTitle || '',
            accountNumber: method.accountNumber || '',
            minDeposit: parseFloat(method.minDeposit) || 500,
            maxDeposit: parseFloat(method.maxDeposit) || 100000,
            processingTime: method.processingTime || 'Instant',
            instructions: method.instructions || '',
            status: method.status || 'active'
        };
        this.data.depositMethods.push(newMethod);
        this.save();
        return newMethod;
    }

    updateDepositMethod(id, updates) {
        const idx = (this.data.depositMethods || []).findIndex(m => m.id === id);
        if (idx === -1) return false;
        this.data.depositMethods[idx] = { ...this.data.depositMethods[idx], ...updates };
        this.save();
        return this.data.depositMethods[idx];
    }

    deleteDepositMethod(id) {
        this.data.depositMethods = (this.data.depositMethods || []).filter(m => m.id !== id);
        this.save();
        return true;
    }

    toggleDepositStatus(id) {
        const m = this.getDepositMethodById(id);
        if (!m) return false;
        m.status = (m.status === 'active') ? 'inactive' : 'active';
        this.save();
        return m.status;
    }

    // --- WITHDRAW METHODS CRUD ---
    getWithdrawMethods(onlyActive = false) {
        const list = this.data.withdrawMethods || [];
        return onlyActive ? list.filter(m => m.status === 'active') : list;
    }

    getWithdrawMethodById(id) {
        return (this.data.withdrawMethods || []).find(m => m.id === id) || null;
    }

    addWithdrawMethod(method) {
        const newId = 'wth-' + (method.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now());
        const newMethod = {
            id: newId,
            name: method.name || 'New Withdrawal Method',
            type: method.type || 'Bank Transfer',
            currency: method.currency || 'PKR',
            exchangeRateToUSD: parseFloat(method.exchangeRateToUSD) || 280,
            icon: method.icon || '💸',
            minWithdraw: parseFloat(method.minWithdraw) || 5.0,
            maxWithdraw: parseFloat(method.maxWithdraw) || 500.0,
            feePercent: parseFloat(method.feePercent) || 0,
            processingTime: method.processingTime || '15 - 30 Minutes',
            fields: Array.isArray(method.fields) ? method.fields : ['Account Title', 'Account Number'],
            status: method.status || 'active'
        };
        this.data.withdrawMethods.push(newMethod);
        this.save();
        return newMethod;
    }

    updateWithdrawMethod(id, updates) {
        const idx = (this.data.withdrawMethods || []).findIndex(m => m.id === id);
        if (idx === -1) return false;
        this.data.withdrawMethods[idx] = { ...this.data.withdrawMethods[idx], ...updates };
        this.save();
        return this.data.withdrawMethods[idx];
    }

    deleteWithdrawMethod(id) {
        this.data.withdrawMethods = (this.data.withdrawMethods || []).filter(m => m.id !== id);
        this.save();
        return true;
    }

    toggleWithdrawStatus(id) {
        const m = this.getWithdrawMethodById(id);
        if (!m) return false;
        m.status = (m.status === 'active') ? 'inactive' : 'active';
        this.save();
        return m.status;
    }
}

window.paymentManager = new PaymentManager();
