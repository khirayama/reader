import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { DrawerNavigator } from './DrawerNavigator';
import type { AppStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
    </Stack.Navigator>
  );
}