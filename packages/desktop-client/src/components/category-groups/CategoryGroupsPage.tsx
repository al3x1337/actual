import React from 'react';
import { useTranslation } from 'react-i18next';

import { CategoryGroups } from './CategoryGroups';

import { Page } from '@desktop-client/components/Page';

export function CategoryGroupsPage() {
  const { t } = useTranslation();

  return (
    <Page header={t('Category Groups')}>
      <CategoryGroups />
    </Page>
  );
}

