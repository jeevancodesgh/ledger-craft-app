import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/store';

export default function SettingsScreen() {
  const { signOut } = useAuth();

  return (
    <View className="flex-1 bg-background p-6">
      <Text className="text-2xl font-bold text-foreground mb-4">Settings</Text>
      
      <TouchableOpacity
        className="w-full h-12 bg-destructive rounded-lg items-center justify-center mt-4"
        onPress={signOut}
      >
        <Text className="text-white font-semibold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

