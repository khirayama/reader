import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { FeedSidebar } from '../components/feeds/FeedSidebar';
import type { DrawerParamList } from '../types/navigation';
import { colors } from '../constants/colors';

const Drawer = createDrawerNavigator<DrawerParamList>();

// カスタムドロワーコンテンツ
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user } = useAuth();
  const { state, navigation } = props;
  const { isTablet } = useResponsive();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);

  const handleFeedSelect = (feedId: string | null) => {
    setSelectedFeedId(feedId);
    // DashboardScreenに遷移してフィード選択を通知
    navigation.navigate('Dashboard', { selectedFeedId: feedId });
    // モバイルの場合はドロワーを閉じる
    if (!isTablet) {
      navigation.closeDrawer();
    }
  };

  const handleFeedRefresh = () => {
    // フィード更新時の処理
  };

  return (
    <View style={styles.drawerContent}>
      {/* ヘッダー */}
      <View style={styles.drawerHeader}>
        <View style={styles.appIconWrapper}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>📰</Text>
          </View>
          <View style={styles.appInfo}>
            <Text style={styles.appTitle}>RSS Reader</Text>
          </View>
        </View>
      </View>

      {/* フィード管理セクション */}
      <View style={styles.feedSection}>
        <FeedSidebar
          selectedFeedId={selectedFeedId}
          onFeedSelect={handleFeedSelect}
          onFeedRefresh={handleFeedRefresh}
        />
      </View>

      {/* フッター */}
      <View style={styles.drawerFooter}>
        <Pressable 
          style={styles.settingsButton} 
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.settingsIconContainer}>
            <Text style={styles.settingsIconText}>⚙️</Text>
          </View>
          <Text style={styles.settingsLabel}>設定</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function DrawerNavigator() {
  const { isTablet } = useResponsive();

  // タブレット用の設定
  const tabletScreenOptions = useMemo(() => ({
    headerShown: false,
    drawerStyle: {
      width: 320,
      backgroundColor: '#FFFFFF',
    },
    drawerType: 'permanent' as const,
    drawerPosition: 'left' as const,
    swipeEnabled: false,
  }), []);

  // モバイル用の設定
  const mobileScreenOptions = useMemo(() => ({
    headerShown: false,
    drawerStyle: {
      width: '100%' as const,
      backgroundColor: '#FFFFFF',
    },
    drawerType: 'front' as const,
    drawerPosition: 'left' as const,
    swipeEnabled: true,
  }), []);
  
  return (
    <Drawer.Navigator
      key={isTablet ? 'tablet' : 'mobile'} // 強制的にナビゲーターを再作成
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={isTablet ? tabletScreenOptions : mobileScreenOptions}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'RSS Reader',
          drawerLabel: 'RSS Reader',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '設定',
          drawerLabel: '設定',
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    backgroundColor: colors.white,
  },
  drawerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  appIconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: `${colors.primary[600]}`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  appIconText: {
    fontSize: 16,
    color: colors.white,
  },
  appInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.gray[900],
  },
  feedSection: {
    flex: 1,
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  settingsIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingsIconText: {
    fontSize: 16,
  },
  settingsLabel: {
    fontSize: 16,
    color: colors.gray[700],
    fontWeight: '500',
  },
});