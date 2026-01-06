/**
 * App Navigator - Main Application Navigation
 * 
 * Features:
 * - Revolut-style screen transition animations
 * - Custom animated tab bar
 * - Smooth slide-from-right for push navigation
 * - Slide-from-bottom for form/create screens (iOS)
 */

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList } from './types';

// Screens
import DashboardScreen from '@/screens/main/DashboardScreen';
import InvoiceListScreen from '@/screens/invoices/InvoiceListScreen';
import InvoiceCreateScreen from '@/screens/invoices/InvoiceCreateScreen';
import InvoiceDetailScreen from '@/screens/invoices/InvoiceDetailScreen';
import ExpenseListScreen from '@/screens/expenses/ExpenseListScreen';
import ExpenseCreateScreen from '@/screens/expenses/ExpenseCreateScreen';
import ExpenseEditScreen from '@/screens/expenses/ExpenseEditScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import BusinessSettingsScreen from '@/screens/settings/BusinessSettingsScreen';

// Custom Tab Bar
import CustomTabBar from '@/components/CustomTabBar';

// Animation configurations
import {
  defaultScreenOptions,
  listScreenOptions,
  detailScreenOptions,
  formScreenOptions,
  settingsScreenOptions,
} from '@/utils/navigationAnimations';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for Invoice screens
function InvoiceStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...defaultScreenOptions,
        // Smooth slide animation with gesture support
        animation: 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        fullScreenGestureEnabled: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen
        name="InvoiceList"
        component={InvoiceListScreen}
        options={listScreenOptions}
      />
      <Stack.Screen
        name="InvoiceCreate"
        component={InvoiceCreateScreen}
        options={{
          ...formScreenOptions,
          // Forms slide from bottom on iOS for better UX
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
          gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
        }}
      />
      <Stack.Screen
        name="InvoiceEdit"
        component={InvoiceCreateScreen}
        options={{
          ...formScreenOptions,
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
          gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
        }}
      />
      <Stack.Screen
        name="InvoiceDetail"
        component={InvoiceDetailScreen}
        options={{
          ...detailScreenOptions,
          // Detail screens use fade from bottom for elegance
          animation: 'fade_from_bottom',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Expense screens
function ExpenseStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...defaultScreenOptions,
        animation: 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        fullScreenGestureEnabled: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen
        name="ExpenseList"
        component={ExpenseListScreen}
        options={listScreenOptions}
      />
      <Stack.Screen
        name="ExpenseCreate"
        component={ExpenseCreateScreen}
        options={{
          ...formScreenOptions,
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
          gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
        }}
      />
      <Stack.Screen
        name="ExpenseEdit"
        component={ExpenseEditScreen}
        options={{
          ...formScreenOptions,
          animation: Platform.OS === 'ios' ? 'slide_from_bottom' : 'slide_from_right',
          gestureDirection: Platform.OS === 'ios' ? 'vertical' : 'horizontal',
        }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseListScreen}
        options={{
          ...detailScreenOptions,
          animation: 'fade_from_bottom',
          animationDuration: 300,
        }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Settings screens
function SettingsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        ...defaultScreenOptions,
        animation: 'slide_from_right',
        animationDuration: 350,
        gestureEnabled: true,
        fullScreenGestureEnabled: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen
        name="SettingsList"
        component={SettingsScreen}
        options={settingsScreenOptions}
      />
      <Stack.Screen
        name="BusinessSettings"
        component={BusinessSettingsScreen}
        options={{
          ...settingsScreenOptions,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Tab switching animation
        animation: 'fade',
        lazy: true,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Invoices"
        component={InvoiceStack}
        options={{
          tabBarLabel: 'Invoices',
        }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpenseStack}
        options={{
          tabBarLabel: 'Expenses',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
