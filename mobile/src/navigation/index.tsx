import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuth, useStore } from '@/store';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { View, ActivityIndicator } from 'react-native';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, loading, hasCompletedOnboarding, onboardingChecked } = useAuth();

  useEffect(() => {
    // React Native docs recommend using useEffect with an empty dependency array
    // for one-time subscriptions: https://reactnative.dev/docs/0.80/state
    const { initialize } = useStore.getState();
    initialize().catch((error) => {
      console.error('[RootNavigator] Failed to initialize auth', error);
    });
  }, []);

  // Show loading screen while checking auth
  if (loading || !onboardingChecked) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#33415C" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !hasCompletedOnboarding ? (
          // Redirect to onboarding within auth stack - handled by AuthNavigator
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <Stack.Screen name="Main" component={AppNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

