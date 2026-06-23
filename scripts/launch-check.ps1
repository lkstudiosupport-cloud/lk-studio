# Pre-launch checks: server URL, Capacitor config, keystore for Play Store AAB.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ok = $true
function Warn($msg) { Write-Host "WARN: $msg" -ForegroundColor Yellow }
function Fail($msg) { Write-Host "FAIL: $msg" -ForegroundColor Red; $script:ok = $false }
function Pass($msg) { Write-Host "OK:   $msg" -ForegroundColor Green }

Write-Host "=== LK Studio launch check ===" -ForegroundColor Cyan
Write-Host ""

# Git sync
$branch = git rev-parse --abbrev-ref HEAD 2>$null
$local = git rev-parse HEAD 2>$null
$remote = git rev-parse origin/main 2>$null
if ($branch -eq "main" -and $local -eq $remote) {
    Pass "main branch matches origin/main ($($local.Substring(0,7)))"
} else {
    Warn "Push main to GitHub before Play Store release (branch=$branch)"
}

# Production health
try {
    $health = Invoke-RestMethod -Uri "https://lk-studio-1.onrender.com/api/health" -TimeoutSec 45
    if ($health.ok) {
        Pass "Production server healthy (storage: $($health.storageBackend))"
    } else {
        Fail "Production /api/health returned not ok"
    }
} catch {
    Fail "Cannot reach https://lk-studio-1.onrender.com/api/health - $($_.Exception.Message)"
}

# Capacitor URL
$capFile = Join-Path $root ".env.capacitor"
if (-not (Test-Path $capFile)) {
    Fail "Missing .env.capacitor - copy from .env.capacitor.example and set CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com"
} else {
    $url = $null
    Get-Content $capFile | ForEach-Object {
        if ($_ -match '^\s*CAPACITOR_SERVER_URL=(.+)\s*$') { $url = $matches[1].Trim() }
    }
    if ($url -eq "https://lk-studio-1.onrender.com") {
        Pass "CAPACITOR_SERVER_URL points to production"
    } elseif ($url -match '^https://') {
        Warn "CAPACITOR_SERVER_URL is $url (expected https://lk-studio-1.onrender.com for this project)"
    } else {
        Fail "Set CAPACITOR_SERVER_URL=https://lk-studio-1.onrender.com in .env.capacitor"
    }
}

# Android project
if (Test-Path (Join-Path $root "android\app\build.gradle")) {
    Pass "Android project present"
} else {
    Warn "Run: npx cap add android"
}

# Release keystore
$ksProps = Join-Path $root "android\keystore.properties"
if (Test-Path $ksProps) {
    Pass "android/keystore.properties found"
} else {
    Warn "Create release keystore for Play Store AAB (see LAUNCH.md)"
}

Write-Host ""
if ($ok) {
    Write-Host "Ready for: npm run build:aab:release" -ForegroundColor Green
} else {
    Write-Host "Fix failures above, then run: npm run launch:check" -ForegroundColor Yellow
    exit 1
}
