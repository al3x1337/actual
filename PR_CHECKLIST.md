# Pull Request Checklist for Budget Views Feature

## Pre-Submission Checklist

### Code Quality
- [x] TypeScript type checking passes (`yarn typecheck`)
- [x] Linting issues in new files resolved
- [x] All user-facing strings are internationalized
- [x] Code follows Actual Budget conventions

### Files to Include in PR

#### New Feature Components (3 files)
- [x] `packages/desktop-client/src/components/budget-views/BudgetViews.tsx`
- [x] `packages/desktop-client/src/components/budget-views/BudgetViewsPage.tsx`
- [x] `packages/desktop-client/src/components/budget-views/EditBudgetViewModal.tsx`

#### Modified Integration Files (7 files)
- [x] `packages/desktop-client/src/components/CommandBar.tsx`
- [x] `packages/desktop-client/src/components/FinancesApp.tsx`
- [x] `packages/desktop-client/src/components/Modals.tsx`
- [x] `packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx`
- [x] `packages/desktop-client/src/modals/modalsSlice.ts`
- [x] `packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx`
- [x] `packages/loot-core/src/types/prefs.ts`

#### Deleted Files (3 files)
- [x] `packages/desktop-client/src/components/category-groups/CategoryGroups.tsx`
- [x] `packages/desktop-client/src/components/category-groups/CategoryGroupsPage.tsx`
- [x] `packages/desktop-client/src/components/category-groups/EditCategoryGroupModal.tsx`

### Files to EXCLUDE from PR

#### Build Artifacts (should be in .gitignore)
- [x] `desktop-client/` directory (build artifacts)
- [x] `*.dockerbuild` files
- [x] `*.dockerbuild.zip` files

#### Documentation/Helper Files (optional - can include if helpful)
- [ ] `BUDGET_VIEWS_FEATURE.md` (detailed feature docs - optional)
- [ ] `DOCKER_DEPLOYMENT.md` (deployment guide - optional)
- [ ] `DEPLOYMENT_GUIDE.md` (deployment guide - optional)
- [ ] `FILES_TO_INCLUDE_IN_PR.md` (helper file - optional)
- [ ] `PR_DESCRIPTION_TEMPLATE.md` (helper file - optional)
- [ ] `PR_DESCRIPTION.md` (use this for PR description)
- [ ] `build-and-push-docker.ps1` (deployment script - optional)
- [ ] `build-docker-manual.ps1` (deployment script - optional)
- [ ] `generate-dockerbuild.ps1` (deployment script - optional)

#### Configuration Files
- [ ] `.github/workflows/docker-edge.yml` (only if you modified CI/CD)
- [ ] `.github/workflows/docker-release.yml` (only if you modified CI/CD)
- [ ] `sync-server.Dockerfile` (only if you modified Docker config)
- [ ] `.gitignore` (only if you added new ignore patterns)

## PR Description

Use the content from `PR_DESCRIPTION.md` as your PR description.

## Testing Checklist

Before submitting, verify:
- [x] Create a new budget view
- [x] Rename a budget view
- [x] Assign categories to a view
- [x] Filter budget table by budget view
- [x] Edit view assignments via modal
- [x] Delete a budget view
- [x] Verify categories remain after view deletion
- [x] Test shift+click range selection in edit modal
- [x] Verify filtering works with collapsed/expanded groups
- [x] Test drag and drop reordering
- [x] Test with multiple views assigned to same category
- [x] Verify preferences persist across sessions

## Next Steps

1. Review all changes: `git diff`
2. Stage only the files you want to include: `git add <files>`
3. Commit with a clear message
4. Push to your fork
5. Create PR on GitHub using `PR_DESCRIPTION.md` content
6. Add "AI generated" label if applicable (per AGENTS.md guidelines)

