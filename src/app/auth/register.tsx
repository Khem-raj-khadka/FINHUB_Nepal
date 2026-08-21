import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Eye, EyeOff, Shield } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const signUp = useFinanceStore((state) => state.signUp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError(null);
    try {
      await signUp(data.fullName, data.email, data.password);
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'An error occurred during account creation.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.brandHeader}>
            <View style={[styles.brandIconWrapper, { backgroundColor: `${colors.accent}18` }]}>
              <Shield color={colors.accent} size={30} />
            </View>
            <View style={styles.brandTitleRow}>
              <Text style={[styles.logoText, { color: colors.text }]}>FINHUB</Text>
              <Text style={[styles.logoTextHighlight, { color: colors.accent }]}>NEPAL</Text>
            </View>
          </View>

          {/* Form Card */}
          <Card style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
                <Text style={[styles.errorBoxText, { color: colors.danger }]}>{error}</Text>
              </View>
            )}

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name</Text>
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.fullName ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. Khem Raj"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.fullName && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.fullName.message}
                </Text>
              )}
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.email ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. yourname@example.com"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.email.message}
                </Text>
              )}
            </View>

            {/* Password Input with Eye Visibility Toggle */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        {
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          borderColor: errors.password ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      ]}
                      placeholder="Minimum 6 characters"
                      placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeToggleBtn}>
                      {showPassword ? (
                        <EyeOff color={colors.textSecondary} size={18} />
                      ) : (
                        <Eye color={colors.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Confirm Password Input with Eye Visibility Toggle */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.passwordInput,
                        {
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          borderColor: errors.confirmPassword ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      ]}
                      placeholder="Re-enter password"
                      placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeToggleBtn}>
                      {showConfirmPassword ? (
                        <EyeOff color={colors.textSecondary} size={18} />
                      ) : (
                        <Eye color={colors.textSecondary} size={18} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.confirmPassword && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.confirmPassword.message}
                </Text>
              )}
            </View>

            {/* Submit */}
            <Button
              label="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.signUpBtn}
            />
          </Card>

          {/* Footer Sign In */}
          <View style={styles.footerLinkContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  brandIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  logoTextHighlight: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  card: {
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.four,
  },
  errorBox: {
    padding: Spacing.two * 1.5,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  errorBoxText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.one * 1.2,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.4,
    paddingHorizontal: Spacing.three,
    fontSize: 14.5,
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeToggleBtn: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '500',
    marginTop: Spacing.one,
  },
  signUpBtn: {
    marginTop: Spacing.two,
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  footerText: {
    fontSize: 13.5,
  },
  footerLink: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: Spacing.four,
  },
});
