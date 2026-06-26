# Ensure AndroidManifest exposes UPI apps to WebView (Android 11+ package visibility).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$manifest = Join-Path $root "android\app\src\main\AndroidManifest.xml"

if (-not (Test-Path $manifest)) {
    Write-Host 'Skip UPI manifest patch - android app manifest not found (run: npx cap add android)'
    exit 0
}

$content = Get-Content $manifest -Raw

if ($content -match 'android:scheme="phonepe"') {
    Write-Host "AndroidManifest already has UPI queries."
    exit 0
}

$queriesBlock = @'
    <!-- UPI / PhonePe / GPay deep links (Android 11+ package visibility) -->
    <queries>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="upi" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="phonepe" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="gpay" />
        </intent>
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="tez" />
        </intent>
        <package android:name="com.phonepe.app" />
        <package android:name="com.google.android.apps.nbu.paisa.user" />
        <package android:name="net.one97.paytm" />
    </queries>

'@

$content = $content -replace '(<manifest[^>]*>\s*\r?\n)', "`$1$queriesBlock"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($manifest, $content.TrimEnd() + "`n", $utf8NoBom)
Write-Host "Patched AndroidManifest.xml for UPI app visibility."
