import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Target, Shield, Laptop, Car, Home as HomeIcon, Compass, GraduationCap, AlertCircle } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FeedbackModal, { FeedbackType } from '../../components/ui/FeedbackModal';
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
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();

  // Zustand
  const { addGoal } = useFinanceStore();
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Feedback popup modal
  const [feedbackState, setFeedbackState] = useState<{
    visible: boolean;
    type: FeedbackType;
    title: string;
    message: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

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
    { name: 'Target', icon: <Target size={20} color={colors.accent} />, label: 'Goal' },
    { name: 'Shield', icon: <Shield size={20} color={colors.accent} />, label: 'Emergency' },
    { name: 'Laptop', icon: <Laptop size={20} color={colors.info} />, label: 'Tech' },
    { name: 'Car', icon: <Car size={20} color={colors.warning} />, label: 'Vehicle' },
    { name: 'Home', icon: <HomeIcon size={20} color={colors.success} />, label: 'House' },
    { name: 'Compass', icon: <Compass size={20} color={colors.accent} />, label: 'Travel' },
    { name: 'Graduation', icon: <GraduationCap size={20} color={colors.warning} />, label: 'Education' },
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
      setFeedbackState({
        visible: true,
        type: 'success',
        title: 'Goal Created',
        message: `Successfully created "${data.name}". Track your savings progress in the Goals tab.`,
      });
    } catch (err) {
      setLoading(false);
      setFormError('An unexpected error occurred while saving the goal.');
    }
  };

  const handleFeedbackClose = () => {
    setFeedbackState((s) => ({ ...s, visible: false }));
    router.replace('/(tabs)/goals');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Feedback Modal */}
      <FeedbackModal
        visible={feedbackState.visible}
        type={feedbackState.type}
        title={feedbackState.title}
        message={feedbackState.message}
        onClose={handleFeedbackClose}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Quick suggestions header */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Goal Templates</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateScroll}>
            {quickTemplates.map((tpl, i) => {
              const matchedIcon = iconsList.find((ic) => ic.name === tpl.icon)?.icon;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.7}
                  onPress={() => handleApplyTemplate(tpl)}
                  style={[styles.templateChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.templateIconWrap}>{matchedIcon || <Target size={18} color={colors.accent} />}</View>
                  <Text style={[styles.templateText, { color: colors.text }]}>{tpl.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Card style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
            {formError && (
              <View style={[styles.errorBox, { backgroundColor: `${colors.danger}15` }]}>
                <AlertCircle color={colors.danger} size={16} />
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
                    <View style={styles.iconSymbol}>{ic.icon}</View>
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
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.name ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. Emergency Fund, Buy a Laptop, Travel Fund"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
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
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.targetAmount ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. 150000"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
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
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.currentAmount ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. 25000 (enter 0 if starting new)"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
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
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.targetDate ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. 2027-06-30"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
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
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="Add purpose, milestones, or notes for this goal..."
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
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
    maxWidth: 760,
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
    gap: Spacing.two,
  },
  templateIconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateText: {
    fontSize: 13,
    fontWeight: '700',
  },
  card: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two * 1.5,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  errorBoxText: {
    fontSize: 12.5,
    fontWeight: '600',
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
    marginBottom: 4,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 14.5,
  },
  textArea: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 11.5,
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
