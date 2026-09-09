import { Platform, StyleSheet } from 'react-native';

export const palette = {
  background: '#F2F2F2',
  surface: '#FFFFFF',
  fill: '#EDEDED',
  fillMuted: '#F7F7F5',
  accent: '#9FE870',
  accentFill: '#E8F8D8',
  accentForeground: '#163300',
  text: '#163300',
  textSecondary: '#62605B',
  textTertiary: '#8A8880',
  separator: 'rgba(22, 51, 0, 0.12)',
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
  group: 16,
  well: 28,
  pill: 980,
} as const;

export const type = {
  money: {
    fontSize: 44,
    fontWeight: '700' as const,
    letterSpacing: -1.4,
    lineHeight: 50,
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
    shadowColor: '#163300',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  android: {
    elevation: 0,
  },
  default: {},
});
