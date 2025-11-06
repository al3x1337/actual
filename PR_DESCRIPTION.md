# Add Budget Views Feature

## Summary

This PR adds a new **Budget Views** feature that allows users to create custom views/labels for organizing categories in the budget view. Users can assign multiple categories to custom views and filter the budget table by these views.

## Features

- ✅ Create custom budget views with custom names
- ✅ Rename budget views
- ✅ Assign categories to views (multiple categories can belong to multiple views)
- ✅ Filter budget table by selected views
- ✅ Edit view assignments via modal with shift+click range selection
- ✅ Delete views (categories remain, just unviewed)
- ✅ Reorder views via drag and drop
- ✅ View category counts per budget view
- ✅ Experimental feature toggle in Settings → Experimental features

## Changes

### New Components

- **`BudgetViews.tsx`** - Main component for managing budget views with rename and reorder functionality
- **`BudgetViewsPage.tsx`** - Page wrapper for Budget Views feature
- **`EditBudgetViewModal.tsx`** - Modal for editing budget view assignments with shift+click support
- **`CategoryFilterSelector.tsx`** - Filter component for budget table by budget views (shows stats on hover)

### Integration

- Added Budget Views route (`/budget-views`)
- Added navigation items (sidebar, command bar)
- Integrated filtering into budget table
- Added modal handlers and state management
- Updated preference types

### Type Definitions

- Added `budget.budgetViewMap` preference: `Record<string, string[]>` (maps category ID to array of view IDs)
- Added `budget.customBudgetViews` preference: `Array<{ id: string; name: string }>` (stores view definitions)

## Technical Notes

- **Storage**: Budget views stored in synced preferences (syncs across devices via sync server)
- **Data Structure**: 
  - `budget.budgetViewMap`: Maps category ID → array of view IDs (stored as JSON string)
  - `budget.customBudgetViews`: Array of view definitions with id and name (stored as JSON string)
- **New Hook**: Created `useSyncedPrefJson` hook to handle JSON serialization/deserialization for complex synced preferences
- **UX Features**:
  - Drag and drop reordering
  - Shift+click for range selection in edit modal
  - Tooltip shows budgeted/spent/balance stats when hovering filter buttons
  - Preserves collapsed state during filtering
- **Integration**: Seamlessly integrates with existing budget table filtering and collapse/expand functionality

## Testing Checklist

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

## Code Quality

- ✅ TypeScript type checking passes
- ✅ Follows Actual Budget coding conventions
- ✅ Uses functional components with hooks
- ✅ Proper separation of concerns
- ✅ Reusable components
- ✅ All user-facing strings are internationalized

## Files Changed

### New Files (3)
- `packages/desktop-client/src/components/budget-views/BudgetViews.tsx`
- `packages/desktop-client/src/components/budget-views/BudgetViewsPage.tsx`
- `packages/desktop-client/src/components/budget-views/EditBudgetViewModal.tsx`

### Modified Files (10)
- `packages/desktop-client/src/components/CommandBar.tsx`
- `packages/desktop-client/src/components/FinancesApp.tsx`
- `packages/desktop-client/src/components/Modals.tsx`
- `packages/desktop-client/src/components/sidebar/PrimaryButtons.tsx`
- `packages/desktop-client/src/modals/modalsSlice.ts`
- `packages/desktop-client/src/components/budget/CategoryFilterSelector.tsx`
- `packages/desktop-client/src/components/settings/Experimental.tsx`
- `packages/desktop-client/src/hooks/useFeatureFlag.ts`
- `packages/loot-core/src/types/prefs.ts`
- `packages/loot-core/migrations/1723665565000_prefs.js`
- `desktop-client/public/data/migrations/1723665565000_prefs.js`

### New Hooks (1)
- `packages/desktop-client/src/hooks/useSyncedPrefJson.ts` - Hook for synced preferences with JSON serialization

## Notes

- Budget views are stored in synced preferences and sync across all devices via the sync server
- This feature enhances budget organization without modifying core category structure
- The feature is accessible via sidebar navigation and command bar
- All user-facing strings are internationalized using the translation system
- Migration included to move existing budget views from local to synced preferences (if any exist)
- **Feature is gated behind experimental feature flag** - users must enable "Budget Views" in Settings → Experimental features to use it
- **Mobile UI not supported** - Budget Views feature is desktop-only and will redirect mobile users to the budget page

