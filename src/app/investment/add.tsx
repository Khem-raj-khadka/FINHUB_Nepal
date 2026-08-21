import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import FeedbackModal, { FeedbackType } from '../../components/ui/FeedbackModal';
import { InvestmentCategory } from '../../types';

// Zod schema validation
const investmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.enum(['SIP', 'Stock', 'Mutual Fund', 'Fixed Deposit', 'Other'] as const),
  purchaseValue: z.number().min(1, 'Please enter a valid amount'),
  currentValue: z.number().min(0, 'Please enter a valid current value'),
  monthlyContribution: z.number().optional(),
  quantity: z.number().optional(),
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

export default function AddInvestment() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  // Zustand
  const { addInvestment } = useFinanceStore();
  const [loading, setLoading] = useState(false);

  // Feedback Modal
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

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: '',
      category: 'SIP',
      purchaseValue: 0,
      currentValue: 0,
      monthlyContribution: 0,
      quantity: 0,
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: InvestmentFormData) => {
    setLoading(true);
    try {
      setTimeout(() => {
        addInvestment(
          data.name,
          data.category as InvestmentCategory,
          data.purchaseValue,
          data.currentValue,
          data.category === 'SIP' ? data.monthlyContribution : undefined,
          data.category === 'Stock' ? data.quantity : undefined
        );
        setLoading(false);
        setFeedbackState({
          visible: true,
          type: 'success',
          title: 'Investment Tracker Saved',
          message: `Successfully added ${data.name} to your ${data.category} portfolio.`,
        });
      }, 500);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleFeedbackClose = () => {
    setFeedbackState((s) => ({ ...s, visible: false }));
    router.replace('/(tabs)/investments');
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
          
          <Card style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Category selection */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Asset Category</Text>
              <View style={styles.categoryRow}>
                {(['SIP', 'Stock', 'Mutual Fund', 'Fixed Deposit'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setValue('category', cat)}
                    style={[
                      styles.catChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                      selectedCategory === cat && {
                        backgroundColor: colors.text,
                        borderColor: colors.text,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.catChipText,
                        { color: selectedCategory === cat ? colors.background : colors.text },
                      ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fund / Company Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {selectedCategory === 'Stock' ? 'Stock Ticker / Company Name' : 'Investment Name / Fund Name'}
              </Text>
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
                    placeholder={selectedCategory === 'Stock' ? 'e.g. NABIL or NMB' : 'e.g. Nabil Flexi Cap Fund'}
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize={selectedCategory === 'Stock' ? 'characters' : 'words'}
                  />
                )}
              />
              {errors.name && (
                <Text style={[styles.errorText, { color: colors.danger }]}>{errors.name.message}</Text>
              )}
            </View>

            {/* Quantity of shares (for Stock only) */}
            {selectedCategory === 'Stock' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Number of Shares</Text>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          borderColor: errors.quantity ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      ]}
                      placeholder="e.g. 50"
                      placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(Number(text) || 0)}
                      value={value ? String(value) : ''}
                    />
                  )}
                />
                {errors.quantity && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.quantity.message}
                  </Text>
                )}
              </View>
            )}

            {/* Invested Value (Principal) */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>
                {selectedCategory === 'Stock' ? 'Total Purchase Value (Rs.)' : 'Total Invested Principal (Rs.)'}
              </Text>
              <Controller
                control={control}
                name="purchaseValue"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.purchaseValue ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. 25000"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? String(value) : ''}
                  />
                )}
              />
              {errors.purchaseValue && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.purchaseValue.message}
                </Text>
              )}
            </View>

            {/* Current Valuation */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Current Market Valuation (Rs.)</Text>
              <Controller
                control={control}
                name="currentValue"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        borderColor: errors.currentValue ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      },
                    ]}
                    placeholder="e.g. 28500"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? String(value) : ''}
                  />
                )}
              />
              {errors.currentValue && (
                <Text style={[styles.errorText, { color: colors.danger }]}>
                  {errors.currentValue.message}
                </Text>
              )}
            </View>

            {/* Monthly contribution (for SIP only) */}
            {selectedCategory === 'SIP' && (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Monthly Contribution (Rs.)</Text>
                <Controller
                  control={control}
                  name="monthlyContribution"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: isDark ? '#F8FAFC' : '#0F172A',
                          borderColor: errors.monthlyContribution ? colors.danger : (isDark ? '#334155' : '#CBD5E1'),
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        },
                      ]}
                      placeholder="e.g. 5000"
                      placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                      keyboardType="numeric"
                      onBlur={onBlur}
                      onChangeText={(text) => onChange(Number(text) || 0)}
                      value={value ? String(value) : ''}
                    />
                  )}
                />
                {errors.monthlyContribution && (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {errors.monthlyContribution.message}
                  </Text>
                )}
              </View>
            )}

            {/* Submit Actions */}
            <Button
              label="Save Investment Tracker"
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
  card: {
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
  },
  inputGroup: {
    marginBottom: Spacing.four,
  },
  label: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  catChip: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.three,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two * 1.5,
    paddingHorizontal: Spacing.three,
    fontSize: 14.5,
  },
  errorText: {
    fontSize: 11.5,
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
