import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabParamList } from './types';

// Screens
import DashboardScreen from '@/screens/main/DashboardScreen';
import InvoiceListScreen from '@/screens/invoices/InvoiceListScreen';
import InvoiceCreateScreen from '@/screens/invoices/InvoiceCreateScreen';
import InvoiceDetailScreen from '@/screens/invoices/InvoiceDetailScreen';
import SettingsScreen from '@/screens/settings/SettingsScreen';
import BusinessSettingsScreen from '@/screens/settings/BusinessSettingsScreen';

// Custom Tab Bar
import CustomTabBar from '@/components/CustomTabBar';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for Invoice screens
function InvoiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="InvoiceList" 
        component={InvoiceListScreen}
        options={{ title: 'Invoices' }}
      />
      <Stack.Screen 
        name="InvoiceCreate" 
        component={InvoiceCreateScreen}
        options={{ title: 'Create Invoice' }}
      />
      <Stack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Settings screens
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <Stack.Screen 
        name="BusinessSettings" 
        component={BusinessSettingsScreen}
        options={{ title: 'Business Settings' }}
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
        name="Settings"
        component={SettingsStack}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
