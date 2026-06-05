# Build APK for sharing with friends — must use public HTTPS URL (deployed app)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$envFile = Join-Path $root ".env.capacitor"
$url = $null
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') {
            $url = $matches[1].Trim()
        }
    }
}

if (-not $url) {
    Write-Host ""
    Write-Host "ERROR: Create .env.capacitor with your LIVE site URL:" -ForegroundColor Red
    Write-Host '  CAPACITOR_SERVER_URL=https://your-app.vercel.app' -ForegroundColor Yellow
    Write-Host ""
    Write-Host "See SHARE-WITH-FRIENDS.md — deploy on Vercel first." -ForegroundColor Cyan
    exit 1
}

if ($url -match '^http://192\.168\.' -or $url -match '^http://10\.' -or $url -match 'loca\.lt') {
    Write-Host ""
    Write-Host "ERROR: This URL only works on your network or while your PC is on:" -ForegroundColor Red
    Write-Host "  $url" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For a friend far away, deploy to Vercel and use:" -ForegroundColor Cyan
    Write-Host '  CAPACITOR_SERVER_URL=https://your-app.vercel.app' -ForegroundColor Green
    Write-Host ""
    exit 1
}

if ($url -notmatch '^https://') {
    Write-Host "WARNING: Prefer https:// for friends (secure login cookies)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Building APK for remote friends..." -ForegroundColor Cyan
Write-Host "  Server: $url" -ForegroundColor Green
Write-Host ""

& (Join-Path $root "scripts\build-apk.ps1")

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " SEND TO YOUR FRIEND (WhatsApp / Drive)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  File: $root\LK-Studio-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "  They install APK, open app, login:" -ForegroundColor Yellow
Write-Host "  $url/login/customer" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Demo: 9123456789 / demo123" -ForegroundColor DarkGray
Write-Host "  Or Register with their own mobile number." -ForegroundColor DarkGray
Write-Host ""
