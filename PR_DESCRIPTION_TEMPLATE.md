# Add Budget Views Feature

## Summary

This PR adds a new **Budget Views** feature that allows users to create custom views/labels for organizing categories in the budget view. Users can assign multiple categories to custom views and filter the budget table by these views.

## Changes

### New Components

- `BudgetViews.tsx` - Main component for managing budget views
- `BudgetViewsPage.tsx` - Page wrapper for Budget Views feature
- `EditBudgetViewModal.tsx` - Modal for editing budget view assignments
- `CategoryFilterSelector.tsx` - Filter component for budget table by budget views

### Integration

- Added Budget Views route (`/budget-views`)
- Added navigation items (sidebar, command bar)
- Integrated filtering into budget table
- Added modal handlers and state management

### Type Definitions

- Added `budget.budgetViewMap` and `budget.customBudgetViews` preferences

## Features

- ✅ Create custom budget views
- ✅ Assign categories to views
- ✅ Filter budget table by views
- ✅ Edit view assignments via modal
- ✅ Delete views (categories remain)

## Technical Notes

- Budget views stored in local preferences (client-side only)
- Uses `budget.budgetViewMap` (Record<string, string[]>) to map categories to views
- Uses `budget.customBudgetViews` (Array<{id, name}>) to store view definitions
- Supports shift+click for range selection in edit modal

## Testing

- [ ] Create/edit/delete budget views
- [ ] Assign categories to views
- [ ] Filter budget table by views
- [ ] Verify filtering with collapsed/expanded groups
