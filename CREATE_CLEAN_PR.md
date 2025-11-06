# Create Clean PR Targeting v25.11.0 (2025.11.0)

## Current Situation

- **Current Branch**: `category_groups_ai`
- **Base Tag**: `v25.11.0` (2025.11.0)
- **Your Commits**: Budget Views feature commits on top of v25.11.0

## Option 1: Create PR from Current Branch (Recommended)

If your current branch only has Budget Views changes, you can create a PR directly:

1. **Verify your changes are clean:**
   ```powershell
   # See what files you've changed vs v25.11.0
   git diff v25.11.0..HEAD --name-only
   ```

2. **Push your branch:**
   ```powershell
   git push origin category_groups_ai
   ```

3. **Create PR on GitHub:**
   - Go to: https://github.com/actualbudget/actual/compare
   - Base: `v25.11.0` (or the branch that contains v25.11.0)
   - Compare: `al3x1337:category_groups_ai`
   - This will show ONLY your Budget Views changes

## Option 2: Create Clean Branch from v25.11.0 (If Needed)

If you want a completely clean branch with only your feature:

```powershell
# 1. Create a new branch from v25.11.0
git checkout -b budget-views-v25.11.0 v25.11.0

# 2. Cherry-pick only your feature commits
# (Replace with your actual commit hashes)
git cherry-pick fc39d6272  # Add Budget Views feature with cross-device sync
git cherry-pick efa4f4b27  # cleaned up v2 (if needed)

# 3. Stage only Budget Views files
git add packages/desktop-client/src/components/budget-views/
git add packages/desktop-client/src/hooks/useSyncedPrefJson.ts
git add packages/desktop-client/src/components/CommandBar.tsx
git add packages/desktop-client/src/components/FinancesApp.tsx
git add packages/desktop-client/src/components/Modals.tsx
git add packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx
git add packages/desktop-client/src/modals/modalsSlice.ts
git add packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx
git add packages/desktop-client/src/components/settings/Experimental.tsx
git add packages/desktop-client/src/hooks/useFeatureFlag.ts
git add packages/loot-core/src/types/prefs.ts
git add packages/loot-core/migrations/1723665565000_prefs.js
git add desktop-client/public/data/migrations/1723665565000_prefs.js
git add packages/desktop-client/src/components/category-groups/

# 4. Commit
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

# 5. Push new branch
git push origin budget-views-v25.11.0
```

## Option 3: Interactive Rebase to Clean Up Commits

If you want to squash/clean up your commits:

```powershell
# 1. Find the commit hash of v25.11.0
git log --oneline | Select-String "v25.11.0"

# 2. Interactive rebase from that point
git rebase -i v25.11.0

# 3. In the editor, you can:
#    - Pick the commits you want
#    - Squash commits together
#    - Reword commit messages
#    - Drop commits you don't want

# 4. Force push (only if you haven't shared the branch yet)
git push origin category_groups_ai --force-with-lease
```

## Recommended Approach

**Use Option 1** if your current branch is clean. Just:
1. Make sure you've committed only Budget Views changes
2. Push the branch
3. Create PR targeting `v25.11.0` as base

## Verify What Will Be in PR

```powershell
# See all files that differ from v25.11.0
git diff v25.11.0..HEAD --name-only

# See the actual changes
git diff v25.11.0..HEAD --stat
```

## Important Notes

- When creating the PR, set the **base branch** to the branch/tag that contains `v25.11.0`
- GitHub will automatically show only the diff between base and your branch
- Make sure to use `PR_DESCRIPTION.md` content for the PR description
- Add the "AI generated" label if applicable

