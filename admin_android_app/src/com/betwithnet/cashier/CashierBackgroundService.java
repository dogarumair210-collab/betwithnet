package com.betwithnet.cashier;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import android.os.Vibrator;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CashierBackgroundService extends Service {

    public static final String ACTION_STOP_ALARM = "com.betwithnet.cashier.STOP_ALARM";
    public static final String ACTION_START_MONITOR = "com.betwithnet.cashier.START_MONITOR";
    public static final String ACTION_TICK = "com.betwithnet.cashier.ACTION_TICK";

    private static final String CHANNEL_SERVICE_ID = "bwn_cashier_service_channel";
    private static final String CHANNEL_ALARM_ID = "bwn_cashier_alarm_v3";
    private static final int NOTIF_SERVICE_ID = 9001;
    private static final int NOTIF_ALARM_ID = 9002;

    private static final String API_URL = "https://betwithnet.com/api/admin.php?action=pending_notifications&admin_pin=7777";
    private static final int POLLING_INTERVAL_MS = 3000; // 3 seconds
    private static final int ALARM_DURATION_MS = 30000; // 30 seconds

    private static final String PREFS_NAME = "bwn_cashier_prefs";
    private static final String KEY_LAST_PENDING = "last_total_pending";

    private ExecutorService networkExecutor;
    private Handler handler;
    private Runnable pollingRunnable;
    private Runnable stopAlarmRunnable;

    private MediaPlayer mediaPlayer;
    private Ringtone backupRingtone;
    private Vibrator vibrator;
    private PowerManager.WakeLock cpuWakeLock;
    private PowerManager.WakeLock screenWakeLock;

    private static volatile boolean isAlarmRinging = false;
    private static volatile boolean isAppInForeground = false;
    private int lastTotalPending = -1;

    public static void setAppForegroundState(boolean inForeground) {
        isAppInForeground = inForeground;
    }

    public static boolean isAppInForeground() {
        return isAppInForeground;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        handler = new Handler(Looper.getMainLooper());
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        networkExecutor = Executors.newSingleThreadExecutor();

        // Restore persisted pending count
        SharedPreferences sp = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        lastTotalPending = sp.getInt(KEY_LAST_PENDING, -1);

        createNotificationChannels();

        // Start Foreground Service with persistent status notification
        Notification notification = buildForegroundServiceNotification("Cashier monitor active (Real-time deposit/withdrawal alerts)");
        try {
            startForeground(NOTIF_SERVICE_ID, notification);
        } catch (Exception e) {}

        startPollingLoop();
        scheduleNextAlarmWakeup();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            if (ACTION_STOP_ALARM.equals(action)) {
                stopAlarm();
                return START_STICKY;
            } else if (ACTION_TICK.equals(action)) {
                // Wakeup tick from AlarmManager
                performNetworkCheckAsync();
                scheduleNextAlarmWakeup();
                return START_STICKY;
            }
        }

        // Default or ACTION_START_MONITOR: ensure polling and exact wakeup are running
        scheduleNextAlarmWakeup();
        return START_STICKY;
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // When app is swiped away or closed from recent apps:
        // Schedule immediate AlarmManager respawn to make service indestructible
        try {
            scheduleNextAlarmWakeup();

            Intent restartServiceIntent = new Intent(getApplicationContext(), CashierBackgroundService.class);
            restartServiceIntent.setPackage(getPackageName());
            restartServiceIntent.setAction(ACTION_START_MONITOR);
            PendingIntent restartPendingIntent = PendingIntent.getService(
                getApplicationContext(), 1, restartServiceIntent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? (PendingIntent.FLAG_ONE_SHOT | PendingIntent.FLAG_IMMUTABLE) : PendingIntent.FLAG_ONE_SHOT
            );
            AlarmManager alarmService = (AlarmManager) getApplicationContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmService != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmService.setExactAndAllowWhileIdle(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + 1000,
                        restartPendingIntent
                    );
                } else {
                    alarmService.set(
                        AlarmManager.ELAPSED_REALTIME_WAKEUP,
                        SystemClock.elapsedRealtime() + 1000,
                        restartPendingIntent
                    );
                }
            }
        } catch (Exception e) {}
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void scheduleNextAlarmWakeup() {
        try {
            AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            Intent intent = new Intent(this, AlarmReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(
                this, 999, intent,
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE) : PendingIntent.FLAG_UPDATE_CURRENT
            );

            long triggerAt = SystemClock.elapsedRealtime() + POLLING_INTERVAL_MS;

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                am.setExact(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            } else {
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, triggerAt, pi);
            }
        } catch (Exception e) {}
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;

            // 1. Silent persistent background monitoring service channel
            NotificationChannel serviceChannel = new NotificationChannel(
                CHANNEL_SERVICE_ID,
                "Cashier Desk Status",
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription("Keeps cashier monitor active in background");
            serviceChannel.setShowBadge(false);
            nm.createNotificationChannel(serviceChannel);

            // 2. High-priority loud 30-second alarm channel WITH EXPLICIT SOUND & VIBRATION
            NotificationChannel alarmChannel = new NotificationChannel(
                CHANNEL_ALARM_ID,
                "Cashier 30s Deposit/Withdrawal Alarm",
                NotificationManager.IMPORTANCE_HIGH
            );
            alarmChannel.setDescription("Loud 30-second alarm when a deposit or withdrawal arrives");
            alarmChannel.enableVibration(true);
            alarmChannel.setVibrationPattern(new long[]{0, 1000, 400, 1000, 400, 1000, 400});
            alarmChannel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            }
            if (soundUri == null) {
                soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            }

            if (soundUri != null) {
                AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
                alarmChannel.setSound(soundUri, audioAttributes);
            }

            nm.createNotificationChannel(alarmChannel);
        }
    }

    private Notification buildForegroundServiceNotification(String text) {
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(
            this, 0, openIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE) : PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_SERVICE_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        builder.setContentTitle("👑 BWN Cashier Desk Live")
            .setContentText(text)
            .setSmallIcon(getResources().getIdentifier("ic_launcher", "mipmap", getPackageName()))
            .setContentIntent(pi)
            .setOngoing(true);

        return builder.build();
    }

    private void startPollingLoop() {
        if (pollingRunnable != null) return;
        pollingRunnable = new Runnable() {
            @Override
            public void run() {
                performNetworkCheckAsync();
                if (handler != null) {
                    handler.postDelayed(this, POLLING_INTERVAL_MS);
                }
            }
        };
        handler.postDelayed(pollingRunnable, 1000);
    }

    private void performNetworkCheckAsync() {
        if (networkExecutor == null || networkExecutor.isShutdown()) {
            networkExecutor = Executors.newSingleThreadExecutor();
        }
        networkExecutor.execute(new Runnable() {
            @Override
            public void run() {
                checkPendingRequestsFromServer();
            }
        });
    }

    private void checkPendingRequestsFromServer() {
        // Hold CPU wake lock during network query
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        PowerManager.WakeLock tempLock = null;
        if (pm != null) {
            tempLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bwn:poll_query");
            try { tempLock.acquire(4000); } catch (Exception e) {}
        }

        HttpURLConnection conn = null;
        try {
            URL url = new URL(API_URL);
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.setRequestProperty("User-Agent", "BWN-Cashier-Android/1.2");
            conn.setRequestProperty("X-Admin-Pin", "7777");
            conn.setRequestProperty("Cache-Control", "no-cache");

            int code = conn.getResponseCode();
            if (code == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }
                reader.close();

                String json = sb.toString();
                parseAndTriggerAlarmIfNeeded(json);
            }
        } catch (Exception e) {
            // Silently retry next tick
        } finally {
            if (conn != null) {
                try { conn.disconnect(); } catch (Exception e) {}
            }
            if (tempLock != null && tempLock.isHeld()) {
                try { tempLock.release(); } catch (Exception e) {}
            }
        }
    }

    private void parseAndTriggerAlarmIfNeeded(String json) {
        int totalPending = 0;
        int depCount = 0;
        int withCount = 0;

        Pattern pTotal = Pattern.compile("\"total_pending\"\\s*:\\s*(\\d+)");
        Matcher mTotal = pTotal.matcher(json);
        if (mTotal.find()) {
            totalPending = Integer.parseInt(mTotal.group(1));
        } else {
            Pattern pDep = Pattern.compile("\"pending_deposits_count\"\\s*:\\s*(\\d+)");
            Matcher mDep = pDep.matcher(json);
            if (mDep.find()) depCount = Integer.parseInt(mDep.group(1));

            Pattern pWith = Pattern.compile("\"pending_withdrawals_count\"\\s*:\\s*(\\d+)");
            Matcher mWith = pWith.matcher(json);
            if (mWith.find()) withCount = Integer.parseInt(mWith.group(1));

            totalPending = depCount + withCount;
        }

        // Persist totalPending
        SharedPreferences sp = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        if (lastTotalPending == -1) {
            // Service just initialized: if there is an unhandled pending request, ALARM NOW!
            lastTotalPending = totalPending;
            sp.edit().putInt(KEY_LAST_PENDING, totalPending).apply();

            if (totalPending > 0) {
                final int pendingCount = totalPending;
                handler.post(new Runnable() {
                    @Override
                    public void run() {
                        trigger30SecondAlarm(pendingCount);
                    }
                });
            }
            return;
        }

        if (totalPending > lastTotalPending) {
            // NEW REAL USER TRANSACTION ARRIVED!
            final int newIncoming = totalPending - lastTotalPending;
            lastTotalPending = totalPending;
            sp.edit().putInt(KEY_LAST_PENDING, totalPending).apply();

            handler.post(new Runnable() {
                @Override
                public void run() {
                    trigger30SecondAlarm(newIncoming);
                }
            });
        } else {
            lastTotalPending = totalPending;
            sp.edit().putInt(KEY_LAST_PENDING, totalPending).apply();
        }
    }

    /**
     * RINGS LOUDLY FOR 30 SECONDS WHEN APP IS OFF / IN BACKGROUND OR SCREEN IS OFF!
     */
    public synchronized void trigger30SecondAlarm(int newItemsCount) {
        // If cashier admin is actively in foreground on screen, suppress loud siren
        if (isAppInForeground) {
            return;
        }

        // Wake CPU and turn screen ON
        acquireWakeLock(32000);

        stopAlarm(); // Reset any existing playback
        isAlarmRinging = true;

        // Boost STREAM_ALARM volume to 100% maximum
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int maxVol = am.getStreamMaxVolume(AudioManager.STREAM_ALARM);
                am.setStreamVolume(AudioManager.STREAM_ALARM, maxVol, 0);
            }
        } catch (Exception e) {}

        // 1. Play looping alarm ringtone via MediaPlayer
        Uri soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
        }
        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        boolean playerStarted = false;
        try {
            if (soundUri != null) {
                mediaPlayer = new MediaPlayer();
                mediaPlayer.setDataSource(this, soundUri);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    AudioAttributes aa = new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .setFlags(AudioAttributes.FLAG_AUDIBILITY_ENFORCED)
                        .build();
                    mediaPlayer.setAudioAttributes(aa);
                } else {
                    mediaPlayer.setAudioStreamType(AudioManager.STREAM_ALARM);
                }
                mediaPlayer.setLooping(true);
                mediaPlayer.prepare();
                mediaPlayer.start();
                playerStarted = true;
            }
        } catch (Exception e) {
            playerStarted = false;
        }

        // Fallback: If MediaPlayer couldn't play, use RingtoneManager
        if (!playerStarted && soundUri != null) {
            try {
                backupRingtone = RingtoneManager.getRingtone(getApplicationContext(), soundUri);
                if (backupRingtone != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        backupRingtone.setLooping(true);
                    }
                    backupRingtone.play();
                }
            } catch (Exception e) {}
        }

        // 2. Vibrate rhythmically for 30 seconds
        if (vibrator != null) {
            long[] pattern = new long[]{0, 1000, 400, 1000, 400, 1000, 400, 1000, 400};
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(android.os.VibrationEffect.createWaveform(pattern, 1));
                } else {
                    vibrator.vibrate(pattern, 1);
                }
            } catch (Exception e) {}
        }

        // 3. Post High Priority Notification with Stop Button & Full Screen Intent
        postAlarmNotification(newItemsCount);

        // 4. Timer to stop after EXACTLY 30 SECONDS
        stopAlarmRunnable = new Runnable() {
            @Override
            public void run() {
                stopAlarm();
            }
        };
        handler.postDelayed(stopAlarmRunnable, ALARM_DURATION_MS);
    }

    private void postAlarmNotification(int count) {
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent openAppIntent = new Intent(this, MainActivity.class);
        openAppIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent piOpen = PendingIntent.getActivity(
            this, 1, openAppIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE) : PendingIntent.FLAG_UPDATE_CURRENT
        );

        Intent stopIntent = new Intent(this, CashierBackgroundService.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent piStop = PendingIntent.getService(
            this, 2, stopIntent,
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? (PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE) : PendingIntent.FLAG_UPDATE_CURRENT
        );

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ALARM_ID);
        } else {
            builder = new Notification.Builder(this);
            builder.setPriority(Notification.PRIORITY_MAX);
        }

        builder.setContentTitle("🚨 NEW CASHIER REQUEST (" + count + " NEW)!")
            .setContentText("User deposited / requested payout! Ringing for 30 seconds...")
            .setSmallIcon(getResources().getIdentifier("ic_launcher", "mipmap", getPackageName()))
            .setContentIntent(piOpen)
            .setFullScreenIntent(piOpen, true)
            .setAutoCancel(true)
            .addAction(0, "🔕 STOP ALARM", piStop);

        nm.notify(NOTIF_ALARM_ID, builder.build());
    }

    public synchronized void stopAlarm() {
        isAlarmRinging = false;

        if (stopAlarmRunnable != null) {
            handler.removeCallbacks(stopAlarmRunnable);
            stopAlarmRunnable = null;
        }

        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
            } catch (Exception e) {}
            mediaPlayer = null;
        }

        if (backupRingtone != null) {
            try {
                if (backupRingtone.isPlaying()) {
                    backupRingtone.stop();
                }
            } catch (Exception e) {}
            backupRingtone = null;
        }

        if (vibrator != null) {
            try { vibrator.cancel(); } catch (Exception e) {}
        }

        releaseWakeLock();

        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) {
            nm.cancel(NOTIF_ALARM_ID);
        }
    }

    private void acquireWakeLock(long timeoutMs) {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                if (cpuWakeLock == null) {
                    cpuWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bwn:cashier_cpu_lock");
                }
                if (cpuWakeLock != null && !cpuWakeLock.isHeld()) {
                    cpuWakeLock.acquire(timeoutMs);
                }

                int screenFlags = PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP | PowerManager.ON_AFTER_RELEASE;
                if (screenWakeLock == null) {
                    screenWakeLock = pm.newWakeLock(screenFlags, "bwn:cashier_screen_wakeup");
                }
                if (screenWakeLock != null && !screenWakeLock.isHeld()) {
                    screenWakeLock.acquire(Math.min(timeoutMs, 15000));
                }
            }
        } catch (Exception e) {}
    }

    private void releaseWakeLock() {
        try {
            if (cpuWakeLock != null && cpuWakeLock.isHeld()) {
                cpuWakeLock.release();
            }
            if (screenWakeLock != null && screenWakeLock.isHeld()) {
                screenWakeLock.release();
            }
        } catch (Exception e) {}
    }

    public static void stopAlarmIfRunning(Context ctx) {
        if (isAlarmRinging) {
            Intent stopIntent = new Intent(ctx, CashierBackgroundService.class);
            stopIntent.setAction(ACTION_STOP_ALARM);
            ctx.startService(stopIntent);
        }
    }

    @Override
    public void onDestroy() {
        stopAlarm();
        if (pollingRunnable != null) {
            handler.removeCallbacks(pollingRunnable);
        }
        if (networkExecutor != null) {
            networkExecutor.shutdownNow();
        }
        super.onDestroy();
    }
}
