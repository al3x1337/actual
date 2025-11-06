# PowerShell script to create a clean branch from v25.11.0 with only Budget Views changes
# Usage: .\CREATE_CLEAN_BRANCH.ps1

Write-Host "Creating clean branch from v25.11.0..." -ForegroundColor Cyan
Write-Host ""

# Trap errors to prevent silent exit
trap {
    Write-Host "`nERROR: $_" -ForegroundColor Red
    Write-Host "Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

# Store current branch BEFORE any checkouts
$currentBranch = git branch --show-current
if (-not $currentBranch) {
    Write-Host "ERROR: Not on a valid branch! Please checkout a branch first." -ForegroundColor Red
    exit 1
}
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Fetch latest tags
Write-Host "`nFetching tags from upstream..." -ForegroundColor Cyan
$fetchResult = git fetch upstream --tags 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Could not fetch from upstream, continuing anyway..." -ForegroundColor Yellow
    Write-Host "  Error: $fetchResult" -ForegroundColor Gray
}

# Check if v25.11.0 exists
$tagExists = git tag -l "v25.11.0"
if (-not $tagExists) {
    Write-Host "ERROR: v25.11.0 tag not found!" -ForegroundColor Red
    Write-Host "Available tags:" -ForegroundColor Yellow
    git tag | Select-String -Pattern "25.11|2025" | Select-Object -First 5
    exit 1
}

# Create new clean branch
$newBranch = "budget-views-v25.11.0"
Write-Host "`nCreating new branch '$newBranch' from v25.11.0..." -ForegroundColor Cyan

# Check if branch already exists
$branchExists = git branch --list $newBranch
if ($branchExists) {
    Write-Host "ERROR: Branch '$newBranch' already exists!" -ForegroundColor Red
    Write-Host "Delete it first with: git branch -D $newBranch" -ForegroundColor Yellow
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    try {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        Read-Host "Press Enter to exit"
    }
    exit 1
}

$checkoutResult = git checkout -b $newBranch v25.11.0 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to create branch!" -ForegroundColor Red
    Write-Host "  Error: $checkoutResult" -ForegroundColor Red
    Write-Host "`nPress any key to exit..." -ForegroundColor Yellow
    try {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    } catch {
        Read-Host "Press Enter to exit"
    }
    exit 1
}
Write-Host "✅ Branch created successfully" -ForegroundColor Green

# List of Budget Views feature files to copy from current branch
$featureFiles = @(
    "packages/desktop-client/src/components/budget-views/",
    "packages/desktop-client/src/hooks/useSyncedPrefJson.ts",
    "packages/desktop-client/src/components/CommandBar.tsx",
    "packages/desktop-client/src/components/FinancesApp.tsx",
    "packages/desktop-client/src/components/Modals.tsx",
    "packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx",
    "packages/desktop-client/src/modals/modalsSlice.ts",
    "packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx",
    "packages/desktop-client/src/components/settings/Experimental.tsx",
    "packages/desktop-client/src/hooks/useFeatureFlag.ts",
    "packages/loot-core/src/types/prefs.ts",
    "packages/loot-core/migrations/1723665565000_prefs.js",
    "desktop-client/public/data/migrations/1723665565000_prefs.js"
)

Write-Host "`nCopying Budget Views feature files from '$currentBranch'..." -ForegroundColor Cyan
$copiedCount = 0
$errorCount = 0

# Checkout files from the feature branch
foreach ($file in $featureFiles) {
    # Check if file exists in the source branch
    $fileExists = git ls-tree -r --name-only $currentBranch | Select-String -Pattern "^$([regex]::Escape($file))" -Quiet
    
    if ($fileExists) {
        Write-Host "  Copying: $file" -ForegroundColor Gray
        $copyResult = git checkout $currentBranch -- $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            $copiedCount++
        } else {
            Write-Host "    ERROR: $copyResult" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "  WARNING: File not found in '$currentBranch': $file" -ForegroundColor Yellow
    }
}

Write-Host "`nCopied $copiedCount files, $errorCount errors" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Yellow" })

# Handle deleted category-groups files
Write-Host "`nHandling deleted category-groups files..." -ForegroundColor Cyan
$deletedFiles = @(
    "packages/desktop-client/src/components/category-groups/CategoryGroups.tsx",
    "packages/desktop-client/src/components/category-groups/CategoryGroupsPage.tsx",
    "packages/desktop-client/src/components/category-groups/EditCategoryGroupModal.tsx"
)

$deletedCount = 0
foreach ($file in $deletedFiles) {
    # Check if file exists in current branch (v25.11.0)
    if (Test-Path $file) {
        Write-Host "  Removing: $file" -ForegroundColor Gray
        $rmResult = git rm $file 2>&1
        if ($LASTEXITCODE -eq 0) {
            $deletedCount++
        } else {
            Write-Host "    WARNING: Could not remove: $rmResult" -ForegroundColor Yellow
        }
    }
}

# Show status
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Staged changes:" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
git status --short

Write-Host "`n" + ("=" * 60) -ForegroundColor Green
Write-Host "✅ Clean branch created successfully!" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes: git diff --cached" -ForegroundColor White
Write-Host "2. Commit: git commit -m 'Add Budget Views feature with cross-device sync'" -ForegroundColor White
Write-Host "3. Push: git push origin $newBranch" -ForegroundColor White
Write-Host "4. Create PR targeting v25.11.0" -ForegroundColor White
Write-Host "`n" + ("=" * 60) -ForegroundColor Cyan
Write-Host "Script completed. Press any key to exit..." -ForegroundColor Gray
try {
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    # If ReadKey doesn't work, use Read-Host instead
    Read-Host "Press Enter to exit"
}

