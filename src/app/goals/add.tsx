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
import Typography from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

const goalSchema = z.object({
  name: z.string().min(2, 'Goal name must be at least 2 characters'),
  targetAmount: z.number().min(1, 'Target amount must be a positive number greater than 0'),
  currentAmount: z.number().min(0, 'Current saved amount cannot be negative'),
  targetDate: z.string().refine((val) => {
    const d = Date.parse(val);
    return !isNaN(d);
  }, {
    message: 'Please enter a valid date (YYYY-MM-DD)',
  }),
  icon: z.string().min(1, 'Please choose an icon'),
  description: z.string().optional(),
});

type GoalFormData = z.infer<typeof goalSchema>;

export default function AddGoal() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  // Zustand
  const { addGoal } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Default target date: 6 months from today
  const defaultTargetDate = new Date(Date.now() + 180 * 24 * 3600 * 1000)
    .toISOString()
    .split('T')[0];

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
      currentAmount: 0,
      targetDate: defaultTargetDate,
      icon: 'Target',
      description: '',
    },
  });

  const selectedIcon = watch('icon');

  const iconsList = [
    { name: 'Target', symbol: '🎯', label: 'Goal' },
    { name: 'Shield', symbol: '🛡️', label: 'Emergency' },
    { name: 'Laptop', symbol: '💻', label: 'Tech' },
    { name: 'Car', symbol: '🏍️', label: 'Vehicle' },
    { name: 'Home', symbol: '🏠', label: 'House' },
    { name: 'Compass', symbol: '🧭', label: 'Travel' },
    { name: 'Graduation', symbol: '🎓', label: 'Education' },
  ];

  const quickTemplates = [
    { name: 'Emergency Fund', icon: 'Shield', target: 300000 },
    { name: 'Buy a Laptop', icon: 'Laptop', target: 150000 },
    { name: 'Buy a Motorcycle', icon: 'Car', target: 350000 },
    { name: 'Education Fund', icon: 'Graduation', target: 200000 },
    { name: 'Travel & Trek Fund', icon: 'Compass', target: 50000 },
    { name: 'House Down Payment', icon: 'Home', target: 1000000 },
    { name: 'Custom Investment Target', icon: 'Target', target: 500000 },
  ];

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setValue('name', tpl.name, { shouldValidate: true });
    setValue('icon', tpl.icon, { shouldValidate: true });
    setValue('targetAmount', tpl.target, { shouldValidate: true });
  };

  const onSubmit = async (data: GoalFormData) => {
    setLoading(true);
    setFormError(null);

    try {
      if (data.currentAmount > data.targetAmount) {
        setFormError('Current saved amount cannot exceed target amount.');
        setLoading(false);
        return;
      }

      addGoal(
        data.name,
        data.targetAmount,
        data.icon,
        data.targetDate,
        data.currentAmount,
        data.description || ''
      );

      setLoading(false);
      router.replace('/(tabs)/goals');
    } catch (err) {
      setLoading(false);
      setFormError('An unexpected error occurred while saving the goal.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Quick suggestions header */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Goal Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
            {quickTemplates.map((tpl, i) => (
              <TouchableOpacity
                key={i}
                activeOpacity={0.7}
                onPress={() => handleApplyTemplate(tpl)}
                style={[styles.templateChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.templateIcon}>
                  {iconsList.find((ic) => ic.name === tpl.icon)?.symbol || '🎯'}
                </Text>
                <Text style={[styles.templateText, { color: colors.text }]}>{tpl.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Card style={[styles.card, { borderColor: colors.border }]}>
            {formError && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
                <Text style={[styles.errorBoxText, { color: colors.danger }]}>{formError}</Text>
              </View>
            )}

            {/* Goal Icon Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Choose Category Icon</Text>
              <View style={styles.iconsRow}>
                {iconsList.map((ic) => (
                  <TouchableOpacity
                    key={ic.name}
                    activeOpacity={0.7}
                    onPress={() => setValue('icon', ic.name)}
                    style={[
                      styles.iconChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                      selectedIcon === ic.name && {
                        borderColor: colors.accent,
                        backgroundColor: `${colors.accent}20`,
                      },
                    ]}>
                    <Text style={styles.iconSymbol}>{ic.symbol}</Text>
                    <Text style={[styles.iconLabel, { color: selectedIcon === ic.name ? colors.accent : colors.textSecondary }]}>
                      {ic.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Goal Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Goal Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.name ? colors.danger : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="e.g. Emergency Fund, Buy a Laptop, Travel Fund"
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
              <Text style={[styles.label, { color: colors.text }]}>Target Amount (Rs.) *</Text>
              <Controller
                control={control}
                name="targetAmount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.targetAmount ? colors.danger : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="e.g. 150000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? 0 : num);
                    }}
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

            {/* Current / Saved Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Current / Saved Amount (Rs.)</Text>
              <Controller
                control={control}
                name="currentAmount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.currentAmount ? colors.danger : colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="e.g. 25000 (enter 0 if starting new)"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => {
                      const num = parseFloat(text);
                      onChange(isNaN(num) ? 0 : num);
                    }}
                    value={value !== undefined ? String(value) : ''}
                  />
                )}
              />
              {errors.currentAmount && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.currentAmount.message}
                </Text>
              )}
            </View>

            {/* Target Completion Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Target Date (YYYY-MM-DD) *</Text>
              <Controller
                control={control}
                name="targetDate"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: colors.text,
                        borderColor: errors.targetDate ? colors.danger : colors.border,
                        backgroundColor: colors.background,
                      },
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

            {/* Optional Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description (Optional)</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textArea,
                      {
                        color: colors.text,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                      },
                    ]}
                    placeholder="Add purpose, milestones, or notes for this goal..."
                    placeholderTextColor={colors.textSecondary}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    multiline
                    numberOfLines={3}
                  />
                )}
              />
            </View>

            {/* Submit Button */}
            <Button
              label="Create Financial Goal"
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
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  templateScroll: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  templateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.one * 1.5,
  },
  templateIcon: {
    fontSize: 16,
  },
  templateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.four,
    borderRadius: 16,
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
    fontWeight: '700',
    marginBottom: Spacing.one * 1.5,
  },
  iconsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  iconChip: {
    flexGrow: 1,
    minWidth: 70,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSymbol: {
    fontSize: 20,
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  submitBtn: {
    marginTop: Spacing.three,
  },
  bottomSpacer: {
    height: Spacing.six,
  },
});
