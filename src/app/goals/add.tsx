import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
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
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const goalSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  targetAmount: z.number().min(1, 'Target must be a positive number'),
  targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please select a valid date (YYYY-MM-DD)',
  }),
  icon: z.string().min(1, 'Please choose an icon'),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function AddGoal() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Zustand
  const { addGoal } = useFinanceStore();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      targetDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split('T')[0], // 6 months default
      icon: 'Shield',
    },
  });

  const selectedIcon = watch('icon');

  const iconsList = [
    { name: 'Shield', symbol: '🛡️', label: 'Safety' },
    { name: 'Laptop', symbol: '💻', label: 'Tech' },
    { name: 'Compass', symbol: '🧭', label: 'Travel' },
    { name: 'Car', symbol: '🚗', label: 'Auto' },
    { name: 'Home', symbol: '🏠', label: 'Property' },
  ];

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    try {
      setTimeout(() => {
        addGoal(data.name, data.targetAmount, data.icon, data.targetDate);
        setLoading(false);
        router.replace('/(tabs)/goals');
      }, 1000);
    } catch (err) {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Card style={styles.card}>
            {/* Goal Icon Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Select Goal Icon</Text>
              <View style={styles.iconsRow}>
                {iconsList.map((ic) => (
                  <TouchableOpacity
                    key={ic.name}
                    onPress={() => setValue('icon', ic.name)}
                    style={[
                      styles.iconChip,
                      { borderColor: colors.border },
                      selectedIcon === ic.name && {
                        borderColor: colors.accent,
                        backgroundColor: `${colors.accent}15`,
                      },
                    ]}>
                    <Text style={styles.iconSymbol}>{ic.symbol}</Text>
                    <Text style={[styles.iconLabel, { color: colors.textSecondary }]}>
                      {ic.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goal Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Goal Name</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: errors.name ? colors.danger : colors.border },
                    ]}
                    placeholder="e.g. Emergency Fund or Pokhara Trip"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.name.message}</Text>
              )}
            </View>

            {/* Target Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Target Amount (Rs.)</Text>
              <Controller
                control={control}
                name="targetAmount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: errors.targetAmount ? colors.danger : colors.border },
                    ]}
                    placeholder="e.g. 150000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? String(value) : ''}
                  />
                )}
              />
              {errors.targetAmount && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.targetAmount.message}
                </Text>
              )}
            </View>

            {/* Target Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Target Completion Date (YYYY-MM-DD)</Text>
              <Controller
                control={control}
                name="targetDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: errors.targetDate ? colors.danger : colors.border },
                    ]}
                    placeholder="e.g. 2027-06-30"
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.targetDate && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.targetDate.message}
                </Text>
              )}
            </View>

            {/* Actions */}
            <Button
              label="Save Savings Goal"
              onPress={handleSubmit(onSubmit)}
              loading={loading}
              style={styles.submitBtn}
            />
          </Card>

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
    padding: Spacing.four,
  },
  card: {
    padding: Spacing.four,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  iconChip: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 22,
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 10,
    fontWeight: '600',
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
    marginTop: Spacing.three,
  },
  bottomSpacer: {
    height: Spacing.five,
  },
});
