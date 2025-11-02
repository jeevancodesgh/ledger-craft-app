// Onboarding type definitions for mobile app

export type OnboardingStep = 'welcome' | 'invoice-setup' | 'branding';

export interface BusinessTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  text: string;
  textLight: string;
}

export interface OnboardingData {
  // Welcome step - business basics (required)
  businessName: string;
  businessEmail: string;
  country: string;
  
  // Invoice setup step (recommended)
  invoiceNumberFormat: string;
  defaultTaxRate?: number;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  
  // Branding step (optional)
  theme: BusinessTheme;
  logoUri?: string;
}

export interface OnboardingStepProps {
  data: OnboardingData;
  onDataChange: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading?: boolean;
}

// Default theme (Professional - Blue/Navy)
export const DEFAULT_THEME: BusinessTheme = {
  name: 'Professional',
  primary: '#5B72EE',
  secondary: '#3B4DE6',
  accent: '#4F63D7',
  surface: '#FFFFFF',
  text: '#1E293B',
  textLight: '#64748B',
};

// Preset themes matching web app
export const PRESET_THEMES: Record<string, BusinessTheme> = {
  professional: {
    name: 'Professional',
    primary: '#5B72EE',
    secondary: '#3B4DE6',
    accent: '#4F63D7',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
  modern: {
    name: 'Modern',
    primary: '#A855F7',
    secondary: '#EC4899',
    accent: '#C026D3',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
  nature: {
    name: 'Nature',
    primary: '#10B981',
    secondary: '#14B8A6',
    accent: '#059669',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
  sunset: {
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#EF4444',
    accent: '#DC2626',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
  ocean: {
    name: 'Ocean',
    primary: '#06B6D4',
    secondary: '#3B82F6',
    accent: '#0EA5E9',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
  minimal: {
    name: 'Minimal',
    primary: '#64748B',
    secondary: '#475569',
    accent: '#334155',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
  },
};

// Invoice number format options
export const INVOICE_FORMATS = [
  { 
    value: 'INV-{YYYY}-{SEQ}', 
    label: 'INV-2025-0001', 
    description: 'Year with sequence' 
  },
  { 
    value: 'INV-{MM}-{YYYY}-{SEQ}', 
    label: 'INV-11-2025-0001', 
    description: 'Month and year' 
  },
  { 
    value: '{YYYY}{MM}{DD}-{SEQ}', 
    label: '20251102-0001', 
    description: 'Date-based' 
  },
  { 
    value: 'INV-{SEQ}', 
    label: 'INV-0001', 
    description: 'Simple sequence' 
  },
];

// Countries list
export const COUNTRIES = [
  'New Zealand',
  'Australia',
  'United States',
  'United Kingdom',
  'Canada',
  'Germany',
  'France',
  'Japan',
  'Singapore',
  'India',
  'China',
  'Brazil',
  'Mexico',
  'South Africa',
  'Netherlands',
  'Spain',
  'Italy',
  'Sweden',
  'Norway',
  'Denmark',
  'Sri Lanka',
  'Pakistan',
  'Bangladesh',
  'Malaysia',
  'Indonesia',
  'Thailand',
  'Philippines',
  'Vietnam',
  'South Korea',
  'United Arab Emirates',
  'Saudi Arabia',
  'Egypt',
  'Nigeria',
  'Kenya',
  'Argentina',
  'Chile',
  'Colombia',
  'Poland',
  'Switzerland',
  'Austria',
  'Belgium',
  'Ireland',
  'Portugal',
  'Greece',
  'Turkey',
  'Russia',
  'Ukraine',
  'Israel',
  'Other',
];

