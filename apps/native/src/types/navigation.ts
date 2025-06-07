import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type AppTabParamList = {
  Dashboard: undefined;
  Feeds: undefined;
  Articles: { feedId?: string } | undefined;
  Profile: undefined;
};

export type AppStackParamList = {
  TabNavigator: undefined;
  Articles: { feedId?: string } | undefined;
  Profile: undefined;
};

export type AuthNavigationProp = StackNavigationProp<AuthStackParamList>;
export type AppTabNavigationProp = BottomTabNavigationProp<AppTabParamList>;
export type AppStackNavigationProp = StackNavigationProp<AppStackParamList>;