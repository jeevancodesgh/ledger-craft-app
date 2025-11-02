import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/store';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '@/navigation/types';
import { ModernInput } from '@/components/ui/ModernInput';
import { ModernButton } from '@/components/ui/ModernButton';

type SignupScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (text && !emailRegex.test(text)) {
      setEmailError('Invalid email address');
    } else {
      setEmailError('');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    if (text && text.length < 6) {
      setPasswordError('Password must be at least 6 characters');
    } else {
      setPasswordError('');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (emailError || passwordError) {
      Alert.alert('Error', 'Please fix the errors before continuing');
      return;
    }

    setLoading(true);
    const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      Alert.alert('Signup Failed', error.message);
    } else if (needsEmailConfirmation) {
      Alert.alert(
        'Check your email',
        'Please verify your email address to continue',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc', '#f1f5f9']}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-20 pb-8">
            {/* Logo & Brand */}
            <View className="items-center mb-12">
              <View className="w-16 h-16 bg-primary rounded-2xl items-center justify-center mb-4 shadow-lg">
                <Text className="text-3xl text-white font-bold">LC</Text>
              </View>
              <Text className="text-3xl font-bold text-foreground">Ledger Craft</Text>
              <Text className="text-muted-foreground mt-2">Professional Business Solutions</Text>
            </View>

            {/* Form Card */}
            <View className="bg-card/80 border border-border/50 rounded-2xl p-6 shadow-xl mb-6">
              <View className="mb-6">
                <Text className="text-2xl font-bold text-center text-foreground mb-2">
                  Create Account
                </Text>
                <Text className="text-center text-muted-foreground">
                  Sign up to get started
                </Text>
              </View>

              {/* Full Name Input */}
              <ModernInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                autoCapitalize="words"
              />

              {/* Email Input */}
              <ModernInput
                label="Email address"
                value={email}
                onChangeText={validateEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                error={emailError}
              />

              {/* Password Input */}
              <ModernInput
                label="Password"
                value={password}
                onChangeText={validatePassword}
                placeholder="Enter your password"
                secureTextEntry
                showPasswordToggle
                error={passwordError}
              />

              {/* Sign Up Button */}
              <View className="mt-2">
                <ModernButton
                  onPress={handleSignup}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={loading}
                  disabled={!email || !password || !fullName || !!emailError || !!passwordError}
                >
                  {loading ? 'Creating account...' : 'Sign up'}
                </ModernButton>
              </View>

              {/* Sign In Link */}
              <View className="mt-6">
                <Text className="text-center text-muted-foreground">
                  Already have an account?{' '}
                  <Text
                    onPress={() => navigation.navigate('Login')}
                    className="text-primary font-semibold"
                  >
                    Sign in
                  </Text>
                </Text>
              </View>
            </View>

            {/* Features */}
            <View className="flex-row justify-center space-x-8 mt-4">
              <View className="items-center">
                <Text className="text-2xl mb-1">🎯</Text>
                <Text className="text-xs text-muted-foreground">Free</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl mb-1">🚀</Text>
                <Text className="text-xs text-muted-foreground">Quick Setup</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl mb-1">💼</Text>
                <Text className="text-xs text-muted-foreground">Professional</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

