#!/bin/bash
set -e

echo "=== BWN Cashier Admin APK Builder (30s Alarm Edition) ==="

export ANDROID_HOME=/opt/android-sdk
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
PLATFORM="$ANDROID_HOME/platforms/android-34/android.jar"

cd /root/admin_android_app

rm -rf build
mkdir -p build/gen build/obj build/bin

echo "[1/4] Compiling Android Resources with AAPT2..."
"$BUILD_TOOLS/aapt2" compile --dir res -o build/compiled_res.zip

"$BUILD_TOOLS/aapt2" link -I "$PLATFORM" \
    build/compiled_res.zip \
    --manifest AndroidManifest.xml \
    --min-sdk-version 21 \
    --target-sdk-version 34 \
    --java build/gen \
    -o build/base.apk

echo "[2/4] Compiling Java Sources..."
javac -encoding UTF-8 \
    -cp "$PLATFORM:build/gen" \
    -d build/obj \
    build/gen/com/betwithnet/cashier/R.java \
    src/com/betwithnet/cashier/*.java

echo "[3/4] Dexing Bytecode with D8..."
"$BUILD_TOOLS/d8" build/obj/com/betwithnet/cashier/*.class \
    --lib "$PLATFORM" \
    --output build/bin

cd build/bin
zip -u ../base.apk classes.dex
cd /root/admin_android_app

echo "[4/4] Zipaligning and Signing Cashier APK..."
"$BUILD_TOOLS/zipalign" -f -v 4 build/base.apk build/aligned.apk > /dev/null

"$BUILD_TOOLS/apksigner" sign \
    --ks /root/bwn-release.keystore \
    --ks-key-alias bwn_key \
    --ks-pass pass:bwn_betwithnet_2026 \
    --key-pass pass:bwn_betwithnet_2026 \
    --out /root/admin_android_app/betwithnet_cashier_admin.apk \
    build/aligned.apk

"$BUILD_TOOLS/apksigner" verify /root/admin_android_app/betwithnet_cashier_admin.apk

mkdir -p /home/betwithnet.com/public_html/admin
cp /root/admin_android_app/betwithnet_cashier_admin.apk /home/betwithnet.com/public_html/admin/betwithnet_cashier_admin.apk
cp /root/admin_android_app/betwithnet_cashier_admin.apk /home/betwithnet.com/public_html/betwithnet_cashier_admin.apk
chown betwi4261:betwi4261 /home/betwithnet.com/public_html/admin/betwithnet_cashier_admin.apk /home/betwithnet.com/public_html/betwithnet_cashier_admin.apk
chmod 644 /home/betwithnet.com/public_html/admin/betwithnet_cashier_admin.apk /home/betwithnet.com/public_html/betwithnet_cashier_admin.apk

echo "SUCCESS! Cashier Admin APK with 30s Background Alarm built and deployed!"
ls -lh /home/betwithnet.com/public_html/admin/betwithnet_cashier_admin.apk
