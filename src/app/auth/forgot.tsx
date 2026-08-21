import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  useColorScheme,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors, Spacing } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotFormData) => {
    setLoading(true);
    try {
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
      }, 1000);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.content}>
          <Card style={styles.card}>
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
            
            {success ? (
              <View style={styles.successContainer}>
                <Text style={styles.successEmoji}>✉️</Text>
                <Text style={[styles.successTitle, { color: colors.text }]}>Check your email</Text>
                <Text style={[styles.successDesc, { color: colors.textSecondary }]}>
                  We have sent instructions to reset your password. Please check your inbox.
                </Text>
                <Button
                  label="Back to Login"
                  onPress={() => router.replace('/auth/login')}
                  style={styles.backBtn}
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.desc, { color: colors.textSecondary }]}>
                  Enter the email address associated with your account and we'll email you a link to reset your password.
                </Text>

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
                        placeholder="e.g. yourname@example.com"
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
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.email.message}
                    </Text>
                  )}
                </View>

                {/* Submit */}
                <Button
                  label="Send Instructions"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  style={styles.submitBtn}
                />

                <TouchableOpacity
                  onPress={() => router.push('/auth/login')}
                  style={styles.cancelBtn}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: Spacing.three,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one * 1.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.one,
  },
  submitBtn: {
    marginTop: Spacing.two,
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: Spacing.three,
    padding: Spacing.two,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  successEmoji: {
    fontSize: 54,
    marginBottom: Spacing.three,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  successDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  backBtn: {
    alignSelf: 'stretch',
  },
});
