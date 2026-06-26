# Build signed LK Studio release APK (same config as release AAB — R8, signing, version).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== LK Studio release APK ===" -ForegroundColor Cyan
Write-Host ""

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
3. Run: npm run build:apk:release
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

& (Join-Path $root "scripts\patch-android-release.ps1")

$gradlew = Join-Path $root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Error "Run first: npx.cmd cap add android"
}

Write-Host "Building release APK (first time may take 10-20 min)..."
Set-Location (Join-Path $root "android")
& .\gradlew.bat assembleRelease

$apk = Join-Path $root "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apk) {
    $dest = Join-Path $root "LK-Studio-release.apk"
    Copy-Item $apk $dest -Force
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host " SUCCESS! Install on phone (same build as AAB):"
    Write-Host " $dest"
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Error "Release APK not found. Ensure android\app\build.gradle has release signing config."
}
