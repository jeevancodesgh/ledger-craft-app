import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@/store';

type NavigationProp = NativeStackNavigationProp<any>;

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const navigation = useNavigation<NavigationProp>();

  const settingsOptions = [
    {
      id: 'business',
      icon: '🏢',
      title: 'Business Settings',
      subtitle: 'Manage your business profile and preferences',
      onPress: () => navigation.navigate('BusinessSettings'),
    },
    {
      id: 'account',
      icon: '👤',
      title: 'Account Settings',
      subtitle: 'Email, password, and security',
      onPress: () => {
        // TODO: Implement account settings
      },
      disabled: true,
    },
    {
      id: 'notifications',
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Manage notification preferences',
      onPress: () => {
        // TODO: Implement notifications settings
      },
      disabled: true,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#1E2875" />
      {/* Header with Dark Blue Background */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>
        <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
      </View>

      {/* Settings Options */}
      <View style={styles.section}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[styles.optionCard, option.disabled && styles.optionCardDisabled]}
            onPress={option.onPress}
            activeOpacity={0.7}
            disabled={option.disabled}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.optionIconText}>{option.icon}</Text>
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, option.disabled && styles.optionTextDisabled]}>
                {option.title}
              </Text>
              <Text style={[styles.optionSubtitle, option.disabled && styles.optionTextDisabled]}>
                {option.subtitle}
              </Text>
              {option.disabled && (
                <Text style={styles.comingSoonBadge}>Coming Soon</Text>
              )}
            </View>
            <Text style={[styles.optionChevron, option.disabled && styles.optionTextDisabled]}>
              ›
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={signOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutButtonText}>🚪 Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>EasyBizInvoice Mobile</Text>
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
  header: {
    backgroundColor: '#1E2875',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  titleSection: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    paddingLeft: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionCardDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionIconText: {
    fontSize: 24,
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
  optionChevron: {
    fontSize: 28,
    color: '#94A3B8',
    marginLeft: 8,
  },
  signOutButton: {
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
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

