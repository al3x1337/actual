# Files to Include in Budget Views PR

## ✅ Source Code Files (Include)

### New Feature Components

```
packages/desktop-client/src/components/budget-views/BudgetViews.tsx
packages/desktop-client/src/components/budget-views/BudgetViewsPage.tsx
packages/desktop-client/src/components/budget-views/EditBudgetViewModal.tsx
packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx
```

### Integration Files

```
packages/desktop-client/src/components/CommandBar.tsx
packages/desktop-client/src/components/FinancesApp.tsx
packages/desktop-client/src/components/Modals.tsx
packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx
packages/desktop-client/src/modals/modalsSlice.ts
packages/desktop-client/src/components/budget/BudgetCategories.jsx
packages/desktop-client/src/components/budget/BudgetTable.tsx
packages/desktop-client/src/components/budget/BudgetTotals.tsx
```

### Type Definitions

```
packages/loot-core/src/types/prefs.ts
```

### Build Infrastructure (if needed)

```
packages/loot-core/src/platform/server/fs/index.web.ts
```

### Dependencies

```
packages/api/package.json
packages/desktop-client/package.json
packages/loot-core/package.json
packages/plugins-service/package.json
packages/sync-server/package.json
yarn.lock
```

## ❌ Build Artifacts (Exclude from PR)

These should be in `.gitignore` or excluded:

```
desktop-client/public/kcab/kcab.worker.dev.js
desktop-client/public/kcab/kcab.worker.dev.js.map
desktop-client/public/kcab/stats.json
desktop-client/public/data-file-index.txt
desktop-client/public/sql-wasm.wasm
```

## Summary

- **Total source files**: ~17 files
- **New components**: 4 files
- **Modified components**: 9 files
- **Type definitions**: 1 file
- **Dependencies**: 6 files
