$iconBytes = [System.IO.File]::ReadAllBytes("assets\icons\apple_touch_icon_180.png")
$iconBase64 = [Convert]::ToBase64String($iconBytes)

$mobileConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>Icon</key>
            <data>
$iconBase64
            </data>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>Bet With Net</string>
            <key>PayloadDescription</key>
            <string>Installs Bet With Net VIP Casino App on iPhone home screen</string>
            <key>PayloadDisplayName</key>
            <string>Bet With Net WebClip</string>
            <key>PayloadIdentifier</key>
            <string>com.betwithnet.app.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>4F73A9E2-7D68-4F1A-98C3-B4E9A70C2D81</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>https://betwithnet.com/</string>
        </dict>
    </array>
    <key>PayloadDescription</key>
    <string>Official Bet With Net VIP Casino Application for iOS</string>
    <key>PayloadDisplayName</key>
    <string>Bet With Net VIP App</string>
    <key>PayloadIdentifier</key>
    <string>com.betwithnet.app.ios</string>
    <key>PayloadOrganization</key>
    <string>Bet With Net VIP Gaming</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>8C2B3E14-6F29-4A73-A5B2-D3F1E7C4B9A0</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>
"@

[System.IO.File]::WriteAllText("betwithnet.mobileconfig", $mobileConfig, [System.Text.Encoding]::UTF8)
Write-Output "MOBILECONFIG_CREATED"
