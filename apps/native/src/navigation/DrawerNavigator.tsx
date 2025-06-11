import React, { useMemo } from 'react';
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
import type { DrawerParamList } from '../types/navigation';
import { colors } from '../constants/colors';

const Drawer = createDrawerNavigator<DrawerParamList>();

// カスタムドロワーコンテンツ
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { state, navigation } = props;

  const menuItems = [
    { 
      name: 'Dashboard', 
      label: 'RSS Reader', 
      icon: (
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>📡</Text>
        </View>
      ),
      description: 'フィード・記事管理'
    },
    { 
      name: 'Profile', 
      label: '設定', 
      icon: (
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>⚙️</Text>
        </View>
      ),
      description: 'アカウント・環境設定'
    },
  ] as const;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      {/* ヘッダー */}
      <View style={styles.drawerHeader}>
        <View style={styles.appIconWrapper}>
          <View style={styles.appIcon}>
            <Text style={styles.appIconText}>📰</Text>
          </View>
          <View style={styles.appInfo}>
            <Text style={styles.appTitle}>RSS Reader</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* メニューアイテム */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => {
          const isActive = state.index === index;
          return (
            <Pressable
              key={item.name}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.name)}
            >
              {item.icon}
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                <Text style={styles.menuDescription}>
                  {item.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* フッター */}
      <View style={styles.drawerFooter}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <View style={styles.logoutIconContainer}>
            <Text style={styles.logoutIconText}>🚪</Text>
          </View>
          <Text style={styles.logoutLabel}>ログアウト</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

export function DrawerNavigator() {
  const { isTablet } = useResponsive();

  // タブレット用の設定
  const tabletScreenOptions = useMemo(() => ({
    headerShown: true,
    headerStyle: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: '#1F2937',
    headerTitleStyle: {
      fontWeight: '600',
    },
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
    headerShown: true,
    headerStyle: {
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      elevation: 0,
      shadowOpacity: 0,
    },
    headerTintColor: '#1F2937',
    headerTitleStyle: {
      fontWeight: '600',
    },
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
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: colors.gray[600],
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 2,
    borderLeftColor: colors.primary[500],
  },
  iconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    color: colors.gray[900],
    fontWeight: '500',
    marginBottom: 2,
  },
  menuLabelActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  menuDescription: {
    fontSize: 12,
    color: colors.gray[500],
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoutIconText: {
    fontSize: 16,
  },
  logoutLabel: {
    fontSize: 16,
    color: colors.red[600],
    fontWeight: '500',
  },
});