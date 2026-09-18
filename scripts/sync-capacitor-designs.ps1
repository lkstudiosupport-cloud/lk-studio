# Sync LK Designs Android app (separate Play Store package).
# Capacitor CLI only reads capacitor.config.ts — we swap configs for this sync.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.capacitor"
if (-not (Test-Path $envFile)) {
    Write-Host "Missing .env.capacitor - copy from .env.capacitor.example" -ForegroundColor Red
    exit 1
}

Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') {
        $env:CAPACITOR_SERVER_URL = $matches[1].Trim()
    }
}

if (-not $env:CAPACITOR_SERVER_URL) {
    Write-Host "Set CAPACITOR_SERVER_URL in .env.capacitor (base site URL, no path)" -ForegroundColor Red
    exit 1
}

$mainConfig = Join-Path $root "capacitor.config.ts"
$designsConfig = Join-Path $root "capacitor.designs.config.ts"
$backup = Join-Path $root "capacitor.config.studio.bak.ts"
$androidDir = Join-Path $root "android-designs"

Write-Host "LK Designs server: $($env:CAPACITOR_SERVER_URL.TrimEnd('/'))/designs" -ForegroundColor Cyan

Copy-Item $mainConfig $backup -Force
try {
    Copy-Item $designsConfig $mainConfig -Force

    if (-not (Test-Path $androidDir)) {
        Write-Host "Adding android-designs project (first time)..." -ForegroundColor Yellow
        npx.cmd cap add android
    }

    npx.cmd cap sync android
}
finally {
    if (Test-Path $backup) {
        Move-Item $backup $mainConfig -Force
    }
}

Write-Host ""
Write-Host "Done. Build LK Designs APK:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build:apk:designs" -ForegroundColor White
Write-Host ""
