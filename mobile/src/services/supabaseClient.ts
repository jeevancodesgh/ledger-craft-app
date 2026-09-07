import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const SupabaseSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

// Fallback to web app values if env vars not loaded (Expo may need restart)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://viqckjmborlqaemavrzu.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZpcWNram1ib3JscWFlbWF2cnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NjIxMzIsImV4cCI6MjA2MDQzODEzMn0.ccFdzJbDBjGzYaGenOz8Gnsuyj-LtljPeXAjcFyPllA';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SupabaseSecureStoreAdapter,
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

