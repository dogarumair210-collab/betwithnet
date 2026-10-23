#!/bin/bash
set -e

echo "=== Bet With Net Android APK Builder ==="

export ANDROID_HOME=/opt/android-sdk
mkdir -p "$ANDROID_HOME/cmdline-tools"

# Download Command-Line Tools if not already installed
if [ ! -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
    echo "[1/6] Downloading Android Command-Line Tools..."
    cd /tmp
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O cmdline-tools.zip
    unzip -q cmdline-tools.zip
    mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
    cp -r cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/"
    rm -rf cmdline-tools cmdline-tools.zip
fi

export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"

# Accept licenses and install platform 34 and build-tools 34.0.0
echo "[2/6] Ensuring Android SDK Platform & Build-Tools..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true

if [ ! -f "$ANDROID_HOME/platforms/android-34/android.jar" ] || [ ! -d "$ANDROID_HOME/build-tools/34.0.0" ]; then
    echo "Installing platforms;android-34 and build-tools;34.0.0..."
    sdkmanager "platforms;android-34" "build-tools;34.0.0" > /dev/null
fi

BUILD_TOOLS="$ANDROID_HOME/build-tools/34.0.0"
PLATFORM="$ANDROID_HOME/platforms/android-34/android.jar"

echo "[3/6] Compiling Android Resources with AAPT2..."
cd /root/android_app

rm -rf build
mkdir -p build/gen build/obj build/bin

# Compile resources
"$BUILD_TOOLS/aapt2" compile --dir res -o build/compiled_res.zip

# Link resources and generate R.java and base APK
"$BUILD_TOOLS/aapt2" link -I "$PLATFORM" \
    build/compiled_res.zip \
    --manifest AndroidManifest.xml \
    --min-sdk-version 21 \
    --target-sdk-version 34 \
    --java build/gen \
    -o build/base.apk

echo "[4/6] Compiling Java Sources..."
javac -encoding UTF-8 \
    -cp "$PLATFORM:build/gen" \
    -d build/obj \
    build/gen/com/betwithnet/app/R.java \
    src/com/betwithnet/app/MainActivity.java

echo "[5/6] Dexing Bytecode with D8..."
"$BUILD_TOOLS/d8" build/obj/com/betwithnet/app/*.class \
    --lib "$PLATFORM" \
    --output build/bin

cd build/bin
# Package classes.dex into base.apk
zip -u ../base.apk classes.dex
cd /root/android_app

echo "[6/6] Zipaligning and Signing APK..."
# Zipalign
"$BUILD_TOOLS/zipalign" -f -v 4 build/base.apk build/aligned.apk > /dev/null

# Generate release keystore if not exists
if [ ! -f "/root/bwn-release.keystore" ]; then
    keytool -genkey -v \
        -keystore /root/bwn-release.keystore \
        -alias bwn_key \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "bwn_betwithnet_2026" \
        -keypass "bwn_betwithnet_2026" \
        -dname "CN=BetWithNet, OU=Gaming, O=BetWithNet, L=Islamabad, ST=ISB, C=PK"
fi

# Sign with apksigner (v1, v2, v3 signatures)
"$BUILD_TOOLS/apksigner" sign \
    --ks /root/bwn-release.keystore \
    --ks-key-alias bwn_key \
    --ks-pass pass:bwn_betwithnet_2026 \
    --key-pass pass:bwn_betwithnet_2026 \
    --out /root/android_app/betwithnet.apk \
    build/aligned.apk

# Verify signature
"$BUILD_TOOLS/apksigner" verify /root/android_app/betwithnet.apk

# Deploy to public_html
cp /root/android_app/betwithnet.apk /home/betwithnet.com/public_html/betwithnet.apk
chown betwi4261:betwi4261 /home/betwithnet.com/public_html/betwithnet.apk
chmod 644 /home/betwithnet.com/public_html/betwithnet.apk

echo "SUCCESS! Bet With Net APK built and deployed at /home/betwithnet.com/public_html/betwithnet.apk"
ls -lh /home/betwithnet.com/public_html/betwithnet.apk
