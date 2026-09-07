/**
 * Root Navigator - Application Entry Point
 * 
 * Features:
 * - Smooth fade transition between Auth and Main stacks
 * - Loading state with animated indicator
 * - Automatic auth state handling
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { RootStackParamList } from './types';
import { useAuth, useStore } from '@/store';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { revolutNavigationTheme } from '@/theme/navigation';
import { rootNavigatorOptions } from '@/utils/navigationAnimations';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Animated loading component
function AnimatedLoadingScreen() {
  const opacity = useSharedValue(0.4);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    // Pulsing animation
    opacity.value = withRepeat(
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    scale.value = withRepeat(
      withTiming(1.05, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.loadingContainer}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <View style={styles.logo}>
          <Animated.Text style={styles.logoText}>EBI</Animated.Text>
        </View>
      </Animated.View>
      <ActivityIndicator
        size="large"
        color="#5B72EE"
        style={styles.activityIndicator}
      />
    </View>
  );
}

export default function RootNavigator() {
  const { user, loading, hasCompletedOnboarding, onboardingChecked } = useAuth();

  useEffect(() => {
    // Initialize auth state on mount
    const { initialize } = useStore.getState();
    initialize().catch((error) => {
      console.error('[RootNavigator] Failed to initialize auth', error);
    });
  }, []);

  // Show animated loading screen while checking auth
  if (loading || !onboardingChecked) {
    return <AnimatedLoadingScreen />;
  }

  return (
    <NavigationContainer theme={revolutNavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          ...rootNavigatorOptions,
          // Smooth fade between Auth and Main stacks
          animation: 'fade',
          animationDuration: 400,
          gestureEnabled: false,
        }}
      >
        {!user ? (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
              animationDuration: 300,
            }}
          />
        ) : !hasCompletedOnboarding ? (
          // Redirect to onboarding within auth stack
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              animation: 'fade',
              animationDuration: 300,
            }}
          />
        ) : (
          <Stack.Screen
            name="Main"
            component={AppNavigator}
            options={{
              // Elegant fade-in for main app
              animation: 'fade',
              animationDuration: 400,
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#5B72EE',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  activityIndicator: {
    marginTop: 16,
  },
});
