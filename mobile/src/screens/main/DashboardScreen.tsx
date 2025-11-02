import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/store';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="text-2xl font-bold text-foreground mb-2">Dashboard</Text>
        <Text className="text-muted-foreground mb-4">
          Welcome, {user?.email || 'User'}
        </Text>
        
        <View className="bg-card p-4 rounded-lg mb-4">
          <Text className="text-foreground font-semibold">Quick Stats</Text>
          <Text className="text-muted-foreground mt-2">
            Dashboard content coming soon...
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

