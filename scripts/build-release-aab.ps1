# Build signed LK Studio release AAB for Google Play (Windows)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== LK Studio release AAB ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "First-time keystore (run once, store backup safely):"
Write-Host '  keytool -genkeypair -v -storetype PKCS12 -keystore lk-studio-release.keystore -alias lkstudio -keyalg RSA -keysize 2048 -validity 10000'
Write-Host ""
Write-Host "Then copy keystore.properties.example to android\keystore.properties and set passwords."
Write-Host "Add signing block to android\app\build.gradle (see PLAY-STORE-CHECKLIST.md)."
Write-Host ""

# Load CAPACITOR_SERVER_URL from .env.capacitor
$envFile = Join-Path $root ".env.capacitor"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') {
            $env:CAPACITOR_SERVER_URL = $matches[1].Trim()
        }
    }
}

if (-not $env:CAPACITOR_SERVER_URL) {
    Write-Host "WARNING: Set CAPACITOR_SERVER_URL in .env.capacitor to your production HTTPS URL" -ForegroundColor Yellow
    Write-Host "  Example: CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com"
    Write-Host ""
}

$keystoreProps = Join-Path $root "android\keystore.properties"
if (-not (Test-Path $keystoreProps)) {
    Write-Error @"
android\keystore.properties not found.

1. Create keystore: keytool -genkeypair -v -storetype PKCS12 -keystore lk-studio-release.keystore -alias lkstudio -keyalg RSA -keysize 2048 -validity 10000
2. Copy keystore.properties.example to android\keystore.properties
3. Configure signing in android\app\build.gradle (see MOBILE-APK.md)
"@
}

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
    Write-Error "Android SDK not found. Install Android Studio first."
}

$env:ANDROID_HOME = $sdkPath
$localProps = Join-Path $root "android\local.properties"
$sdkEsc = $sdkPath -replace '\\', '/'
"sdk.dir=$sdkEsc" | Set-Content $localProps -Encoding ASCII

$platformsDir = Join-Path $sdkPath "platforms"
$best = Get-ChildItem $platformsDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^android-(\d+)$' } |
    ForEach-Object { [int]$Matches[1] } |
    Sort-Object -Descending |
    Select-Object -First 1

if (-not $best) {
    Write-Error "No Android SDK platform installed."
}

$varsFile = Join-Path $root "android\variables.gradle"
if (Test-Path $varsFile) {
    $vars = Get-Content $varsFile -Raw
    $vars = $vars -replace 'compileSdkVersion = \d+', "compileSdkVersion = $best"
    $vars = $vars -replace 'targetSdkVersion = \d+', "targetSdkVersion = $best"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($varsFile, $vars.TrimEnd() + "`n", $utf8NoBom)
    Write-Host "Using Android SDK platform $best"
}

Write-Host "Syncing Capacitor..."
npx.cmd cap sync android

$gradlew = Join-Path $root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Error "Run first: npx.cmd cap add android"
}

Write-Host "Building release AAB (first time may take 10–20 min)..."
Set-Location (Join-Path $root "android")
& .\gradlew.bat bundleRelease

$aab = Join-Path $root "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
    $dest = Join-Path $root "LK-Studio-release.aab"
    Copy-Item $aab $dest -Force
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SUCCESS! Upload to Play Console:"
    Write-Host " $dest"
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Error "AAB not found. Ensure android\app\build.gradle has release signing config."
}
