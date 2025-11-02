import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function InvoiceListScreen() {
  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6">
        <Text className="text-2xl font-bold text-foreground mb-4">Invoices</Text>
        <Text className="text-muted-foreground">
          Invoice list will be implemented here
        </Text>
      </View>
    </ScrollView>
  );
}

