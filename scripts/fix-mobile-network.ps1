# Run as Administrator: fixes phone not reaching PC (ERR_ADDRESS_UNREACHABLE)
# Right-click PowerShell -> Run as administrator, then:
#   cd C:\Users\saima\Projects\lk-studio
#   powershell -ExecutionPolicy Bypass -File scripts\fix-mobile-network.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== LK Studio: fix phone connection ===" -ForegroundColor Cyan
Write-Host ""

# 1. Wi-Fi must be Private (Public blocks incoming connections)
$profile = Get-NetConnectionProfile | Where-Object { $_.InterfaceAlias -eq "Wi-Fi" -or $_.NetworkCategory -ne $null } | Select-Object -First 1
if ($profile) {
    Write-Host "Wi-Fi network: $($profile.Name)  Category: $($profile.NetworkCategory)"
    if ($profile.NetworkCategory -eq "Public") {
        Set-NetConnectionProfile -InterfaceAlias $profile.InterfaceAlias -NetworkCategory Private
        Write-Host "Changed Wi-Fi to PRIVATE network." -ForegroundColor Green
    } else {
        Write-Host "Wi-Fi already Private." -ForegroundColor Green
    }
}

# 2. Firewall allow port 3000
$ruleName = "LK Studio Dev 3000"
$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if (-not $existing) {
    New-NetFirewallRule -DisplayName $ruleName `
        -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow `
        -Profile Any | Out-Null
    Write-Host "Firewall: allowed inbound TCP 3000" -ForegroundColor Green
} else {
    Enable-NetFirewallRule -DisplayName $ruleName | Out-Null
    Write-Host "Firewall rule already exists (enabled)." -ForegroundColor Green
}

# 3. Show Node path if present
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if ($nodeCmd) {
    Write-Host "Node.js: $($nodeCmd.Source)"
}

Write-Host ""
Write-Host "Done! Now in a NORMAL terminal run:" -ForegroundColor Yellow
Write-Host "  cd C:\Users\saima\Projects\lk-studio"
Write-Host "  npm.cmd run mobile:dev"
Write-Host ""
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.PrefixOrigin -ne "WellKnown" } |
    Select-Object -ExpandProperty IPAddress -First 1)
if ($ip) {
    Write-Host "On phone Chrome test: http://${ip}:3000" -ForegroundColor Cyan
    Write-Host "Then: npm.cmd run cap:sync && npm.cmd run build:apk" -ForegroundColor Cyan
}
Write-Host ""
