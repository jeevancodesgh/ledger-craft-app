import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  describeMissingFields,
  getMissingProfileFields,
  type ProfileCompletenessInput,
} from '@/utils/profileCompleteness';

let dismissedThisSession = false;

interface ProfileCompletenessBannerProps {
  profile: ProfileCompletenessInput | null | undefined;
  onCompleteProfile?: () => void;
}

export function ProfileCompletenessBanner({
  profile,
  onCompleteProfile,
}: ProfileCompletenessBannerProps) {
  const [dismissed, setDismissed] = useState(dismissedThisSession);
  const missing = getMissingProfileFields(profile);

  if (dismissed || missing.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    dismissedThisSession = true;
    setDismissed(true);
  };

  return (
    <View style={styles.banner} testID="profile-completeness-banner">
      <View style={styles.copy}>
        <Text style={styles.title}>Add {describeMissingFields(missing)} before you send</Text>
        <Text style={styles.subtitle}>Optional, but it makes invoices look complete.</Text>
        {onCompleteProfile && (
          <TouchableOpacity onPress={onCompleteProfile} activeOpacity={0.7}>
            <Text style={styles.link}>Update in settings</Text>
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        onPress={handleDismiss}
        hitSlop={8}
        testID="profile-completeness-dismiss"
      >
        <Text style={styles.dismiss}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  link: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#5B72EE',
  },
  dismiss: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});
