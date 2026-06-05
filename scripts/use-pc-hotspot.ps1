# Bypass router AP isolation: use Windows Mobile Hotspot
# 1. Settings -> Network -> Mobile hotspot -> ON (share Wi-Fi)
# 2. Connect PHONE to PC hotspot (e.g. DESKTOP-xxxxx)
# 3. Run this script, then npm run mobile:dev, then rebuild APK once

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

# PC IP on hotspot is almost always 192.168.137.1
$hotspotIp = "192.168.137.1"
$found = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -like "192.168.137.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -First 1

if ($found) {
    $hotspotIp = $found.IPAddress
}

$url = "http://${hotspotIp}:3000"
Write-Host ""
Write-Host "Hotspot server URL: $url" -ForegroundColor Green
Write-Host ""

$envFile = Join-Path $root ".env.capacitor"
"CAPACITOR_SERVER_URL=$url" | Set-Content $envFile -Encoding ASCII

$env:CAPACITOR_SERVER_URL = $url
Set-Location $root

Write-Host "Syncing Capacitor..."
npx.cmd cap sync android

Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Phone connected to PC Mobile Hotspot (not home Wi-Fi)"
Write-Host "  2. Rebuild APK: npm.cmd run build:apk"
Write-Host "  3. Install new APK on phone"
Write-Host "  4. Run server: npm.cmd run mobile:dev"
Write-Host "  5. Phone Chrome test: $url"
Write-Host ""
