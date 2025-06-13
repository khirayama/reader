import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { ArticlesMobileScreen } from '../screens/ArticlesMobileScreen';
import { ArticlesTabletScreen } from '../screens/ArticlesTabletScreen';
import { colors } from '../constants/colors';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';

interface DashboardScreenProps {
  navigation: DrawerNavigationProp;
  route?: {
    params?: {
      selectedFeedId?: string | null;
    };
  };
}

export function DashboardScreen({ navigation, route }: DashboardScreenProps) {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(
    route?.params?.selectedFeedId || null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  // ルートパラメータの変更を監視
  useEffect(() => {
    if (route?.params?.selectedFeedId !== undefined) {
      setSelectedFeedId(route.params.selectedFeedId);
    }
  }, [route?.params?.selectedFeedId]);

  const handleFeedSelect = (feedId: string | null) => {
    setSelectedFeedId(feedId);
  };

  const handleFeedRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // タブレット・モバイル共通で記事表示のみ（ドロワーナビゲーションでフィード管理）
  if (isTablet) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={colors.white}
          translucent={false}
        />
        <ArticlesTabletScreen
          selectedFeedId={selectedFeedId}
          refreshKey={refreshKey}
        />
      </View>
    );
  }

  // モバイル表示の場合は記事画面のみ（ドロワーナビゲーションでフィードアクセス）
  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={colors.white}
        translucent={false}
      />
      <ArticlesMobileScreen
        key={`mobile-${selectedFeedId}-${refreshKey}`}
        selectedFeedId={selectedFeedId}
        onFeedSelect={handleFeedSelect}
        onFeedRefresh={handleFeedRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
});