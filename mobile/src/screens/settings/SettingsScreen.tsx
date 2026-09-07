import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/store';
import { SettingsStackParamList } from '@/navigation/types';

type NavigationProp = NativeStackNavigationProp<SettingsStackParamList, 'SettingsList'>;

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const settingsOptions = [
    {
      id: 'business',
      icon: 'briefcase' as const,
      title: 'Business',
      subtitle: 'Profile, GST, and invoice numbering',
      onPress: () => navigation.navigate('BusinessSettings'),
    },
    {
      id: 'account',
      icon: 'user' as const,
      title: 'Account',
      subtitle: 'Email, password, and security',
      onPress: () => {},
      disabled: true,
    },
    {
      id: 'notifications',
      icon: 'bell' as const,
      title: 'Notifications',
      subtitle: 'Reminders and payment alerts',
      onPress: () => {},
      disabled: true,
    },
  ];

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        {settingsOptions.map((option) => (
          <Pressable
            key={option.id}
            style={[styles.optionCard, option.disabled && styles.optionCardDisabled]}
            onPress={option.onPress}
            disabled={option.disabled}
            accessibilityRole="button"
            accessibilityLabel={option.title}
            accessibilityState={{ disabled: !!option.disabled }}
          >
            <View style={styles.optionIcon}>
              <Feather name={option.icon} size={20} color="#5B72EE" />
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, option.disabled && styles.optionTextDisabled]}>
                {option.title}
              </Text>
              <Text style={[styles.optionSubtitle, option.disabled && styles.optionTextDisabled]}>
                {option.subtitle}
              </Text>
              {option.disabled && (
                <Text style={styles.comingSoonBadge}>Coming soon</Text>
              )}
            </View>
            <Feather name="chevron-right" size={20} color="#94A3B8" />
          </Pressable>
        ))}
      </View>

      <View style={styles.section}>
        <Pressable
          style={styles.signOutButton}
          onPress={confirmSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text style={styles.signOutButtonText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>LedgerCraft</Text>
        <Text style={styles.appInfoText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 72,
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  optionTextDisabled: {
    opacity: 0.5,
  },
  comingSoonBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5B72EE',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    minHeight: 52,
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
  },
  appInfoText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
});
