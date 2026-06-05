# Start LK Studio for phone testing + auto-configure Capacitor server URL
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Get-LanIpv4FromIpconfig {
    $results = @()
    $adapter = ""
    foreach ($line in (ipconfig)) {
        if ($line -match '^\s*([^:]+):\s*$' -and $line -notmatch 'IPv4|Subnet|Default|Media|Link-local|Connection-specific') {
            $adapter = $Matches[1].Trim()
        }
        if ($line -match 'IPv4 Address[^:]*:\s*([\d.]+)') {
            $ip = $Matches[1]
            if ($ip -notlike "127.*") {
                $results += [PSCustomObject]@{ IPAddress = $ip; InterfaceAlias = $adapter }
            }
        }
    }
    return $results
}

Write-Host ""
Write-Host "=== Your Wi-Fi IP addresses ===" -ForegroundColor Cyan

$ips = Get-LanIpv4FromIpconfig
if ($ips.Count -eq 0) {
    Write-Host "  (none found - run ipconfig)" -ForegroundColor Red
} else {
    $ips | ForEach-Object {
        Write-Host "  $($_.IPAddress)  ($($_.InterfaceAlias))" -ForegroundColor Green
    }
}

# Prefer Wi-Fi IP for phone testing (not PC hotspot 192.168.137.1 unless that's all we have)
$wifiIp = ($ips | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" } | Select-Object -First 1).IPAddress
$primaryIp = $wifiIp
if (-not $primaryIp) {
    $primaryIp = ($ips | Where-Object { $_.IPAddress -notlike "192.168.137.*" } | Select-Object -First 1).IPAddress
}
if (-not $primaryIp) {
    $primaryIp = ($ips | Select-Object -First 1).IPAddress
}

if ($primaryIp) {
    $serverUrl = "http://${primaryIp}:3000"
    $envFile = Join-Path $root ".env.capacitor"
    "CAPACITOR_SERVER_URL=$serverUrl" | Set-Content $envFile -Encoding ASCII
    $env:CAPACITOR_SERVER_URL = $serverUrl

    Write-Host ""
    Write-Host "Updated .env.capacitor -> $serverUrl" -ForegroundColor Green
    Write-Host "Phone on same Wi-Fi: $serverUrl" -ForegroundColor Yellow
    Write-Host "Any Wi-Fi / mobile data (no IP changes): npm run dev:anywhere" -ForegroundColor Cyan
    Write-Host "Rebuild APK only if app still shows old IP: npm run build:apk" -ForegroundColor DarkYellow
} else {
    Write-Host ""
    Write-Host "No LAN IP found. Set .env.capacitor manually." -ForegroundColor Red
    Write-Host "Emulator only: CAPACITOR_SERVER_URL=http://10.0.2.2:3000" -ForegroundColor Yellow
}

$portBusy = netstat -ano 2>$null | Select-String ":3000\s+.*LISTENING"
if ($portBusy) {
    Write-Host ""
    Write-Host "Port 3000 in use — stopping old process..." -ForegroundColor Yellow
    node (Join-Path $root "scripts\kill-port.mjs") 3000
}

Write-Host ""
Write-Host "Starting server on 0.0.0.0:3000 ..." -ForegroundColor Cyan
Write-Host "Keep this window open while using the app on phone." -ForegroundColor Yellow
Write-Host ""

if (Test-Path (Join-Path $root ".next")) {
    Remove-Item -Recurse -Force (Join-Path $root ".next") -ErrorAction SilentlyContinue
    Write-Host "Cleared .next cache (fixes stale build errors)" -ForegroundColor DarkGray
}

npm.cmd run dev:mobile
