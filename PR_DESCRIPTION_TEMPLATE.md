# Add Category Groups Feature

## Summary
This PR adds a new **Category Groups** feature that allows users to create custom labels/groups for organizing categories in the budget view. Users can assign multiple categories to custom groups and filter the budget table by these groups.

## Changes

### New Components
- `CategoryGroups.tsx` - Main component for managing category groups
- `CategoryGroupsPage.tsx` - Page wrapper for Category Groups feature
- `EditCategoryGroupModal.tsx` - Modal for editing category group assignments
- `CategoryFilterSelector.tsx` - Filter component for budget table by category groups

### Integration
- Added Category Groups route (`/category-groups`)
- Added navigation items (sidebar, command bar)
- Integrated filtering into budget table
- Added modal handlers and state management

### Type Definitions
- Added `budget.categoryLabelMap` and `budget.customCategoryLabels` preferences

## Features
- ✅ Create custom category groups
- ✅ Assign categories to groups
- ✅ Filter budget table by groups
- ✅ Edit group assignments via modal
- ✅ Delete groups (categories remain)

## Technical Notes
- Category groups stored in local preferences (client-side only)
- Uses `budget.categoryLabelMap` (Record<string, string[]>) to map categories to groups
- Uses `budget.customCategoryLabels` (Array<{id, name}>) to store group definitions
- Supports shift+click for range selection in edit modal

## Testing
- [ ] Create/edit/delete category groups
- [ ] Assign categories to groups
- [ ] Filter budget table by groups
- [ ] Verify filtering with collapsed/expanded groups

