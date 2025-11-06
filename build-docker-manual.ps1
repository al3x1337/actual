# Manual Docker build script with detailed output
# This script will help you see exactly what's happening during the build

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Continue"

$ImageName = "$DockerHubUsername/actual-server-budget-views"
$FullImageName = "$ImageName`:$Tag"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Manual Docker Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Image: $FullImageName" -ForegroundColor Yellow
Write-Host ""

# Pre-flight checks
Write-Host "Checking prerequisites..." -ForegroundColor Green

if (-not (Test-Path "sync-server.Dockerfile")) {
    Write-Host "ERROR: sync-server.Dockerfile not found!" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Dockerfile found" -ForegroundColor Green

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Docker not found or not running!" -ForegroundColor Red
    exit 1
}

# Check if logged in to Docker Hub
Write-Host "`nChecking Docker Hub login status..." -ForegroundColor Green
$loginCheck = docker info 2>&1 | Select-String "Username"
if (-not $loginCheck) {
    Write-Host "⚠ Not logged in to Docker Hub" -ForegroundColor Yellow
    Write-Host "Run: docker login" -ForegroundColor Cyan
} else {
    Write-Host "✓ Logged in to Docker Hub" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Starting build..." -ForegroundColor Cyan
Write-Host "This will take 10-20 minutes" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

# Build with no cache to ensure fresh build
Write-Host "Building image (no cache)..." -ForegroundColor Green
docker build --no-cache --progress=plain -f sync-server.Dockerfile -t $FullImageName . 

$buildExitCode = $LASTEXITCODE

Write-Host "`n========================================" -ForegroundColor Cyan
if ($buildExitCode -eq 0) {
    Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nImage built: $FullImageName" -ForegroundColor Green
    
    # Show image info
    Write-Host "`nImage details:" -ForegroundColor Yellow
    docker images $FullImageName
    
    Write-Host "`nTo push to Docker Hub:" -ForegroundColor Cyan
    Write-Host "  docker push $FullImageName" -ForegroundColor White
    
} else {
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "Exit code: $buildExitCode" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "`nCommon issues:" -ForegroundColor Yellow
    Write-Host "1. Out of memory - try closing other applications" -ForegroundColor White
    Write-Host "2. Disk space - check available space" -ForegroundColor White
    Write-Host "3. Network issues - check internet connection" -ForegroundColor White
    Write-Host "4. Docker daemon not running" -ForegroundColor White
}

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

