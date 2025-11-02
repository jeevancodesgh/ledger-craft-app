import React from 'react';
import { View, Text } from 'react-native';

export default function OnboardingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-6">
      <Text className="text-2xl font-bold text-foreground mb-4">Onboarding</Text>
      <Text className="text-muted-foreground text-center">
        Onboarding flow will be implemented here
      </Text>
    </View>
  );
}

