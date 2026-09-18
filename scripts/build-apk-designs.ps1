# Build LK Designs debug APK (separate Play Store app)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.capacitor"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') {
            $env:CAPACITOR_SERVER_URL = $matches[1].Trim()
        }
    }
}

$mainConfig = Join-Path $root "capacitor.config.ts"
$designsConfig = Join-Path $root "capacitor.designs.config.ts"
$backup = Join-Path $root "capacitor.config.studio.bak.ts"
$androidDir = Join-Path $root "android-designs"

$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $sdkPath)) {
    Write-Error "Android SDK not found at $sdkPath - install Android Studio first."
}

$env:ANDROID_HOME = $sdkPath

function Invoke-WithDesignsConfig([scriptblock]$Action) {
    Copy-Item $mainConfig $backup -Force
    try {
        Copy-Item $designsConfig $mainConfig -Force
        & $Action
    }
    finally {
        if (Test-Path $backup) {
            Move-Item $backup $mainConfig -Force
        }
    }
}

if (-not (Test-Path $androidDir)) {
    Write-Host "Creating android-designs (first time)..." -ForegroundColor Yellow
    if (-not $env:CAPACITOR_SERVER_URL) {
        Write-Error "Set CAPACITOR_SERVER_URL in .env.capacitor first"
    }
    Invoke-WithDesignsConfig { npx.cmd cap add android }
}

$localProps = Join-Path $androidDir "local.properties"
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

$varsFile = Join-Path $androidDir "variables.gradle"
if (Test-Path $varsFile) {
    $vars = Get-Content $varsFile -Raw
    $vars = $vars -replace 'compileSdkVersion = \d+', "compileSdkVersion = $best"
    $vars = $vars -replace 'targetSdkVersion = \d+', "targetSdkVersion = $best"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($varsFile, $vars.TrimEnd() + "`n", $utf8NoBom)
    Write-Host "Using Android SDK platform $best"
}

Write-Host "Syncing LK Designs Capacitor..."
Invoke-WithDesignsConfig { npx.cmd cap sync android }

$wrapperProps = Join-Path $androidDir "gradle\wrapper\gradle-wrapper.properties"
if (Test-Path $wrapperProps) {
    $wp = Get-Content $wrapperProps -Raw
    $wp = $wp -replace 'networkTimeout=\d+', 'networkTimeout=600000'
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($wrapperProps, $wp.TrimEnd() + "`n", $utf8NoBom)
}

$gradlew = Join-Path $androidDir "gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Error "android-designs missing gradlew - re-run: npm run cap:sync:designs"
}

Write-Host "Building LK Designs debug APK..."
Set-Location $androidDir
& .\gradlew.bat assembleDebug

$apk = Join-Path $androidDir "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $dest = Join-Path $root "LK-Designs-debug.apk"
    Copy-Item $apk $dest -Force
    Write-Host ""
    Write-Host "========================================"
    Write-Host " SUCCESS! LK Designs APK:"
    Write-Host " $dest"
    Write-Host " Package: com.lkstudio.designs"
    Write-Host "========================================"
} else {
    Write-Error "APK not found. Check errors above."
}
