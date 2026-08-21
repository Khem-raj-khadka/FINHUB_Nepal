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
import { Eye, EyeOff } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  const loginUser = useFinanceStore((state) => state.loginUser);
  const loginDemo = useFinanceStore((state) => state.loginDemo);
  
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setAuthError(null);
    try {
      await loginUser(data.email, data.password);
      setLoading(false);
      router.replace('/(tabs)/home');
    } catch (err: any) {
      setLoading(false);
      setAuthError(err.message || 'Authentication failed. Please check your credentials or click "Continue with Demo".');
    }
  };

  const handleContinueAsDemo = () => {
    setLoading(true);
    setTimeout(() => {
      loginDemo();
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 400);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Logo Brand Header */}
          <View style={styles.brandHeader}>
            <Text style={[styles.logoText, { color: colors.text }]}>FINHUB</Text>
            <Text style={[styles.logoTextHighlight, { color: colors.accent }]}>NEPAL</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              One Dashboard. Every Investment. Every Goal.
            </Text>
          </View>

          {/* Login Card */}
          <Card style={[styles.card, { borderColor: colors.border }]}>
            <Text style={[styles.loginTitle, { color: colors.text }]}>Sign In</Text>

            {authError && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
                <Text style={[styles.errorBoxText, { color: colors.danger }]}>{authError}</Text>
              </View>
            )}

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
                        color: colors.text,
                        borderColor: errors.email ? colors.danger : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="e.g. demo@finhub.com"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.email.message}</Text>
              )}
            </View>

            {/* Password Input with Eye Visibility Toggle */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
                <TouchableOpacity onPress={() => router.push('/auth/forgot')}>
                  <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot?</Text>
                </TouchableOpacity>
              </View>
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
                          color: colors.text,
                          borderColor: errors.password ? colors.danger : colors.border,
                          backgroundColor: colors.background,
                        },
                      ]}
                      placeholder="Enter password"
                      placeholderTextColor={colors.textSecondary}
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
                        <EyeOff color={colors.textSecondary} size={20} />
                      ) : (
                        <Eye color={colors.textSecondary} size={20} />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.password.message}</Text>
              )}
            </View>

            {/* Actions */}
            <Button
              label="Sign In"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.signInButton}
            />

            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textSecondary }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Continue with Demo Account */}
            <Button
              label="Continue with Demo Account"
              variant="secondary"
              onPress={handleContinueAsDemo}
              style={styles.demoButton}
            />
          </Card>

          {/* Sign Up Redirect */}
          <View style={styles.signUpContainer}>
            <Text style={[styles.signUpLabel, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')}>
              <Text style={[styles.signUpLink, { color: colors.accent }]}>Sign Up</Text>
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
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoTextHighlight: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  card: {
    padding: Spacing.four,
  },
  loginTitle: {
    fontSize: 22,
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
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: Spacing.one * 1.5,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
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
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.one,
  },
  signInButton: {
    marginTop: Spacing.two,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: Spacing.three,
  },
  demoButton: {
    borderWidth: 0,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  signUpLabel: {
    fontSize: 14,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: Spacing.four,
  },
});
