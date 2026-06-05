# Build LK Studio debug APK (Windows)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# Load CAPACITOR_SERVER_URL from .env.capacitor
$envFile = Join-Path $root ".env.capacitor"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') {
            $env:CAPACITOR_SERVER_URL = $matches[1].Trim()
        }
    }
}

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
    Write-Error @"
Android SDK not found at $sdkPath
Install Android Studio: https://developer.android.com/studio
Then open SDK Manager and install Android SDK Platform.
"@
}

$env:ANDROID_HOME = $sdkPath
$localProps = Join-Path $root "android\local.properties"
$sdkEsc = $sdkPath -replace '\\', '/'
"sdk.dir=$sdkEsc" | Set-Content $localProps -Encoding ASCII

# Use highest installed SDK platform (fixes missing android-34 when only 35 is installed)
$platformsDir = Join-Path $sdkPath "platforms"
$best = Get-ChildItem $platformsDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^android-(\d+)$' } |
    ForEach-Object { [int]$Matches[1] } |
    Sort-Object -Descending |
    Select-Object -First 1

if (-not $best) {
    Write-Error "No Android SDK platform installed. Open Android Studio -> SDK Manager -> install a platform (e.g. Android 14)."
}

$varsFile = Join-Path $root "android\variables.gradle"
$vars = Get-Content $varsFile -Raw
$vars = $vars -replace 'compileSdkVersion = \d+', "compileSdkVersion = $best"
$vars = $vars -replace 'targetSdkVersion = \d+', "targetSdkVersion = $best"
# Write without UTF-8 BOM (BOM breaks Gradle)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($varsFile, $vars.TrimEnd() + "`n", $utf8NoBom)
Write-Host "Using Android SDK platform $best"

if (-not $env:CAPACITOR_SERVER_URL) {
    Write-Host ""
    Write-Host "WARNING: Set CAPACITOR_SERVER_URL in .env.capacitor"
    Write-Host "  Real phone: http://YOUR-PC-WIFI-IP:3000  (run: ipconfig)"
    Write-Host "  Emulator only: http://10.0.2.2:3000"
    Write-Host ""
}

Write-Host "Syncing Capacitor..."
npx.cmd cap sync android

$gradlew = Join-Path $root "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Error "Run first: npx.cmd cap add android"
}

Write-Host "Building debug APK (first time may take 5-15 min)..."
Set-Location (Join-Path $root "android")
& .\gradlew.bat assembleDebug

$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $dest = Join-Path $root "LK-Studio-debug.apk"
    Copy-Item $apk $dest -Force
    Write-Host ""
    Write-Host "========================================"
    Write-Host " SUCCESS! Install this file on your phone:"
    Write-Host " $dest"
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Before opening the app on phone:"
    Write-Host "  1. PC and phone on same Wi-Fi"
    Write-Host "  2. Run: npm.cmd run dev -- -H 0.0.0.0"
    Write-Host "  3. .env.capacitor must have your PC IP, not 10.0.2.2"
} else {
    Write-Error "APK not found. Check errors above."
}
