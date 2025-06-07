import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FeedsScreen } from '../screens/FeedsScreen';
import { ArticlesScreen } from '../screens/ArticlesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import type { AppTabParamList, AppStackParamList } from '../types/navigation';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Feeds"
        component={FeedsScreen}
        options={{
          tabBarLabel: 'フィード',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="rss" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Articles"
        component={ArticlesScreen}
        options={{
          tabBarLabel: '記事',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="article" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'プロフィール',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="profile" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component using text/symbols
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home':
        return '🏠';
      case 'rss':
        return '📡';
      case 'article':
        return '📄';
      case 'profile':
        return '👤';
      default:
        return '•';
    }
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {getIcon(name)}
    </Text>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="Articles" component={ArticlesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}