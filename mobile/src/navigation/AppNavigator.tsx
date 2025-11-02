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

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#33415C',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
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
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}
