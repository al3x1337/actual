import React, { useCallback, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { type CategoryEntity } from 'loot-core/types/models';

import { useCategories } from '@desktop-client/hooks/useCategories';
import { useLocalPref } from '@desktop-client/hooks/useLocalPref';
import {
  Modal,
  ModalButtons,
  ModalHeader,
  ModalTitle,
  ModalCloseButton,
} from '@desktop-client/components/common/Modal';
import { Checkbox } from '@desktop-client/components/forms';
import { popModal } from '@desktop-client/modals/modalsSlice';
import { useDispatch } from '@desktop-client/redux';

type EditCategoryGroupModalProps = {
  labelId: string;
  labelName: string;
  assignedCategoryIds: string[];
  allCategories: CategoryEntity[];
};

export function EditCategoryGroupModal({
  labelId,
  labelName,
  assignedCategoryIds: initialAssignedIds,
}: EditCategoryGroupModalProps) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { grouped: categoryGroups } = useCategories();
  const [categoryLabelMap = {}, setCategoryLabelMapPref] = useLocalPref(
    'budget.categoryLabelMap',
  );
  
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(initialAssignedIds),
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategoryIds(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const newMap = categoryLabelMap ? { ...categoryLabelMap } : {};
    
    // Remove label from all categories first
    Object.keys(newMap).forEach(categoryId => {
      const labelIds = newMap[categoryId];
      if (Array.isArray(labelIds)) {
        newMap[categoryId] = labelIds.filter(id => id !== labelId);
        if (newMap[categoryId].length === 0) {
          delete newMap[categoryId];
        }
      }
    });

    // Add label to selected categories
    selectedCategoryIds.forEach(categoryId => {
      if (!newMap[categoryId]) {
        newMap[categoryId] = [];
      }
      if (!newMap[categoryId].includes(labelId)) {
        newMap[categoryId].push(labelId);
      }
    });

    setCategoryLabelMapPref(newMap);
    dispatch(popModal());
  }, [categoryLabelMap, dispatch, labelId, selectedCategoryIds, setCategoryLabelMapPref]);

  const handleCancel = useCallback(() => {
    dispatch(popModal());
  }, [dispatch]);

  return (
    <Modal
      name="edit-category-group"
      containerProps={{
        style: {
          maxWidth: '800px',
          width: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {({ state: { close } }) => (
        <>
          <ModalHeader
            title={
              <ModalTitle
                title={t('Edit Category Group: {{name}}', { name: labelName })}
                shrinkOnOverflow
              />
            }
            rightContent={<ModalCloseButton onPress={close} />}
          />
          <View
            style={{
              padding: '0 20px',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Text
              style={{
                marginBottom: 16,
                marginTop: 8,
                color: theme.pageTextLight,
                flexShrink: 0,
              }}
            >
              <Trans>Select categories to include in this group:</Trans>
            </Text>

            <View
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              <View style={{ gap: 20, paddingBottom: 8 }}>
                {categoryGroups.map(group => (
                  <View key={group.id} style={{ flexShrink: 0 }}>
                    <Text
                      style={{
                        fontWeight: 600,
                        marginBottom: 10,
                        fontSize: 14,
                        color: theme.pageText,
                        flexShrink: 0,
                      }}
                    >
                      {group.name}
                    </Text>
                    <View style={{ paddingLeft: 20, gap: 6 }}>
                      {group.categories?.map(category => (
                        <label
                          key={category.id}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            cursor: 'pointer',
                            padding: '6px 0',
                            minHeight: 28,
                            width: '100%',
                            flexShrink: 0,
                          }}
                        >
                          <Checkbox
                            checked={selectedCategoryIds.has(category.id)}
                            onChange={() => toggleCategory(category.id)}
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          <Text
                            style={{
                              marginLeft: 8,
                              fontSize: 13,
                              lineHeight: '20px',
                              flex: 1,
                              wordWrap: 'break-word',
                              overflowWrap: 'break-word',
                              whiteSpace: 'normal',
                              minWidth: 0,
                            }}
                          >
                            {category.name}
                          </Text>
                        </label>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View
            style={{
              flexShrink: 0,
              borderTop: `1px solid ${theme.tableBorder}`,
              padding: '16px 20px',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                gap: 8,
              }}
            >
              <Button variant="bare" onPress={handleCancel}>
                <Trans>Cancel</Trans>
              </Button>
              <Button onPress={handleSave}>
                <Trans>Save</Trans>
              </Button>
            </View>
          </View>
        </>
      )}
    </Modal>
  );
}

