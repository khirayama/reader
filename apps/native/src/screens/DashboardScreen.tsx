import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { FeedSidebar } from '../components/feeds/FeedSidebar';
import { ArticlesMobileScreen } from '../screens/ArticlesMobileScreen';
import { ArticlesTabletScreen } from '../screens/ArticlesTabletScreen';
import { colors } from '../constants/colors';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';

interface DashboardScreenProps {
  navigation: DrawerNavigationProp;
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user } = useAuth();
  const { isTablet } = useResponsive();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedSelect = (feedId: string | null) => {
    setSelectedFeedId(feedId);
  };

  const handleFeedRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // タブレット表示の場合はサイドバー + 記事表示の2カラムレイアウト
  if (isTablet) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor={colors.white}
          translucent={false}
        />
        <View style={styles.tabletContainer}>
          {/* フィードサイドバー */}
          <View style={styles.sidebar}>
            <FeedSidebar
              selectedFeedId={selectedFeedId}
              onFeedSelect={handleFeedSelect}
              onFeedRefresh={handleFeedRefresh}
            />
          </View>
          
          {/* 記事表示エリア */}
          <View style={styles.mainContent}>
            <ArticlesTabletScreen
              selectedFeedId={selectedFeedId}
              refreshKey={refreshKey}
            />
          </View>
        </View>
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
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 320,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  mainContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
});