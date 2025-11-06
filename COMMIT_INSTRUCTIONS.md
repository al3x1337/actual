# Commit and Docker Hub Upload Instructions

## ✅ Pre-Commit Checklist

- [x] TypeScript type checking passes
- [x] No linter errors
- [x] All feature flag integration complete
- [x] Mobile UI protection in place
- [x] PR description ready

## 📦 Files to Commit

### Core Feature Files (Must Include)
```bash
# New Budget Views components
git add packages/desktop-client/src/components/budget-views/

# New hook for JSON synced preferences
git add packages/desktop-client/src/hooks/useSyncedPrefJson.ts

# Modified integration files
git add packages/desktop-client/src/components/CommandBar.tsx
git add packages/desktop-client/src/components/FinancesApp.tsx
git add packages/desktop-client/src/components/Modals.tsx
git add packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx
git add packages/desktop-client/src/modals/modalsSlice.ts

# Modified budget filter component
git add packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx

# Feature flag integration
git add packages/desktop-client/src/components/settings/Experimental.tsx
git add packages/desktop-client/src/hooks/useFeatureFlag.ts

# Type definitions and migrations
git add packages/loot-core/src/types/prefs.ts
git add packages/loot-core/migrations/1723665565000_prefs.js
git add desktop-client/public/data/migrations/1723665565000_prefs.js

# Deleted old category-groups files (if they exist)
git add packages/desktop-client/src/components/category-groups/
```

### Optional Documentation Files
```bash
# Include these if helpful for reviewers
git add PR_DESCRIPTION.md
git add BUDGET_VIEWS_FEATURE.md
```

## 🚀 Commit Command

```bash
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

## 🐳 Docker Hub Upload

### Prerequisites
1. Docker Desktop must be running
2. Logged into Docker Hub: `docker login`

### Build and Push Script

The script `build-and-push-docker.ps1` is ready to use:

```powershell
.\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Tag "latest"
```

**Or with a specific tag:**
```powershell
.\build-and-push-docker.ps1 -DockerHubUsername "your-username" -Tag "v1.0.0"
```

### What the Script Does
1. Checks Docker availability
2. Builds the Docker image from `sync-server.Dockerfile`
3. Tags it as `your-username/actual-server-budget-views:tag`
4. Optionally pushes to Docker Hub
5. Provides image URL when complete

### Manual Docker Commands (Alternative)

If you prefer manual commands:

```powershell
# Build the image
docker build -f sync-server.Dockerfile -t your-username/actual-server-budget-views:latest .

# Push to Docker Hub
docker push your-username/actual-server-budget-views:latest
```

## 📝 PR Creation

After committing and pushing to your fork:

1. Go to GitHub and create a Pull Request
2. Use the content from `PR_DESCRIPTION.md` as the PR description
3. Add the "AI generated" label if applicable (per AGENTS.md guidelines)
4. Reference any related issues if applicable

## ✅ Verification

After commit, verify:
- [ ] All files committed successfully
- [ ] Docker image builds without errors
- [ ] Docker image pushes successfully
- [ ] PR description is complete

