# Commit and Docker Hub Upload Guide

## ✅ Final Status Check

- ✅ TypeScript: All files pass
- ✅ Linting: No errors  
- ✅ Feature flag: Integrated
- ✅ Mobile protection: In place
- ✅ Docker script: Ready

## 📦 Step 1: Stage Feature Files Only

**IMPORTANT**: Only commit Budget Views feature files. Many other files are modified from upstream syncs - exclude those.

```powershell
# Core Budget Views feature
git add packages/desktop-client/src/components/budget-views/
git add packages/desktop-client/src/hooks/useSyncedPrefJson.ts

# Integration files
git add packages/desktop-client/src/components/CommandBar.tsx
git add packages/desktop-client/src/components/FinancesApp.tsx
git add packages/desktop-client/src/components/Modals.tsx
git add packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx
git add packages/desktop-client/src/modals/modalsSlice.ts

# Budget filter component
git add packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx

# Feature flag integration
git add packages/desktop-client/src/components/settings/Experimental.tsx
git add packages/desktop-client/src/hooks/useFeatureFlag.ts

# Type definitions and migrations
git add packages/loot-core/src/types/prefs.ts
git add packages/loot-core/migrations/1723665565000_prefs.js
git add desktop-client/public/data/migrations/1723665565000_prefs.js

# Deleted old category-groups files
git add packages/desktop-client/src/components/category-groups/
```

## 📝 Step 2: Commit

```powershell
git commit -m "Add Budget Views feature with cross-device sync

- Add Budget Views feature for organizing and filtering categories
- Support create, rename, delete, and reorder budget views
- Implement drag-and-drop reordering
- Add shift+click range selection in edit modal
- Store in synced preferences (syncs across devices)
- Add experimental feature flag toggle in Settings
- Desktop-only feature (mobile redirects to budget page)
- Add useSyncedPrefJson hook for JSON synced preferences
- Update migrations to include budget views in synced prefs"
```

## 🚀 Step 3: Push to Your Fork

```powershell
git push origin your-branch-name
```

## 🐳 Step 4: Build and Push Docker Image

### Option A: Use the PowerShell Script (Recommended)

```powershell
.\build-and-push-docker.ps1 -DockerHubUsername "your-dockerhub-username" -Tag "latest"
```

The script will:
1. Check Docker is running
2. Build the image (10-20 minutes)
3. Ask if you want to push
4. Push to Docker Hub if confirmed

### Option B: Manual Docker Commands

```powershell
# Make sure you're logged in
docker login

# Build the image
docker build -f sync-server.Dockerfile -t your-username/actual-server-budget-views:latest .

# Push to Docker Hub
docker push your-username/actual-server-budget-views:latest
```

## 📋 Step 5: Create Pull Request

1. Go to GitHub and create a Pull Request from your fork
2. Copy the content from `PR_DESCRIPTION.md` as the PR description
3. Add the "AI generated" label if applicable
4. Submit the PR

## ✅ Verification Checklist

After completing all steps:
- [ ] Commit successful
- [ ] Push to fork successful
- [ ] Docker image built successfully
- [ ] Docker image pushed to Docker Hub
- [ ] PR created with proper description

