# PowerShell script to generate a .dockerbuild file for local analysis
# Usage: .\generate-dockerbuild.ps1 -Dockerfile "sync-server.Dockerfile" -OutputFile "build.dockerbuild"

param(
    [Parameter(Mandatory=$false)]
    [string]$Dockerfile = "sync-server.Dockerfile",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "build.dockerbuild",
    
    [Parameter(Mandatory=$false)]
    [string]$ImageTag = "actual-server-build:local"
)

$ErrorActionPreference = "Continue"

function Exit-Script {
    param([string]$Message, [string]$Color = "Yellow")
    Write-Host "`n$Message" -ForegroundColor $Color
    Write-Host "Press any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

trap {
    Write-Host "`nUnexpected error occurred: $_" -ForegroundColor Red
    Write-Host "Error details: $($_.Exception.Message)" -ForegroundColor Red
    Exit-Script "Script terminated due to error" "Red"
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Generate .dockerbuild File" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Dockerfile: $Dockerfile" -ForegroundColor Yellow
Write-Host "Output: $OutputFile" -ForegroundColor Yellow
Write-Host ""

# Check if Docker is available
Write-Host "Checking Docker availability..." -ForegroundColor Cyan
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "ERROR: Docker is not available or not running!`nPlease make sure Docker Desktop is installed and running." "Red"
    }
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Exit-Script "ERROR: Failed to check Docker. Make sure Docker is installed and in your PATH." "Red"
}

# Check if Docker Buildx is available
Write-Host "Checking Docker Buildx..." -ForegroundColor Cyan
try {
    $buildxVersion = docker buildx version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Script "ERROR: Docker Buildx is not available!`nPlease install Docker Buildx or update Docker Desktop." "Red"
    }
    Write-Host "Buildx found: $buildxVersion" -ForegroundColor Green
} catch {
    Exit-Script "ERROR: Failed to check Docker Buildx." "Red"
}

# Check if Dockerfile exists
if (-not (Test-Path $Dockerfile)) {
    Exit-Script "ERROR: $Dockerfile not found!`nMake sure you're running this from the project root directory." "Red"
}

# Create buildx builder if it doesn't exist
Write-Host "Setting up Docker Buildx builder..." -ForegroundColor Cyan
$builderExists = docker buildx ls --format "{{.Name}}" | Select-String -Pattern "^dockerbuild-builder$"
if (-not $builderExists) {
    Write-Host "Creating new buildx builder..." -ForegroundColor Yellow
    docker buildx create --name dockerbuild-builder --use 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Could not create builder, using default" -ForegroundColor Yellow
    } else {
        Write-Host "Builder created successfully" -ForegroundColor Green
    }
} else {
    Write-Host "Using existing builder" -ForegroundColor Green
    docker buildx use dockerbuild-builder 2>&1 | Out-Null
}

Write-Host "`nBuilding Docker image and generating .dockerbuild file..." -ForegroundColor Green
Write-Host "This may take 10-20 minutes..." -ForegroundColor Cyan
Write-Host ""

# Build with dockerbuild output
$buildOutput = docker buildx build `
    -f $Dockerfile `
    -t $ImageTag `
    --output type=dockerbuild,dest=$OutputFile `
    --load `
    . 2>&1

$buildExitCode = $LASTEXITCODE

# Display output
$buildOutput | ForEach-Object {
    Write-Host $_ -ForegroundColor Gray
}

if ($buildExitCode -ne 0) {
    Write-Host "`nBUILD FAILED! Exit code: $buildExitCode" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Yellow
    Exit-Script "Build failed. Please fix the errors and try again." "Red"
}

# Verify file was created
if (Test-Path $OutputFile) {
    $fileSize = (Get-Item $OutputFile).Length / 1MB
    Write-Host "`n✓ .dockerbuild file created successfully!" -ForegroundColor Green
    Write-Host "  File: $OutputFile" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
    Write-Host "`nTo analyze in Docker Desktop:" -ForegroundColor Yellow
    Write-Host "  1. Open Docker Desktop" -ForegroundColor Cyan
    Write-Host "  2. Go to the 'Builds' tab" -ForegroundColor Cyan
    Write-Host "  3. Click 'Import Builds' and select: $OutputFile" -ForegroundColor Cyan
} else {
    Exit-Script "ERROR: .dockerbuild file was not created!`nBuild appeared to succeed but file is missing." "Red"
}

Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

