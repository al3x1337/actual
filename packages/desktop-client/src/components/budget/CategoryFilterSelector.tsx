import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { type CategoryEntity } from 'loot-core/types/models';

import { useLocalPref } from '@desktop-client/hooks/useLocalPref';

type CategoryFilterSelectorProps = {
  categoryGroups: Array<{
    id: string;
    name: string;
    categories?: CategoryEntity[];
  }>;
  onFilterChange: (filteredCategoryIds: string[] | null) => void;
};

type CategoryLabel = {
  id: string;
  name: string;
};

const DEFAULT_LABELS: CategoryLabel[] = [
  { id: 'bills', name: 'Bills' },
  { id: 'fun-money', name: 'Fun Money' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'savings', name: 'Savings' },
];

export function CategoryFilterSelector({
  categoryGroups,
  onFilterChange,
}: CategoryFilterSelectorProps) {
  const { t } = useTranslation();
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [categoryLabelMap = {}, setCategoryLabelMapPref] = useLocalPref(
    'budget.categoryLabelMap',
  );

  const labels = useMemo(() => {
    // Get all unique labels from the category mapping
    const allLabelIds = new Set<string>();
    Object.values(categoryLabelMap).forEach(labelIds => {
      labelIds.forEach(labelId => allLabelIds.add(labelId));
    });

    // Include default labels
    DEFAULT_LABELS.forEach(label => allLabelIds.add(label.id));

    // Return labels in a consistent order
    return DEFAULT_LABELS.filter(label => allLabelIds.has(label.id));
  }, [categoryLabelMap]);

  const handleLabelToggle = (labelId: string) => {
    const newSelected = new Set(selectedLabels);
    if (newSelected.has(labelId)) {
      newSelected.delete(labelId);
    } else {
      newSelected.add(labelId);
    }
    setSelectedLabels(newSelected);

    // Find all categories that belong to the selected labels
    if (newSelected.size === 0) {
      onFilterChange(null); // Show all categories
    } else {
      const filteredCategoryIds = new Set<string>();
      Object.entries(categoryLabelMap).forEach(([categoryId, labelIds]) => {
        if (
          Array.isArray(labelIds) &&
          labelIds.some(id => newSelected.has(id))
        ) {
          filteredCategoryIds.add(categoryId);
        }
      });
      onFilterChange(Array.from(filteredCategoryIds));
    }
  };

  // Function to assign a category to a label (can be called from a context menu or settings)
  const assignCategoryToLabel = (
    categoryId: string,
    labelId: string,
    add: boolean,
  ) => {
    const currentLabels = categoryLabelMap[categoryId] || [];
    const updatedLabels = add
      ? [...currentLabels, labelId].filter(
          (id, index, arr) => arr.indexOf(id) === index,
        ) // Remove duplicates
      : currentLabels.filter(id => id !== labelId);

    const newMap = Object.assign({}, categoryLabelMap || {});
    if (updatedLabels.length === 0) {
      delete newMap[categoryId];
    } else {
      newMap[categoryId] = updatedLabels;
    }
    setCategoryLabelMapPref(newMap);
  };

  if (labels.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        backgroundColor: theme.tableBackground,
        borderBottom: `1px solid ${theme.tableBorder}`,
        flexWrap: 'wrap',
        marginLeft: 5,
        marginRight: 5,
      }}
    >
      {labels.map(label => (
        <Button
          key={label.id}
          variant={selectedLabels.has(label.id) ? 'menuSelected' : 'menu'}
          onPress={() => handleLabelToggle(label.id)}
          style={{
            fontSize: 13,
            padding: '4px 12px',
          }}
        >
          {label.name}
        </Button>
      ))}
      {selectedLabels.size > 0 && (
        <Button
          variant="bare"
          onPress={() => {
            setSelectedLabels(new Set());
            onFilterChange(null);
          }}
          style={{
            fontSize: 13,
            padding: '4px 8px',
            marginLeft: 'auto',
            color: theme.pageTextLight,
          }}
        >
          {t('Clear filters')}
        </Button>
      )}
    </View>
  );
}

