import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BusinessTheme, PRESET_THEMES } from '@/types/onboarding';

interface ThemePickerProps {
  selectedTheme: BusinessTheme;
  onSelect: (theme: BusinessTheme) => void;
}

export default function ThemePicker({ selectedTheme, onSelect }: ThemePickerProps) {
  const isSelected = (theme: BusinessTheme): boolean => {
    return (
      theme.primary === selectedTheme.primary &&
      theme.secondary === selectedTheme.secondary &&
      theme.accent === selectedTheme.accent
    );
  };

  const renderThemeCard = (key: string, theme: BusinessTheme) => {
    const selected = isSelected(theme);

    return (
      <TouchableOpacity
        key={key}
        style={[styles.themeCard, selected && styles.themeCardSelected]}
        onPress={() => onSelect(theme)}
        activeOpacity={0.7}
      >
        {/* Theme Preview */}
        <View style={styles.themePreview}>
          {/* Header gradient */}
          <View
            style={[
              styles.previewHeader,
              { backgroundColor: theme.primary },
            ]}
          />
          {/* Content area */}
          <View style={styles.previewContent}>
            <View
              style={[
                styles.previewBar,
                { backgroundColor: theme.primary + '40' },
              ]}
            />
            <View
              style={[
                styles.previewBarSmall,
                { backgroundColor: theme.secondary + '40' },
              ]}
            />
            <View
              style={[
                styles.previewCircle,
                { backgroundColor: theme.accent + '40' },
              ]}
            />
          </View>
        </View>

        {/* Theme Name */}
        <Text style={[styles.themeName, selected && styles.themeNameSelected]}>
          {theme.name}
        </Text>

        {/* Color Dots */}
        <View style={styles.colorDots}>
          <View
            style={[styles.colorDot, { backgroundColor: theme.primary }]}
          />
          <View
            style={[styles.colorDot, { backgroundColor: theme.secondary }]}
          />
          <View
            style={[styles.colorDot, { backgroundColor: theme.accent }]}
          />
        </View>

        {/* Selected Checkmark */}
        {selected && (
          <View
            style={[
              styles.checkmarkContainer,
              { backgroundColor: theme.primary },
            ]}
          >
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Theme</Text>
      <Text style={styles.subtitle}>
        Select a color theme for your invoices and documents
      </Text>

      <View style={styles.grid}>
        {Object.entries(PRESET_THEMES).map(([key, theme]) =>
          renderThemeCard(key, theme)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  themeCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 12,
    position: 'relative',
  },
  themeCardSelected: {
    borderColor: '#5B72EE',
    borderWidth: 2,
  },
  themePreview: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewHeader: {
    height: 20,
  },
  previewContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 8,
    justifyContent: 'space-between',
  },
  previewBar: {
    width: '70%',
    height: 8,
    borderRadius: 4,
  },
  previewBarSmall: {
    width: '50%',
    height: 6,
    borderRadius: 3,
  },
  previewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignSelf: 'flex-end',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    textAlign: 'center',
  },
  themeNameSelected: {
    color: '#5B72EE',
  },
  colorDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkmark: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

