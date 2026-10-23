// ============================================================================
// BET WITH NET - NEW GAME WALLET CONNECT (VANILLA JS COMPANION)
// Specifically for New Game HTML/Canvas pages.
// Leaves purani working 1xBet games completely untouched.
// BSC Chain (Chain ID: 56 / 0x38)
// ============================================================================

(function () {
    const BSC_CHAIN = {
        chainId: '0x38',
        chainName: 'Binance Smart Chain Mainnet',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com']
    };

    window.NewGameWallet = {
        account: null,
        balance: '0.0000',
        chainId: null,
        isConnected: false,

        async init(containerId = 'new-game-wallet-container') {
            this.container = document.getElementById(containerId);
            this.render();
            this.attachListeners();

            // Auto-reconnect if already approved
            if (window.ethereum && localStorage.getItem('bwn_new_game_wallet_connected') === 'true') {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    this.account = accounts[0];
                    this.isConnected = true;
                    await this.checkNetwork();
                    await this.fetchBalance();
                    this.render();
                }
            }
        },

        async connect() {
            if (!window.ethereum) {
                alert('MetaMask is not installed. Please install MetaMask to connect your wallet.');
                window.open('https://metamask.io/download/', '_blank');
                return;
            }

            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (accounts && accounts.length > 0) {
                    this.account = accounts[0];
                    this.isConnected = true;
                    localStorage.setItem('bwn_new_game_wallet_connected', 'true');
                    localStorage.setItem('bwn_new_game_wallet_address', this.account);

                    await this.checkNetwork();
                    await this.fetchBalance();
                    this.render();
                }
            } catch (err) {
                console.error('[NewGameWallet] Connect error:', err);
                alert(err.message || 'Failed to connect MetaMask');
            }
        },

        async checkNetwork() {
            if (!window.ethereum) return false;
            try {
                const cid = await window.ethereum.request({ method: 'eth_chainId' });
                this.chainId = cid;
                if (cid !== BSC_CHAIN.chainId) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{ chainId: BSC_CHAIN.chainId }]
                        });
                        this.chainId = BSC_CHAIN.chainId;
                    } catch (swErr) {
                        if (swErr.code === 4902) {
                            await window.ethereum.request({
                                method: 'wallet_addEthereumChain',
                                params: [BSC_CHAIN]
                            });
                            this.chainId = BSC_CHAIN.chainId;
                        }
                    }
                }
                return this.chainId === BSC_CHAIN.chainId;
            } catch (e) {
                console.warn('[NewGameWallet] Network switch error:', e);
                return false;
            }
        },

        async fetchBalance() {
            if (!window.ethereum || !this.account) return;
            try {
                const rawBal = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.account, 'latest']
                });
                const wei = BigInt(rawBal);
                this.balance = (Number(wei) / 1e18).toFixed(4);
            } catch (e) {
                console.error('[NewGameWallet] Balance fetch error:', e);
            }
        },

        disconnect() {
            this.account = null;
            this.balance = '0.0000';
            this.isConnected = false;
            localStorage.removeItem('bwn_new_game_wallet_connected');
            localStorage.removeItem('bwn_new_game_wallet_address');
            this.render();
        },

        attachListeners() {
            if (!window.ethereum) return;
            window.ethereum.on('accountsChanged', (accs) => {
                if (accs.length === 0) {
                    this.disconnect();
                } else {
                    this.account = accs[0];
                    this.fetchBalance().then(() => this.render());
                }
            });
            window.ethereum.on('chainChanged', () => {
                this.checkNetwork().then(() => this.fetchBalance().then(() => this.render()));
            });
        },

        render() {
            if (!this.container) return;

            if (!this.isConnected || !this.account) {
                this.container.innerHTML = `
                    <button id="btnNewGameConnectWallet" onclick="NewGameWallet.connect()" style="
                        display: inline-flex; align-items: center; gap: 8px;
                        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
                        color: #fff; font-weight: 800; font-size: 13px;
                        padding: 8px 16px; border: 1px solid #fbbf24; border-radius: 8px;
                        cursor: pointer; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
                    ">
                        <span>🦊</span>
                        <span>Connect Wallet</span>
                    </button>
                `;
            } else {
                const shortAddr = `${this.account.slice(0, 6)}...${this.account.slice(-4)}`;
                const isBsc = this.chainId === BSC_CHAIN.chainId;
                this.container.innerHTML = `
                    <div style="display: inline-flex; align-items: center; gap: 8px; background: rgba(10,15,25,0.95); border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; padding: 4px 10px; color: #fff; font-size: 12px;">
                        <span style="background: ${isBsc ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}; color: ${isBsc ? '#34d399' : '#f87171'}; border: 1px solid currentColor; border-radius: 4px; padding: 2px 6px; font-weight: 700; font-size: 10px;">
                            ${isBsc ? 'BSC 56' : 'Wrong Net'}
                        </span>
                        <span style="font-family: monospace; color: #ffd700; font-weight: 700;">${this.balance} BNB</span>
                        <span style="font-family: monospace; color: #cbd5e1;">${shortAddr}</span>
                        <button onclick="NewGameWallet.disconnect()" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; color: #cbd5e1; cursor: pointer; padding: 2px 6px; font-size: 10px;">
                            Disconnect
                        </button>
                    </div>
                `;
            }
        }
    };
})();
