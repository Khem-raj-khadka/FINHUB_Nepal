import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Edit3, AlertCircle, CheckCircle2, Shield, Laptop, Car, Home as HomeIcon, Compass, GraduationCap, Target } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import FeedbackModal, { FeedbackType } from '../../components/ui/FeedbackModal';
import { calculateGoalProgress, calculateSmartSavings } from '../../services/calculations';
import { SavingsGoal } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function Goals() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 768;

  // Zustand state
  const {
    goals,
    accounts,
    transactions,
    addGoalMoney,
    removeGoalMoney,
    editGoal,
    deleteGoal,
    isBalanceHidden,
    currency,
    loadSavedData,
  } = useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);

  // Add / Withdraw Modal State
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'withdraw'>('add');
  const [amountInput, setAmountInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Edit Goal Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [editName, setEditName] = useState('');
  const [editTarget, setEditTarget] = useState('');
  const [editCurrent, setEditCurrent] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Goal Confirmation State
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null);

  // Feedback Popup Modal
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

  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  const getGoalIcon = (iconName: string) => {
    switch (iconName?.toLowerCase()) {
      case 'shield':
        return <Shield color={colors.accent} size={22} />;
      case 'laptop':
        return <Laptop color={colors.info} size={22} />;
      case 'compass':
        return <Compass color={colors.accent} size={22} />;
      case 'car':
        return <Car color={colors.warning} size={22} />;
      case 'home':
        return <HomeIcon color={colors.success} size={22} />;
      case 'graduation':
        return <GraduationCap color={colors.warning} size={22} />;
      default:
        return <Target color={colors.accent} size={22} />;
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadSavedData().finally(() => {
      setRefreshing(false);
    });
  };

  // Open Add / Withdraw Modal
  const handleOpenActionModal = (goal: SavingsGoal, mode: 'add' | 'withdraw') => {
    setSelectedGoal(goal);
    setModalMode(mode);
    setAmountInput('');
    setActionError(null);
    setActionModalVisible(true);
  };

  const handleActionModalSubmit = () => {
    if (!selectedGoal) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setActionError('Please enter a valid positive amount.');
      return;
    }

    if (modalMode === 'add') {
      if (accounts.length === 0) {
        setActionError('Please link a bank account under the "Accounts" tab first.');
        return;
      }
      const sourceAcc = accounts[0];
      if (sourceAcc.balance < amount) {
        setActionError(`Insufficient balance in ${sourceAcc.providerName} (${fmt(sourceAcc.balance)}).`);
        return;
      }

      addGoalMoney(selectedGoal.id, amount);
    } else {
      if (selectedGoal.currentAmount < amount) {
        setActionError(`You cannot withdraw more than you have saved (${fmt(selectedGoal.currentAmount)}).`);
        return;
      }

      removeGoalMoney(selectedGoal.id, amount);
    }

    setActionModalVisible(false);
    setFeedbackState({
      visible: true,
      type: 'success',
      title: modalMode === 'add' ? 'Savings Added' : 'Withdrawal Recorded',
      message: `Goal balance for "${selectedGoal.name}" updated by ${fmt(amount)}.`,
    });
  };

  // Open Edit Modal
  const handleOpenEditModal = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setEditName(goal.name);
    setEditTarget(String(goal.targetAmount));
    setEditCurrent(String(goal.currentAmount));
    setEditDate(goal.targetDate.split('T')[0]);
    setEditDescription(goal.description || '');
    setEditError(null);
    setEditModalVisible(true);
  };

  const handleEditModalSubmit = () => {
    if (!editingGoal) return;
    if (!editName.trim()) {
      setEditError('Goal name cannot be empty.');
      return;
    }
    const targetAmt = parseFloat(editTarget);
    if (isNaN(targetAmt) || targetAmt <= 0) {
      setEditError('Target amount must be a positive number.');
      return;
    }
    const currentAmt = parseFloat(editCurrent);
    if (isNaN(currentAmt) || currentAmt < 0) {
      setEditError('Current saved amount cannot be negative.');
      return;
    }
    if (isNaN(Date.parse(editDate))) {
      setEditError('Please enter a valid date (YYYY-MM-DD).');
      return;
    }

    editGoal(editingGoal.id, {
      name: editName.trim(),
      targetAmount: targetAmt,
      currentAmount: currentAmt,
      targetDate: editDate,
      description: editDescription.trim(),
    });

    setEditModalVisible(false);
    setFeedbackState({
      visible: true,
      type: 'success',
      title: 'Goal Updated',
      message: `Successfully updated parameters for "${editName.trim()}".`,
    });
  };

  const confirmDeleteGoal = () => {
    if (!deletingGoal) return;
    const name = deletingGoal.name;
    deleteGoal(deletingGoal.id);
    setDeletingGoal(null);
    setFeedbackState({
      visible: true,
      type: 'success',
      title: 'Goal Deleted',
      message: `"${name}" has been removed from your goals.`,
    });
  };

  // Calculate smart savings dynamically
  const smartSavingsCapacity = calculateSmartSavings(transactions);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Feedback Popup Modal */}
      <FeedbackModal
        visible={feedbackState.visible}
        type={feedbackState.type}
        title={feedbackState.title}
        message={feedbackState.message}
        onClose={() => setFeedbackState((s) => ({ ...s, visible: false }))}
      />

      {/* Delete Confirmation Popup */}
      <FeedbackModal
        visible={!!deletingGoal}
        type="confirm"
        title="Delete Financial Goal?"
        message={`Are you sure you want to delete "${deletingGoal?.name}"? Saved metrics will be adjusted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={confirmDeleteGoal}
        onCancel={() => setDeletingGoal(null)}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('goals.title')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/goals/add')}
            style={[styles.addButton, { backgroundColor: colors.text }]}>
            <Plus color={colors.background} size={16} style={styles.addIcon} />
            <Text style={[styles.addButtonText, { color: colors.background }]}>{t('goals.newGoal')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }>
        
        <View style={[styles.responsiveContainer, isWideScreen && styles.responsiveContainerWide]}>
          
          {/* Smart Savings Recommendation Card */}
          <Card style={[styles.smartRecommendCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.smartTitle, { color: colors.text }]}>{t('goals.smartSavingsTitle')}</Text>
            <Text style={[styles.smartDesc, { color: colors.textSecondary }]}>
              {t('goals.smartSavingsDesc', { amount: fmt(smartSavingsCapacity) })}
            </Text>
          </Card>

          {/* Goals List Header */}
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('goals.activeGoals')} ({goals.length})</Text>
          </View>
          
          {/* Goals Grid (Responsive) */}
          <View style={[styles.goalsGrid, isWideScreen && styles.goalsGridWide]}>
            {goals.map((goal) => {
              const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);
              const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
              const isAchieved = goal.currentAmount >= goal.targetAmount;
              const dateStr = new Date(goal.targetDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <Card 
                  key={goal.id} 
                  style={[
                    styles.goalCard,
                    isWideScreen && styles.goalCardWide,
                    { borderColor: colors.border, backgroundColor: colors.card }
                  ]}>
                  {/* Top Row: Icon, Name, Date, Action Buttons */}
                  <View style={styles.goalHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: colors.backgroundElement }]}>
                      {getGoalIcon(goal.icon)}
                    </View>
                    <View style={styles.goalMeta}>
                      <Text numberOfLines={1} style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                      <Text style={[styles.goalDate, { color: colors.textSecondary }]}>
                        {t('goals.target')}: {dateStr}
                      </Text>
                    </View>
                    <View style={styles.goalHeaderButtons}>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Edit Goal"
                        onPress={() => handleOpenEditModal(goal)}
                        style={[styles.headerActionIcon, { backgroundColor: colors.backgroundElement }]}>
                        <Edit3 color={colors.textSecondary} size={15} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Delete Goal"
                        onPress={() => setDeletingGoal(goal)}
                        style={[styles.headerActionIcon, { backgroundColor: colors.backgroundElement }]}>
                        <Trash2 color={colors.danger} size={15} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Description if present */}
                  {goal.description ? (
                    <Text numberOfLines={2} style={[styles.goalDescription, { color: colors.textSecondary }]}>
                      {goal.description}
                    </Text>
                  ) : null}

                  {/* Progress bar */}
                  <View style={styles.progressContainer}>
                    <ProgressBar progress={progress} showText={false} height={10} />
                    <View style={styles.progressPercentageRow}>
                      <Text style={[styles.progressPctText, { color: isAchieved ? colors.success : colors.accent }]}>
                        {progress.toFixed(0)}% completed
                      </Text>
                      {isAchieved && (
                        <Text style={[styles.achievedBadge, { color: colors.success }]}>
                          {t('goals.achieved')}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* 3-Column Financial Breakdown */}
                  <View style={styles.goalDetailsRow}>
                    <View style={styles.metricColumn}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('goals.saved')}</Text>
                      <Text numberOfLines={1} style={[styles.detailValue, { color: colors.text }]}>{fmt(goal.currentAmount)}</Text>
                    </View>
                    <View style={styles.metricColumn}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('goals.target')}</Text>
                      <Text numberOfLines={1} style={[styles.detailValue, { color: colors.text }]}>{fmt(goal.targetAmount)}</Text>
                    </View>
                    <View style={[styles.metricColumn, styles.rightAlign]}>
                      <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('goals.remaining')}</Text>
                      <Text numberOfLines={1} style={[styles.detailValue, { color: isAchieved ? colors.success : colors.warning }]}>
                        {isAchieved ? 'Completed' : fmt(remainingAmount)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Add/Withdraw Controls */}
                  <View style={styles.controlsRow}>
                    <Button
                      label={t('goals.withdraw')}
                      variant="outline"
                      size="small"
                      onPress={() => handleOpenActionModal(goal, 'withdraw')}
                      style={styles.controlBtn}
                    />
                    <Button
                      label={t('goals.addMoney')}
                      size="small"
                      onPress={() => handleOpenActionModal(goal, 'add')}
                      style={[styles.controlBtn, { backgroundColor: colors.success }]}
                    />
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Empty State */}
          {goals.length === 0 && (
            <View style={[styles.emptyContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <AlertCircle color={colors.textSecondary} size={36} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('goals.emptyState')}</Text>
              <Button
                label={t('goals.createGoalBtn')}
                variant="primary"
                size="small"
                onPress={() => router.push('/goals/add')}
                style={styles.emptyBtn}
              />
            </View>
          )}

        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save / Withdraw Action Modal */}
      {selectedGoal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={actionModalVisible}
          onRequestClose={() => setActionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalMode === 'add' ? 'Save Money' : 'Withdraw Money'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Goal: {selectedGoal.name} ({fmt(selectedGoal.currentAmount)} saved)
              </Text>

              {actionError && (
                <View style={[styles.modalErrorBox, { backgroundColor: `${colors.danger}15` }]}>
                  <Text style={[styles.modalErrorText, { color: colors.danger }]}>{actionError}</Text>
                </View>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount (Rs.)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: isDark ? '#F8FAFC' : '#0F172A',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    },
                  ]}
                  placeholder="e.g. 5000"
                  placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  keyboardType="numeric"
                  value={amountInput}
                  onChangeText={(val) => {
                    setAmountInput(val);
                    setActionError(null);
                  }}
                  autoFocus
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  label={t('general.cancel')}
                  variant="secondary"
                  onPress={() => setActionModalVisible(false)}
                  style={styles.modalBtn}
                />
                <Button
                  label={modalMode === 'add' ? 'Confirm Save' : 'Confirm Withdraw'}
                  onPress={handleActionModalSubmit}
                  style={[styles.modalBtn, modalMode === 'add' && { backgroundColor: colors.success }]}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('goals.editGoalTitle')}</Text>

              {editError && (
                <View style={[styles.modalErrorBox, { backgroundColor: `${colors.danger}15` }]}>
                  <Text style={[styles.modalErrorText, { color: colors.danger }]}>{editError}</Text>
                </View>
              )}

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                {/* Goal Name */}
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Goal Name</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? '#334155' : '#CBD5E1', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Goal Name"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  />
                </View>

                {/* Target Amount */}
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Target Amount (Rs.)</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? '#334155' : '#CBD5E1', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ]}
                    value={editTarget}
                    onChangeText={setEditTarget}
                    keyboardType="numeric"
                    placeholder="Target Amount"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  />
                </View>

                {/* Current Saved Amount */}
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Current Saved (Rs.)</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? '#334155' : '#CBD5E1', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ]}
                    value={editCurrent}
                    onChangeText={setEditCurrent}
                    keyboardType="numeric"
                    placeholder="Current Saved"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  />
                </View>

                {/* Target Date */}
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Target Date (YYYY-MM-DD)</Text>
                  <TextInput
                    style={[
                      styles.modalInput,
                      { color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? '#334155' : '#CBD5E1', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ]}
                    value={editDate}
                    onChangeText={setEditDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                  />
                </View>

                {/* Description */}
                <View style={styles.modalInputGroup}>
                  <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('goals.description')}</Text>
                  <TextInput
                    style={[
                      styles.modalTextArea,
                      { color: isDark ? '#F8FAFC' : '#0F172A', borderColor: isDark ? '#334155' : '#CBD5E1', backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                    ]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Optional notes or description"
                    placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
                    multiline
                    numberOfLines={2}
                  />
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  label={t('general.cancel')}
                  variant="secondary"
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalBtn}
                />
                <Button
                  label={t('general.save')}
                  onPress={handleEditModalSubmit}
                  style={styles.modalBtn}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  headerInner: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    fontSize: 20,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.one * 1.2,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  addIcon: {
    marginRight: 4,
  },
  addButtonText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1280,
  },
  responsiveContainerWide: {
    paddingHorizontal: Spacing.two,
  },
  smartRecommendCard: {
    borderWidth: 0,
    padding: Spacing.four,
    marginBottom: Spacing.four,
    borderRadius: 16,
  },
  smartTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
  },
  smartDesc: {
    ...Typography.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.two,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '800',
  },
  goalsGrid: {
    flexDirection: 'column',
    gap: Spacing.three,
  },
  goalsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  goalCard: {
    borderWidth: 1,
    padding: Spacing.four,
    borderRadius: 16,
    width: '100%',
  },
  goalCardWide: {
    width: '48.5%',
    flexGrow: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  goalMeta: {
    flex: 1,
  },
  goalName: {
    ...Typography.bodyLarge,
    fontSize: 15.5,
    fontWeight: '800',
  },
  goalDate: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  goalHeaderButtons: {
    flexDirection: 'row',
    gap: Spacing.one * 1.5,
  },
  headerActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDescription: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: Spacing.three,
  },
  progressContainer: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  progressPercentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  progressPctText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  achievedBadge: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  goalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  metricColumn: {
    flex: 1,
  },
  detailLabel: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '600',
  },
  detailValue: {
    ...Typography.bodySmall,
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  controlBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six * 1.5,
    gap: Spacing.two,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginVertical: Spacing.three,
  },
  emptyText: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
  },
  emptyBtn: {
    marginTop: Spacing.two,
  },
  bottomSpacer: {
    height: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.three,
  },
  modalErrorBox: {
    padding: Spacing.two,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  modalErrorText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: Spacing.three,
  },
  modalLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  modalTextArea: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    height: 60,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  modalBtn: {
    flex: 1,
  },
});
