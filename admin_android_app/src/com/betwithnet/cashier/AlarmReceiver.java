package com.betwithnet.cashier;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

/**
 * AlarmReceiver triggered by AlarmManager.setExactAndAllowWhileIdle() every few seconds
 * to guarantee that Android OS Doze mode and background restrictions never halt
 * the Cashier monitor while the app is closed or the screen is off.
 */
public class AlarmReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null) return;
        try {
            Intent serviceIntent = new Intent(context, CashierBackgroundService.class);
            serviceIntent.setAction(CashierBackgroundService.ACTION_TICK);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {}
    }
}
