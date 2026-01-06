import React from 'react';
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

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Stack navigator for Invoice screens
function InvoiceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="InvoiceList" 
        component={InvoiceListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="InvoiceCreate" 
        component={InvoiceCreateScreen}
        options={{ title: 'Create Invoice' }}
      />
      <Stack.Screen 
        name="InvoiceEdit" 
        component={InvoiceCreateScreen}
        options={{ title: 'Edit Invoice' }}
      />
      <Stack.Screen 
        name="InvoiceDetail" 
        component={InvoiceDetailScreen}
        options={{ title: 'Invoice Details' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Expense screens
function ExpenseStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="ExpenseList" 
        component={ExpenseListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExpenseCreate" 
        component={ExpenseCreateScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExpenseEdit" 
        component={ExpenseEditScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ExpenseDetail" 
        component={ExpenseListScreen}
        options={{ title: 'Expense Details' }}
      />
    </Stack.Navigator>
  );
}

// Stack navigator for Settings screens
function SettingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="SettingsList" 
        component={SettingsScreen}
        options={{ headerShown: false }}
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
