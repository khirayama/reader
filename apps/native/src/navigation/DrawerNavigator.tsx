import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  type DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { useAuth } from '../contexts/AuthContext';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FeedsScreen } from '../screens/FeedsScreen';
import { ArticlesScreen } from '../screens/ArticlesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { DrawerParamList } from '../types/navigation';

const Drawer = createDrawerNavigator<DrawerParamList>();

// カスタムドロワーコンテンツ
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { user, logout } = useAuth();
  const { state, navigation } = props;

  const menuItems = [
    { name: 'Dashboard', label: 'ダッシュボード', icon: '🏠' },
    { name: 'Feeds', label: 'フィード', icon: '📡' },
    { name: 'Articles', label: '記事', icon: '📄' },
    { name: 'Profile', label: 'プロフィール', icon: '👤' },
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
        <Text style={styles.appTitle}>RSS Reader</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
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
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* フッター */}
      <View style={styles.drawerFooter}>
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutLabel}>ログアウト</Text>
        </Pressable>
      </View>
    </DrawerContentScrollView>
  );
}

export function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
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
          width: Platform.isPad ? 320 : '100%',
          backgroundColor: '#FFFFFF',
        },
        drawerType: Platform.isPad ? 'permanent' : 'front',
        drawerPosition: 'left',
        swipeEnabled: !Platform.isPad,
      }}
    >
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'ダッシュボード',
          drawerLabel: 'ダッシュボード',
        }}
      />
      <Drawer.Screen
        name="Feeds"
        component={FeedsScreen}
        options={{
          title: 'フィード',
          drawerLabel: 'フィード',
        }}
      />
      <Drawer.Screen
        name="Articles"
        component={ArticlesScreen}
        options={{
          title: '記事',
          drawerLabel: '記事',
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'プロフィール',
          drawerLabel: 'プロフィール',
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  drawerHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  menuItemActive: {
    backgroundColor: '#EBF5FF',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  menuLabel: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  menuLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  logoutLabel: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
});