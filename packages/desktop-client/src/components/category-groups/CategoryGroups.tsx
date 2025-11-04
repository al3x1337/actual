import React, { useCallback, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgAdd, SvgEditPencil } from '@actual-app/components/icons/v1';
import { SvgDelete } from '@actual-app/components/icons/v0';
import { Stack } from '@actual-app/components/stack';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { type CategoryEntity } from 'loot-core/types/models';

import { useCategories } from '@desktop-client/hooks/useCategories';
import { useLocalPref } from '@desktop-client/hooks/useLocalPref';
import { pushModal } from '@desktop-client/modals/modalsSlice';
import { useDispatch } from '@desktop-client/redux';

const DEFAULT_LABELS = [
  { id: 'bills', name: 'Bills' },
  { id: 'fun-money', name: 'Fun Money' },
  { id: 'groceries', name: 'Groceries' },
  { id: 'transportation', name: 'Transportation' },
  { id: 'utilities', name: 'Utilities' },
  { id: 'savings', name: 'Savings' },
];

type CategoryLabel = {
  id: string;
  name: string;
};

export function CategoryGroups() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { list: categories } = useCategories();
  const [categoryLabelMap = {}, setCategoryLabelMapPref] = useLocalPref(
    'budget.categoryLabelMap',
  );
  const [customLabels = [], setCustomLabels] = useLocalPref(
    'budget.customCategoryLabels',
  );

  // Get all unique labels from the map and include defaults + custom
  const labels = useMemo(() => {
    const allLabelIds = new Set<string>();
    Object.values(categoryLabelMap).forEach(labelIds => {
      labelIds.forEach(labelId => allLabelIds.add(labelId));
    });
    DEFAULT_LABELS.forEach(label => allLabelIds.add(label.id));
    if (Array.isArray(customLabels)) {
      customLabels.forEach((label: CategoryLabel) => allLabelIds.add(label.id));
    }

    const allLabels = [
      ...DEFAULT_LABELS,
      ...(Array.isArray(customLabels) ? customLabels : []),
    ].filter(label => allLabelIds.has(label.id));

    // Remove duplicates by ID
    const seen = new Set<string>();
    return allLabels.filter(label => {
      if (seen.has(label.id)) {
        return false;
      }
      seen.add(label.id);
      return true;
    });
  }, [categoryLabelMap, customLabels]);

  const handleAdd = useCallback(() => {
    const name = prompt(t('Enter category group name:'));
    if (name && name.trim()) {
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Check if ID already exists
      const existingCustom = Array.isArray(customLabels) ? customLabels : [];
      if (DEFAULT_LABELS.find(l => l.id === id) || existingCustom.find((l: CategoryLabel) => l.id === id)) {
        alert(t('A category group with this name already exists.'));
        return;
      }

      const newLabel: CategoryLabel = { id, name: name.trim() };
      setCustomLabels([...existingCustom, newLabel]);
    }
  }, [customLabels, setCustomLabels, t]);

  const handleDelete = useCallback((labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (
      confirm(
        t('Delete category group "{{name}}"?', {
          name: label?.name || labelId,
        }),
      )
    ) {
      // Remove from all categories
      const newMap = categoryLabelMap ? { ...categoryLabelMap } : {};
      Object.keys(newMap).forEach(categoryId => {
        const labelIds = newMap[categoryId];
        if (Array.isArray(labelIds)) {
          newMap[categoryId] = labelIds.filter(id => id !== labelId);
          if (newMap[categoryId].length === 0) {
            delete newMap[categoryId];
          }
        }
      });
      setCategoryLabelMapPref(newMap);
      
      // Remove from custom labels if it's a custom one
      const isDefault = DEFAULT_LABELS.find(l => l.id === labelId);
      if (!isDefault && Array.isArray(customLabels)) {
        setCustomLabels(customLabels.filter((l: CategoryLabel) => l.id !== labelId));
      }
    }
  }, [categoryLabelMap, customLabels, labels, setCategoryLabelMapPref, setCustomLabels, t]);

  const handleEdit = useCallback((labelId: string) => {
    const label = labels.find(l => l.id === labelId);
    if (!label) return;

    // Get categories currently assigned to this label
    const assignedCategoryIds = new Set<string>();
    Object.entries(categoryLabelMap).forEach(([categoryId, labelIds]) => {
      if (labelIds.includes(labelId)) {
        assignedCategoryIds.add(categoryId);
      }
    });

    dispatch(
      pushModal({
        modal: {
          name: 'edit-category-group',
          options: {
            labelId,
            labelName: label.name,
            assignedCategoryIds: Array.from(assignedCategoryIds),
            allCategories: categories,
          },
        },
      }),
    );
  }, [categoryLabelMap, categories, dispatch, labels]);

  const getCategoryCount = useCallback((labelId: string) => {
    return Object.values(categoryLabelMap).filter(labelIds =>
      labelIds.includes(labelId),
    ).length;
  }, [categoryLabelMap]);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 600 }}>
          <Trans>Manage Category Groups</Trans>
        </Text>
        <Button onPress={handleAdd}>
          <SvgAdd width={15} height={15} style={{ marginRight: 5 }} />
          <Trans>Add</Trans>
        </Button>
      </View>

      <View style={{ flex: 1 }}>
        {labels.length > 0 ? (
          <View style={{ gap: 8 }}>
            {labels.map(label => (
              <View
                key={label.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  backgroundColor: theme.tableBackground,
                  borderRadius: 4,
                  border: `1px solid ${theme.tableBorder}`,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: 500, marginBottom: 4 }}>
                    {label.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: theme.pageTextLight }}>
                    <Trans count={getCategoryCount(label.id)}>
                      {{ count: getCategoryCount(label.id) }} category
                    </Trans>
                  </Text>
                </View>
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="bare"
                    onPress={() => handleEdit(label.id)}
                    aria-label={t('Edit')}
                  >
                    <SvgEditPencil width={14} height={14} />
                  </Button>
                  <Button
                    variant="bare"
                    onPress={() => handleDelete(label.id)}
                    aria-label={t('Delete')}
                  >
                    <SvgDelete width={14} height={14} />
                  </Button>
                </Stack>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={{
              background: theme.tableBackground,
              padding: 40,
              textAlign: 'center',
            }}
          >
            <Text style={{ fontStyle: 'italic', color: theme.pageTextLight }}>
              <Trans>No Category Groups</Trans>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

