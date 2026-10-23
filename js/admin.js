// ============================================================
// Bet With Net - Master Admin Control Panel Controller
// Real-time RTP Sliders, Instant Crash Force, Financial Approvals
// ============================================================

const ALL_GAMES = [
    { id: 'crash', name: '🚀 Crash Game', defaultRate: 48 },
    { id: 'card', name: '🎴 Card Game (Dragon/BJ)', defaultRate: 48 },
    { id: 'roulette', name: '🎡 Roulette European', defaultRate: 48 },
    { id: 'slots', name: '🎰 Slots Vegas 5-Reel', defaultRate: 45 },
    { id: 'dice', name: '🎲 Dice Game', defaultRate: 49 },
    { id: 'wheel', name: '🎡 Aztec Sun Wheel 100X', defaultRate: 45 },
    { id: 'plinko', name: '⚪ Plinko Pegboard', defaultRate: 48 },
    { id: 'limbo', name: '🚀 Limbo Turbo Rocket', defaultRate: 6 },
    { id: 'mines', name: '💣 Mines Field 5x5', defaultRate: 48 },
    { id: 'keno', name: '🎱 Keno 80-Ball Lottery', defaultRate: 45 },
    { id: 'bingo', name: '🎫 Bingo 75-Ball Vegas', defaultRate: 45 },
    { id: 'blackjack', name: '♠️ Blackjack 21 VIP', defaultRate: 8 },
    { id: 'poker', name: '🃏 Video Poker (Jacks)', defaultRate: 45 },
    { id: 'lucky', name: '🍀 Lucky Number 777', defaultRate: 48 },
    { id: 'scratch', name: '🎟️ Lucky Scratch VIP', defaultRate: 45 },
    { id: 'coinflip', name: '🪙 Coin Flip VIP', defaultRate: 49 },
    { id: 'hilo', name: '🃏 Hi-Lo VIP Studio', defaultRate: 48 }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth check
    try { checkPinAuth(); } catch(e) { console.warn(e); }

    // 3. Other dashboard views with isolated error boundaries
    try { renderStats(); } catch(e) { console.warn(e); }
    try { loadAdminUsers(1); } catch(e) { console.warn(e); }
    try { renderGameSliders(); } catch(e) { console.warn(e); }
    try { renderDepositsTable(); } catch(e) { console.warn(e); }
    try { renderWithdrawalsTable(); } catch(e) { console.warn(e); }
    try { renderWalletEditor(); } catch(e) { console.warn(e); }
    try { renderWhatsAppSettings(); } catch(e) { console.warn(e); }
    try { startCrashRadar(); } catch(e) { console.warn(e); }
    try { startABRadar(); } catch(e) { console.warn(e); }

    // Init checkbox states
    try {
        const chkDep = document.getElementById('chk-auto-dep');
        const chkWth = document.getElementById('chk-auto-wth');
        if (chkDep && window.adminConfig && window.adminConfig.config) chkDep.checked = window.adminConfig.config.autoApproveDeposits;
        if (chkWth && window.adminConfig && window.adminConfig.config) chkWth.checked = window.adminConfig.config.autoApproveWithdrawals;
        updateRigModeButtons();
    } catch(e) {}
});

// Authentication
function checkPinAuth() {
    const isAuth = (sessionStorage.getItem('bwn_admin_session') === 'authenticated') ||
                   (sessionStorage.getItem('bwn_admin_auth') === 'true') || 
                   (document.cookie.indexOf('bwn_admin_pin=9824') !== -1) ||
                   (document.cookie.indexOf('bwn_admin_pin=8391') !== -1) ||
                   (document.cookie.indexOf('bwn_admin_pin=Sardar') !== -1);
    if (isAuth) {
        sessionStorage.setItem('bwn_admin_auth', 'true');
        sessionStorage.setItem('bwn_admin_session', 'authenticated');
        sessionStorage.setItem('bwn_admin_pin', '9824');
        document.cookie = "bwn_admin_pin=9824; path=/; max-age=86400; SameSite=Lax";
    }
    const modal = document.getElementById('admin-pin-modal');
    if (modal) {
        modal.style.display = isAuth ? 'none' : 'flex';
    }
}

function verifyAdminPin() {
    const input = document.getElementById('admin-pin-input');
    const pin = input ? input.value.trim() : '';

    if (pin === 'Sardar445.' || pin === '9824' || pin === '8391') {
        sessionStorage.setItem('bwn_admin_auth', 'true');
        sessionStorage.setItem('bwn_admin_session', 'authenticated');
        sessionStorage.setItem('bwn_admin_pin', '9824');
        document.cookie = "bwn_admin_pin=9824; path=/; max-age=86400; SameSite=Lax";
        const modal = document.getElementById('admin-pin-modal');
        if (modal) modal.style.display = 'none';
        if (window.sound) window.sound.playWin();
        loadAdminUsers(1);
        renderWalletEditor();
    } else {
        alert('Invalid Admin Password!');
        if (input) input.value = '';
    }
}

function lockAdmin() {
    sessionStorage.removeItem('bwn_admin_auth');
    sessionStorage.removeItem('bwn_admin_pin');
    document.cookie = "bwn_admin_pin=; path=/; max-age=0; SameSite=Lax";
    checkPinAuth();
}

// Navigation Tabs
function switchAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));

    const activeSec = document.getElementById(`tab-${tabId}`);
    if (activeSec) activeSec.classList.add('active');

    // Find clicked tab
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    } else {
        document.querySelectorAll('.admin-tab-btn').forEach(btn => {
            if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabId}'`)) {
                btn.classList.add('active');
            }
        });
    }

    if (tabId === 'overview') renderStats();
    if (tabId === 'users') loadAdminUsers(1);
    if (tabId === 'betslips') loadAdminBetslips(1);
    if (tabId === 'andarbahar') renderABRadarUI();
    if (tabId === 'deposits') renderDepositsTable();
    if (tabId === 'withdrawals') renderWithdrawalsTable();
    if (tabId === 'wallet') renderWalletEditor();
    if (tabId === 'whatsapp') renderWhatsAppSettings();
}

// Overview Stats
function renderStats() {
    if (!window.wallet) return;
    const s = window.wallet.state;

    const elBal = document.getElementById('stat-user-balance');
    const elWagered = document.getElementById('stat-total-wagered');
    const elWon = document.getElementById('stat-total-won');
    const elGGR = document.getElementById('stat-ggr');

    const ggr = s.totalWageredPKR - s.totalWonPKR;

    if (elBal) elBal.innerText = `₨ ${s.balancePKR.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (elWagered) elWagered.innerText = `₨ ${s.totalWageredPKR.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (elWon) elWon.innerText = `₨ ${s.totalWonPKR.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (elGGR) {
        elGGR.innerText = `₨ ${ggr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        elGGR.style.color = ggr >= 0 ? '#00e5ff' : '#ff3b30';
    }
}

function setGlobalRigMode(mode) {
    window.adminConfig.setRigMode(mode);
    updateRigModeButtons();
    alert(`Global Casino Mode set to: ${mode.toUpperCase()}`);
}

function updateRigModeButtons() {
    const mode = window.adminConfig.config.rigMode || 'normal';
    const btnN = document.getElementById('btn-rig-normal');
    const btnW = document.getElementById('btn-rig-win');
    const btnL = document.getElementById('btn-rig-loss');

    if (btnN) btnN.style.background = mode === 'normal' ? 'rgba(255,255,255,0.2)' : '';
    if (btnW) btnW.style.background = mode === 'force_win' ? 'rgba(0,231,0,0.3)' : '';
    if (btnL) btnL.style.background = mode === 'force_loss' ? 'rgba(255,59,48,0.3)' : '';
}

// Crash Live Telemetry & Instant Crash / Auto Mode
let radarPollBusy = false;
let radarTelemetry = {
    status: 'idle',
    multiplier: '1.00',
    next_crash_point: null,
    is_auto: true
};

function renderRadarUI() {
    const radarText = document.getElementById('crash-radar-text');
    const radarStatus = document.getElementById('crash-radar-status');
    const radarMode = document.getElementById('crash-radar-mode');

    // Prefer active local storage if on same machine/browser, else server telemetry
    const localStatus = localStorage.getItem('bwn_crash_live_status');
    const localMul = localStorage.getItem('bwn_crash_live_multiplier');
    const localNext = localStorage.getItem('bwn_admin_next_crash');

    let status = (localStatus && localStatus !== 'idle') ? localStatus : (radarTelemetry.status || 'idle');
    let mul = (localMul && parseFloat(localMul) > 1.0) ? localMul : (radarTelemetry.multiplier || '1.00');
    let nextCrash = localNext || radarTelemetry.next_crash_point;

    // If local was idle but server has flight, use server
    if (radarTelemetry.status === 'running' || radarTelemetry.status === 'flying') {
        status = 'running';
        mul = radarTelemetry.multiplier;
    } else if (radarTelemetry.status === 'waiting') {
        status = 'waiting';
        mul = '1.00';
    } else if (radarTelemetry.status === 'crashed') {
        status = 'crashed';
        mul = radarTelemetry.multiplier;
    }

    if (radarText) {
        radarText.innerText = `${mul}x`;
        if (status === 'running' || status === 'flying') {
            radarText.style.color = '#00e700';
            radarText.style.textShadow = '0 0 25px rgba(0, 231, 0, 0.6)';
        } else if (status === 'crashed') {
            radarText.style.color = '#ff3b30';
            radarText.style.textShadow = '0 0 25px rgba(255, 59, 48, 0.6)';
        } else if (status === 'waiting') {
            radarText.style.color = '#f5a623';
            radarText.style.textShadow = '0 0 20px rgba(245, 166, 35, 0.5)';
        } else {
            radarText.style.color = '#ffffff';
            radarText.style.textShadow = 'none';
        }
    }

    if (radarStatus) {
        if (status === 'running' || status === 'flying') {
            radarStatus.innerText = '🟢 PLANE IN FLIGHT (ACTIVE ROUND)';
            radarStatus.style.color = '#00e700';
        } else if (status === 'crashed') {
            radarStatus.innerText = `🔴 PLANE CRASHED @ ${mul}x`;
            radarStatus.style.color = '#ff3b30';
        } else if (status === 'waiting') {
            radarStatus.innerText = '🟡 WAITING FOR NEXT ROUND...';
            radarStatus.style.color = '#f5a623';
        } else {
            radarStatus.innerText = '⚪ STANDBY / IDLE';
            radarStatus.style.color = '#8e9bb0';
        }
    }

    if (radarMode) {
        if (nextCrash) {
            radarMode.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ff9900; margin-right:6px; box-shadow:0 0 8px #ff9900;"></span> MANUAL TARGET SET (${Number(nextCrash).toFixed(2)}x)`;
            radarMode.style.color = '#ff9900';
            radarMode.style.borderColor = 'rgba(255,153,0,0.4)';
            radarMode.style.background = 'rgba(255,153,0,0.1)';
        } else {
            radarMode.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e700; margin-right:6px; box-shadow:0 0 8px #00e700;"></span> AUTO MODE (DYNAMIC RTP) ACTIVE`;
            radarMode.style.color = '#00e700';
            radarMode.style.borderColor = 'rgba(0,231,0,0.4)';
            radarMode.style.background = 'rgba(0,231,0,0.1)';
        }
    }
}

function startCrashRadar() {
    // 1. Cross-tab storage updates
    window.addEventListener('storage', (e) => {
        if (e.key === 'bwn_crash_live_multiplier' || e.key === 'bwn_crash_live_status' || e.key === 'bwn_admin_next_crash') {
            renderRadarUI();
        }
    });

    // 2. Real-time server sync every 300ms across all phones/devices/apps
    const pollRadar = async () => {
        if (radarPollBusy) return;
        radarPollBusy = true;
        try {
            const res = await fetch('/api/games.php?action=crash_state', { cache: 'no-store' });
            const json = await res.json();
            if (json && json.success && json.data) {
                const d = json.data;
                radarTelemetry.status = d.status || 'idle';
                radarTelemetry.multiplier = (d.multiplier !== undefined) ? Number(d.multiplier).toFixed(2) : '1.00';
                radarTelemetry.next_crash_point = d.next_crash_point || null;
                radarTelemetry.is_auto = !!d.is_auto;
            }
        } catch (e) {} finally {
            radarPollBusy = false;
            renderRadarUI();
        }
    };

    setInterval(pollRadar, 300);
    pollRadar();
}

function triggerInstantCrash() {
    window.adminConfig.triggerForceCrash();
    radarTelemetry.status = 'crashed';
    renderRadarUI();
    const radarText = document.getElementById('crash-radar-text');
    const radarStatus = document.getElementById('crash-radar-status');
    const radarMode = document.getElementById('crash-radar-mode');
    if (radarText) {
        radarText.innerText = '💥 CRASHED!';
        radarText.style.color = '#ff3b30';
    }
    if (radarStatus) {
        radarStatus.innerText = '🔴 ADMIN FORCED CRASH!';
        radarStatus.style.color = '#ff3b30';
    }
    if (radarMode) {
        radarMode.innerHTML = `<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ff3b30; margin-right:6px; box-shadow:0 0 8px #ff3b30;"></span> FORCED CRASH EXECUTED`;
        radarMode.style.color = '#ff3b30';
        radarMode.style.borderColor = 'rgba(255,59,48,0.4)';
        radarMode.style.background = 'rgba(255,59,48,0.1)';
    }
    if (window.sound && window.sound.playCrashBoom) window.sound.playCrashBoom();
    alert('💥 Instant Force Crash signal sent! Active flight exploded.\n\nTip: Click "AUTO MODE" anytime to return to standard dynamic auto rounds.');
}

function setNextCrash() {
    const input = document.getElementById('input-next-crash');
    const val = input ? parseFloat(input.value) : 1.20;
    if (isNaN(val) || val < 1.01) {
        alert('Please enter a valid multiplier (>= 1.01)');
        return;
    }
    localStorage.setItem('bwn_admin_next_crash', val.toFixed(2));
    localStorage.removeItem('bwn_admin_force_crash_now');
    localStorage.removeItem('bwn_admin_force_crash_trigger');
    localStorage.removeItem('bwn_admin_crash_mode');
    if (window.adminConfig && window.adminConfig.setNextCrashPoint) {
        window.adminConfig.setNextCrashPoint(val);
    }
    radarTelemetry.next_crash_point = val;
    renderRadarUI();
    alert(`✅ Target Crash Point locked at: ${val.toFixed(2)}x!\n\nPlane will fly up and burst at ${val.toFixed(2)}x.\n(Click "AUTO MODE" anytime to return to natural auto RTP)`);
}

function activateCrashAutoMode() {
    window.adminConfig.resetCrashToAuto();
    const input = document.getElementById('input-next-crash');
    if (input) input.value = '';
    radarTelemetry.next_crash_point = null;
    radarTelemetry.is_auto = true;
    renderRadarUI();
    alert('✅ Crash Radar reset to AUTO MODE!\n\nManual override cancelled. Dynamic natural auto RTP is now active across all players.');
}

function resetCrashToAuto() {
    activateCrashAutoMode();
}

function setQuickCrash(val) {
    const input = document.getElementById('input-next-crash');
    if (input) input.value = val.toFixed(2);
    setNextCrash();
}

// ============================================================
// Speedy Andar Bahar Live Radar & Outcome Controller
// ============================================================
let abRadarPollBusy = false;
let abRadarState = {
    round_id: 'STANDBY',
    status: 'idle',
    time_left: 0,
    middle_card: 'H10',
    start_side: 'andar',
    winner: null,
    count_dealt: 0,
    end_card: null,
    mode: 'auto',
    lock_mode: 'lock',
    target_range: 'auto',
    target_first3: 'auto',
    command_id: 1,
    player_bets: {
        andar: 0,
        bahar: 0,
        first_andar: 0,
        first_bahar: 0,
        first_3: 0,
        ranges: {},
        total: 0
    },
    history: []
};

function formatABCard(cardStr) {
    if (!cardStr) return { text: '—', color: '#111' };
    const suitChar = cardStr.charAt(0).toUpperCase();
    const rankNum = parseInt(cardStr.slice(1), 10) || 10;
    const rankMap = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
    const rankStr = rankMap[rankNum] || String(rankNum);
    const suitMap = { 'H': '♥', 'D': '♦', 'S': '♠', 'C': '♣' };
    const suitSym = suitMap[suitChar] || '🃏';
    const isRed = (suitChar === 'H' || suitChar === 'D');
    return {
        text: `${suitSym}${rankStr}`,
        color: isRed ? '#e11d48' : '#0f172a'
    };
}

function renderABRadarUI() {
    // Also merge local telemetry if on same browser
    try {
        const locTel = JSON.parse(localStorage.getItem('bwn_ab_live_telemetry') || 'null');
        if (locTel && locTel.updated_at && (Date.now() - locTel.updated_at < 5000)) {
            if (locTel.round_id) abRadarState.round_id = locTel.round_id;
            if (locTel.status) abRadarState.status = locTel.status;
            if (locTel.time_left !== undefined) abRadarState.time_left = locTel.time_left;
            if (locTel.middle_card) abRadarState.middle_card = locTel.middle_card;
            if (locTel.start_side) abRadarState.start_side = locTel.start_side;
            if (locTel.player_bets) abRadarState.player_bets = Object.assign({}, abRadarState.player_bets, locTel.player_bets);
        }
    } catch (e) {}

    const elRound = document.getElementById('ab-radar-round-id');
    const elJoker = document.getElementById('ab-radar-joker-card');
    const elStart = document.getElementById('ab-radar-start-side');
    const elStatus = document.getElementById('ab-radar-status-text');
    const elSub = document.getElementById('ab-radar-sub-text');
    const elBadge = document.getElementById('ab-radar-active-mode-badge');

    if (elRound) elRound.innerText = `#${abRadarState.round_id || 'STANDBY'}`;
    if (elJoker) {
        const c = formatABCard(abRadarState.middle_card || 'H10');
        elJoker.innerText = c.text;
        elJoker.style.color = c.color;
    }
    if (elStart) {
        const s = (abRadarState.start_side || 'andar').toUpperCase();
        elStart.innerText = `1st: ${s}`;
    }

    if (elStatus) {
        const st = abRadarState.status || 'idle';
        const tl = abRadarState.time_left || 0;
        if (st === 'betting') {
            elStatus.innerText = `🟢 BETTING OPEN (${tl}s LEFT)`;
            elStatus.style.color = '#00e700';
        } else if (st === 'dealing' || st === 'closed_bet') {
            const winSide = abRadarState.winner ? ` → ${abRadarState.winner.toUpperCase()} WINS!` : '';
            elStatus.innerText = `🃏 DEALING CARDS (${abRadarState.count_dealt || 0} Cards)${winSide}`;
            elStatus.style.color = '#ffd700';
        } else {
            elStatus.innerText = '⚪ STANDBY / WAITING FOR PLAYER';
            elStatus.style.color = '#8e9bb0';
        }
    }

    if (elSub) {
        const hist = abRadarState.history || [];
        if (hist.length > 0) {
            const last = hist[hist.length - 1];
            const jc = formatABCard(last.middle_card);
            elSub.innerHTML = `Last Round: <b style="color:${last.winner === 'andar' ? '#38bdf8' : '#fb7185'};">${(last.winner || '').toUpperCase()} WON</b> in ${last.count_dealt || 1} cards (Joker ${jc.text})`;
        } else {
            elSub.innerText = 'Last Round: —';
        }
    }

    const mode = abRadarState.mode || 'auto';
    const lockMode = abRadarState.lock_mode || 'lock';
    const lockTag = lockMode === 'once' ? ' (NEXT ROUND ONLY)' : ' (LOCKED CONTINUOUS)';

    if (elBadge) {
        const modeMap = {
            'auto': { text: '🔄 AUTO / FAIR MODE ACTIVE', color: '#00e700', bg: 'rgba(0,231,0,0.12)', border: 'rgba(0,231,0,0.4)' },
            'force_andar': { text: `🟦 FORCE ANDAR WIN${lockTag}`, color: '#38bdf8', bg: 'rgba(1,145,255,0.2)', border: '#0191ff' },
            'force_bahar': { text: `🟥 FORCE BAHAR WIN${lockTag}`, color: '#fb7185', bg: 'rgba(255,56,41,0.2)', border: '#ff3829' },
            'house_win': { text: `💀 HOUSE WIN / PLAYER LOSE${lockTag}`, color: '#ff6b6b', bg: 'rgba(255,71,87,0.2)', border: '#ff4757' },
            'player_win': { text: `👑 PLAYER WIN / VIP BOOST${lockTag}`, color: '#00e700', bg: 'rgba(0,231,0,0.2)', border: '#00e700' },
            'first_andar': { text: `⚡ 1st CARD ANDAR WIN${lockTag}`, color: '#38bdf8', bg: 'rgba(56,189,248,0.2)', border: '#38bdf8' },
            'first_bahar': { text: `⚡ 1st CARD BAHAR WIN${lockTag}`, color: '#fb7185', bg: 'rgba(251,113,133,0.2)', border: '#fb7185' }
        };
        const mInfo = modeMap[mode] || modeMap['auto'];
        let extra = '';
        if (abRadarState.target_range && abRadarState.target_range !== 'auto') {
            extra += ` • Range: ${abRadarState.target_range.replace('ab-', '')}`;
        }
        if (abRadarState.target_first3 && abRadarState.target_first3 !== 'auto') {
            extra += ` • First-3: ${abRadarState.target_first3.toUpperCase()}`;
        }
        elBadge.innerText = mInfo.text + extra;
        elBadge.style.color = mInfo.color;
        elBadge.style.background = mInfo.bg;
        elBadge.style.borderColor = mInfo.border;
    }

    // Highlight active mode button
    const btnIds = {
        'force_andar': 'btn-ab-force-andar',
        'force_bahar': 'btn-ab-force-bahar',
        'house_win': 'btn-ab-house-win',
        'player_win': 'btn-ab-player-win',
        'first_andar': 'btn-ab-first-andar',
        'first_bahar': 'btn-ab-first-bahar',
        'auto': 'btn-ab-auto'
    };
    Object.keys(btnIds).forEach(k => {
        const b = document.getElementById(btnIds[k]);
        if (b) {
            b.style.outline = (k === mode) ? '3px solid #ffd700' : 'none';
            b.style.transform = (k === mode) ? 'scale(1.02)' : 'scale(1)';
        }
    });

    const selLock = document.getElementById('ab-radar-lock-mode');
    if (selLock && document.activeElement !== selLock) selLock.value = lockMode;
    const selRange = document.getElementById('ab-radar-target-range');
    if (selRange && document.activeElement !== selRange) selRange.value = abRadarState.target_range || 'auto';
    const selF3 = document.getElementById('ab-radar-target-first3');
    if (selF3 && document.activeElement !== selF3) selF3.value = abRadarState.target_first3 || 'auto';

    // Update Player Bets Exposure
    const pb = abRadarState.player_bets || {};
    const andarAmt = parseFloat(pb.andar) || 0;
    const baharAmt = parseFloat(pb.bahar) || 0;
    const fAndarAmt = parseFloat(pb.first_andar) || 0;
    const fBaharAmt = parseFloat(pb.first_bahar) || 0;
    const f3Amt = parseFloat(pb.first_3) || 0;
    const rangesObj = pb.ranges || {};
    let rangesSum = 0;
    const rangeParts = [];
    Object.keys(rangesObj).forEach(rk => {
        const rv = parseFloat(rangesObj[rk]) || 0;
        if (rv > 0) {
            rangesSum += rv;
            rangeParts.push(`${rk.replace('ab-', '')}: ₨${rv}`);
        }
    });
    const sideTotal = f3Amt + rangesSum;
    const totalAmt = andarAmt + baharAmt + fAndarAmt + fBaharAmt + sideTotal;

    const elBetA = document.getElementById('ab-bet-andar');
    const elBetB = document.getElementById('ab-bet-bahar');
    const elBetFA = document.getElementById('ab-bet-first-andar');
    const elBetFB = document.getElementById('ab-bet-first-bahar');
    const elBetSide = document.getElementById('ab-bet-side');
    const elBetRanges = document.getElementById('ab-bet-ranges-label');
    const elBetTot = document.getElementById('ab-bet-total');
    const elAdvice = document.getElementById('ab-bet-advice');

    if (elBetA) elBetA.innerText = `₨ ${andarAmt.toLocaleString()}`;
    if (elBetB) elBetB.innerText = `₨ ${baharAmt.toLocaleString()}`;
    if (elBetFA) elBetFA.innerText = `₨ ${fAndarAmt.toLocaleString()}`;
    if (elBetFB) elBetFB.innerText = `₨ ${fBaharAmt.toLocaleString()}`;
    if (elBetSide) elBetSide.innerText = `₨ ${sideTotal.toLocaleString()}`;
    if (elBetRanges) {
        elBetRanges.innerText = rangeParts.length > 0 ? (`1st-3: ₨${f3Amt} | ` + rangeParts.join(', ')) : (f3Amt > 0 ? `First-3: ₨ ${f3Amt}` : 'No range bets');
    }
    if (elBetTot) elBetTot.innerText = `₨ ${totalAmt.toLocaleString()}`;
    if (elAdvice) {
        if (andarAmt + fAndarAmt > baharAmt + fBaharAmt) {
            elAdvice.innerHTML = `⚠️ Heavy on <b>ANDAR</b> → Click <b style="color:#ff3829;">BAHAR</b> or <b style="color:#ff6b6b;">HOUSE WIN</b> to take`;
        } else if (baharAmt + fBaharAmt > andarAmt + fBaharAmt) {
            elAdvice.innerHTML = `⚠️ Heavy on <b>BAHAR</b> → Click <b style="color:#0191ff;">ANDAR</b> or <b style="color:#ff6b6b;">HOUSE WIN</b> to take`;
        } else if (totalAmt > 0) {
            elAdvice.innerText = 'Active bets on table';
        } else {
            elAdvice.innerText = 'Waiting for player bets...';
        }
    }

    // Render Recent History Table
    const tbody = document.getElementById('ab-radar-history-tbody');
    if (tbody) {
        const hist = (abRadarState.history || []).slice().reverse().slice(0, 15);
        if (hist.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:18px; color:#8e9bb0;">No rounds recorded yet...</td></tr>`;
        } else {
            tbody.innerHTML = hist.map(h => {
                const jc = formatABCard(h.middle_card);
                const isA = (h.winner === 'andar');
                const winBadge = isA
                    ? `<span style="background:rgba(1,145,255,0.2); color:#38bdf8; border:1px solid #0191ff; padding:2px 8px; border-radius:4px; font-weight:800;">🟦 ANDAR</span>`
                    : `<span style="background:rgba(255,56,41,0.2); color:#fb7185; border:1px solid #ff3829; padding:2px 8px; border-radius:4px; font-weight:800;">🟥 BAHAR</span>`;
                return `
                    <tr>
                        <td style="font-family:var(--font-mono); font-weight:700;">#${h.round_id || '—'}</td>
                        <td><b style="color:${jc.color}; background:#fff; padding:2px 7px; border-radius:4px; font-family:var(--font-mono);">${jc.text}</b></td>
                        <td>${winBadge}</td>
                        <td style="font-family:var(--font-mono); font-weight:800;">${h.count_dealt || 1} Cards</td>
                        <td><span style="font-size:11px; color:#ffd700; font-weight:700;">${(h.mode_used || 'auto').toUpperCase()}</span></td>
                        <td style="color:#8e9bb0;">${h.time || '—'}</td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function startABRadar() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'bwn_ab_live_telemetry' || e.key === 'bwn_ab_radar') {
            renderABRadarUI();
        }
    });

    const pollAB = async () => {
        if (abRadarPollBusy) return;
        abRadarPollBusy = true;
        try {
            const res = await fetch('/api/games.php?action=ab_state', { cache: 'no-store' });
            const json = await res.json();
            if (json && json.success && json.data) {
                abRadarState = Object.assign(abRadarState, json.data);
            }
        } catch (e) {} finally {
            abRadarPollBusy = false;
            renderABRadarUI();
        }
    };

    setInterval(pollAB, 500);
    pollAB();
}

async function sendABControlPayload(payload) {
    const nextCmdId = (parseInt(abRadarState.command_id, 10) || 1) + 1;
    abRadarState = Object.assign(abRadarState, payload, { command_id: nextCmdId });

    // Save to localStorage immediately for 0ms same-browser response
    try {
        localStorage.setItem('bwn_ab_radar', JSON.stringify({
            mode: abRadarState.mode || 'auto',
            lock_mode: abRadarState.lock_mode || 'lock',
            target_range: abRadarState.target_range || 'auto',
            target_first3: abRadarState.target_first3 || 'auto',
            command_id: nextCmdId
        }));
    } catch (e) {}

    renderABRadarUI();

    try {
        const res = await fetch('/api/games.php?action=ab_control', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            body: JSON.stringify(Object.assign({ admin_pin: '9824' }, payload))
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            abRadarState = Object.assign(abRadarState, json.data);
            try {
                localStorage.setItem('bwn_ab_radar', JSON.stringify({
                    mode: abRadarState.mode || 'auto',
                    lock_mode: abRadarState.lock_mode || 'lock',
                    target_range: abRadarState.target_range || 'auto',
                    target_first3: abRadarState.target_first3 || 'auto',
                    command_id: abRadarState.command_id || nextCmdId
                }));
            } catch (e) {}
            renderABRadarUI();
        }
    } catch (e) {
        console.error('AB Control sync error:', e);
    }
}

function setABRadarMode(mode) {
    const selLock = document.getElementById('ab-radar-lock-mode');
    const lockMode = selLock ? selLock.value : (abRadarState.lock_mode || 'lock');
    const payload = {
        mode: mode,
        lock_mode: lockMode
    };
    if (mode === 'auto') {
        payload.target_range = 'auto';
        payload.target_first3 = 'auto';
    }
    sendABControlPayload(payload);
}

function onABLockModeChange(lockMode) {
    sendABControlPayload({ lock_mode: lockMode, keep_side_targets: true });
}

function updateABSideTargets() {
    const selRange = document.getElementById('ab-radar-target-range');
    const selF3 = document.getElementById('ab-radar-target-first3');
    sendABControlPayload({
        target_range: selRange ? selRange.value : 'auto',
        target_first3: selF3 ? selF3.value : 'auto',
        keep_side_targets: true
    });
}

// 17 Games Win/Loss RTP Sliders
function renderGameSliders() {
    const container = document.getElementById('games-settings-grid');
    if (!container) return;

    container.innerHTML = ALL_GAMES.map(g => {
        const currentRate = window.adminConfig.getGameWinRate(g.id);
        return `
            <div class="game-setting-card" id="card-game-${g.id}">
                <div class="game-setting-header">
                    <b style="font-size:13px; color:#ffffff;">${g.name}</b>
                    <span class="admin-badge-rate" id="rate-badge-${g.id}">${currentRate}%</span>
                </div>
                <div class="slider-wrap">
                    <input type="range" class="admin-slider" min="0" max="100" value="${currentRate}" 
                           oninput="onGameSliderChange('${g.id}', this.value)">
                </div>
                <div class="preset-btn-group">
                    <button class="btn-preset" onclick="setPresetRate('${g.id}', 30)">House 30%</button>
                    <button class="btn-preset" onclick="setPresetRate('${g.id}', 48)">Fair 48%</button>
                    <button class="btn-preset" onclick="setPresetRate('${g.id}', 75)">Player 75%</button>
                    <button class="btn-preset" onclick="setPresetRate('${g.id}', 100)" style="color:#00e700;">100% Win</button>
                </div>
            </div>
        `;
    }).join('');
}

function onGameSliderChange(gameId, val) {
    window.adminConfig.setGameWinRate(gameId, val);
    const badge = document.getElementById(`rate-badge-${gameId}`);
    if (badge) badge.innerText = `${val}%`;
}

function setPresetRate(gameId, val) {
    const card = document.getElementById(`card-game-${gameId}`);
    if (card) {
        const slider = card.querySelector('.admin-slider');
        if (slider) slider.value = val;
    }
    onGameSliderChange(gameId, val);
}

// Deposit Approvals Table
let adminCachedDeposits = [];

async function renderDepositsTable() {
    const tbody = document.getElementById('deposits-table-body');
    if (!tbody) return;

    let dbDeposits = [];
    try {
        const res = await fetch('/api/admin.php?action=transactions&type=deposit&limit=200&admin_pin=9824', {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include',
            cache: 'no-store'
        });
        const json = await res.json();
        if (json && json.success && json.data && Array.isArray(json.data.transactions)) {
            dbDeposits = json.data.transactions.map(t => ({
                id: t.id,
                userId: t.user_id,
                method: t.method || 'EasyPaisa',
                amountPKR: parseFloat(t.amount_pkr || 0),
                amountUSD: parseFloat(t.amount_usd || 0),
                sender: t.sender_account || t.user_id || 'Self / Direct',
                trxId: t.trx_id || '-',
                proofImage: t.proof_image || '',
                status: t.status || 'Pending',
                date: t.transaction_date || t.created_at || '-'
            }));
        }
    } catch (e) {}

    const txns = dbDeposits;
    adminCachedDeposits = txns;

    if (txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#8e9bb0; padding:24px;">No deposit requests recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = txns.map(t => {
        let statusBadge = `<span style="color:#ffd700; font-weight:800;">Pending</span>`;
        if (t.status === 'Approved' || t.status === 'Completed') statusBadge = `<span style="color:#00e700; font-weight:800;">Approved</span>`;
        if (t.status === 'Rejected') statusBadge = `<span style="color:#ff3b30; font-weight:800;">Rejected</span>`;

        const canAction = (t.status === 'Pending');
        const proofHtml = (t.proofImage && t.proofImage.length > 30)
            ? `<button class="btn-secondary" style="padding:4px 8px; font-size:11px; color:#00e5ff; font-weight:700;" onclick="adminViewProof('${t.id}')">📸 View Screenshot</button>`
            : `<span style="color:#64748b; font-size:11px;">No Screenshot</span>`;

        return `
            <tr>
                <td style="font-family:var(--font-mono); font-weight:700;">${t.id}</td>
                <td><b>${t.method}</b></td>
                <td style="font-family:var(--font-mono); font-weight:800; color:#00e700;">₨ ${Number(t.amountPKR || 0).toLocaleString()}</td>
                <td>${t.sender || 'Self / Direct'}</td>
                <td style="font-family:var(--font-mono);">${t.trxId || '-'}</td>
                <td>${proofHtml}</td>
                <td>${statusBadge}</td>
                <td style="color:#8e9bb0; font-size:11px;">${t.date}</td>
                <td>
                    ${canAction ? `
                        <button class="btn-tbl-approve" onclick="adminApproveDep('${t.id}')">Approve</button>
                        <button class="btn-tbl-reject" onclick="adminRejectDep('${t.id}')">Reject</button>
                    ` : `<span style="color:#8e9bb0; font-size:11px;">Done</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

function adminViewProof(id) {
    const tx = adminCachedDeposits.find(t => t.id === id);
    if (!tx || !tx.proofImage) {
        alert('No transaction screenshot uploaded for this deposit.');
        return;
    }
    const modal = document.getElementById('admin-proof-modal');
    const img = document.getElementById('admin-proof-img');
    const details = document.getElementById('admin-proof-details');
    if (img) img.src = tx.proofImage;
    if (details) {
        details.innerHTML = `
            <div><b>Txn ID:</b> ${tx.id} &nbsp;|&nbsp; <b>Method:</b> ${tx.method}</div>
            <div><b>Sender:</b> ${tx.sender} &nbsp;|&nbsp; <b>TID:</b> ${tx.trxId}</div>
            <div><b>Amount:</b> <span style="color:#00e700; font-weight:800;">₨ ${Number(tx.amountPKR || 0).toLocaleString()}</span></div>
        `;
    }
    if (modal) modal.style.display = 'flex';
}

async function adminApproveDep(id) {
    try {
        await fetch('/api/admin.php?action=update_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: 'Approved' })
        });
    } catch (e) {}
    if (window.wallet && window.wallet.approveDeposit) {
        window.wallet.approveDeposit(id);
    }
    await renderDepositsTable();
    renderStats();
    alert(`Deposit ${id} Approved! Player balance credited.`);
}

async function adminRejectDep(id) {
    const reason = prompt('Enter rejection reason for player:', 'Verification Failed');
    if (reason !== null) {
        try {
            await fetch('/api/admin.php?action=update_transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: 'Rejected' })
            });
        } catch (e) {}
        if (window.wallet && window.wallet.rejectDeposit) {
            window.wallet.rejectDeposit(id, reason);
        }
        await renderDepositsTable();
        renderStats();
        alert(`Deposit ${id} Rejected.`);
    }
}

function toggleAutoApproveDep(checked) {
    window.adminConfig.config.autoApproveDeposits = checked;
    window.adminConfig.save();
}

// Withdrawal Approvals Table
let adminCachedWithdrawals = [];

async function renderWithdrawalsTable() {
    const tbody = document.getElementById('withdrawals-table-body');
    if (!tbody) return;

    let dbWithdrawals = [];
    try {
        const res = await fetch('/api/admin.php?action=transactions&type=withdraw&limit=200&admin_pin=9824', {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include',
            cache: 'no-store'
        });
        const json = await res.json();
        if (json && json.success && json.data && Array.isArray(json.data.transactions)) {
            dbWithdrawals = json.data.transactions.map(t => ({
                id: t.id,
                userId: t.user_id,
                method: t.method || 'JazzCash',
                amountPKR: parseFloat(t.amount_pkr || 0),
                amountUSD: parseFloat(t.amount_usd || 0),
                accountTitle: t.account_title || t.sender_account || t.user_id || 'User',
                accountNumber: t.account_number || t.sender_account || '-',
                status: t.status || 'Pending',
                date: t.transaction_date || t.created_at || '-'
            }));
        }
    } catch (e) {}

    const txns = dbWithdrawals;
    adminCachedWithdrawals = txns;

    if (txns.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:#8e9bb0; padding:24px;">No withdrawal requests recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = txns.map(t => {
        let statusBadge = `<span style="color:#ffd700; font-weight:800;">Pending</span>`;
        if (t.status === 'Approved' || t.status === 'Completed') statusBadge = `<span style="color:#00e700; font-weight:800;">Approved</span>`;
        if (t.status === 'Rejected') statusBadge = `<span style="color:#ff3b30; font-weight:800;">Rejected</span>`;

        const canAction = (t.status === 'Pending' || t.status === 'Processing');

        return `
            <tr>
                <td style="font-family:var(--font-mono); font-weight:700;">${t.id}</td>
                <td><b>${t.method}</b></td>
                <td style="font-family:var(--font-mono); font-weight:800; color:#ff7675;">₨ ${Number(t.amountPKR || 0).toLocaleString()}</td>
                <td>${t.accountTitle || 'User'}</td>
                <td style="font-family:var(--font-mono);">${t.accountNumber || '-'}</td>
                <td>${statusBadge}</td>
                <td style="color:#8e9bb0; font-size:11px;">${t.date}</td>
                <td>
                    ${canAction ? `
                        <button class="btn-tbl-approve" onclick="adminApproveWth('${t.id}')">Approve</button>
                        <button class="btn-tbl-reject" onclick="adminRejectWth('${t.id}')">Reject & Refund</button>
                    ` : `<span style="color:#8e9bb0; font-size:11px;">Done</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

async function adminApproveWth(id) {
    try {
        await fetch('/api/admin.php?action=update_transaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, status: 'Approved' })
        });
    } catch (e) {}

    if (window.wallet && window.wallet.approveWithdraw) {
        window.wallet.approveWithdraw(id);
    }
    await renderWithdrawalsTable();
    renderStats();
    alert(`Withdrawal ${id} Approved and processed!`);
}

async function adminRejectWth(id) {
    const reason = prompt('Enter rejection reason (Funds will be refunded to user):', 'Account Title Mismatch');
    if (reason !== null) {
        try {
            await fetch('/api/admin.php?action=update_transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id, status: 'Rejected' })
            });
        } catch (e) {}

        if (window.wallet && window.wallet.rejectWithdraw) {
            window.wallet.rejectWithdraw(id, reason);
        }
        await renderWithdrawalsTable();
        renderStats();
        alert(`Withdrawal ${id} Rejected. Funds refunded back to player balance.`);
    }
}

function toggleAutoApproveWth(checked) {
    window.adminConfig.config.autoApproveWithdrawals = checked;
    window.adminConfig.save();
}

// Admin Real-time Transaction Audio & Toast Notification Engine
let knownPendingTxIds = new Set();
let isFirstTxPoll = true;

function showAdminTxNotification(title, message, isDeposit = true) {
    let container = document.getElementById('admin-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-toast-container';
        container.style.cssText = 'position:fixed; top:20px; right:20px; z-index:99999999; display:flex; flex-direction:column; gap:12px; max-width:400px; pointer-events:none;';
        document.body.appendChild(container);

        if (!document.getElementById('admin-toast-anim-styles')) {
            const st = document.createElement('style');
            st.id = 'admin-toast-anim-styles';
            st.textContent = `
                @keyframes adminToastSlide {
                    0% { transform: translateY(-40px) scale(0.88); opacity: 0; filter: blur(5px); }
                    60% { transform: translateY(6px) scale(1.02); opacity: 1; filter: blur(0); }
                    100% { transform: translateY(0) scale(1); opacity: 1; }
                }
                @keyframes adminGlowPulse {
                    0%, 100% { box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 25px rgba(16,185,129,0.35); }
                    50% { box-shadow: 0 20px 50px rgba(0,0,0,0.95), 0 0 35px rgba(16,185,129,0.6); }
                }
                @keyframes adminWithdrawPulse {
                    0%, 100% { box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 25px rgba(245,158,11,0.35); }
                    50% { box-shadow: 0 20px 50px rgba(0,0,0,0.95), 0 0 35px rgba(245,158,11,0.6); }
                }
            `;
            document.head.appendChild(st);
        }
    }

    const toast = document.createElement('div');
    const borderColor = isDeposit ? '#10b981' : '#f59e0b';
    const glowAnim = isDeposit ? 'adminGlowPulse 2.5s infinite ease-in-out' : 'adminWithdrawPulse 2.5s infinite ease-in-out';
    toast.style.cssText = `
        background: radial-gradient(circle at 20% 0%, #1a253a 0%, #0c1322 65%, #05080f 100%);
        border: 2px solid ${borderColor};
        border-radius: 16px;
        padding: 15px 18px;
        color: #fff;
        box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 25px ${isDeposit ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.35)'};
        display: flex;
        align-items: center;
        gap: 14px;
        font-family: inherit;
        animation: adminToastSlide 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards, ${glowAnim};
        pointer-events: auto;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
    `;
    toast.innerHTML = `
        <div style="font-size:28px; filter:drop-shadow(0 0 8px ${borderColor});">${isDeposit ? '📥' : '💸'}</div>
        <div style="flex:1;">
            <div style="font-weight:900; font-size:13.5px; color:${borderColor}; letter-spacing:0.5px; text-transform:uppercase;">${title}</div>
            <div style="font-size:12.5px; color:#e2e8f0; margin-top:3px; font-weight:600; line-height:1.35;">${message}</div>
        </div>
        <button style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:#cbd5e1; font-size:14px; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.25)'; this.style.color='#fff';" onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.color='#cbd5e1';" onclick="this.parentElement.remove()">✕</button>
    `;
    container.appendChild(toast);

    // Audio chime
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
            const ctx = new AudioCtx();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.setValueAtTime(isDeposit ? 659.25 : 523.25, now);
            osc.frequency.exponentialRampToValueAtTime(isDeposit ? 880 : 783.99, now + 0.15);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch(e) {}

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px) scale(0.95)';
        toast.style.transition = 'all 0.35s ease';
        setTimeout(() => toast.remove(), 350);
    }, 7000);
}


// Player Wallet Editor
async function renderWalletEditor() {
    const sel = document.getElementById('wallet-editor-user-select');
    const el = document.getElementById('editor-current-balance');
    const setInp = document.getElementById('input-set-balance');

    try {
        const res = await fetch('/api/admin.php?action=users&limit=1000&admin_pin=9824', {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include'
        });
        const json = await res.json();
        if (json && json.success && json.data && Array.isArray(json.data.users)) {
            adminUsersState.users = json.data.users;
        }
    } catch (e) {}

    if (sel && adminUsersState.users && adminUsersState.users.length > 0) {
        const currentVal = sel.value || (currentDetailUser ? currentDetailUser.id : '');
        sel.innerHTML = '<option value="">-- Select a Player --</option>' + adminUsersState.users.map(u => {
            const bal = Number(u.balance_pkr || 0).toLocaleString();
            const isSel = String(u.id) === String(currentVal) ? 'selected' : '';
            return `<option value="${escapeHtml(u.id)}" ${isSel}>${escapeHtml(u.username)} (${escapeHtml(u.id)}) — ₨ ${bal}</option>`;
        }).join('');
        
        // NEVER auto-select users[0]! Explicit selection only.
        if (currentVal) {
            const found = adminUsersState.users.find(u => String(u.id) === String(currentVal));
            if (found) {
                currentDetailUser = found;
                sel.value = found.id;
            } else {
                currentDetailUser = null;
                sel.value = '';
            }
        } else {
            currentDetailUser = null;
            sel.value = '';
        }
    }

    if (el) {
        if (currentDetailUser) {
            const balPkr = Number(currentDetailUser.balance_pkr || 0);
            el.innerText = `₨ ${balPkr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            if (setInp) setInp.value = balPkr;
        } else {
            el.innerText = '⚠️ Select a Player Above';
            if (setInp) setInp.value = 0;
        }
    }
}

function onWalletEditorUserChange(userId) {
    const found = adminUsersState.users.find(u => String(u.id) === String(userId));
    currentDetailUser = found || null;
    const el = document.getElementById('editor-current-balance');
    const setInp = document.getElementById('input-set-balance');
    const manualInp = document.getElementById('wallet-editor-manual-input');
    if (found && manualInp) {
        manualInp.value = '';
    }
    if (el) {
        if (found) {
            const balPkr = Number(found.balance_pkr || 0);
            el.innerText = `₨ ${balPkr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            if (setInp) setInp.value = balPkr;
        } else {
            el.innerText = '⚠️ Select a Player Above';
            if (setInp) setInp.value = 0;
        }
    }
}

function onWalletEditorManualInput(val) {
    val = (val || '').trim().toLowerCase();
    const sel = document.getElementById('wallet-editor-user-select');
    if (!val) {
        if (sel && sel.value) onWalletEditorUserChange(sel.value);
        else {
            currentDetailUser = null;
            const el = document.getElementById('editor-current-balance');
            if (el) el.innerText = '⚠️ Select a Player Above';
        }
        return;
    }
    const found = adminUsersState.users.find(u => 
        String(u.id).toLowerCase() === val ||
        String(u.username || '').toLowerCase() === val ||
        String(u.phone || '').toLowerCase() === val
    );
    if (found) {
        if (sel) sel.value = found.id;
        currentDetailUser = found;
        const el = document.getElementById('editor-current-balance');
        const setInp = document.getElementById('input-set-balance');
        if (el) {
            const balPkr = Number(found.balance_pkr || 0);
            el.innerText = `₨ ${balPkr.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            if (setInp) setInp.value = balPkr;
        }
    } else {
        currentDetailUser = { id: val, username: val, balance_pkr: 0 };
        const el = document.getElementById('editor-current-balance');
        if (el) el.innerText = `User: ${val}`;
    }
}

function getWalletEditorTargetUser() {
    const manual = document.getElementById('wallet-editor-manual-input');
    const manualVal = manual ? manual.value.trim() : '';
    if (manualVal) {
        const found = adminUsersState.users.find(u => 
            String(u.id).toLowerCase() === manualVal.toLowerCase() ||
            String(u.username || '').toLowerCase() === manualVal.toLowerCase() ||
            (u.phone && String(u.phone) === manualVal)
        );
        if (found) return found;
        return { id: manualVal, username: manualVal };
    }
    const sel = document.getElementById('wallet-editor-user-select');
    if (sel && sel.value) {
        const found = adminUsersState.users.find(u => String(u.id) === String(sel.value));
        if (found) return found;
        return { id: sel.value, username: sel.value };
    }
    if (currentDetailUser && currentDetailUser.id) return currentDetailUser;
    return null;
}

function getWalletEditorTargetId() {
    const target = getWalletEditorTargetUser();
    return target ? target.id : null;
}

async function adminCustomAdjustBalance(type) {
    const targetUser = getWalletEditorTargetUser();
    if (!targetUser || !targetUser.id) {
        alert('⚠️ Please select a player from the dropdown first (or enter Username/ID).');
        return;
    }
    const inp = document.getElementById('input-custom-adj-balance');
    const amount = inp ? parseFloat(inp.value) : 0;
    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
    }

    const actionText = type === 'deduct' ? `MINUS (- ₨ ${amount.toLocaleString()})` : `ADD (+ ₨ ${amount.toLocaleString()})`;
    if (!confirm(`⚠️ Confirm Balance Change:\n\nPlayer: ${targetUser.username} (${targetUser.id})\nAction: ${actionText}\n\nAre you sure you want to proceed?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin.php?action=adjust_balance&admin_pin=9824', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '9824' },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                user_id: targetUser.id,
                type: type,
                currency: 'PKR',
                amount: amount,
                reason: `Admin Direct ${type === 'deduct' ? 'Debit (-)' : 'Credit (+)'}`
            })
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            if (inp) inp.value = '';
            const newBal = Number(json.data.balance_pkr || 0);
            if (currentDetailUser && (String(currentDetailUser.id) === String(json.data.user_id) || String(currentDetailUser.username).toLowerCase() === String(json.data.username).toLowerCase())) {
                currentDetailUser.balance_pkr = newBal;
                currentDetailUser.balance_usd = Number(json.data.balance_usd || 0);
            }
            const uInList = adminUsersState.users.find(u => String(u.id) === String(json.data.user_id) || String(u.username).toLowerCase() === String(json.data.username).toLowerCase());
            if (uInList) {
                uInList.balance_pkr = newBal;
                uInList.balance_usd = Number(json.data.balance_usd || 0);
            }
            alert(`✅ Balance ${type === 'deduct' ? 'Deducted (-)' : 'Added (+)'} Successfully!\n\nPlayer: ${json.data.username} (${json.data.user_id})\nNew Balance: ₨ ${newBal.toLocaleString()}`);
            await loadAdminUsers(adminUsersState.page);
            await renderWalletEditor();
            renderStats();
        } else {
            alert('❌ Failed: ' + ((json && json.message) || (json && json.error) || 'Error'));
        }
    } catch (e) {
        alert('Network error: ' + e.message);
    }
}

async function adminZeroAllUsersBalances() {
    if (!confirm('Are you sure you want to reset ALL users balances to ₨ 0.00?')) return;
    try {
        const res = await fetch('/api/admin.php?action=zero_all_balances&admin_pin=9824', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '9824' },
            credentials: 'include',
            body: JSON.stringify({ admin_pin: '9824' })
        });
        const json = await res.json();
        if (json && json.success) {
            alert('✅ All users balances have been reset to ₨ 0.00!');
            await loadAdminUsers(1);
            await renderWalletEditor();
            renderStats();
        } else {
            alert('Failed: ' + ((json && json.message) || 'Error'));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function adminSetBalance() {
    const targetUser = getWalletEditorTargetUser();
    if (!targetUser || !targetUser.id) {
        alert('⚠️ Please select a player from the dropdown first (or enter Username/ID).');
        return;
    }

    const input = document.getElementById('input-set-balance');
    const val = input ? parseFloat(input.value) : 0;
    if (isNaN(val) || val < 0) {
        alert('Enter a valid non-negative balance.');
        return;
    }

    if (!confirm(`⚠️ Confirm Set Absolute Balance:\n\nPlayer: ${targetUser.username} (${targetUser.id})\nNew Balance: ₨ ${val.toLocaleString()}\n\nAre you sure you want to proceed?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin.php?action=adjust_balance&admin_pin=9824', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '9824' },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                user_id: targetUser.id,
                type: 'set',
                currency: 'PKR',
                amount: val,
                reason: 'Admin Set Absolute Balance'
            })
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            const newBal = Number(json.data.balance_pkr || 0);
            if (currentDetailUser && (String(currentDetailUser.id) === String(json.data.user_id) || String(currentDetailUser.username).toLowerCase() === String(json.data.username).toLowerCase())) {
                currentDetailUser.balance_pkr = newBal;
                currentDetailUser.balance_usd = Number(json.data.balance_usd || 0);
            }
            const uInList = adminUsersState.users.find(u => String(u.id) === String(json.data.user_id) || String(u.username).toLowerCase() === String(json.data.username).toLowerCase());
            if (uInList) {
                uInList.balance_pkr = newBal;
                uInList.balance_usd = Number(json.data.balance_usd || 0);
            }
            alert(`✅ Player (${json.data.username}) balance set to: ₨ ${newBal.toLocaleString()}`);
            await loadAdminUsers(adminUsersState.page);
            await renderWalletEditor();
            renderStats();
        } else {
            alert('Failed: ' + ((json && json.message) || (json && json.error) || 'Error'));
        }
    } catch(e) {
        alert('Error setting balance: ' + e.message);
    }
}

async function adminAdjustBalance(amount) {
    const targetUser = getWalletEditorTargetUser();
    if (!targetUser || !targetUser.id) {
        alert('⚠️ Please select a player from the dropdown first (or enter Username/ID).');
        return;
    }

    const type = amount >= 0 ? 'add' : 'deduct';
    const absAmt = Math.abs(amount);
    const actionText = amount >= 0 ? `ADD (+ ₨ ${absAmt.toLocaleString()})` : `DEDUCT (- ₨ ${absAmt.toLocaleString()})`;

    if (!confirm(`⚠️ Confirm Quick Balance Change:\n\nPlayer: ${targetUser.username} (${targetUser.id})\nAction: ${actionText}\n\nAre you sure you want to proceed?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin.php?action=adjust_balance&admin_pin=9824', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '9824' },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                user_id: targetUser.id,
                type: type,
                currency: 'PKR',
                amount: absAmt,
                reason: 'Admin Quick Adjust Preset'
            })
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            const newBal = Number(json.data.balance_pkr || 0);
            if (currentDetailUser && (String(currentDetailUser.id) === String(json.data.user_id) || String(currentDetailUser.username).toLowerCase() === String(json.data.username).toLowerCase())) {
                currentDetailUser.balance_pkr = newBal;
                currentDetailUser.balance_usd = Number(json.data.balance_usd || 0);
            }
            const uInList = adminUsersState.users.find(u => String(u.id) === String(json.data.user_id) || String(u.username).toLowerCase() === String(json.data.username).toLowerCase());
            if (uInList) {
                uInList.balance_pkr = newBal;
                uInList.balance_usd = Number(json.data.balance_usd || 0);
            }
            alert(`✅ Player (${json.data.username}) balance adjusted: ${amount >= 0 ? '+' : '-'}₨ ${absAmt.toLocaleString()}\nNew Balance: ₨ ${newBal.toLocaleString()}`);
            await loadAdminUsers(adminUsersState.page);
            await renderWalletEditor();
            renderStats();
        } else {
            alert('Failed: ' + ((json && json.message) || (json && json.error) || 'Error'));
        }
    } catch(e) {
        alert('Error adjusting balance: ' + e.message);
    }
}

// WhatsApp Group & Live Support Settings
async function renderWhatsAppSettings() {
    const inputLink = document.getElementById('input-wa-group-link');
    const inputNum = document.getElementById('input-wa-number');
    const inputMsg = document.getElementById('input-wa-msg');
    const chkEnabled = document.getElementById('chk-wa-enabled');

    // 1. Load from localStorage immediately
    if (inputLink) inputLink.value = localStorage.getItem('bwn_whatsapp_group_link') || 'https://whatsapp.com/channel/0029VbDhwXK35fLwCwVkNJ0Q';
    if (inputNum) inputNum.value = localStorage.getItem('bwn_support_whatsapp') || '923000000000';
    if (inputMsg) inputMsg.value = localStorage.getItem('bwn_support_whatsapp_msg') || 'Assalam-o-Alaikum Bet With Net Support! Mujhe help chahiye.';
    if (chkEnabled) {
        const en = localStorage.getItem('bwn_whatsapp_enabled');
        chkEnabled.checked = (en === null || en === 'true' || en === '1');
    }

    // 2. Fetch server authoritative site_settings from SQL
    try {
        const res = await fetch('/api/admin.php?action=site_settings&admin_pin=9824', {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include'
        });
        if (res.ok) {
            const json = await res.json();
            if (json && json.success && json.data) {
                const s = json.data;
                if (s.whatsapp_group_link !== undefined && inputLink) {
                    inputLink.value = s.whatsapp_group_link;
                    localStorage.setItem('bwn_whatsapp_group_link', s.whatsapp_group_link);
                }
                if (s.whatsapp_number !== undefined && inputNum) {
                    inputNum.value = s.whatsapp_number;
                    localStorage.setItem('bwn_support_whatsapp', s.whatsapp_number);
                }
                if (s.whatsapp_enabled !== undefined && chkEnabled) {
                    const isEn = (s.whatsapp_enabled === 'true' || s.whatsapp_enabled === '1' || s.whatsapp_enabled === true);
                    chkEnabled.checked = isEn;
                    localStorage.setItem('bwn_whatsapp_enabled', isEn ? 'true' : 'false');
                }
            }
        }
    } catch(e) {
        console.warn('Failed to load server whatsapp settings:', e);
    }
}

async function saveWhatsAppSettings() {
    const inputLink = document.getElementById('input-wa-group-link');
    const inputNum = document.getElementById('input-wa-number');
    const inputMsg = document.getElementById('input-wa-msg');
    const chkEnabled = document.getElementById('chk-wa-enabled');
    const statusEl = document.getElementById('wa-save-status');

    const groupLink = inputLink ? inputLink.value.trim() : '';
    const waNum = inputNum ? inputNum.value.trim().replace(/\D/g, '') : '';
    const waMsg = inputMsg ? inputMsg.value.trim() : '';
    const isEnabled = chkEnabled ? chkEnabled.checked : true;

    // Save locally
    localStorage.setItem('bwn_whatsapp_group_link', groupLink);
    localStorage.setItem('bwn_support_whatsapp', waNum);
    localStorage.setItem('bwn_support_whatsapp_msg', waMsg);
    localStorage.setItem('bwn_whatsapp_enabled', isEnabled ? 'true' : 'false');

    // Save to SQL Database via API
    try {
        const payload = {
            admin_pin: '9824',
            whatsapp_group_link: groupLink,
            whatsapp_number: waNum,
            whatsapp_enabled: isEnabled ? '1' : '0'
        };
        const res = await fetch('/api/admin.php?action=save_site_settings&admin_pin=9824', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Pin': '9824' },
            credentials: 'include',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            console.log('WhatsApp settings saved to database successfully.');
        }
    } catch(e) {
        console.warn('Could not sync whatsapp settings to server DB:', e);
    }

    if (window.sound && window.sound.playWin) window.sound.playWin();

    if (statusEl) {
        statusEl.style.display = 'block';
        statusEl.innerText = '✅ WhatsApp settings successfully saved & live across platform!';
        setTimeout(() => { statusEl.style.display = 'none'; }, 4000);
    }
    alert('✅ WhatsApp Group Link & Support Settings saved successfully!');
}

function testWhatsAppLink() {
    const inputLink = document.getElementById('input-wa-group-link');
    const link = inputLink ? inputLink.value.trim() : '';
    if (!link) {
        alert('Pehle WhatsApp group ka link enter karein!');
        return;
    }
    let finalUrl = link;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
        finalUrl = 'https://' + finalUrl;
    }
    window.open(finalUrl, '_blank');
}

// ============================================================
// Comprehensive Users & Players Master Back-Office Logic
// Real-time SQL DB Sync, Device/Platform/IP tracking, Live Balances, RTP Rigging, Activity Slips
// ============================================================

let adminUsersState = {
    users: [],
    page: 1,
    limit: 25,
    totalPages: 1,
    total: 0,
    search: '',
    filterPlatform: 'all',
    filterStatus: 'all',
    filterBias: 'all',
    isLoading: false,
    searchDebounceTimer: null
};

let currentDetailUser = null;
let currentBalanceUser = null;

async function loadAdminUsers(page = 1) {
    adminUsersState.page = page;
    const tbody = document.getElementById('admin-users-tbody');
    if (tbody && (!adminUsersState.users || adminUsersState.users.length === 0)) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#8e9bb0;"><div style="display:inline-block; animation:spin 1s linear infinite; margin-right:8px;">⏳</div> Loading users from database...</td></tr>`;
    }

    try {
        const params = new URLSearchParams({
            action: 'users',
            page: adminUsersState.page,
            limit: adminUsersState.limit
        });

        if (adminUsersState.search) params.append('search', adminUsersState.search);
        if (adminUsersState.filterStatus && adminUsersState.filterStatus !== 'all') params.append('status', adminUsersState.filterStatus);
        if (adminUsersState.filterBias && adminUsersState.filterBias !== 'all') params.append('outcome_bias', adminUsersState.filterBias);
        if (adminUsersState.filterPlatform && adminUsersState.filterPlatform !== 'all') {
            if (adminUsersState.filterPlatform === 'guest') {
                params.append('role', 'guest');
            } else {
                params.append('device_type', adminUsersState.filterPlatform);
            }
        }

        params.append('admin_pin', '9824');
        const res = await fetch(`/api/admin.php?${params.toString()}`, {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include'
        });
        const json = await res.json();

        if (json && json.success && json.data) {
            adminUsersState.users = json.data.users || [];
            adminUsersState.total = json.data.total || 0;
            adminUsersState.totalPages = json.data.total_pages || 1;

            if (json.data.total !== undefined) {
                const elTotal = document.getElementById('usr-kpi-total');
                if (elTotal) elTotal.innerText = Number(json.data.total).toLocaleString();
            }
            if (json.data.total_app_users !== undefined) {
                const elApp = document.getElementById('usr-kpi-app');
                if (elApp) elApp.innerText = Number(json.data.total_app_users).toLocaleString();
            }
            if (json.data.total_guests !== undefined) {
                const elGuests = document.getElementById('usr-kpi-guests');
                if (elGuests) elGuests.innerText = Number(json.data.total_guests).toLocaleString();
            }
            if (json.data.total_balance_pkr !== undefined) {
                const elBal = document.getElementById('usr-kpi-balance');
                if (elBal) elBal.innerText = '₨ ' + Number(json.data.total_balance_pkr).toLocaleString('en-US', { maximumFractionDigits: 0 });
            }

            renderAdminUsersTable();
        } else {
            throw new Error((json && json.message) || 'Failed to retrieve user data');
        }
    } catch(err) {
        console.error('Error loading admin users:', err);
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#ff3b30;">❌ Error loading users: ${escapeHtml(err.message)}<br><button class="btn-action-primary" style="margin-top:10px; font-size:11px;" onclick="loadAdminUsers(1)">🔄 Retry</button></td></tr>`;
        }
    }
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('admin-users-tbody');
    if (!tbody) return;

    if (!adminUsersState.users || adminUsersState.users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:35px; color:#8e9bb0;">No users matched current filters.</td></tr>`;
        updateAdminUsersPagination();
        return;
    }

    tbody.innerHTML = adminUsersState.users.map(u => {
        const id = escapeHtml(String(u.id));
        const username = escapeHtml(String(u.username || 'guest'));
        const fullName = escapeHtml(String(u.full_name || '-'));
        const email = escapeHtml(String(u.email || ''));
        const phone = escapeHtml(String(u.phone || ''));
        const ip = escapeHtml(String(u.ip_address || '-'));
        const device = escapeHtml(String(u.device_type || 'Web'));
        const vip = escapeHtml(String(u.vip_tier || 'VIP 1 Bronze'));
        const status = String(u.status || 'active');
        const bias = String(u.outcome_bias || 'fair');
        const balPKR = Number(u.balance_pkr || 0);
        const balUSD = Number(u.balance_usd || 0);
        const lastActive = u.last_active ? formatRelativeTime(u.last_active) : (u.created_at ? formatRelativeTime(u.created_at) : 'Never');

        let platformBadge = `<span style="background:rgba(0,229,255,0.15); color:#00e5ff; font-weight:800; font-size:10px; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;">🌐 ${device}</span>`;
        if (device.includes('Android')) {
            platformBadge = `<span style="background:rgba(0,231,0,0.15); color:#00e700; font-weight:800; font-size:10px; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;">🤖 ${device}</span>`;
        } else if (device.includes('iOS')) {
            platformBadge = `<span style="background:rgba(255,255,255,0.15); color:#fff; font-weight:800; font-size:10px; padding:2px 6px; border-radius:4px; display:inline-flex; align-items:center; gap:3px;">🍏 ${device}</span>`;
        }

        let playingPill = '';
        if (u.is_playing && u.active_game) {
            playingPill = `
                <span style="background:linear-gradient(135deg, #00ff88 0%, #00b4d8 100%); color:#011c1e; font-weight:900; font-size:10px; padding:2px 7px; border-radius:10px; margin-right:5px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 0 10px rgba(0,255,136,0.7); animation:pulse 1.5s infinite; vertical-align:middle; cursor:pointer;" onclick="openUserDetailsModal('${id}')" title="Playing Now: ${escapeHtml(u.active_game)}">
                    <span style="width:5px; height:5px; background:#011c1e; border-radius:50%; display:inline-block;"></span>
                    🎮 PLAYING: ${escapeHtml(u.active_game)}
                </span>
            `;
        }

        let statusBadge = `<span style="color:#00e700; font-weight:800; font-size:11px;">🟢 Active</span>`;
        if (status === 'suspended') statusBadge = `<span style="color:#ff3b30; font-weight:800; font-size:11px;">⛔ Suspended</span>`;
        if (status === 'pending') statusBadge = `<span style="color:#ffd700; font-weight:800; font-size:11px;">⏳ Pending</span>`;

        const isSuspended = (status === 'suspended');

        return `
            <tr>
                <td>
                    <div style="font-family:var(--font-mono); font-weight:800; color:#00e5ff; font-size:12px;">#${id}</div>
                    <div style="margin-top:2px;">${platformBadge}</div>
                </td>
                <td>
                    <div style="font-weight:900; color:#fff; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                        ${playingPill}
                        <span>${username}</span>
                        ${u.role === 'guest' ? `<span style="font-size:9px; background:#1e293b; color:#ffd700; padding:1px 5px; border-radius:3px;">GUEST</span>` : ''}
                    </div>
                    <div style="font-size:11px; color:#8e9bb0;">${fullName}</div>
                </td>
                <td>
                    <div style="font-size:11px; color:#fff; font-family:var(--font-mono);">${phone || '<span style="color:#64748b;">No phone</span>'}</div>
                    <div style="font-size:10px; color:#8e9bb0;">${email || '<span style="color:#64748b;">No email</span>'}</div>
                </td>
                <td>
                    <div style="font-family:var(--font-mono); font-weight:900; font-size:13px; color:#00e700;">₨ ${balPKR.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                    <div style="font-family:var(--font-mono); font-size:11px; color:#00e5ff;">$ ${balUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </td>
                <td>
                    <div style="font-family:var(--font-mono); font-size:11px; color:#fff;">${ip}</div>
                    <div style="font-size:10px; color:#8e9bb0; max-width:140px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${escapeHtml(u.user_agent || '')}">${device}</div>
                </td>
                <td>
                    <div style="font-size:11px; font-weight:700; color:#cbd5e1;">${lastActive}</div>
                    <div style="font-size:10px; color:#64748b;">Joined: ${u.created_at ? u.created_at.split(' ')[0] : '-'}</div>
                </td>
                <td>
                    <span style="font-weight:800; font-size:11px; color:#ffd700;">⭐ ${vip}</span>
                </td>
                <td>
                    <select onchange="quickSetUserBias('${id}', this.value)" style="background:#070d12; color:#fff; border:1px solid #1e293b; border-radius:4px; font-size:11px; padding:3px 6px; cursor:pointer;">
                        <option value="fair" ${bias === 'fair' ? 'selected' : ''}>⚖️ Fair</option>
                        <option value="force_win" ${bias === 'force_win' ? 'selected' : ''}>👑 Win</option>
                        <option value="force_loss" ${bias === 'force_loss' ? 'selected' : ''}>💀 Force Loss (Max 3/50, &gt;300 Loss)</option>
                    </select>
                </td>
                <td>${statusBadge}</td>
                <td style="text-align:right; white-space:nowrap;">
                    <button class="btn-action-primary" style="padding:4px 8px; font-size:11px; font-weight:800;" onclick="openAdminBalanceModal('${id}')" title="Add or Deduct Balance">
                        💰 Balance
                    </button>
                    <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openUserDetailsModal('${id}')" title="View Full Details, Bets & Transactions">
                        👁️ Detail
                    </button>
                    <button class="btn-secondary" style="padding:4px 8px; font-size:11px; ${isSuspended ? 'color:#00e700;' : 'color:#ff3b30;'}" onclick="toggleUserStatus('${id}', '${status}')" title="${isSuspended ? 'Unsuspend User' : 'Suspend User'}">
                        ${isSuspended ? '✓ Unban' : '⏸️ Ban'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    updateAdminUsersPagination();
}

function updateAdminUsersPagination() {
    const lbl = document.getElementById('admin-users-count-label');
    const ind = document.getElementById('admin-users-page-indicator');
    const btnP = document.getElementById('btn-users-prev');
    const btnN = document.getElementById('btn-users-next');

    const startIdx = adminUsersState.total === 0 ? 0 : (adminUsersState.page - 1) * adminUsersState.limit + 1;
    const endIdx = Math.min(adminUsersState.total, adminUsersState.page * adminUsersState.limit);

    if (lbl) lbl.innerText = `Showing ${startIdx}-${endIdx} of ${adminUsersState.total} total players`;
    if (ind) ind.innerText = `Page ${adminUsersState.page} / ${adminUsersState.totalPages || 1}`;

    if (btnP) btnP.disabled = (adminUsersState.page <= 1);
    if (btnN) btnN.disabled = (adminUsersState.page >= adminUsersState.totalPages);
}

function changeAdminUsersPage(delta) {
    const newPage = adminUsersState.page + delta;
    if (newPage >= 1 && newPage <= adminUsersState.totalPages) {
        loadAdminUsers(newPage);
    }
}

function debounceUserSearch() {
    clearTimeout(adminUsersState.searchDebounceTimer);
    adminUsersState.searchDebounceTimer = setTimeout(() => {
        const input = document.getElementById('input-user-search');
        adminUsersState.search = input ? input.value.trim() : '';
        loadAdminUsers(1);
    }, 350);
}

function filterAdminUsers() {
    const selPlat = document.getElementById('select-user-platform');
    const selStat = document.getElementById('select-user-status');
    const selBias = document.getElementById('select-user-bias');

    adminUsersState.filterPlatform = selPlat ? selPlat.value : 'all';
    adminUsersState.filterStatus = selStat ? selStat.value : 'all';
    adminUsersState.filterBias = selBias ? selBias.value : 'all';

    loadAdminUsers(1);
}

async function openUserDetailsModal(userId) {
    const modal = document.getElementById('modal-user-details');
    if (!modal) return;
    modal.style.display = 'flex';

    document.getElementById('det-username').innerText = 'Loading...';
    document.getElementById('det-userid').innerText = '#' + userId;
    document.getElementById('det-fullname').innerText = '';
    document.getElementById('det-tbody-bets').innerHTML = '<tr><td colspan="7" style="text-align:center; color:#8e9bb0; padding:15px;">Loading bets...</td></tr>';
    document.getElementById('det-tbody-txns').innerHTML = '<tr><td colspan="7" style="text-align:center; color:#8e9bb0; padding:15px;">Loading transactions...</td></tr>';

    try {
        const res = await fetch(`api/admin.php?action=user_detail&id=${encodeURIComponent(userId)}`, {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include'
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            const u = json.data.user;
            currentDetailUser = u;

            document.getElementById('det-username').innerText = u.username || 'guest';
            document.getElementById('det-userid').innerText = '#' + u.id;
            document.getElementById('det-fullname').innerText = u.full_name || 'No name provided';
            document.getElementById('det-badge-platform').innerText = u.device_type || 'Web';
            document.getElementById('det-badge-vip').innerText = u.vip_tier || 'VIP 1';
            
            const badgeStat = document.getElementById('det-badge-status');
            badgeStat.innerText = (u.status || 'active').toUpperCase();
            badgeStat.style.color = (u.status === 'suspended') ? '#ff3b30' : '#00e700';

            const btnTog = document.getElementById('det-btn-toggle-status');
            if (btnTog) {
                btnTog.innerText = (u.status === 'suspended') ? '✓ Unsuspend Player' : '⏸️ Suspend Player';
                btnTog.style.color = (u.status === 'suspended') ? '#00e700' : '#ff3b30';
            }

            document.getElementById('det-bal-pkr').innerText = '₨ ' + Number(u.balance_pkr || 0).toLocaleString();
            document.getElementById('det-bal-usd').innerText = '$ ' + Number(u.balance_usd || 0).toFixed(2);
            document.getElementById('det-phone').innerText = u.phone || 'None';
            document.getElementById('det-email').innerText = u.email || 'None';
            document.getElementById('det-ip').innerText = u.ip_address || '-';
            document.getElementById('det-device').innerText = u.device_type || 'Desktop Web';
            document.getElementById('det-last-active').innerText = u.last_active || u.created_at || '-';

            const selBias = document.getElementById('det-select-bias');
            if (selBias) selBias.value = u.outcome_bias || 'fair';

            const tbodyBets = document.getElementById('det-tbody-bets');
            const bets = json.data.bets || [];
            if (bets.length === 0) {
                tbodyBets.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#8e9bb0; padding:15px;">No bets recorded in database yet.</td></tr>';
            } else {
                tbodyBets.innerHTML = bets.map(b => {
                    const isWin = (b.status === 'WIN' || b.status === 'win' || Number(b.profit_pkr || b.profit) > 0);
                    const betPkr = Number(b.bet_amount_pkr !== undefined ? b.bet_amount_pkr : (b.bet_amount * 280));
                    const payoutPkr = Number(b.payout_pkr !== undefined ? b.payout_pkr : (b.payout * 280));
                    const profitPkr = Number(b.profit_pkr !== undefined ? b.profit_pkr : (payoutPkr - betPkr));
                    const mult = b.multiplier_formatted || (Number(b.multiplier || 1).toFixed(2) + 'x');
                    return `
                        <tr>
                            <td><b>${escapeHtml(b.game)}</b></td>
                            <td style="font-family:var(--font-mono); font-weight:700; color:var(--admin-gold);">₨ ${betPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td style="font-family:var(--font-mono); color:#00e5ff; font-weight:700;">${escapeHtml(mult)}</td>
                            <td style="font-family:var(--font-mono); font-weight:700; color:${isWin ? '#00e700' : '#8e9bb0'};">₨ ${payoutPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td style="font-family:var(--font-mono); font-weight:800; color:${profitPkr >= 0 ? '#00e700' : '#ff3b30'};">${profitPkr >= 0 ? '+' : ''}₨ ${profitPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                            <td><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-weight:800; font-size:10px; ${isWin ? 'background:rgba(0,231,0,0.15); color:#00e700; border:1px solid rgba(0,231,0,0.4);' : 'background:rgba(255,59,48,0.15); color:#ff3b30; border:1px solid rgba(255,59,48,0.4);'}">${isWin ? 'WIN 🏆' : 'LOSS 💀'}</span></td>
                            <td style="color:#8e9bb0; font-size:10px; font-family:var(--font-mono);">${escapeHtml(b.played_at || b.bet_time || '-')}</td>
                        </tr>
                    `;
                }).join('');
            }

            const tbodyTxns = document.getElementById('det-tbody-txns');
            const txns = json.data.transactions || [];
            if (txns.length === 0) {
                tbodyTxns.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#8e9bb0; padding:15px;">No transactions recorded.</td></tr>';
            } else {
                tbodyTxns.innerHTML = txns.map(t => {
                    return `
                        <tr>
                            <td style="font-family:var(--font-mono);">${escapeHtml(t.id)}</td>
                            <td><b>${escapeHtml(t.type || 'Txn')}</b></td>
                            <td style="font-family:var(--font-mono); color:#00e700;">₨ ${Number(t.amount_pkr).toLocaleString()}</td>
                            <td style="font-family:var(--font-mono); color:#00e5ff;">$ ${Number(t.amount_usd).toFixed(2)}</td>
                            <td>${escapeHtml(t.method || '-')}</td>
                            <td><span style="color:#00e700; font-weight:700;">${escapeHtml(t.status || 'Approved')}</span></td>
                            <td style="color:#8e9bb0; font-size:10px;">${t.transaction_date || '-'}</td>
                        </tr>
                    `;
                }).join('');
            }
        }
    } catch(err) {
        alert('Failed to load user details: ' + err.message);
    }
}

function closeUserDetailsModal() {
    const modal = document.getElementById('modal-user-details');
    if (modal) modal.style.display = 'none';
    currentDetailUser = null;
}

function switchDetailSubTab(subTab) {
    const btnBets = document.getElementById('btn-tab-det-bets');
    const btnTxns = document.getElementById('btn-tab-det-txns');
    const secBets = document.getElementById('det-section-bets');
    const secTxns = document.getElementById('det-section-txns');

    if (subTab === 'bets') {
        if (btnBets) { btnBets.className = 'btn-action-primary'; }
        if (btnTxns) { btnTxns.className = 'btn-secondary'; }
        if (secBets) secBets.style.display = 'block';
        if (secTxns) secTxns.style.display = 'none';
    } else {
        if (btnBets) { btnBets.className = 'btn-secondary'; }
        if (btnTxns) { btnTxns.className = 'btn-action-primary'; }
        if (secBets) secBets.style.display = 'none';
        if (secTxns) secTxns.style.display = 'block';
    }
}

function openAdminBalanceModal(userId) {
    const user = adminUsersState.users.find(u => String(u.id) === String(userId)) || currentDetailUser;
    if (!user) return;
    currentBalanceUser = user;

    const modal = document.getElementById('modal-user-balance');
    if (!modal) return;

    document.getElementById('m-adj-user-id').value = user.id;
    document.getElementById('m-adj-username').innerText = user.username || 'guest';
    document.getElementById('m-adj-userid').innerText = '#' + user.id;
    document.getElementById('m-adj-current-pkr').innerText = '₨ ' + Number(user.balance_pkr || 0).toLocaleString();
    document.getElementById('m-adj-current-usd').innerText = '$ ' + Number(user.balance_usd || 0).toFixed(2);
    document.getElementById('m-adj-amount').value = '';
    document.getElementById('m-adj-reason').value = '';

    modal.style.display = 'flex';
}

function openAdminBalanceModalFromDetail() {
    if (currentDetailUser) {
        openAdminBalanceModal(currentDetailUser.id);
    }
}

function closeAdminBalanceModal() {
    const modal = document.getElementById('modal-user-balance');
    if (modal) modal.style.display = 'none';
    currentBalanceUser = null;
}

function setModalAdjAmount(amt, type) {
    const inp = document.getElementById('m-adj-amount');
    if (inp) inp.value = amt;
    if (type) {
        const radio = document.querySelector(`input[name="m_adj_type"][value="${type}"]`);
        if (radio) radio.checked = true;
    }
}

async function submitAdminBalanceAdjWithType(forcedType) {
    if (forcedType) {
        const radio = document.querySelector(`input[name="m_adj_type"][value="${forcedType}"]`);
        if (radio) radio.checked = true;
    }
    await submitAdminBalanceAdj();
}

async function submitAdminBalanceAdj() {
    const userId = document.getElementById('m-adj-user-id').value;
    const typeRadio = document.querySelector('input[name="m_adj_type"]:checked');
    const type = typeRadio ? typeRadio.value : 'add';
    const currency = document.getElementById('m-adj-currency').value || 'PKR';
    const amount = parseFloat(document.getElementById('m-adj-amount').value);
    const reason = document.getElementById('m-adj-reason').value.trim() || `Admin manual balance ${type === 'deduct' ? 'deduction' : 'credit'}`;

    if (isNaN(amount) || amount <= 0) {
        alert('Please enter a valid amount greater than 0.');
        return;
    }

    const username = document.getElementById('m-adj-username')?.innerText || userId;
    const actionText = type === 'deduct' ? `MINUS (- ${currency} ${amount.toLocaleString()})` : `ADD (+ ${currency} ${amount.toLocaleString()})`;
    if (!confirm(`⚠️ Confirm Balance Update:\n\nPlayer: ${username} (${userId})\nAction: ${actionText}\nReason: ${reason}\n\nAre you sure you want to proceed?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin.php?action=adjust_balance&admin_pin=9824', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                user_id: userId,
                type: type,
                currency: currency,
                amount: amount,
                reason: reason
            })
        });
        const json = await res.json();
        if (json && json.success && json.data) {
            const newBalPkr = Number(json.data.balance_pkr || 0);
            const newBalUsd = Number(json.data.balance_usd || 0);

            // Update in local state
            const u = adminUsersState.users.find(x => String(x.id) === String(userId) || String(x.username).toLowerCase() === String(json.data.username).toLowerCase());
            if (u) {
                u.balance_pkr = newBalPkr;
                u.balance_usd = newBalUsd;
            }
            if (currentDetailUser && (String(currentDetailUser.id) === String(userId) || String(currentDetailUser.username).toLowerCase() === String(json.data.username).toLowerCase())) {
                currentDetailUser.balance_pkr = newBalPkr;
                currentDetailUser.balance_usd = newBalUsd;
            }

            alert(`✅ Successfully updated balance!\nPlayer: ${json.data.username}\nNew Balance: ₨ ${newBalPkr.toLocaleString()} ($ ${newBalUsd.toFixed(2)})`);
            closeAdminBalanceModal();
            renderAdminUsersTable();
            renderStats();
            renderWalletEditor();
            if (currentDetailUser && String(currentDetailUser.id) === String(userId)) {
                openUserDetailsModal(userId);
            }
        } else {
            alert('Failed to update balance: ' + ((json && json.message) || (json && json.error) || 'Unknown error'));
        }
    } catch(err) {
        alert('Network error adjusting balance: ' + err.message);
    }
}

async function quickSetUserBias(userId, bias) {
    try {
        const res = await fetch('/api/admin.php?action=update_user&admin_pin=9824', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                id: userId,
                outcome_bias: bias
            })
        });
        const json = await res.json();
        if (json && json.success) {
            console.log(`Updated outcome bias for user ${userId} to ${bias}`);
        } else {
            alert('Failed to update bias: ' + ((json && json.message) || 'Error'));
        }
    } catch(err) {
        alert('Error updating bias: ' + err.message);
    }
}

async function saveUserDetailBias() {
    if (!currentDetailUser) return;
    const selBias = document.getElementById('det-select-bias');
    const bias = selBias ? selBias.value : 'fair';
    await quickSetUserBias(currentDetailUser.id, bias);
    alert(`✅ RTP Outcome Bias updated to "${bias.toUpperCase()}" for ${currentDetailUser.username}!`);
    loadAdminUsers(adminUsersState.page);
}

async function toggleUserStatus(userId, currentStatus) {
    const newStatus = (currentStatus === 'suspended') ? 'active' : 'suspended';
    const actionWord = (newStatus === 'suspended') ? 'Suspend/Ban' : 'Unsuspend/Activate';
    if (!confirm(`Are you sure you want to ${actionWord} User #${userId}?`)) {
        return;
    }

    try {
        const res = await fetch('/api/admin.php?action=update_user&admin_pin=9824', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Admin-Pin': '9824'
            },
            credentials: 'include',
            body: JSON.stringify({
                admin_pin: '9824',
                id: userId,
                status: newStatus
            })
        });
        const json = await res.json();
        if (json && json.success) {
            alert(`User #${userId} is now ${newStatus.toUpperCase()}`);
            loadAdminUsers(adminUsersState.page);
            if (currentDetailUser && String(currentDetailUser.id) === String(userId)) {
                openUserDetailsModal(userId);
            }
        } else {
            alert('Failed to update user status: ' + ((json && json.message) || 'Error'));
        }
    } catch(err) {
        alert('Error updating status: ' + err.message);
    }
}

function toggleUserStatusFromDetail() {
    if (currentDetailUser) {
        toggleUserStatus(currentDetailUser.id, currentDetailUser.status || 'active');
    }
}

function formatRelativeTime(dateStr) {
    if (!dateStr) return 'Never';
    try {
        const d = new Date(dateStr.replace(' ', 'T'));
        const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
        if (diffSec < 60) return 'Just now';
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
        return dateStr.split(' ')[0];
    } catch(e) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================
// Real-Time Audited Betslip Ledger System (Real PKR)
// ============================================================
let currentBetslipPage = 1;
let currentBetslipTotalPages = 1;
let betslipSearchTimer = null;

async function loadAdminBetslips(page = 1) {
    currentBetslipPage = page;
    const tbody = document.getElementById('admin-betslips-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align:center; padding:35px; color:#8e9bb0;">
                    <div style="font-size:24px; margin-bottom:8px;">⏳</div>
                    <div>Loading real-time player betslips from database...</div>
                </td>
            </tr>
        `;
    }

    const q = (document.getElementById('admin-betslip-search-input') ? document.getElementById('admin-betslip-search-input').value.trim() : '');
    const game = (document.getElementById('admin-betslip-filter-game') ? document.getElementById('admin-betslip-filter-game').value : 'all');
    const status = (document.getElementById('admin-betslip-filter-status') ? document.getElementById('admin-betslip-filter-status').value : 'all');
    const limit = (document.getElementById('admin-betslip-page-size') ? document.getElementById('admin-betslip-page-size').value : 50);

    try {
        const res = await fetch(`../api/admin.php?action=betslips&page=${page}&limit=${limit}&q=${encodeURIComponent(q)}&game=${encodeURIComponent(game)}&status=${encodeURIComponent(status)}&admin_pin=9824`, {
            headers: { 'X-Admin-Pin': '9824' },
            credentials: 'include'
        });
        if (!res.ok) throw new Error('Network error: ' + res.status);
        const json = await res.json();
        if (!json || !json.success) throw new Error(json.message || 'Failed to load bets');

        const data = json.data;
        const bets = data.bets || [];
        currentBetslipTotalPages = data.total_pages || 1;

        // Populate Summary KPIs in PKR
        const summary = data.summary || {};
        const elTotalCount = document.getElementById('betslip-kpi-count');
        const elTurnover = document.getElementById('betslip-kpi-turnover');
        const elPayouts = document.getElementById('betslip-kpi-payouts');
        const elGgr = document.getElementById('betslip-kpi-ggr');

        if (elTotalCount) elTotalCount.innerText = (data.total || 0).toLocaleString() + ' Bets';
        if (elTurnover) elTurnover.innerText = '₨ ' + Number(summary.total_turnover_pkr || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (elPayouts) elPayouts.innerText = '₨ ' + Number(summary.total_payouts_pkr || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        if (elGgr) {
            const houseNet = Number(summary.total_turnover_pkr || 0) - Number(summary.total_payouts_pkr || 0);
            elGgr.innerText = (houseNet >= 0 ? '+' : '') + '₨ ' + houseNet.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
            elGgr.style.color = houseNet >= 0 ? '#00e700' : '#ff3b30';
        }

        // Populate game dropdown options dynamically
        const selGame = document.getElementById('admin-betslip-filter-game');
        if (selGame && selGame.options.length <= 1 && data.games) {
            data.games.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g;
                opt.textContent = '🎮 ' + g;
                selGame.appendChild(opt);
            });
            if (game !== 'all') selGame.value = game;
        }

        // Render table rows
        if (!tbody) return;
        if (bets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:35px; color:#8e9bb0;">
                        <div style="font-size:24px; margin-bottom:8px;">🎲</div>
                        <div>No player betslips found matching current filters.</div>
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = bets.map(b => {
                const isWin = (b.status === 'WIN' || Number(b.profit_pkr || b.profit) > 0);
                const betPkr = Number(b.bet_amount_pkr !== undefined ? b.bet_amount_pkr : (b.bet_amount * 280));
                const payPkr = Number(b.payout_pkr !== undefined ? b.payout_pkr : (b.payout * 280));
                const profitPkr = Number(b.profit_pkr !== undefined ? b.profit_pkr : (payPkr - betPkr));
                const mult = b.multiplier_formatted || (Number(b.multiplier || 1).toFixed(2) + 'x');
                const timeStr = b.played_at || b.bet_time || '-';

                return `
                    <tr>
                        <td style="font-family:var(--font-mono); font-size:11px; color:#8e9bb0;">
                            <span style="user-select:all; cursor:pointer;" title="Click to copy ID" onclick="navigator.clipboard.writeText('${escapeHtml(b.id)}')">
                                ${escapeHtml(b.id)}
                            </span>
                        </td>
                        <td>
                            <div style="font-weight:800; color:#fff; display:flex; align-items:center; gap:6px;">
                                <span style="cursor:pointer; color:var(--admin-accent);" onclick="openUserDetailsModal('${escapeHtml(b.user_id)}')">
                                    👤 ${escapeHtml(b.username)}
                                </span>
                            </div>
                            <div style="font-size:10px; color:#8e9bb0; font-family:var(--font-mono); margin-top:2px;">
                                ${escapeHtml(b.phone || b.user_id)}
                            </div>
                        </td>
                        <td>
                            <span style="background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); border-radius:4px; padding:3px 8px; font-weight:700; color:#e2e8f0; font-size:11px;">
                                ${escapeHtml(b.game)}
                            </span>
                        </td>
                        <td style="font-family:var(--font-mono); font-weight:800; font-size:13px; color:var(--admin-gold);">
                            ₨ ${betPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td style="font-family:var(--font-mono); font-weight:800; color:#00e5ff; font-size:12px;">
                            ${escapeHtml(mult)}
                        </td>
                        <td style="font-family:var(--font-mono); font-weight:800; font-size:13px; color:${isWin ? '#00e700' : '#8e9bb0'};">
                            ₨ ${payPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td style="font-family:var(--font-mono); font-weight:800; font-size:12px; color:${profitPkr >= 0 ? '#00e700' : '#ff3b30'};">
                            ${profitPkr >= 0 ? '+' : ''}₨ ${profitPkr.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td>
                            <span style="display:inline-block; padding:3px 9px; border-radius:4px; font-weight:900; font-size:10px; letter-spacing:0.5px; ${isWin ? 'background:rgba(0,231,0,0.15); color:#00e700; border:1px solid rgba(0,231,0,0.4);' : 'background:rgba(255,59,48,0.15); color:#ff3b30; border:1px solid rgba(255,59,48,0.4);'}">
                                ${isWin ? 'WIN 🏆' : 'LOSS 💀'}
                            </span>
                        </td>
                        <td style="font-size:11px; color:#8e9bb0; font-family:var(--font-mono); white-space:nowrap;">
                            ${escapeHtml(timeStr)}
                        </td>
                        <td style="text-align:right;">
                            <button class="btn-secondary" style="padding:4px 8px; font-size:11px;" onclick="openUserDetailsModal('${escapeHtml(b.user_id)}')" title="View Player Profile">
                                👁️ Player
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Pagination controls
        const countLabel = document.getElementById('admin-betslip-count-label');
        if (countLabel) {
            const start = bets.length > 0 ? (page - 1) * limit + 1 : 0;
            const end = (page - 1) * limit + bets.length;
            countLabel.innerText = `Showing ${start} - ${end} of ${(data.total || 0).toLocaleString()} real bets`;
        }
        const pageIndicator = document.getElementById('admin-betslip-page-indicator');
        if (pageIndicator) pageIndicator.innerText = `Page ${page} of ${currentBetslipTotalPages}`;
        const prevBtn = document.getElementById('btn-betslip-prev');
        const nextBtn = document.getElementById('btn-betslip-next');
        if (prevBtn) prevBtn.disabled = page <= 1;
        if (nextBtn) nextBtn.disabled = page >= currentBetslipTotalPages;

    } catch (err) {
        console.error('Error loading betslips:', err);
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:30px; color:#ff3b30;">
                        Failed to load betslips: ${escapeHtml(err.message)}
                        <br><button class="btn-action-primary" style="margin-top:10px; padding:6px 14px;" onclick="loadAdminBetslips(1)">Retry</button>
                    </td>
                </tr>
            `;
        }
    }
}

function debounceBetslipSearch() {
    if (betslipSearchTimer) clearTimeout(betslipSearchTimer);
    betslipSearchTimer = setTimeout(() => {
        loadAdminBetslips(1);
    }, 350);
}

function changeAdminBetslipPage(delta) {
    const newPage = currentBetslipPage + delta;
    if (newPage >= 1 && newPage <= currentBetslipTotalPages) {
        loadAdminBetslips(newPage);
    }
}

