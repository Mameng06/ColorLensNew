# ColorLens Android Build Script
Write-Host "Building ColorLens Android App..." -ForegroundColor Green

# Navigate to android directory
Set-Location android

# Clean build
Write-Host "Cleaning build..." -ForegroundColor Yellow
.\gradlew.bat clean

# Build and install
Write-Host "Building and installing..." -ForegroundColor Yellow
.\gradlew.bat installGeneralDebug -PreactNativeDevServerPort=8081

# Navigate back to project root
Set-Location ..

Write-Host "Build complete!" -ForegroundColor Green 