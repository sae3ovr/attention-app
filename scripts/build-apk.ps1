# Attention App - Android APK Build Script
# This script builds the APK using EAS (Expo Application Services)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ATTENTION APP - APK Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check EAS CLI
$easVersion = eas --version 2>$null
if (-not $easVersion) {
    Write-Host "[!] EAS CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g eas-cli
}

# Check login
$whoami = eas whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[!] Not logged in to EAS." -ForegroundColor Yellow
    Write-Host "    Please log in with your Expo account:" -ForegroundColor White
    Write-Host ""
    eas login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[X] Login failed. Cannot proceed." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Logged in as: $(eas whoami)" -ForegroundColor Green
Write-Host ""

# Check if project needs EAS init
$appJson = Get-Content "app.json" | ConvertFrom-Json
$projectId = $appJson.expo.extra.eas.projectId
if ($projectId -eq "YOUR_EAS_PROJECT_ID" -or -not $projectId) {
    Write-Host "[!] EAS project not initialized. Running eas init..." -ForegroundColor Yellow
    eas init
}

Write-Host ""
Write-Host "[*] Starting APK build (preview profile)..." -ForegroundColor Cyan
Write-Host "    This will build in the cloud and may take 10-15 minutes." -ForegroundColor White
Write-Host ""

eas build --platform android --profile preview

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Build complete! Download the APK" -ForegroundColor Green
Write-Host "  from the URL shown above." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
