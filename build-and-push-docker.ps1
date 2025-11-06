# PowerShell script to build and push Docker image to Docker Hub
# Usage: 
#   Interactive tag prompt: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -PromptForTag
#   Basic (auto-prompts if no tag options): .\build-and-push-docker.ps1 -DockerHubUsername "your-username"
#   Custom tag: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Tag "v1.0.0"
#   Timestamp tag: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -UseTimestamp
#   Version tag: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Version "1.0.0"
#   Combined: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Version "1.0.0" -UseTimestamp -TagSuffix "beta"
#   No cache: .\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Tag "latest" -NoCache

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$Tag,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseTimestamp,
    
    [Parameter(Mandatory=$false)]
    [string]$Version,
    
    [Parameter(Mandatory=$false)]
    [string]$TagSuffix,
    
    [Parameter(Mandatory=$false)]
    [string]$TagPrefix,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoCache,
    
    [Parameter(Mandatory=$false)]
    [switch]$PromptForTag
)

# Keep window open on error
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

# Determine the tag to use
$finalTag = $null

if ($PromptForTag -or (-not $Tag -and -not $UseTimestamp -and -not $Version)) {
    # Prompt user for tag
    Write-Host ""
    Write-Host "Tag Options:" -ForegroundColor Cyan
    Write-Host "  1. Enter custom tag" -ForegroundColor Yellow
    Write-Host "  2. Use timestamp (format: YYYYMMDD-HHMMSS)" -ForegroundColor Yellow
    Write-Host "  3. Use 'latest' (default)" -ForegroundColor Yellow
    Write-Host ""
    $tagChoice = Read-Host "Enter choice (1-3) or press Enter for 'latest'"
    
    if ($tagChoice -eq "1") {
        $customTag = Read-Host "Enter custom tag"
        if ([string]::IsNullOrWhiteSpace($customTag)) {
            Write-Host "No tag entered, using 'latest'" -ForegroundColor Yellow
            $finalTag = "latest"
        } else {
            $finalTag = $customTag.Trim()
        }
    } elseif ($tagChoice -eq "2") {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $finalTag = $timestamp
        Write-Host "Using timestamp tag: $finalTag" -ForegroundColor Green
    } else {
        $finalTag = "latest"
        Write-Host "Using default tag: $finalTag" -ForegroundColor Green
    }
} elseif ($Tag) {
    # Explicit tag provided - use it
    $finalTag = $Tag
} elseif ($UseTimestamp -or $Version) {
    # Build tag from components
    $tagParts = @()
    
    if ($TagPrefix) {
        $tagParts += $TagPrefix
    }
    
    if ($Version) {
        # Add 'v' prefix if version doesn't start with it
        if ($Version -notmatch '^v') {
            $tagParts += "v$Version"
        } else {
            $tagParts += $Version
        }
    }
    
    if ($UseTimestamp) {
        # Generate timestamp in format: YYYYMMDD-HHMMSS
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $tagParts += $timestamp
    }
    
    if ($TagSuffix) {
        $tagParts += $TagSuffix
    }
    
    $finalTag = $tagParts -join "-"
} else {
    # Default to "latest"
    $finalTag = "latest"
}

$ImageName = "$DockerHubUsername/actual-server-budget-views"
$FullImageName = "$ImageName`:$finalTag"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Build and Push Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Image: $FullImageName" -ForegroundColor Yellow
Write-Host "Tag: $finalTag" -ForegroundColor Cyan
Write-Host "Dockerfile: sync-server.Dockerfile" -ForegroundColor Yellow
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

# Check if Dockerfile exists
if (-not (Test-Path "sync-server.Dockerfile")) {
    Exit-Script "ERROR: sync-server.Dockerfile not found!`nMake sure you're running this from the project root directory." "Red"
}

Write-Host "Building Docker image (this may take 10-20 minutes)..." -ForegroundColor Green
if ($NoCache) {
    Write-Host "Using --no-cache flag (forcing full rebuild)..." -ForegroundColor Yellow
}
Write-Host ""

# Build with progress output - capture exit code properly
$buildArgs = @("-f", "sync-server.Dockerfile", "-t", $FullImageName)
if ($NoCache) {
    $buildArgs += "--no-cache"
}
$buildArgs += "."

$buildOutput = docker build $buildArgs 2>&1
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

# Verify image was created
Write-Host "`nVerifying image was created..." -ForegroundColor Cyan
$imageExists = docker images $FullImageName --format "{{.Repository}}:{{.Tag}}" 2>&1
if ($LASTEXITCODE -ne 0 -or -not $imageExists) {
    Exit-Script "ERROR: Image was not created successfully!`nBuild appeared to succeed but image is missing." "Red"
}
Write-Host "Image verified: $imageExists" -ForegroundColor Green

Write-Host "Build successful!" -ForegroundColor Green
Write-Host ""
Write-Host "To push to Docker Hub, run:" -ForegroundColor Yellow
Write-Host "  docker login" -ForegroundColor Cyan
Write-Host "  docker push $FullImageName" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or push now? (y/n)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "`nPushing to Docker Hub..." -ForegroundColor Green
    Write-Host "This may take several minutes depending on image size..." -ForegroundColor Cyan
    Write-Host ""
    
    # Push with output capture
    $pushOutput = docker push $FullImageName 2>&1
    $pushExitCode = $LASTEXITCODE
    
    # Display output
    $pushOutput | ForEach-Object {
        Write-Host $_ -ForegroundColor Gray
    }
    
    if ($pushExitCode -eq 0) {
        Write-Host "`nSuccessfully pushed to Docker Hub!" -ForegroundColor Green
        Write-Host "Image available at: https://hub.docker.com/r/$DockerHubUsername/actual-server-budget-views" -ForegroundColor Cyan
        Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } else {
        Write-Host "`nPUSH FAILED! Exit code: $pushExitCode" -ForegroundColor Red
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "  - Not logged in: Run 'docker login' first" -ForegroundColor Yellow
        Write-Host "  - Permission denied: Check your Docker Hub username matches" -ForegroundColor Yellow
        Write-Host "  - Network issues: Check your internet connection" -ForegroundColor Yellow
        Write-Host "`nTo push manually later, run:" -ForegroundColor Cyan
        Write-Host "  docker push $FullImageName" -ForegroundColor Cyan
        Exit-Script "Push failed. See errors above." "Red"
    }
} else {
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
    Write-Host "To push later, run:" -ForegroundColor Cyan
    Write-Host "  docker login" -ForegroundColor Yellow
    Write-Host "  docker push $FullImageName" -ForegroundColor Yellow
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

