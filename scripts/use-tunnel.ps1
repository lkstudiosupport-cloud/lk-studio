# Expose dev server via public URL (works when router blocks phone->PC)
# Requires: npm run mobile:dev running in another terminal

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "Starting tunnel to localhost:3000 ..." -ForegroundColor Cyan
Write-Host "Keep this window open. Copy the https URL below." -ForegroundColor Yellow
Write-Host ""

# localtunnel prints URL to stdout
$lt = Start-Process -FilePath "npx.cmd" -ArgumentList "localtunnel --port 3000" -NoNewWindow -PassThru -RedirectStandardOutput "tunnel-out.txt" -RedirectStandardError "tunnel-err.txt"

Start-Sleep -Seconds 8
$out = Get-Content "tunnel-out.txt" -ErrorAction SilentlyContinue | Out-String
if ($out -match "(https://[^\s]+\.loca\.lt)") {
    $publicUrl = $matches[1]
    Write-Host "Public URL: $publicUrl" -ForegroundColor Green
    "CAPACITOR_SERVER_URL=$publicUrl" | Set-Content ".env.capacitor" -Encoding ASCII
    $env:CAPACITOR_SERVER_URL = $publicUrl
    npx.cmd cap sync android
    Write-Host ""
    Write-Host "Updated .env.capacitor and synced Android." -ForegroundColor Green
    Write-Host "Rebuild APK: npm.cmd run build:apk" -ForegroundColor Yellow
    Write-Host "Install APK on phone - works on ANY network (mobile data OK)" -ForegroundColor Yellow
} else {
    Write-Host "Could not get tunnel URL. Run manually:" -ForegroundColor Red
    Write-Host "  npx localtunnel --port 3000"
    Get-Content "tunnel-out.txt","tunnel-err.txt" -ErrorAction SilentlyContinue
}

Write-Host "Press Ctrl+C to stop tunnel."
Wait-Process -Id $lt.Id
