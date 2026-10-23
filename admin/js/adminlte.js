// ============================================================
// Bet With Net - AdminLTE Framework Engine
// Manages Sidebar Fold/Unfold, State Persistence, and Breadcrumbs
// ============================================================

// ============================================================
// ADMIN AUTHENTICATION GATE (runs on every admin page)
// ============================================================
(function checkAdminAuth() {
    if (sessionStorage.getItem('bwn_admin_session') !== 'authenticated') {
        window.location.replace('login.html');
    }
})();

function adminLogout() {
    fetch('../api/admin.php?action=logout', {
        method: 'POST',
        credentials: 'include'
    }).finally(function() {
        sessionStorage.removeItem('bwn_admin_session');
        window.location.replace('login.html');
    });
}

function toggleSidebarFold() {
    if (window.innerWidth <= 992) {
        document.body.classList.toggle('sidebar-mobile-open');
    } else {
        document.body.classList.toggle('sidebar-folded');
        const isFolded = document.body.classList.contains('sidebar-folded');
        localStorage.setItem('bwn_admin_sidebar_folded', isFolded ? 'true' : 'false');
    }
}

// Auto-restore sidebar folded state on page load
(function initAdminLTEState() {
    if (localStorage.getItem('bwn_admin_sidebar_folded') === 'true') {
        document.body.classList.add('sidebar-folded');
    }
})();

// Inject logout button into navbar-right after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const navRight = document.querySelector('.navbar-right');
    if (navRight) {
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn-lte btn-lte-danger';
        logoutBtn.style.cssText = 'margin-left:8px; cursor:pointer; border:none;';
        logoutBtn.innerHTML = '🚪 Logout';
        logoutBtn.onclick = adminLogout;
        navRight.appendChild(logoutBtn);
    }
});

// ============================================================
// Universal Table Pager & Search Engine Helper
// ============================================================
class LTEDataPager {
    constructor(options) {
        this.refName = options.refName || 'tablePager';
        if (options.refName) {
            window[options.refName] = this;
        } else {
            window.tablePager = this;
        }
        this.data = options.data || [];
        this.pageSize = options.pageSize || 10;
        this.currentPage = 1;
        this.containerId = options.containerId; // tbody ID
        this.footerId = options.footerId;       // footer ID
        this.renderRow = options.renderRow;     // callback(item, index) -> html string
        this.filterFn = options.filterFn || null; // custom filter callback
        this.searchQuery = '';
        this.activeFilters = {};
        this.sortKey = options.defaultSortKey || null;
        this.sortAsc = options.defaultSortAsc !== undefined ? options.defaultSortAsc : false;
        this.onPageChange = options.onPageChange || null;
    }

    setData(data) {
        this.data = data;
        this.currentPage = 1;
        this.render();
    }

    setSearch(query) {
        this.searchQuery = (query || '').toLowerCase().trim();
        this.currentPage = 1;
        this.render();
    }

    setFilter(key, val) {
        if (!val || val === 'all') {
            delete this.activeFilters[key];
        } else {
            this.activeFilters[key] = val;
        }
        this.currentPage = 1;
        this.render();
    }

    setPageSize(size) {
        this.pageSize = parseInt(size, 10) || 10;
        this.currentPage = 1;
        this.render();
    }

    setSort(key) {
        if (this.sortKey === key) {
            this.sortAsc = !this.sortAsc;
        } else {
            this.sortKey = key;
            this.sortAsc = true;
        }
        this.render();
    }

    goToPage(page) {
        const totalPages = this.getTotalPages();
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.render();
        if (this.onPageChange) this.onPageChange(this.currentPage);
    }

    getFilteredData() {
        let list = [...this.data];

        // Custom search & filter function
        if (this.filterFn) {
            list = list.filter((item, idx) => this.filterFn(item, this.searchQuery, this.activeFilters));
        } else {
            if (this.searchQuery) {
                list = list.filter(item => {
                    const str = JSON.stringify(item).toLowerCase();
                    return str.includes(this.searchQuery);
                });
            }
            for (const [key, val] of Object.entries(this.activeFilters)) {
                list = list.filter(item => {
                    const itemVal = item[key];
                    if (itemVal === undefined || itemVal === null) return false;
                    return String(itemVal).toLowerCase() === String(val).toLowerCase();
                });
            }
        }

        // Apply sort with Pending items prioritized at the top
        list.sort((a, b) => {
            const isPendingA = (a.status === 'Pending') ? 1 : 0;
            const isPendingB = (b.status === 'Pending') ? 1 : 0;
            if (isPendingA !== isPendingB) {
                return isPendingB - isPendingA; // Pending always first!
            }
            if (this.sortKey) {
                let va = a[this.sortKey];
                let vb = b[this.sortKey];
                if (typeof va === 'string') va = va.toLowerCase();
                if (typeof vb === 'string') vb = vb.toLowerCase();
                if (va < vb) return this.sortAsc ? -1 : 1;
                if (va > vb) return this.sortAsc ? 1 : -1;
            }
            return 0;
        });

        return list;
    }

    getTotalPages() {
        const filtered = this.getFilteredData();
        return Math.max(1, Math.ceil(filtered.length / this.pageSize));
    }

    render() {
        const tbody = document.getElementById(this.containerId);
        const footer = document.getElementById(this.footerId);
        if (!tbody) return;

        const filtered = this.getFilteredData();
        const total = filtered.length;
        const totalPages = Math.max(1, Math.ceil(total / this.pageSize));

        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIdx = (this.currentPage - 1) * this.pageSize;
        const endIdx = Math.min(startIdx + this.pageSize, total);
        const pageItems = filtered.slice(startIdx, endIdx);

        if (pageItems.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" style="text-align:center; padding:45px 20px; color:#8e9bb0;">
                        <div style="font-size:32px; margin-bottom:8px;">🔍</div>
                        <div style="font-weight:700; color:#fff; font-size:14px;">No matching records found</div>
                        <div style="font-size:12px; margin-top:4px;">Try refining or clearing your search / filter criteria</div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = pageItems.map((item, idx) => this.renderRow(item, startIdx + idx)).join('');
        }

        if (footer) {
            const startDisplay = total === 0 ? 0 : startIdx + 1;
            const endDisplay = endIdx;

            // Generate Page Buttons
            let pageBtnsHtml = '';

            pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(1)" ${this.currentPage === 1 ? 'disabled' : ''} title="First Page">«</button>`;
            pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''} title="Previous Page">‹</button>`;

            const maxVisible = 5;
            let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
            let endPage = Math.min(totalPages, startPage + maxVisible - 1);
            if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
            }

            if (startPage > 1) {
                pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(1)">1</button>`;
                if (startPage > 2) pageBtnsHtml += `<span class="page-ellipsis">...</span>`;
            }

            for (let p = startPage; p <= endPage; p++) {
                pageBtnsHtml += `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" onclick="${this.refName}.goToPage(${p})">${p}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) pageBtnsHtml += `<span class="page-ellipsis">...</span>`;
                pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(${totalPages})">${totalPages}</button>`;
            }

            pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''} title="Next Page">›</button>`;
            pageBtnsHtml += `<button class="page-btn" onclick="${this.refName}.goToPage(${totalPages})" ${this.currentPage === totalPages ? 'disabled' : ''} title="Last Page">»</button>`;

            footer.innerHTML = `
                <div class="datatable-info">
                    Showing <b>${startDisplay}</b> to <b>${endDisplay}</b> of <b>${total}</b> entries
                    ${total < this.data.length ? `<span style="color:var(--lte-muted);"> (filtered from ${this.data.length} total)</span>` : ''}
                </div>
                <div class="pagination-controls">
                    ${pageBtnsHtml}
                </div>
            `;
        }
    }
}

// ============================================================
// Real-Time Real User Deposit & Withdrawal Notification System
// ============================================================
(function initAdminNotificationMonitor() {
    let seenTxIds = null;
    try {
        const stored = sessionStorage.getItem('bwn_admin_seen_txids');
        if (stored) seenTxIds = new Set(JSON.parse(stored));
    } catch (e) {
        seenTxIds = new Set();
    }
    if (!seenTxIds) seenTxIds = new Set();

    function saveSeenTxIds() {
        try {
            sessionStorage.setItem('bwn_admin_seen_txids', JSON.stringify([...seenTxIds]));
        } catch (e) {}
    }

    // Audio synthesizer for zero-dependency sound notifications
    function playAdminChime(type) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            if (type === 'deposit') {
                // Energetic casino high chime: 587Hz -> 880Hz -> 1175Hz
                osc.frequency.setValueAtTime(587.33, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
                osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.28);
            } else {
                // Attention alert: 880Hz -> 659Hz -> 880Hz
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.30);
            }

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.35, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.55);
        } catch (e) {
            console.warn('Audio alert unavailable:', e);
        }
    }

    // Desktop notification
    function triggerDesktopNotification(title, body) {
        try {
            if ('Notification' in window) {
                if (Notification.permission === 'granted') {
                    new Notification(title, { body, icon: '/favicon.ico' });
                } else if (Notification.permission !== 'denied') {
                    Notification.requestPermission();
                }
            }
        } catch (e) {}
    }

    // Create container for floating popups
    function getToastContainer() {
        let container = document.getElementById('bwn-admin-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'bwn-admin-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 24px;
                right: 24px;
                z-index: 9999999;
                display: flex;
                flex-direction: column;
                gap: 14px;
                max-width: 420px;
                width: calc(100% - 48px);
                pointer-events: none;
            `;
            document.body.appendChild(container);

            // Inject CSS keyframes
            const style = document.createElement('style');
            style.innerHTML = `
                @keyframes bwnSlideInRight {
                    from { opacity: 0; transform: translateX(50px) scale(0.95); }
                    to { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes bwnGlowPulse {
                    0%, 100% { box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 15px rgba(0, 231, 0, 0.3); }
                    50% { box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 28px rgba(0, 231, 0, 0.6); }
                }
                @keyframes bwnGlowPulseAmber {
                    0%, 100% { box-shadow: 0 16px 40px rgba(0,0,0,0.7), 0 0 15px rgba(245, 158, 11, 0.3); }
                    50% { box-shadow: 0 20px 50px rgba(0,0,0,0.85), 0 0 28px rgba(245, 158, 11, 0.6); }
                }
                .bwn-admin-popup {
                    pointer-events: auto;
                    background: rgba(15, 23, 42, 0.97);
                    backdrop-filter: blur(16px);
                    -webkit-backdrop-filter: blur(16px);
                    border-radius: 14px;
                    padding: 16px 20px;
                    color: #fff;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    animation: bwnSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    transition: all 0.25s ease;
                    position: relative;
                }
                .bwn-admin-popup.type-deposit {
                    border-left: 6px solid #00e700;
                    animation: bwnSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards, bwnGlowPulse 2.5s infinite;
                }
                .bwn-admin-popup.type-withdraw {
                    border-left: 6px solid #f59e0b;
                    animation: bwnSlideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards, bwnGlowPulseAmber 2.5s infinite;
                }
                .bwn-admin-popup .btn-close-toast {
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: rgba(255,255,255,0.1);
                    border: none;
                    color: #94a3b8;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 13px;
                    transition: background 0.2s, color 0.2s;
                }
                .bwn-admin-popup .btn-close-toast:hover {
                    background: rgba(239, 68, 68, 0.3);
                    color: #ef4444;
                }
            `;
            document.head.appendChild(style);
        }
        return container;
    }

    // Display Popup Alert
    function showNotificationPopup(item) {
        const container = getToastContainer();
        const isDep = item.type === 'deposit';
        const typeClass = isDep ? 'type-deposit' : 'type-withdraw';
        const icon = isDep ? '💳' : '💸';
        const titleBadge = isDep ? '🟢 NEW REAL DEPOSIT' : '🟡 NEW REAL WITHDRAWAL';
        const badgeColor = isDep ? '#00e700' : '#f59e0b';
        const targetUrl = isDep ? 'deposits.html' : 'withdrawals.html';
        const actionLabel = isDep ? '💳 View Deposit Approvals' : '💸 View Withdrawal Approvals';

        const username = item.username || item.full_name || item.user_id || 'User';
        const pkr = parseFloat(item.amount_pkr || 0).toLocaleString();
        const usd = parseFloat(item.amount_usd || 0).toFixed(2);
        const method = item.method || 'Standard';
        const refInfo = isDep ? (item.trx_id ? `Trx: ${item.trx_id}` : (item.sender_account ? `From: ${item.sender_account}` : '')) : (item.sender_account ? `To: ${item.sender_account}` : '');

        const popup = document.createElement('div');
        popup.className = `bwn-admin-popup ${typeClass}`;
        popup.innerHTML = `
            <button class="btn-close-toast" title="Dismiss">✕</button>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                <span style="font-size:20px;">${icon}</span>
                <span style="font-size:11px; font-weight:800; letter-spacing:0.5px; color:${badgeColor}; background:rgba(${isDep ? '0,231,0' : '245,158,11'},0.12); padding:3px 8px; border-radius:6px; border:1px solid ${badgeColor}40;">
                    ${titleBadge}
                </span>
                <span style="margin-left:auto; font-size:11px; color:#64748b; margin-right:20px;">Just now</span>
            </div>
            <div style="font-size:14px; color:#e2e8f0; margin-bottom:4px;">
                Player: <b style="color:#00e5ff; font-weight:700;">${username}</b> ${item.phone ? `<span style="font-size:11px; color:#94a3b8;">(${item.phone})</span>` : ''}
            </div>
            <div style="font-size:22px; font-weight:900; color:#fff; margin:6px 0 8px 0; letter-spacing:-0.5px;">
                PKR ${pkr} <span style="font-size:13px; color:#94a3b8; font-weight:500;">($${usd})</span>
            </div>
            <div style="font-size:12px; color:#94a3b8; margin-bottom:12px; display:flex; gap:10px; flex-wrap:wrap;">
                <span><b>Method:</b> ${method}</span>
                ${refInfo ? `<span><b>•</b> ${refInfo}</span>` : ''}
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
                <a href="${targetUrl}" class="btn-lte" style="background:${badgeColor}; color:#000; font-weight:800; font-size:12px; padding:7px 14px; border-radius:6px; text-decoration:none; display:inline-flex; align-items:center; gap:6px; border:none; cursor:pointer;">
                    ${actionLabel}
                </a>
                <button class="btn-dismiss-action" style="background:rgba(255,255,255,0.08); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); padding:7px 12px; font-size:12px; border-radius:6px; cursor:pointer;">
                    Dismiss
                </button>
            </div>
        `;

        const dismiss = () => {
            popup.style.opacity = '0';
            popup.style.transform = 'translateX(60px) scale(0.9)';
            setTimeout(() => popup.remove(), 250);
        };

        popup.querySelector('.btn-close-toast').onclick = dismiss;
        popup.querySelector('.btn-dismiss-action').onclick = dismiss;

        container.prepend(popup);

        // Auto remove after 25 seconds
        setTimeout(() => {
            if (popup.parentNode) dismiss();
        }, 25000);
    }

    // Live update sidebar pending badges
    function updateSidebarBadges(depCount, withCount) {
        // Deposits badge
        document.querySelectorAll('a[href*="deposits.html"]').forEach(link => {
            let badge = link.querySelector('.bwn-sidebar-dep-badge');
            if (depCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'sidebar-badge bwn-sidebar-dep-badge';
                    badge.style.cssText = 'background:#00e700; color:#000; font-weight:800; font-size:11px; padding:2px 7px; border-radius:10px; margin-left:auto;';
                    link.appendChild(badge);
                }
                badge.innerText = depCount + ' PENDING';
                badge.style.display = 'inline-block';
            } else if (badge) {
                badge.style.display = 'none';
            }
        });

        // Withdrawals badge
        document.querySelectorAll('a[href*="withdrawals.html"]').forEach(link => {
            let badge = link.querySelector('.bwn-sidebar-with-badge');
            if (withCount > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'sidebar-badge bwn-sidebar-with-badge';
                    badge.style.cssText = 'background:#f59e0b; color:#000; font-weight:800; font-size:11px; padding:2px 7px; border-radius:10px; margin-left:auto;';
                    link.appendChild(badge);
                }
                badge.innerText = withCount + ' PENDING';
                badge.style.display = 'inline-block';
            } else if (badge) {
                badge.style.display = 'none';
            }
        });
    }

    // Main poll function
    let isPolling = false;
    async function checkPendingTransactions() {
        if (isPolling) return;
        isPolling = true;

        try {
            const adminPin = (window.adminConfig && window.adminConfig.config && window.adminConfig.config.adminPin) || '9824';
            const res = await fetch('../api/admin.php?action=pending_notifications', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'X-Admin-Pin': adminPin
                },
                cache: 'no-store'
            });

            if (!res.ok) return;
            const json = await res.json();
            if (!json || !json.success || !json.data) return;

            const { pending_deposits_count, pending_withdrawals_count, items } = json.data;

            // Update sidebar counters
            updateSidebarBadges(pending_deposits_count || 0, pending_withdrawals_count || 0);

            if (!Array.isArray(items)) return;

            // First time loading page:
            const isFirstRun = seenTxIds.size === 0;

            let newDepositsFound = false;
            let newWithdrawalsFound = false;

            items.forEach(item => {
                if (!item || !item.id) return;

                if (!seenTxIds.has(item.id)) {
                    seenTxIds.add(item.id);

                    // If it's the very first time running in this session, check if it's very fresh (< 10 minutes)
                    let shouldAlert = true;
                    if (isFirstRun) {
                        const createdTime = new Date((item.created_at || '').replace(' ', 'T') + 'Z').getTime();
                        const now = Date.now();
                        // Only alert on items created in last 10 minutes if first run
                        if (isNaN(createdTime) || (now - createdTime) > 10 * 60 * 1000) {
                            shouldAlert = false;
                        }
                    }

                    if (shouldAlert) {
                        playAdminChime(item.type);
                        const isDep = item.type === 'deposit';
                        const title = isDep ? '💳 NAYA REAL DEPOSIT!' : '💸 NAYA REAL WITHDRAWAL!';
                        const body = `${item.username || 'Player'} ne PKR ${parseFloat(item.amount_pkr || 0).toLocaleString()} ka ${isDep ? 'deposit' : 'withdrawal'} submit kiya hai!`;
                        triggerDesktopNotification(title, body);
                        showNotificationPopup(item);

                        if (isDep) newDepositsFound = true;
                        else newWithdrawalsFound = true;
                    }
                }
            });

            saveSeenTxIds();

            // Auto-refresh active tables if on deposits or withdrawals page
            if (newDepositsFound && typeof window.initDepositsTable === 'function') {
                window.initDepositsTable();
            }
            if (newWithdrawalsFound && typeof window.loadWithdrawals === 'function') {
                window.loadWithdrawals();
            }

        } catch (e) {
            console.warn('Admin notification check error:', e);
        } finally {
            isPolling = false;
        }
    }

    // Start poll after DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            checkPendingTransactions();
            setInterval(checkPendingTransactions, 6000);
        });
    } else {
        checkPendingTransactions();
        setInterval(checkPendingTransactions, 6000);
    }
})();


