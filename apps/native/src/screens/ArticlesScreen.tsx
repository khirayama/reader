import React from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { ArticlesTabletScreen } from './ArticlesTabletScreen';
import { ArticlesMobileScreen } from './ArticlesMobileScreen';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';

interface ArticlesScreenProps {
  navigation: DrawerNavigationProp;
  route?: {
    params?: {
      feedId?: string;
    };
  };
}

export function ArticlesScreen(props: ArticlesScreenProps) {
  const { isTablet } = useResponsive();

  // タブレットの場合はタブレット専用画面を使用
  if (isTablet) {
    return <ArticlesTabletScreen {...props} />;
  }

  // モバイルの場合は既存の実装を使用
  return <ArticlesMobileScreen {...props} />;
}