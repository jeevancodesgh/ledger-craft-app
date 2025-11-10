import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { businessProfileService, BusinessProfile, BusinessProfileUpdate } from '@/services/businessProfileService';
import { FormInput } from '@/components/ui/FormInput';
import CountryPicker from '@/components/onboarding/CountryPicker';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';

type TabType = 'profile' | 'preferences' | 'appearance';

export default function BusinessSettingsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  
  // Form state
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [taxId, setTaxId] = useState('');
  const [country, setCountry] = useState('New Zealand');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [defaultTaxRate, setDefaultTaxRate] = useState('');
  const [invoiceNumberFormat, setInvoiceNumberFormat] = useState('INV-{YYYY}-{SEQ}');
  const [invoiceNumberSequence, setInvoiceNumberSequence] = useState('1');
  const [defaultTerms, setDefaultTerms] = useState('');
  const [defaultNotes, setDefaultNotes] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [newLogoUri, setNewLogoUri] = useState<string | null>(null);
  
  // UI state
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await businessProfileService.getBusinessProfile();
      console.log('📸 Loaded profile data:', data);
      console.log('📸 Logo URL from database:', data?.logoUrl);
      if (data) {
        setProfile(data);
        populateForm(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load business profile');
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (data: BusinessProfile) => {
    setBusinessName(data.name || '');
    setEmail(data.email || '');
    setPhone(data.phone || '');
    setWebsite(data.website || '');
    setTaxId(data.taxId || '');
    setCountry(data.country || 'New Zealand');
    setAddress(data.address || '');
    setCity(data.city || '');
    setState(data.state || '');
    setZip(data.zip || '');
    setDefaultTaxRate(data.defaultTaxRate?.toString() || '');
    setInvoiceNumberFormat(data.invoiceNumberFormat || 'INV-{YYYY}-{SEQ}');
    setInvoiceNumberSequence(data.invoiceNumberSequence?.toString() || '1');
    setDefaultTerms(data.defaultTerms || '');
    setDefaultNotes(data.defaultNotes || '');
    const logoUrl = data.logoUrl || null;
    console.log('📸 Setting logoUri to:', logoUrl);
    setLogoUri(logoUrl);
  };

  const validateForm = (): boolean => {
    if (!businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (defaultTaxRate && (isNaN(parseFloat(defaultTaxRate)) || parseFloat(defaultTaxRate) < 0)) {
      Alert.alert('Validation Error', 'Tax rate must be a valid number greater than or equal to 0');
      return false;
    }
    if (invoiceNumberSequence && (isNaN(parseInt(invoiceNumberSequence)) || parseInt(invoiceNumberSequence) < 1)) {
      Alert.alert('Validation Error', 'Sequence number must be a valid number greater than or equal to 1');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);
      
      const updates: BusinessProfileUpdate = {
        businessName,
        businessEmail: email,
        phone: phone || undefined,
        website: website || undefined,
        taxId: taxId || undefined,
        country,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        zip: zip || undefined,
        defaultTaxRate: defaultTaxRate ? parseFloat(defaultTaxRate) : undefined,
        invoiceNumberFormat: invoiceNumberFormat || 'INV-{YYYY}-{SEQ}',
        invoiceNumberSequence: invoiceNumberSequence ? parseInt(invoiceNumberSequence) : 1,
        defaultTerms: defaultTerms || undefined,
        defaultNotes: defaultNotes || undefined,
        logoUri: newLogoUri || undefined,
      };

      await businessProfileService.updateBusinessProfile(updates);
      Alert.alert('Success', 'Business profile updated successfully');
      setNewLogoUri(null); // Clear the new logo URI after successful save
      loadProfile(); // Reload to get updated data
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update business profile');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert('Permission Required', 'Camera and photo library permissions are required to upload a logo');
      return;
    }

    Alert.alert(
      'Upload Logo',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: async () => {
            setImagePickerLoading(true);
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setNewLogoUri(result.assets[0].uri);
                setLogoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking image from camera:', error);
              Alert.alert('Error', 'Failed to capture image');
            } finally {
              setImagePickerLoading(false);
            }
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            setImagePickerLoading(true);
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setNewLogoUri(result.assets[0].uri);
                setLogoUri(result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error picking image from gallery:', error);
              Alert.alert('Error', 'Failed to select image');
            } finally {
              setImagePickerLoading(false);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
        onPress={() => setActiveTab('profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
          Profile
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
        onPress={() => setActiveTab('preferences')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
          Preferences
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'appearance' && styles.tabActive]}
        onPress={() => setActiveTab('appearance')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabText, activeTab === 'appearance' && styles.tabTextActive]}>
          Appearance
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      {/* Logo Upload */}
      <View style={styles.logoSection}>
        <Text style={styles.logoLabel}>Business Logo</Text>
        <TouchableOpacity
          style={styles.logoButton}
          onPress={pickImage}
          activeOpacity={0.7}
          disabled={imagePickerLoading}
        >
          {logoUri ? (
            <Image 
              key={logoUri} 
              source={{ uri: logoUri }} 
              style={styles.logoImage}
              onError={(error) => console.error('📸 Image load error:', error.nativeEvent)}
              onLoad={() => console.log('📸 Image loaded successfully:', logoUri)}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>📷</Text>
              <Text style={styles.logoPlaceholderSubtext}>Tap to upload</Text>
            </View>
          )}
        </TouchableOpacity>
        {imagePickerLoading && (
          <ActivityIndicator style={styles.logoLoader} color="#5B72EE" />
        )}
      </View>

      {/* Business Info */}
      <FormInput
        label="Business Name"
        value={businessName}
        onChangeText={setBusinessName}
        placeholder="Your Business Name"
        required
      />
      <FormInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="contact@yourbusiness.com"
        keyboardType="email-address"
        autoCapitalize="none"
        required
      />
      <FormInput
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="(555) 123-4567"
        keyboardType="phone-pad"
      />
      <FormInput
        label="Website"
        value={website}
        onChangeText={setWebsite}
        placeholder="www.yourbusiness.com"
        keyboardType="url"
        autoCapitalize="none"
      />
      <FormInput
        label="Tax ID / VAT Number"
        value={taxId}
        onChangeText={setTaxId}
        placeholder="12-3456789"
      />
      
      {/* Country Picker */}
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>
          Country <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowCountryPicker(true)}
          style={styles.countryButton}
          activeOpacity={0.7}
        >
          <Text style={styles.countryButtonText}>{country || 'Select country'}</Text>
          <Text style={styles.countryButtonIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Address */}
      <FormInput
        label="Address"
        value={address}
        onChangeText={setAddress}
        placeholder="100 Main Street"
      />
      <FormInput
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="Anytown"
      />
      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <FormInput
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="ST"
          />
        </View>
        <View style={styles.halfWidth}>
          <FormInput
            label="Zip Code"
            value={zip}
            onChangeText={setZip}
            placeholder="12345"
          />
        </View>
      </View>

      {/* Invoice Settings */}
      <FormInput
        label="Default Tax Rate (%)"
        value={defaultTaxRate}
        onChangeText={setDefaultTaxRate}
        placeholder="7.5"
        keyboardType="decimal-pad"
      />
      <FormInput
        label="Invoice Number Format"
        value={invoiceNumberFormat}
        onChangeText={setInvoiceNumberFormat}
        placeholder="INV-{YYYY}-{SEQ}"
      />
      <Text style={styles.helperText}>
        Use {'{YYYY}'} for year, {'{MM}'} for month, {'{DD}'} for day, {'{SEQ}'} for sequence.{'\n'}
        Example: INV-{'{YYYY}'}-{'{SEQ}'} → INV-2025-001
      </Text>
      <FormInput
        label="Next Sequence Number"
        value={invoiceNumberSequence}
        onChangeText={setInvoiceNumberSequence}
        placeholder="1"
        keyboardType="number-pad"
      />
    </View>
  );

  const renderPreferencesTab = () => (
    <View style={styles.tabContent}>
      <FormInput
        label="Default Payment Terms"
        value={defaultTerms}
        onChangeText={setDefaultTerms}
        placeholder="Payment due within 30 days"
        multiline
        numberOfLines={3}
      />
      <FormInput
        label="Default Notes"
        value={defaultNotes}
        onChangeText={setDefaultNotes}
        placeholder="Thank you for your business!"
        multiline
        numberOfLines={3}
      />
    </View>
  );

  const renderAppearanceTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonIcon}>🎨</Text>
        <Text style={styles.comingSoonTitle}>Theme Customization</Text>
        <Text style={styles.comingSoonText}>
          Custom theme selection coming soon! You'll be able to personalize your brand colors and appearance.
        </Text>
        {profile?.theme && (
          <View style={styles.currentThemeContainer}>
            <Text style={styles.currentThemeLabel}>Current Theme Colors:</Text>
            <View style={styles.colorRow}>
              <View style={styles.colorSwatch}>
                <View style={[styles.colorBox, { backgroundColor: profile.theme.primary }]} />
                <Text style={styles.colorLabel}>Primary</Text>
              </View>
              <View style={styles.colorSwatch}>
                <View style={[styles.colorBox, { backgroundColor: profile.theme.secondary }]} />
                <Text style={styles.colorLabel}>Secondary</Text>
              </View>
              <View style={styles.colorSwatch}>
                <View style={[styles.colorBox, { backgroundColor: profile.theme.accent }]} />
                <Text style={styles.colorLabel}>Accent</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return <LoadingOverlay visible={true} message="Loading settings..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1E2875" />
      {/* Header with Dark Blue Background */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Business Settings</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>

      {renderTabButtons()}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'preferences' && renderPreferencesTab()}
        {activeTab === 'appearance' && renderAppearanceTab()}
      </ScrollView>

      {/* Save Button */}
      {activeTab !== 'appearance' && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            activeOpacity={0.7}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>💾 Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Country Picker Modal */}
      <CountryPicker
        visible={showCountryPicker}
        onSelect={(selectedCountry) => {
          setCountry(selectedCountry);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
        selectedCountry={country}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    backgroundColor: '#1E2875',
    paddingTop: 48,
    paddingBottom: 20,
    marginTop: 0,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#5B72EE',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#5B72EE',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
    paddingBottom: 100,
  },
  logoSection: {
    marginBottom: 24,
  },
  logoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  logoButton: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  logoPlaceholderText: {
    fontSize: 32,
    marginBottom: 4,
  },
  logoPlaceholderSubtext: {
    fontSize: 12,
    color: '#64748B',
  },
  logoLoader: {
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  countryButtonIcon: {
    fontSize: 24,
    color: '#94A3B8',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: -8,
    marginBottom: 16,
    lineHeight: 18,
  },
  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  currentThemeContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  currentThemeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorSwatch: {
    alignItems: 'center',
  },
  colorBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  colorLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  bottomContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButton: {
    backgroundColor: '#5B72EE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5B72EE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

