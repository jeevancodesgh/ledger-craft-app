import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { OnboardingStepProps } from '@/types/onboarding';
import ThemePicker from './ThemePicker';

export default function BrandingStep({
  data,
  onDataChange,
  onNext,
  onBack,
  isLoading,
}: OnboardingStepProps) {
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload your logo.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setImagePickerLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onDataChange({ logoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const pickImageFromCamera = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take a photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    setImagePickerLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onDataChange({ logoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setImagePickerLoading(false);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert('Upload Logo', 'Choose an option', [
      { text: 'Take Photo', onPress: pickImageFromCamera },
      { text: 'Choose from Gallery', onPress: pickImageFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSkip = () => {
    onNext();
  };

  const handleComplete = () => {
    onNext();
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>🎨</Text>
      </View>

      {/* Header */}
      <Text style={styles.headerText}>
        Customize your brand appearance to make your invoices uniquely yours.
      </Text>

      {/* Logo Upload Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Logo</Text>
        <Text style={styles.sectionSubtitle}>
          Add your logo to personalize your invoices (optional)
        </Text>

        <View style={styles.logoUploadContainer}>
          {data.logoUri ? (
            <View style={styles.logoPreviewContainer}>
              <Image source={{ uri: data.logoUri }} style={styles.logoImage} />
              <Text style={styles.logoSuccessText}>Logo uploaded!</Text>
              <TouchableOpacity
                style={styles.changeLogoButton}
                onPress={showImagePickerOptions}
                disabled={imagePickerLoading}
                activeOpacity={0.7}
              >
                <Text style={styles.changeLogoButtonText}>
                  {imagePickerLoading ? 'Loading...' : '📷 Change Logo'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.logoPlaceholderContainer}>
              <Text style={styles.logoPlaceholderIcon}>🖼️</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={showImagePickerOptions}
                disabled={imagePickerLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.uploadButtonText}>
                  {imagePickerLoading ? 'Loading...' : '📷 Upload Logo'}
                </Text>
              </TouchableOpacity>
              <Text style={styles.uploadHint}>
                PNG, JPG up to 5MB • Recommended: 300x300px
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Theme Selection */}
      <ThemePicker
        selectedTheme={data.theme}
        onSelect={(theme) => onDataChange({ theme })}
      />

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoIcon}>✨</Text>
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Brand Consistency Matters</Text>
          <Text style={styles.infoText}>
            A professional logo builds trust with your clients. Consistent colors
            make your invoices instantly recognizable. You can always update
            these settings later.
          </Text>
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.rightButtons}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.completeButton}
            onPress={handleComplete}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Text style={styles.completeButtonText}>
              {isLoading ? 'Saving...' : '✓ Complete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 64,
  },
  headerText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  logoUploadContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderStyle: 'dashed',
    padding: 24,
    alignItems: 'center',
  },
  logoPreviewContainer: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoSuccessText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 12,
  },
  changeLogoButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  changeLogoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  logoPlaceholderContainer: {
    alignItems: 'center',
  },
  logoPlaceholderIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#5B72EE',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadHint: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 32,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#5B72EE',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

