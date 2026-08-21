import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Target, Trash2, AlertCircle } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import { calculateGoalProgress, calculateSmartSavings } from '../../services/calculations';
import { SavingsGoal } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function Goals() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  // Zustand state
  const {
    goals,
    accounts,
    transactions,
    addGoalMoney,
    removeGoalMoney,
    deleteGoal,
    isBalanceHidden,
    currency,
    loadSavedData,
  } = useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'withdraw'>('add');
  const [amountInput, setAmountInput] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  const getGoalIcon = (iconName: string) => {
    switch (iconName.toLowerCase()) {
      case 'shield':
        return '🛡️';
      case 'laptop':
        return '💻';
      case 'compass':
        return '🧭';
      case 'car':
        return '🚗';
      case 'home':
        return '🏠';
      default:
        return '🎯';
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadSavedData().finally(() => {
      setRefreshing(false);
    });
  };

  const handleOpenActionModal = (goal: SavingsGoal, mode: 'add' | 'withdraw') => {
    setSelectedGoal(goal);
    setModalMode(mode);
    setAmountInput('');
    setModalError(null);
    setModalVisible(true);
  };

  const handleModalSubmit = () => {
    if (!selectedGoal) return;
    const amount = parseFloat(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setModalError('Please enter a valid positive amount.');
      return;
    }

    if (modalMode === 'add') {
      if (accounts.length === 0) {
        setModalError('Please link a bank account under the "Accounts" tab first.');
        return;
      }
      const sourceAcc = accounts[0]; 
      if (sourceAcc.balance < amount) {
        setModalError(`Insufficient balance in ${sourceAcc.providerName} (${fmt(sourceAcc.balance)}).`);
        return;
      }

      addGoalMoney(selectedGoal.id, amount);
    } else {
      if (selectedGoal.currentAmount < amount) {
        setModalError(`You cannot withdraw more than you have saved (${fmt(selectedGoal.currentAmount)}).`);
        return;
      }

      removeGoalMoney(selectedGoal.id, amount);
    }

    setModalVisible(false);
    Alert.alert(t('general.success'), 'Goal updated successfully.');
  };

  const handleDeleteGoal = (goal: SavingsGoal) => {
    Alert.alert(
      t('goals.deleteTitle'),
      t('goals.deleteConfirm', { name: goal.name }),
      [
        { text: t('goals.deleteCancel'), style: 'cancel' },
        {
          text: t('goals.deleteBtn'),
          style: 'destructive',
          onPress: () => {
            try {
              deleteGoal(goal.id);
              Alert.alert(t('general.success'), t('goals.deleteSuccess'));
            } catch (err) {
              Alert.alert(t('general.error'), t('goals.deleteFail'));
            }
          },
        },
      ]
    );
  };

  // Calculate smart savings dynamically
  const smartSavingsCapacity = calculateSmartSavings(transactions);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('goals.title')}</Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/goals/add')}
          style={[styles.addButton, { backgroundColor: colors.text }]}>
          <Plus color={colors.background} size={16} style={styles.addIcon} />
          <Text style={[styles.addButtonText, { color: colors.background }]}>{t('goals.newGoal')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }>
        
        {/* Smart Savings Recommendation Card */}
        <Card style={[styles.smartRecommendCard, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.smartTitle, { color: colors.text }]}>{t('goals.smartSavingsTitle')}</Text>
          <Text style={[styles.smartDesc, { color: colors.textSecondary }]}>
            {t('goals.smartSavingsDesc', { amount: fmt(smartSavingsCapacity) })}
          </Text>
        </Card>

        {/* Goals List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('goals.activeGoals')}</Text>
        
        {goals.map((goal) => {
          const progress = calculateGoalProgress(goal.currentAmount, goal.targetAmount);
          const dateStr = new Date(goal.targetDate).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          });

          return (
            <Card key={goal.id} style={[styles.goalCard, { borderColor: colors.border }]}>
              <View style={styles.goalHeader}>
                <View style={[styles.iconCircle, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={styles.goalIconEmoji}>{getGoalIcon(goal.icon)}</Text>
                </View>
                <View style={styles.goalMeta}>
                  <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>
                  <Text style={[styles.goalDate, { color: colors.textSecondary }]}>{t('goals.target')}: {dateStr}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteGoal(goal)}
                  style={[styles.trashIcon, { backgroundColor: colors.backgroundElement }]}>
                  <Trash2 color={colors.danger} size={16} />
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              <ProgressBar progress={progress} showText={false} height={10} />

              {/* Details and controls */}
              <View style={styles.goalDetailsRow}>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('goals.saved')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{fmt(goal.currentAmount)}</Text>
                </View>
                <View style={styles.rightAlign}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('goals.target')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{fmt(goal.targetAmount)}</Text>
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

        {/* Empty State */}
        {goals.length === 0 && (
          <View style={[styles.emptyContainer, { borderColor: colors.border }]}>
            <AlertCircle color={colors.textSecondary} size={32} />
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

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Goal Action Modal */}
      {selectedGoal && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <Card style={[styles.modalCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {modalMode === 'add' ? 'Save Money' : 'Withdraw Money'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Goal: {selectedGoal.name} ({fmt(selectedGoal.currentAmount)} saved)
              </Text>

              {modalError && (
                <View style={[styles.modalErrorBox, { backgroundColor: `${colors.danger}15` }]}>
                  <Text style={[styles.modalErrorText, { color: colors.danger }]}>{modalError}</Text>
                </View>
              )}

              <View style={styles.modalInputGroup}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount (Rs.)</Text>
                <TextInput
                  style={[
                    styles.modalInput,
                    {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                  ]}
                  placeholder="e.g. 5000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={amountInput}
                  onChangeText={(val) => {
                    setAmountInput(val);
                    setModalError(null);
                  }}
                  autoFocus
                />
              </View>

              <View style={styles.modalActions}>
                <Button
                  label={t('general.cancel')}
                  variant="secondary"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalBtn}
                />
                <Button
                  label={modalMode === 'add' ? 'Confirm Save' : 'Confirm Withdraw'}
                  onPress={handleModalSubmit}
                  style={[styles.modalBtn, modalMode === 'add' && { backgroundColor: colors.success }]}
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
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
  },
  headerTitle: {
    ...Typography.h2,
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
  divider: {
    height: 1.2,
    marginVertical: Spacing.three,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.two,
  },
  goalCard: {
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  goalIconEmoji: {
    fontSize: 18,
  },
  goalMeta: {
    flex: 1,
  },
  goalName: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '800',
  },
  goalDate: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 2,
  },
  trashIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  detailLabel: {
    ...Typography.caption,
    fontSize: 10,
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
    paddingVertical: Spacing.five * 1.2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginVertical: Spacing.three,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  emptyBtn: {
    marginTop: Spacing.four,
    width: '60%',
  },
  bottomSpacer: {
    height: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000080',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    padding: Spacing.four,
    elevation: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
  },
  modalTitle: {
    ...Typography.h2,
    marginBottom: Spacing.one,
  },
  modalSubtitle: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginBottom: Spacing.four,
  },
  modalErrorBox: {
    padding: Spacing.two,
    borderRadius: 8,
    marginBottom: Spacing.three,
  },
  modalErrorText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    textAlign: 'center',
  },
  modalInputGroup: {
    marginBottom: Spacing.four,
  },
  modalLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.one * 1.5,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
  },
});
