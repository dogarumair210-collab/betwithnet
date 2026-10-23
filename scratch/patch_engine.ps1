$content = [System.IO.File]::ReadAllText('scratch/main_index.js')
Write-Host "Original length: $($content.Length)"

# Header bridge
$header = @'
// --- BET WITH NET REAL WALLET BRIDGE ---
window.__bwn_getRealBalance = function() {
    try {
        if (window.parent && typeof window.parent.getRealBalance === 'function') {
            return window.parent.getRealBalance();
        }
        if (window.wallet && typeof window.wallet.getBalance === 'function') {
            return window.wallet.getBalance();
        }
        var u = JSON.parse(localStorage.getItem('bwn_session_user') || localStorage.getItem('currentUser') || 'null');
        if (u && (u.balance_pkr !== undefined || u.balancePKR !== undefined)) return parseFloat(u.balance_pkr !== undefined ? u.balance_pkr : u.balancePKR);
        if (u && u.balance !== undefined) return parseFloat(u.balance);
        var b = localStorage.getItem("BETWITHNET_balance");
        if (b !== null) return parseFloat(b);
    } catch(e) {}
    return 0;
};

window.__bwn_onBet = function(amount, betOption) {
    try {
        if (window.parent && typeof window.parent.placeRealBetFromGame === 'function') {
            return window.parent.placeRealBetFromGame(amount, betOption);
        }
        if (window.wallet && typeof window.wallet.placeBet === 'function') {
            return window.wallet.placeBet(amount, 'Teen Patti Versus (' + betOption + ')');
        }
        var curBal = window.__bwn_getRealBalance();
        if (curBal >= amount) {
            localStorage.setItem("BETWITHNET_balance", (curBal - amount).toString());
            return true;
        }
    } catch(e) {
        console.error(e);
    }
    return false;
};

window.__bwn_onWin = function(stake, multiplier, winAmount, betOption) {
    try {
        if (window.parent && typeof window.parent.winRealBetFromGame === 'function') {
            window.parent.winRealBetFromGame(stake, multiplier, winAmount, betOption);
            return;
        }
        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(stake, winAmount, 'Teen Patti Versus (' + betOption + ')', multiplier);
            return;
        }
        var curBal = window.__bwn_getRealBalance();
        localStorage.setItem("BETWITHNET_balance", (curBal + winAmount).toString());
    } catch(e) {
        console.error(e);
    }
};

window.__bwn_onRefund = function(amount, betOption) {
    try {
        if (window.parent && typeof window.parent.refundRealBetFromGame === 'function') {
            window.parent.refundRealBetFromGame(amount, betOption);
            return;
        }
        if (window.wallet && typeof window.wallet.creditWin === 'function') {
            window.wallet.creditWin(0, amount, 'Teen Patti Refund (' + betOption + ')', 1);
            return;
        }
        var curBal = window.__bwn_getRealBalance();
        localStorage.setItem("BETWITHNET_balance", (curBal + amount).toString());
    } catch(e) {}
};

'@

$patched = $header + $content

# Patch 2: getAuthenticateBody
$target2 = '"1"===_.default.Instance.getUrlParameter("test")?e={test:!0,balance:1e4,currency:_.default.Instance.getUrlParameter("currency")||n}:_.default.Instance.getToken()||(e={test:!0,balance:1e4,currency:_.default.Instance.getUrlParameter("currency")||n})'
$replace2 = 'var _bwnBal=window.__bwn_getRealBalance();e={test:!0,balance:_bwnBal,currency:"PKR"}'
if ($patched.Contains($target2)) {
    $patched = $patched.Replace($target2, $replace2)
    Write-Host "Patch 2 (getAuthenticateBody): SUCCESS"
} else {
    Write-Host "Patch 2 (getAuthenticateBody): NOT FOUND" -ForegroundColor Red
}

# Patch 3: player model
$target3 = 'push(t,"1307fht42BKP6NlAWObMZb5","player"),Object.defineProperty(n,"__esModule",{value:!0});var o=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return __extends(t,e),t.prototype.associateAttributes=function(){e.prototype.associateAttributes.call(this),this.nickName=this.nickName||"",this.balance=this.balance||0},t}(e("./base_model").default);'
$replace3 = 'push(t,"1307fht42BKP6NlAWObMZb5","player"),Object.defineProperty(n,"__esModule",{value:!0});var o=function(e){function t(){return null!==e&&e.apply(this,arguments)||this}return __extends(t,e),t.prototype.associateAttributes=function(){e.prototype.associateAttributes.call(this),this.nickName=this.nickName||"Player",this.currency="PKR",this.currencyDetails={symbol:"Rs. ",code:"PKR",decimalDigits:2},Object.defineProperty(this,"balance",{get:function(){return window.__bwn_getRealBalance();},set:function(v){},configurable:!0,enumerable:!0})},t}(e("./base_model").default);'
if ($patched.Contains($target3)) {
    $patched = $patched.Replace($target3, $replace3)
    Write-Host "Patch 3 (player model balance): SUCCESS"
} else {
    Write-Host "Patch 3 (player model balance): NOT FOUND" -ForegroundColor Red
}

# Patch 4: placeBet
$target4 = 'if(y.isSuccess()){var v=r.find(l,function(t){return t.betOption===e&&t.isPending()});'
$replace4 = 'if(y.isSuccess()){var _stk=d.nonRoundBaseGame?t:_;if(!window.__bwn_onBet(_stk,e)){return y.setError("general_balance_is_insufficient");}var v=r.find(l,function(t){return t.betOption===e&&t.isPending()});'
if ($patched.Contains($target4)) {
    $patched = $patched.Replace($target4, $replace4)
    Write-Host "Patch 4 (placeBet hook): SUCCESS"
} else {
    Write-Host "Patch 4 (placeBet hook): NOT FOUND" -ForegroundColor Red
}

# Patch 7: undo refund
$target7 = 'r.each(s,function(e){o.push(e.betOption),a.default.Instance.addPlayerBettingAmountAction(e.betOption,-e.getAmount(),0),i[e.betOption]=e.getAmount()})'
$replace7 = 'r.each(s,function(e){window.__bwn_onRefund(e.getAmount(),e.betOption),o.push(e.betOption),a.default.Instance.addPlayerBettingAmountAction(e.betOption,-e.getAmount(),0),i[e.betOption]=e.getAmount()})'
if ($patched.Contains($target7)) {
    $patched = $patched.Replace($target7, $replace7)
    Write-Host "Patch 7 (undo refund hook): SUCCESS"
} else {
    Write-Host "Patch 7 (undo refund hook): NOT FOUND" -ForegroundColor Red
}

# Patch 8: simulate immediate success for postBetsHttper in demo/standalone
$target8 = 't.fire({bets:y},{"payload-signature":w})'
$replace8 = 'Promise.resolve([{id:"bwn_batch_"+Date.now()}])'
if ($patched.Contains($target8)) {
    $patched = $patched.Replace($target8, $replace8)
    Write-Host "Patch 8 (_submitBets instant resolve): SUCCESS"
} else {
    Write-Host "Patch 8 (_submitBets instant resolve): NOT FOUND" -ForegroundColor Red
}

# Patch 9: formatDomain - PREVENT REPLACING DOMAIN WITH betwithnet.com
$target9 = 'e.prototype.formatDomain=function(e,t){var n=new URL(t),o=n.hostname.split(".");if(o.length<2)throw new Error("URL does not have enough parts to replace");for(var r=["com","net","org","co","io","edu","gov","sg","uk"],i=-1,a=o.length-1;a>=0;a--)if(r.includes(o[a])){i=a;break}if(-1===i)throw new Error("No valid TLD found in hostname: "+n.hostname);var s=o.slice(0,i-1);return n.hostname=__spreadArrays(s,e.split(".")).join("."),t.endsWith("ws")?n.protocol+"/"+n.hostname+n.pathname:n.protocol+"//"+n.hostname}'
$replace9 = 'e.prototype.formatDomain=function(e,t){return t;}'
if ($patched.Contains($target9)) {
    $patched = $patched.Replace($target9, $replace9)
    Write-Host "Patch 9 (formatDomain bypass): SUCCESS"
} else {
    Write-Host "Patch 9 (formatDomain bypass): NOT FOUND" -ForegroundColor Red
}

# Patch 10: overideDomain - DISABLE DYNAMIC DOMAIN
$target10 = 'e.prototype.overideDomain=function(){this.configData.serverUrl=this.formatDomain(this.serverDomain,this.configData.serverUrl),this.configData.serverUrlROR=this.formatDomain(this.serverDomain,this.configData.serverUrlROR),i.isArray(this.configData.socketServerUrlROR)?e.socketServerUrl=i.sample(this.configData.socketServerUrl):e.socketServerUrl=this.configData.socketServerUrl,i.isArray(this.configData.socketServerUrlROR)?e.socketServerUrlROR=i.sample(this.configData.socketServerUrlROR):e.socketServerUrlROR=this.configData.socketServerUrlROR,null!=e.socketServerUrlROR&&(e.socketServerUrlROR=this.formatDomain(this.serverDomain,e.socketServerUrlROR)),null!=e.socketServerUrl&&(e.socketServerUrl=this.formatDomain(this.serverDomain,e.socketServerUrl))}'
$replace10 = 'e.prototype.overideDomain=function(){this.configData.dynamicDomain=false;}'
if ($patched.Contains($target10)) {
    $patched = $patched.Replace($target10, $replace10)
    Write-Host "Patch 10 (overideDomain bypass): SUCCESS"
} else {
    Write-Host "Patch 10 (overideDomain bypass): NOT FOUND" -ForegroundColor Red
}

# Patch 11: REMOVE ALERT(N) ON AUTH FAILURE AND GRACEFULLY PROCEED
$target11 = 'case 11:return n=i.sent(),alert(n),this.gameState=T.GameCrashed,this.dispatchEvent(new Event(T.GameCrashed)),[3,12];'
$replace11 = 'case 11:console.warn("Auth bypass:",i.sent()),this.authenticatePlayer(this.session,this.sessionResponseData),this.checkRoomTag(),this.roomTagBlock||(this.dispatchEvent(new Event(T.Authenticated)),this.dispatchEvent(new Event(T.PlayerUpdated))),this.initSymbol();return[3,12];'
if ($patched.Contains($target11)) {
    $patched = $patched.Replace($target11, $replace11)
    Write-Host "Patch 11 (alert bypass on auth): SUCCESS"
} else {
    Write-Host "Patch 11 (alert bypass on auth): NOT FOUND" -ForegroundColor Red
}

# Patch 12: REMOVE ALERT(T) ON FESTIVE ART FAILURE
$target12 = 'case 2:return t=n.sent(),alert(t),[3,3];'
$replace12 = 'case 2:console.warn("Festive bypass:",n.sent());return[3,3];'
if ($patched.Contains($target12)) {
    $patched = $patched.Replace($target12, $replace12)
    Write-Host "Patch 12 (alert bypass on festive): SUCCESS"
} else {
    Write-Host "Patch 12 (alert bypass on festive): NOT FOUND" -ForegroundColor Red
}

# Patch 13: REAL WIN HOOK IN animatePostClosedBet
$target13 = 'var o=this,r=s.default.Instance,i=r.betManager.getPlayerGrossWinAmount(),c=r.betManager.getPlayerWinAmount();'
$replace13 = 'var o=this,r=s.default.Instance,i=r.betManager.getPlayerGrossWinAmount(),c=r.betManager.getPlayerWinAmount();try{var _rRef=(r.CurrentRound&&r.CurrentRound.referenceNumber)||(Date.now().toString());if(i>0&&window.__bwn_lastCreditedRound!==_rRef){window.__bwn_lastCreditedRound=_rRef;r.betManager.serverResponded=!0;if(typeof window.__bwn_onWin==="function"){window.__bwn_onWin(0,1,i,"Teen Patti");}}}catch(e){console.error("bwn win error:",e);}'
if ($patched.Contains($target13)) {
    $patched = $patched.Replace($target13, $replace13)
    Write-Host "Patch 13 (animatePostClosedBet win hook): SUCCESS"
} else {
    Write-Host "Patch 13 (animatePostClosedBet win hook): NOT FOUND" -ForegroundColor Red
}

# Patch 14: SUPPRESS IN-GAME WARNING TOAST ("Waiting for server...")
$target14 = 't.prototype.showWarningToast=function(e){return this.warningToastNode&&this.hideWarningToast()'
$replace14 = 't.prototype.showWarningToast=function(e){return null;this.warningToastNode&&this.hideWarningToast()'
if ($patched.Contains($target14)) {
    $patched = $patched.Replace($target14, $replace14)
    Write-Host "Patch 14 (suppress showWarningToast): SUCCESS"
} else {
    Write-Host "Patch 14 (suppress showWarningToast): NOT FOUND" -ForegroundColor Red
}

# Patch 15: SUPPRESS IN-GAME BASIC TOAST
$target15 = 't.prototype._showBasicToast=function(e,t){if((this.basicToastNode||this.bettingToastNode)&&this.hideBasicToast()'
$replace15 = 't.prototype._showBasicToast=function(e,t){return null;if((this.basicToastNode||this.bettingToastNode)&&this.hideBasicToast()'
if ($patched.Contains($target15)) {
    $patched = $patched.Replace($target15, $replace15)
    Write-Host "Patch 15 (suppress _showBasicToast): SUCCESS"
} else {
    Write-Host "Patch 15 (suppress _showBasicToast): NOT FOUND" -ForegroundColor Red
}

# Patch 16: TEEN PATTI VERSUS MAIN WIN HOOK IN custom_result_display_controller
$target16 = 't.prototype.animatePostClosedBet=function(){e.prototype.animatePostClosedBet.call(this),this.tableNode;var t=i.default.Instance;t.betManager.getPlayerWinAmount(),this.showWinningBetOptions()'
$replace16 = 't.prototype.animatePostClosedBet=function(){e.prototype.animatePostClosedBet.call(this),this.tableNode;var t=i.default.Instance;try{var _rRef=(t.CurrentRound&&t.CurrentRound.referenceNumber)||(Date.now().toString());var _winOpts=(t.CurrentRound&&typeof t.CurrentRound.getWinningBetOptions==="function")?t.CurrentRound.getWinningBetOptions():{};var _gross=0;if(t.betManager){if(typeof t.betManager.getPlayerGrossWinAmount==="function"){_gross=t.betManager.getPlayerGrossWinAmount();}if((!_gross||_gross<=0)&&_winOpts){for(var _opt in _winOpts){if(_winOpts.hasOwnProperty(_opt)){var _bAmt=typeof t.betManager.getPlayerBetAmount==="function"?t.betManager.getPlayerBetAmount(_opt):0;if(_bAmt>0){var _m=parseFloat(_winOpts[_opt]);if(isNaN(_m)||_m<0)_m=1;_gross+=_bAmt*(_m+1);}}}}if(_gross>0&&window.__bwn_lastCreditedRound!==_rRef){window.__bwn_lastCreditedRound=_rRef;t.betManager.serverResponded=!0;if(typeof window.__bwn_onWin==="function"){window.__bwn_onWin(0,1,_gross,"Teen Patti");}if(t.playerInfoController&&typeof t.playerInfoController.playWinAnimation==="function"){t.playerInfoController.playWinAnimation(t.betManager.getPlayerWinAmount(),_gross);}}}}catch(err){console.error("BWN Teen Patti Win Error:",err);}t.betManager.getPlayerWinAmount(),this.showWinningBetOptions()'
if ($patched.Contains($target16)) {
    $patched = $patched.Replace($target16, $replace16)
    Write-Host "Patch 16 (custom_result_display_controller Teen Patti win hook): SUCCESS"
} else {
    Write-Host "Patch 16 (custom_result_display_controller Teen Patti win hook): NOT FOUND" -ForegroundColor Red
}

[System.IO.File]::WriteAllText('scratch/main_index_patched.js', $patched)
Write-Host "Saved scratch/main_index_patched.js, new length: $($patched.Length)"

