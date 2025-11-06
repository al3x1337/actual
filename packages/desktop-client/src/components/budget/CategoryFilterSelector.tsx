import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Tooltip } from '@actual-app/components/tooltip';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import * as monthUtils from 'loot-core/shared/months';
import { type CategoryEntity } from 'loot-core/types/models';

import { useFormat } from '@desktop-client/hooks/useFormat';
import { useLocalPref } from '@desktop-client/hooks/useLocalPref';
import { useSpreadsheet } from '@desktop-client/hooks/useSpreadsheet';
import { useSyncedPref } from '@desktop-client/hooks/useSyncedPref';
import { envelopeBudget, trackingBudget } from '@desktop-client/spreadsheet/bindings';
import { MonthsContext } from './MonthsContext';
import { getScrollbarWidth } from './util';

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

type LabelButtonProps = {
  label: CategoryLabel;
  categoryIds: string[];
  isSelected: boolean;
  onToggle: () => void;
  activeBudgetType: string;
  format: (value: unknown, type?: string) => string;
  t: (key: string) => string;
};

function LabelButton({
  label,
  categoryIds,
  isSelected,
  onToggle,
  activeBudgetType,
  format,
  t,
}: LabelButtonProps) {
  const spreadsheet = useSpreadsheet();
  const { months } = useContext(MonthsContext);
  const currentMonth = months?.[0] || '';
  const sheetName = monthUtils.sheetForMonth(currentMonth);
  
  const [stats, setStats] = useState({ budgeted: 0, spent: 0, count: categoryIds.length });
  
  // Bind to all category values using useEffect
  useEffect(() => {
    if (categoryIds.length === 0 || !sheetName) {
      setStats({ budgeted: 0, spent: 0, count: 0 });
      return;
    }

    const budgetValues: Record<string, number> = {};
    const spentValues: Record<string, number> = {};
    const unbindList: (() => void)[] = [];

    categoryIds.forEach(categoryId => {
      const budgetBinding = activeBudgetType === 'envelope'
        ? envelopeBudget.catBudgeted(categoryId)
        : trackingBudget.catBudgeted(categoryId);
      const spentBinding = activeBudgetType === 'envelope'
        ? envelopeBudget.catSumAmount(categoryId)
        : trackingBudget.catSumAmount(categoryId);

      const unbindBudget = spreadsheet.bind(sheetName, budgetBinding, result => {
        budgetValues[categoryId] = typeof result.value === 'number' ? result.value : 0;
        const total = Object.values(budgetValues).reduce((sum, val) => sum + val, 0);
        const totalSpent = Object.values(spentValues).reduce((sum, val) => sum + val, 0);
        setStats({ budgeted: total, spent: totalSpent, count: categoryIds.length });
      });
      unbindList.push(unbindBudget);

      const unbindSpent = spreadsheet.bind(sheetName, spentBinding, result => {
        spentValues[categoryId] = typeof result.value === 'number' ? result.value : 0;
        const total = Object.values(budgetValues).reduce((sum, val) => sum + val, 0);
        const totalSpent = Object.values(spentValues).reduce((sum, val) => sum + val, 0);
        setStats({ budgeted: total, spent: totalSpent, count: categoryIds.length });
      });
      unbindList.push(unbindSpent);
    });

    return () => {
      unbindList.forEach(unbind => unbind());
    };
  }, [categoryIds, sheetName, activeBudgetType, spreadsheet]);

  const balance = stats.budgeted + stats.spent;
  const count = stats.count;

  const tooltipContent = (
    <View style={{ padding: 8, minWidth: 200 }}>
      <Text style={{ fontWeight: 600, marginBottom: 8 }}>{label.name}</Text>
      <View style={{ gap: 4 }}>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.pageTextLight }}>{t('Budgeted:')}</Text>
          <Text style={{ fontWeight: 500 }}>{format(stats.budgeted, 'financial')}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: theme.pageTextLight }}>{t('Spent:')}</Text>
          <Text style={{ fontWeight: 500 }}>{format(stats.spent, 'financial')}</Text>
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', borderTop: `1px solid ${theme.tableBorder}`, paddingTop: 4, marginTop: 4 }}>
          <Text style={{ color: theme.pageTextLight, fontWeight: 600 }}>{t('Balance:')}</Text>
          <Text style={{ fontWeight: 600, color: balance < 0 ? theme.errorText : theme.pageText }}>
            {format(balance, 'financial')}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Tooltip content={tooltipContent} placement="bottom">
      <Button
        variant="bare"
        onPress={onToggle}
        style={{
          fontSize: 12,
          margin: 0,
          padding: '4px 12px',
          border: `1px solid ${theme.tableBorder}`,
          borderRadius: 4,
          ...(isSelected && {
            backgroundColor: theme.tableBorderHover,
            color: theme.buttonPrimaryText,
          }),
        }}
      >
        <Text>{label.name}</Text>
      </Button>
    </Tooltip>
  );
}

export function CategoryFilterSelector({
  categoryGroups,
  onFilterChange,
}: CategoryFilterSelectorProps) {
  const { t } = useTranslation();
  const format = useFormat();
  const { months, type: budgetType } = useContext(MonthsContext);
  const currentMonth = months?.[0] || '';
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [categoryLabelMap = {}, setCategoryLabelMapPref] = useLocalPref(
    'budget.categoryLabelMap',
  );
  const [customLabels = []] = useLocalPref('budget.customCategoryLabels');
  const [collapsedGroupIds = [], setCollapsedGroupIdsPref] = useLocalPref(
    'budget.collapsed',
  );
  const [budgetTypePref = 'envelope'] = useSyncedPref('budgetType');
  const activeBudgetType = budgetType || budgetTypePref;
  
  // Store the original collapsed state before filtering
  const originalCollapsedStateRef = useRef<string[] | null>(null);

  const labels = useMemo(() => {
    // Collect all label IDs that are actually in use (from categoryLabelMap)
    const labelsInUse = new Set<string>();
    Object.values(categoryLabelMap).forEach(labelIds => {
      labelIds.forEach(labelId => labelsInUse.add(labelId));
    });

    // Include all custom labels that are in use
    const allCustomLabels = Array.isArray(customLabels) ? customLabels : [];

    // Remove duplicates by ID and only show labels that are in use
    const seen = new Set<string>();
    return allCustomLabels.filter(label => {
      if (seen.has(label.id)) {
        return false;
      }
      seen.add(label.id);
      return labelsInUse.has(label.id);
    });
  }, [categoryLabelMap, customLabels]);

  // Calculate category IDs for each label
  const labelCategoryIds = useMemo(() => {
    const map: Record<string, string[]> = {};
    labels.forEach(label => {
      const ids: string[] = [];
      Object.entries(categoryLabelMap).forEach(([categoryId, labelIds]) => {
        if (Array.isArray(labelIds) && labelIds.includes(label.id)) {
          ids.push(categoryId);
        }
      });
      map[label.id] = ids;
    });
    return map;
  }, [labels, categoryLabelMap]);

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
      // Restore original collapsed state when clearing filters
      if (originalCollapsedStateRef.current !== null) {
        setCollapsedGroupIdsPref(originalCollapsedStateRef.current);
        originalCollapsedStateRef.current = null;
      }
      onFilterChange(null); // Show all categories
    } else {
      // Store original collapsed state if this is the first filter applied
      if (originalCollapsedStateRef.current === null) {
        originalCollapsedStateRef.current = [...collapsedGroupIds];
      }

      const filteredCategoryIds = new Set<string>();
      Object.entries(categoryLabelMap).forEach(([categoryId, labelIds]) => {
        if (
          Array.isArray(labelIds) &&
          labelIds.some(id => newSelected.has(id))
        ) {
          filteredCategoryIds.add(categoryId);
        }
      });

      // Find groups that contain filtered categories and expand them
      const groupsToExpand = new Set<string>();
      categoryGroups.forEach(group => {
        const hasFilteredCategory = group.categories?.some(cat =>
          filteredCategoryIds.has(cat.id),
        );
        if (hasFilteredCategory && collapsedGroupIds.includes(group.id)) {
          groupsToExpand.add(group.id);
        }
      });

      // Expand groups that contain filtered categories
      if (groupsToExpand.size > 0) {
        setCollapsedGroupIdsPref(
          collapsedGroupIds.filter(id => !groupsToExpand.has(id)),
        );
      }

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

  // Don't show the filter bar if no category groups are created or if none are in use
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
        borderTop: `1px solid ${theme.tableBorder}`,
        borderBottom: `1px solid ${theme.tableBorder}`,
        flexWrap: 'wrap',
        marginLeft: 5,
        marginRight: 5 + getScrollbarWidth(),
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      {labels.map(label => {
        const isSelected = selectedLabels.has(label.id);
        const categoryIds = labelCategoryIds[label.id] || [];
        return (
          <LabelButton
            key={label.id}
            label={label}
            categoryIds={categoryIds}
            isSelected={isSelected}
            onToggle={() => handleLabelToggle(label.id)}
            activeBudgetType={activeBudgetType}
            format={(value: unknown, type?: string) => format(value, type as any)}
            t={t}
          />
        );
      })}
      {selectedLabels.size > 0 && (
        <Button
          variant="bare"
          onPress={() => {
            setSelectedLabels(new Set());
            // Restore original collapsed state when clearing filters
            if (originalCollapsedStateRef.current !== null) {
              setCollapsedGroupIdsPref(originalCollapsedStateRef.current);
              originalCollapsedStateRef.current = null;
            }
            onFilterChange(null);
          }}
          style={{
            fontSize: 13,
            padding: '4px 8px',
            marginLeft: 'auto',
            color: theme.pageTextLight,
            border: `1px solid ${theme.tableBorder}`,
            borderRadius: 4,
          }}
        >
          {t('Clear filters')}
        </Button>
      )}
    </View>
  );
}

