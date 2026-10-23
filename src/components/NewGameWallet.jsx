import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// BET WITH NET - NEW GAME WALLET CONNECT COMPONENT
// Targeted specifically for the new game without modifying legacy 1xBet games.
// Network: Binance Smart Chain (BSC Mainnet) - Chain ID: 56 (0x38)
// ============================================================================

const BSC_CHAIN_CONFIG = {
    chainId: '0x38', // 56 in hex
    chainName: 'Binance Smart Chain Mainnet',
    nativeCurrency: {
        name: 'BNB',
        symbol: 'BNB',
        decimals: 18
    },
    rpcUrls: [
        'https://bsc-dataseed.binance.org/',
        'https://bsc-dataseed1.defibit.io/',
        'https://bsc-dataseed1.ninicoin.io/'
    ],
    blockExplorerUrls: ['https://bscscan.com']
};

export default function NewGameWallet({ onWalletConnected, onBalanceUpdate }) {
    const [account, setAccount] = useState('');
    const [balance, setBalance] = useState('0.0000');
    const [chainId, setChainId] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isWrongNetwork, setIsWrongNetwork] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Format address helper (e.g. 0x1234...5678)
    const formatAddress = (addr) => {
        if (!addr) return '';
        return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
    };

    // Fetch BNB balance for connected account
    const fetchBalance = useCallback(async (walletAddress) => {
        if (!window.ethereum || !walletAddress) return;
        try {
            const rawBalanceHex = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [walletAddress, 'latest']
            });
            const wei = BigInt(rawBalanceHex);
            // Convert Wei to BNB
            const bnb = (Number(wei) / 1e18).toFixed(4);
            setBalance(bnb);
            if (onBalanceUpdate) onBalanceUpdate(bnb);

            // Expose globally for new game engine
            if (window.newGameWallet) {
                window.newGameWallet.balance = bnb;
                window.newGameWallet.account = walletAddress;
            }
        } catch (err) {
            console.error('[NewGameWallet] Failed to fetch balance:', err);
        }
    }, [onBalanceUpdate]);

    // Ensure user is on BSC Chain ID 56
    const checkAndSwitchToBSC = useCallback(async () => {
        if (!window.ethereum) return false;
        try {
            const currentChain = await window.ethereum.request({ method: 'eth_chainId' });
            setChainId(currentChain);

            if (currentChain === BSC_CHAIN_CONFIG.chainId) {
                setIsWrongNetwork(false);
                return true;
            }

            // Prompt user to switch to BSC
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BSC_CHAIN_CONFIG.chainId }]
                });
                setIsWrongNetwork(false);
                return true;
            } catch (switchError) {
                // Error 4902: Chain not added yet to MetaMask
                if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [BSC_CHAIN_CONFIG]
                    });
                    setIsWrongNetwork(false);
                    return true;
                } else {
                    console.error('[NewGameWallet] Switch chain error:', switchError);
                    setIsWrongNetwork(true);
                    setErrorMessage('Please approve network switch to Binance Smart Chain (BSC).');
                    return false;
                }
            }
        } catch (err) {
            console.error('[NewGameWallet] Error checking network:', err);
            setIsWrongNetwork(true);
            return false;
        }
    }, []);

    // Main Connect Wallet handler
    const connectWallet = async () => {
        setErrorMessage('');

        if (typeof window.ethereum === 'undefined') {
            setErrorMessage('MetaMask is not installed. Please install MetaMask to connect your wallet.');
            window.open('https://metamask.io/download/', '_blank');
            return;
        }

        setIsConnecting(true);
        try {
            // 1. Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                throw new Error('No accounts selected');
            }

            const activeAccount = accounts[0];
            setAccount(activeAccount);

            // 2. Validate and enforce BSC network (Chain ID 56)
            const isBSC = await checkAndSwitchToBSC();

            // 3. Fetch balance
            await fetchBalance(activeAccount);

            // 4. Save to local state for new game
            localStorage.setItem('bwn_new_game_wallet_connected', 'true');
            localStorage.setItem('bwn_new_game_wallet_address', activeAccount);

            // Register global interface for new game
            window.newGameWallet = {
                account: activeAccount,
                chainId: isBSC ? '0x38' : null,
                balance: '0.0000',
                isConnected: true,
                refreshBalance: () => fetchBalance(activeAccount)
            };

            if (onWalletConnected) {
                onWalletConnected({
                    account: activeAccount,
                    chainId: BSC_CHAIN_CONFIG.chainId,
                    isBSC
                });
            }
        } catch (err) {
            console.error('[NewGameWallet] Connect error:', err);
            if (err.code === 4001) {
                setErrorMessage('Connection request rejected by user.');
            } else {
                setErrorMessage(err.message || 'Failed to connect MetaMask wallet.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    // Disconnect Wallet handler
    const disconnectWallet = () => {
        setAccount('');
        setBalance('0.0000');
        setIsWrongNetwork(false);
        setErrorMessage('');
        localStorage.removeItem('bwn_new_game_wallet_connected');
        localStorage.removeItem('bwn_new_game_wallet_address');
        if (window.newGameWallet) {
            window.newGameWallet.isConnected = false;
            window.newGameWallet.account = '';
        }
    };

    // Auto-reconnect if previously connected & listen for MetaMask events
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                disconnectWallet();
            } else {
                setAccount(accounts[0]);
                fetchBalance(accounts[0]);
            }
        };

        const handleChainChanged = (newChainId) => {
            setChainId(newChainId);
            if (newChainId !== BSC_CHAIN_CONFIG.chainId) {
                setIsWrongNetwork(true);
                setErrorMessage('Wrong Network! Please switch back to Binance Smart Chain (Chain ID 56).');
            } else {
                setIsWrongNetwork(false);
                setErrorMessage('');
                if (account) fetchBalance(account);
            }
        };

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        // Check if previously connected
        const wasConnected = localStorage.getItem('bwn_new_game_wallet_connected');
        if (wasConnected === 'true') {
            window.ethereum.request({ method: 'eth_accounts' })
                .then(accounts => {
                    if (accounts && accounts.length > 0) {
                        setAccount(accounts[0]);
                        checkAndSwitchToBSC();
                        fetchBalance(accounts[0]);
                    }
                })
                .catch(() => {});
        }

        return () => {
            if (window.ethereum?.removeListener) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
    }, [account, checkAndSwitchToBSC, fetchBalance]);

    return (
        <div style={styles.container}>
            {!account ? (
                /* Unconnected: Connect Wallet Button */
                <button
                    id="btnConnectNewGameWallet"
                    onClick={connectWallet}
                    disabled={isConnecting}
                    style={{
                        ...styles.connectBtn,
                        ...(isConnecting ? styles.btnDisabled : {})
                    }}
                >
                    <span style={styles.metamaskIcon}>🦊</span>
                    <span>{isConnecting ? 'Connecting BSC...' : 'Connect Wallet'}</span>
                </button>
            ) : (
                /* Connected State View */
                <div style={styles.connectedWrapper}>
                    {/* BSC Network Badge */}
                    <div style={isWrongNetwork ? styles.networkBadgeWrong : styles.networkBadgeBSC}>
                        <span style={styles.statusDot}></span>
                        <span>{isWrongNetwork ? 'Wrong Network' : 'BSC (Chain 56)'}</span>
                    </div>

                    {/* Balance Display */}
                    <div style={styles.balancePill}>
                        <span style={styles.balanceLabel}>BNB:</span>
                        <span style={styles.balanceValue}>{balance}</span>
                        <button
                            onClick={() => fetchBalance(account)}
                            title="Refresh BNB Balance"
                            style={styles.refreshBtn}
                        >
                            ↻
                        </button>
                    </div>

                    {/* Address Display */}
                    <div style={styles.addressPill} title={account}>
                        <span style={styles.addressText}>{formatAddress(account)}</span>
                    </div>

                    {/* Action: Switch to BSC if on wrong chain, or Disconnect */}
                    {isWrongNetwork ? (
                        <button
                            onClick={checkAndSwitchToBSC}
                            style={styles.switchChainBtn}
                        >
                            Switch to BSC
                        </button>
                    ) : (
                        <button
                            onClick={disconnectWallet}
                            title="Disconnect Wallet"
                            style={styles.disconnectBtn}
                        >
                            Disconnect
                        </button>
                    )}
                </div>
            )}

            {/* Error Notification */}
            {errorMessage && (
                <div style={styles.errorAlert}>
                    <span>{errorMessage}</span>
                    <button
                        onClick={() => setErrorMessage('')}
                        style={styles.errorCloseBtn}
                    >
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------------------
// Casino-Themed Dark & Gold Styles (Bet With Net Signature Aesthetic)
// ----------------------------------------------------------------------------
const styles = {
    container: {
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    connectBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        color: '#ffffff',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        fontWeight: '800',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
        transition: 'all 0.2s ease',
        userSelect: 'none'
    },
    btnDisabled: {
        opacity: 0.65,
        cursor: 'not-allowed'
    },
    metamaskIcon: {
        fontSize: '16px'
    },
    connectedWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(10, 15, 25, 0.95)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '12px',
        padding: '4px 8px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.6)'
    },
    networkBadgeBSC: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(16, 185, 129, 0.15)',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '6px',
        padding: '3px 8px',
        color: '#34d399',
        fontSize: '11px',
        fontWeight: '700'
    },
    networkBadgeWrong: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        background: 'rgba(239, 68, 68, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '6px',
        padding: '3px 8px',
        color: '#f87171',
        fontSize: '11px',
        fontWeight: '700'
    },
    statusDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'currentColor'
    },
    balancePill: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '6px',
        padding: '3px 8px',
        fontSize: '12px'
    },
    balanceLabel: {
        color: '#ffd700',
        fontWeight: '700'
    },
    balanceValue: {
        color: '#ffffff',
        fontWeight: '800',
        fontFamily: "'JetBrains Mono', monospace"
    },
    refreshBtn: {
        background: 'none',
        border: 'none',
        color: '#ffd700',
        cursor: 'pointer',
        fontSize: '12px',
        padding: '0 2px'
    },
    addressPill: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        padding: '3px 8px'
    },
    addressText: {
        color: '#cbd5e1',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: "'JetBrains Mono', monospace"
    },
    switchChainBtn: {
        background: '#dc2626',
        color: '#ffffff',
        border: 'none',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: '700',
        cursor: 'pointer'
    },
    disconnectBtn: {
        background: 'rgba(255, 255, 255, 0.08)',
        color: '#94a3b8',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '6px',
        padding: '4px 8px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: 'pointer'
    },
    errorAlert: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'rgba(220, 38, 38, 0.15)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        borderRadius: '6px',
        padding: '4px 10px',
        color: '#fca5a5',
        fontSize: '11px',
        maxWidth: '100%'
    },
    errorCloseBtn: {
        background: 'none',
        border: 'none',
        color: '#fca5a5',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        padding: '0 2px'
    }
};
