# Sync Capacitor Android with CAPACITOR_SERVER_URL from .env.capacitor
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
    Write-Host "Set CAPACITOR_SERVER_URL in .env.capacitor" -ForegroundColor Red
    exit 1
}

Write-Host "Syncing Android app to: $env:CAPACITOR_SERVER_URL" -ForegroundColor Cyan
npx.cmd cap sync android
& (Join-Path $root "scripts\patch-android-upi.ps1")

Write-Host ""
Write-Host "Done. Rebuild and reinstall APK:" -ForegroundColor Yellow
Write-Host "  npm.cmd run build:apk" -ForegroundColor White
Write-Host ""
