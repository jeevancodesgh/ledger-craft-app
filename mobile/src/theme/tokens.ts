import { Platform, StyleSheet } from 'react-native';

export const palette = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  fill: '#E8E8ED',
  fillMuted: '#F4F4F7',
  accent: '#5B72EE',
  accentFill: '#EEF0FE',
  text: '#1C1C1E',
  textSecondary: '#636366',
  textTertiary: '#8E8E93',
  separator: 'rgba(60, 60, 67, 0.18)',
  danger: '#FF3B30',
  dangerFill: '#FFF2F1',
  success: '#34C759',
  warning: '#FF9F0A',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  screen: 20,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  group: 12,
  pill: 980,
} as const;

export const type = {
  money: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -1.2,
    lineHeight: 46,
    color: palette.text,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    color: palette.text,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: palette.text,
  },
  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    color: palette.text,
  },
  callout: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: palette.text,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: palette.textSecondary,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: palette.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: palette.textTertiary,
    letterSpacing: -0.08,
  },
  section: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textSecondary,
    letterSpacing: -0.08,
    textTransform: 'uppercase' as const,
  },
};

export const hairline = StyleSheet.hairlineWidth;

export const groupedShadow = Platform.select({
  ios: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  android: {
    elevation: 0,
  },
  default: {},
});
