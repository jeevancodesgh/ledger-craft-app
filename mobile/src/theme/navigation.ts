import { DefaultTheme, Theme } from '@react-navigation/native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

export const COLORS = {
  accent: '#5B72EE',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
} as const;

export const revolutNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.accent,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.danger,
  },
};

export const nativeHeaderOptions: NativeStackNavigationOptions = {
  headerShown: true,
  headerShadowVisible: false,
  headerBackTitle: 'Back',
  headerTintColor: COLORS.accent,
  headerTitleStyle: {
    fontWeight: '700',
    color: COLORS.text,
  },
  headerLargeTitleStyle: {
    fontWeight: '800',
    color: COLORS.text,
  },
  headerStyle: {
    backgroundColor: COLORS.background,
  },
  contentStyle: {
    backgroundColor: COLORS.background,
  },
  animation: 'slide_from_right',
  animationDuration: 250,
  gestureEnabled: true,
  fullScreenGestureEnabled: Platform.OS === 'ios',
};

export const listHeaderOptions: NativeStackNavigationOptions = {
  ...nativeHeaderOptions,
  headerLargeTitle: true,
};

export const formHeaderOptions: NativeStackNavigationOptions = {
  ...nativeHeaderOptions,
  headerLargeTitle: false,
  presentation: Platform.OS === 'ios' ? 'modal' : 'card',
  animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
  gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
};

export const detailHeaderOptions: NativeStackNavigationOptions = {
  ...nativeHeaderOptions,
  headerLargeTitle: false,
};
