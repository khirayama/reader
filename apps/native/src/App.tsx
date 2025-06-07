import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AuthNavigator from './navigation/AuthNavigator';
import AppNavigator from './navigation/AppNavigator';
import { useAuth } from './contexts/AuthContext';

const Stack = createStackNavigator();

function AppContent() {
  const { user, isLoading } = useAuth();

  console.log('AppContent render:', { user: !!user, isLoading });

  if (isLoading) {
    // TODO: Add loading screen component
    return null;
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}