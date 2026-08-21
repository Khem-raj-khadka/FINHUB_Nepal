import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Bell, User, ArrowUpRight, TrendingUp, Wallet, ShieldAlert, Award, Plus, X } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import FinancialScore from '../../components/ui/FinancialScore';
import { LineChart } from '../../components/ui/SimpleChart';
import { calculateNetWorth, calculateSavingsRate, calculateInvestmentReturns } from '../../services/calculations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function Home() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t, language } = useTranslation();

  // Zustand state
  const {
    user,
    accounts,
    investments,
    transactions,
    goals,
    notifications,
    financialScore,
    isBalanceHidden,
    toggleBalanceHidden,
    currency,
    addTransaction,
    loadSavedData,
  } = useFinanceStore();

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // New Transaction Form state
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txCategory, setTxCategory] = useState('Food & Dining');
  const [txAccountId, setTxAccountId] = useState(accounts[0]?.id || '');

  // Dynamic Calculations
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, investments);
  const { income, expenses, savings, rate } = calculateSavingsRate(transactions);
  const { returnPercentage } = calculateInvestmentReturns(investments);

  // Unread notifications count
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  // Format NPR
  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  // Find next due SIP
  const dueSips = investments.filter((i) => i.investmentType === 'SIP' && (i.status === 'Due Soon' || i.status === 'Overdue'));
  const activeSips = investments.filter((i) => i.investmentType === 'SIP');
  const nextSip = dueSips[0] || activeSips[0];

  // Dynamic Greeting based on Local Hour
  const getLocalizedGreeting = () => {
    const hour = new Date().getHours();
    let greetKey = 'greet.evening';
    if (hour >= 5 && hour < 12) {
      greetKey = 'greet.morning';
    } else if (hour >= 12 && hour < 17) {
      greetKey = 'greet.afternoon';
    }
    return t(greetKey);
  };

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reload state from local storage / recalculate
    loadSavedData().finally(() => {
      setRefreshing(false);
    });
  }, [loadSavedData]);

  // Submit manual transaction
  const handleAddTx = () => {
    if (!txTitle.trim()) {
      Alert.alert(t('general.error'), 'Please enter a transaction title.');
      return;
    }
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert(t('general.error'), 'Please enter a valid positive amount.');
      return;
    }
    const targetAccount = txAccountId || (accounts[0]?.id || '');
    if (!targetAccount) {
      Alert.alert(t('general.error'), 'Please connect a financial account first.');
      return;
    }

    addTransaction(txTitle, amt, txType, txCategory, targetAccount);

    // Reset Form
    setTxTitle('');
    setTxAmount('');
    setTxModalVisible(false);
    
    Alert.alert(t('general.success'), 'Transaction added successfully.');
  };

  // Demo trend values for the sparkline chart
  const netWorthTrend = [1150000, 1180000, 1210000, 1230000, netWorth || 1245000];
  const netWorthLabels = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{getLocalizedGreeting()},</Text>
          <Text style={[styles.userNameText, { color: colors.text }]}>{user?.name || 'Khem Raj'} 👋</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings/notifications')}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Bell color={colors.text} size={20} />
            {unreadNotifs > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                <Text style={styles.badgeText}>{unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/settings/profile')}
            style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <User color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        
        {/* Net Worth Card */}
        <Card style={styles.netWorthCard}>
          <View style={styles.netWorthHeader}>
            <Text style={[styles.netWorthLabel, { color: '#E2E8F0' }]}>{t('dashboard.netWorth')}</Text>
            <TouchableOpacity onPress={toggleBalanceHidden} style={styles.eyeButton}>
              {isBalanceHidden ? <EyeOff color="#FFFFFF" size={18} /> : <Eye color="#FFFFFF" size={18} />}
            </TouchableOpacity>
          </View>
          <Text style={[styles.netWorthAmount, { color: '#FFFFFF' }]}>{fmt(netWorth)}</Text>
          <View style={styles.netWorthTrendRow}>
            <ArrowUpRight color={colors.success} size={16} />
            <Text style={[styles.netWorthTrendText, { color: '#A0AEC0' }]}>
              +Rs. 95,000 (+8.4% this year)
            </Text>
          </View>
          {/* Sparkline chart */}
          <View style={styles.sparklineBox}>
            <LineChart data={netWorthTrend} labels={netWorthLabels} height={120} />
          </View>
        </Card>

        {/* Quick Actions Panel */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => router.push('/account/connect')}
            >
              <Text style={styles.quickActionIcon}>🏦</Text>
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addAccount')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => router.push('/investment/add')}
            >
              <Text style={styles.quickActionIcon}>📈</Text>
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addSip')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => router.push('/goals/add')}
            >
              <Text style={styles.quickActionIcon}>🎯</Text>
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addGoal')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
              onPress={() => setTxModalVisible(true)}
            >
              <Text style={styles.quickActionIcon}>💸</Text>
              <Text style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addTx')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Financial Summary Card */}
        <View style={styles.monthlySummarySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.monthlySummary')}</Text>
          <Card style={[styles.summaryCard, { borderColor: colors.border }]}>
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{fmt(income || 85000)}</Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>{fmt(expenses)}</Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Savings</Text>
              <Text style={[styles.summaryValue, { color: colors.accent }]}>{fmt(income > 0 ? savings : (85000 - expenses))}</Text>
            </View>
            <View style={styles.summaryItemRow}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('dashboard.savingsRate')}</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{(income > 0 ? rate : ((85000 - expenses) / 85000 * 100)).toFixed(0)}%</Text>
            </View>
            <Button
              label={t('dashboard.viewFullReport')}
              variant="outline"
              size="small"
              style={styles.summaryReportBtn}
              onPress={() => setReportModalVisible(true)}
            />
          </Card>
        </View>

        {/* Financial Summary Grid */}
        <View style={styles.summaryGrid}>
          <View style={styles.gridColumn}>
            <Card variant="flat" style={styles.gridItem}>
              <Award color={colors.success} size={18} />
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.assets')}</Text>
              <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(totalAssets)}</Text>
            </Card>
            <Card variant="flat" style={styles.gridItem}>
              <Wallet color={colors.accent} size={18} />
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.monthlySavings')}</Text>
              <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(savings || (85000 - expenses))}</Text>
            </Card>
          </View>
          <View style={styles.gridColumn}>
            <Card variant="flat" style={styles.gridItem}>
              <ShieldAlert color={colors.danger} size={18} />
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.liabilities')}</Text>
              <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(totalLiabilities)}</Text>
            </Card>
            <Card variant="flat" style={styles.gridItem}>
              <TrendingUp color={colors.warning} size={18} />
              <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.portfolioReturn')}</Text>
              <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>+{returnPercentage.toFixed(1)}%</Text>
            </Card>
          </View>
        </View>

        {/* Connected Accounts Slider */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.connectedAccounts')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
            <Text style={[styles.viewAllText, { color: colors.accent }]}>{t('dashboard.viewAll')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalAccounts}>
          {accounts.map((acc) => (
            <Card
              key={acc.id}
              onPress={() => router.push(`/account/${acc.id}`)}
              style={[styles.accountSliderCard, { borderColor: colors.border }]}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderProviderEmoji}>
                  {acc.providerType === 'bank' ? '🏦' : '📱'}
                </Text>
                <Text numberOfLines={1} style={[styles.sliderProviderName, { color: colors.text }]}>
                  {acc.providerName}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.sliderBalance, { color: colors.text }]}>
                {fmt(acc.balance)}
              </Text>
              <Text style={[styles.sliderType, { color: colors.textSecondary }]}>
                {acc.accountType}
              </Text>
            </Card>
          ))}
          {accounts.length === 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push('/account/connect')}
              style={[styles.accountSliderEmpty, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.emptyAddIcon, { color: colors.textSecondary }]}>+</Text>
              <Text style={[styles.emptyAddText, { color: colors.textSecondary }]}>{t('accounts.connectBtn')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Upcoming SIP Card */}
        {nextSip && (
          <View style={styles.sipSection}>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.upcomingSip')}</Text>
            <Card style={[styles.sipCard, { borderColor: colors.border }]}>
              <View style={styles.sipBadgeContainer}>
                <Text style={[styles.sipBadge, { backgroundColor: `${colors.warning}15`, color: colors.warning }]}>
                  {nextSip.status === 'Overdue' ? t('invest.filterOverdue') : t('dashboard.dueSoon')}
                </Text>
              </View>
              <Text style={[styles.sipFundName, { color: colors.text }]}>{nextSip.name}</Text>
              <View style={styles.sipDetailsRow}>
                <View>
                  <Text style={[styles.sipLabel, { color: colors.textSecondary }]}>{t('invest.upcomingSips')}</Text>
                  <Text style={[styles.sipValue, { color: colors.text }]}>
                    {fmt(nextSip.monthlyContribution || 0)}
                  </Text>
                </View>
                <View style={styles.alignRight}>
                  <Text style={[styles.sipLabel, { color: colors.textSecondary }]}>{t('invest.nextDue')}</Text>
                  <Text style={[styles.sipValue, { color: colors.text }]}>
                    {nextSip.nextPaymentDate ? new Date(nextSip.nextPaymentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    }) : 'N/A'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/investments')} style={styles.sipViewDetails}>
                <Text style={[styles.sipDetailsText, { color: colors.accent }]}>{t('dashboard.viewDetails')}</Text>
              </TouchableOpacity>
            </Card>
          </View>
        )}

        {/* Financial Health Score circular gauge */}
        <View style={styles.healthSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.financialHealth')}</Text>
          <Card style={styles.healthCard}>
            <FinancialScore score={financialScore.totalScore} />
            <TouchableOpacity
              onPress={() => router.push('/settings/profile')}
              style={[styles.breakdownButton, { borderColor: colors.border }]}>
              <Text style={[styles.breakdownText, { color: colors.text }]}>{t('dashboard.viewBreakdown')}</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Smart Insights */}
        <View style={styles.insightsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.smartInsights')}</Text>
          <Card style={styles.insightCard}>
            <View style={styles.insightRow}>
              <Text style={styles.insightEmoji}>💡</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>
                You spent 18% more on Food & Dining compared to last month. Consider cooking at home.
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightEmoji}>💡</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Your SIP contributions are consistent. Great job compounding your wealth!
              </Text>
            </View>
            <View style={styles.insightRow}>
              <Text style={styles.insightEmoji}>⚠️</Text>
              <Text style={[styles.insightText, { color: colors.text }]}>
                Your emergency fund is below your recommended target of Rs. 3,00,000.
              </Text>
            </View>
          </Card>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* 1. ADD TRANSACTION DIALOG MODAL */}
      <Modal visible={txModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('dashboard.addTx')}</Text>
              <TouchableOpacity onPress={() => setTxModalVisible(false)}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Salary, Groceries"
                placeholderTextColor={colors.textSecondary}
                value={txTitle}
                onChangeText={setTxTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (Rs.)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. 5000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={txAmount}
                onChangeText={setTxAmount}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderColor: colors.border },
                    txType === 'expense' && { backgroundColor: `${colors.danger}15`, borderColor: colors.danger }
                  ]}
                  onPress={() => {
                    setTxType('expense');
                    setTxCategory('Food & Dining');
                  }}
                >
                  <Text style={[styles.typeBtnText, { color: txType === 'expense' ? colors.danger : colors.text }]}>
                    Expense
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderColor: colors.border },
                    txType === 'income' && { backgroundColor: `${colors.success}15`, borderColor: colors.success }
                  ]}
                  onPress={() => {
                    setTxType('income');
                    setTxCategory('Salary');
                  }}
                >
                  <Text style={[styles.typeBtnText, { color: txType === 'income' ? colors.success : colors.text }]}>
                    Income
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.categoriesWrap}>
                {(txType === 'expense' 
                  ? ['Food & Dining', 'Rent', 'Bills', 'Shopping', 'Transport', 'Healthcare', 'Entertainment'] 
                  : ['Salary', 'Investment Return', 'Other Income']
                ).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                      txCategory === cat && { backgroundColor: colors.accent, borderColor: colors.accent }
                    ]}
                    onPress={() => setTxCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, { color: txCategory === cat ? '#FFFFFF' : colors.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Deduct/Add Account</Text>
              <View style={styles.categoriesWrap}>
                {accounts.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.categoryChip,
                      { borderColor: colors.border, backgroundColor: colors.backgroundElement },
                      txAccountId === acc.id && { backgroundColor: colors.accent, borderColor: colors.accent }
                    ]}
                    onPress={() => setTxAccountId(acc.id)}
                  >
                    <Text style={[styles.categoryChipText, { color: txAccountId === acc.id ? '#FFFFFF' : colors.text }]}>
                      {acc.providerName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {accounts.length === 0 && (
                <Text style={{ color: colors.danger, fontSize: 13, marginTop: 4 }}>
                  No linked accounts. Please link a wallet or bank account first.
                </Text>
              )}

              <Button
                label={t('general.save')}
                variant="success"
                style={styles.modalSubmitBtn}
                onPress={handleAddTx}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. FULL REPORT COMPARISON OVERLAY */}
      <Modal visible={reportModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: 16 }]}>
                {t('dashboard.comparisonReport')}
              </Text>
              <TouchableOpacity onPress={() => setReportModalVisible(false)}>
                <X color={colors.text} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.reportScroll}>
              <Card variant="outline" style={styles.reportSectionCard}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.incomeChange')}</Text>
                <View style={styles.reportGridRow}>
                  <View>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Previous Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.text }]}>{fmt(80000)}</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Current Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.success }]}>+{fmt(income || 85000)}</Text>
                  </View>
                </View>
                <Text style={[styles.reportTrendText, { color: colors.success }]}>
                  ▲ Rs. 5,000 (+6.2%) increase in monthly earnings.
                </Text>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.expenseChange')}</Text>
                <View style={styles.reportGridRow}>
                  <View>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Previous Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.text }]}>{fmt(40000)}</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Current Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.danger }]}>-{fmt(expenses)}</Text>
                  </View>
                </View>
                <Text style={[styles.reportTrendText, { color: expenses > 40000 ? colors.danger : colors.success }]}>
                  {expenses > 40000 
                    ? `▼ Rs. ${(expenses - 40000).toLocaleString('en-IN')} (+${((expenses - 40000)/40000 * 100).toFixed(0)}%) rise in monthly spending.`
                    : `▲ Rs. ${(40000 - expenses).toLocaleString('en-IN')} (-${((40000 - expenses)/40000 * 100).toFixed(0)}%) savings in monthly spending.`}
                </Text>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.savingsChange')}</Text>
                <View style={styles.reportGridRow}>
                  <View>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Previous Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.text }]}>{fmt(40000)}</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Current Month</Text>
                    <Text style={[styles.reportCellValue, { color: colors.accent }]}>{fmt(income > 0 ? savings : (85000 - expenses))}</Text>
                  </View>
                </View>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <View style={styles.summaryItemRow}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.biggestSpending')}</Text>
                  <Text style={[styles.reportCellValue, { color: colors.danger, fontSize: 13 }]}>Food & Dining</Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.investmentContribution')}</Text>
                  <Text style={[styles.reportCellValue, { color: colors.success, fontSize: 13 }]}>Rs. 10,000</Text>
                </View>
              </Card>

              <Button
                label={t('dashboard.close')}
                variant="primary"
                style={styles.modalCloseBtn}
                onPress={() => setReportModalVisible(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two * 1.5,
    borderBottomWidth: 1,
  },
  greetingText: {
    ...Typography.bodySmall,
  },
  userNameText: {
    ...Typography.bodyLarge,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  netWorthCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: Spacing.four,
    marginVertical: Spacing.one,
  },
  netWorthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  netWorthLabel: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  eyeButton: {
    padding: 4,
  },
  netWorthAmount: {
    ...Typography.display,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  netWorthTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  netWorthTrendText: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  sparklineBox: {
    height: 120,
    marginTop: Spacing.one,
    overflow: 'hidden',
  },
  actionsSection: {
    marginTop: Spacing.four,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.three,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.two,
  },
  quickActionItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  quickActionText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  monthlySummarySection: {
    marginTop: Spacing.four,
  },
  summaryCard: {
    borderWidth: 1,
    padding: Spacing.four,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.one * 1.5,
  },
  summaryLabel: {
    ...Typography.body,
    fontWeight: '600',
  },
  summaryValue: {
    ...Typography.bodyLarge,
    fontSize: 16,
  },
  summaryReportBtn: {
    marginTop: Spacing.three,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  gridColumn: {
    flex: 1,
    gap: Spacing.three,
  },
  gridItem: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 0,
  },
  gridItemLabel: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 2,
  },
  gridItemValue: {
    ...Typography.bodyLarge,
    fontSize: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  viewAllText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  horizontalAccounts: {
    paddingVertical: Spacing.one,
    gap: Spacing.three,
  },
  accountSliderCard: {
    width: 140,
    borderWidth: 1,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  sliderProviderEmoji: {
    fontSize: 16,
  },
  sliderProviderName: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  sliderBalance: {
    ...Typography.bodyLarge,
    fontSize: 15,
  },
  sliderType: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
  accountSliderEmpty: {
    width: 140,
    height: 98,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: Spacing.one * 1.5,
  },
  emptyAddIcon: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 2,
  },
  emptyAddText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  sipSection: {
    marginTop: Spacing.four,
  },
  sipCard: {
    borderWidth: 1,
  },
  sipBadgeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.two,
  },
  sipBadge: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sipFundName: {
    ...Typography.bodyLarge,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.three,
  },
  sipDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  sipLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginBottom: 4,
  },
  sipValue: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '700',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  sipViewDetails: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: Spacing.one,
    marginTop: Spacing.two,
  },
  sipDetailsText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  healthSection: {
    marginTop: Spacing.four,
  },
  healthCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  breakdownButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    width: '100%',
    alignItems: 'center',
  },
  breakdownText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  insightsSection: {
    marginTop: Spacing.four,
  },
  insightCard: {
    gap: Spacing.three,
  },
  insightRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  insightEmoji: {
    fontSize: 18,
    marginTop: -2,
  },
  insightText: {
    ...Typography.body,
    fontSize: 13.5,
    lineHeight: 18,
    flex: 1,
  },
  bottomSpacer: {
    height: 90,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.five,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    paddingBottom: Spacing.two,
    borderBottomWidth: 0.5,
    borderColor: '#A0AEC0',
  },
  modalTitle: {
    ...Typography.h2,
  },
  modalScroll: {
    paddingBottom: Spacing.four,
  },
  inputLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
    marginTop: Spacing.three,
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.two * 1.2,
    ...Typography.body,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginVertical: Spacing.one,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  typeBtnText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one * 1.5,
  },
  categoryChipText: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    marginTop: Spacing.four * 1.5,
  },

  // Report Styles
  reportScroll: {
    paddingBottom: Spacing.four,
  },
  reportSectionCard: {
    padding: Spacing.three,
    marginVertical: Spacing.two,
  },
  reportSectionTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  reportGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.one,
  },
  reportCellLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  reportCellValue: {
    ...Typography.bodySmall,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 2,
  },
  reportTrendText: {
    ...Typography.bodySmall,
    fontSize: 12,
    fontWeight: '600',
    marginTop: Spacing.two,
    paddingTop: Spacing.one,
    borderTopWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  modalCloseBtn: {
    marginTop: Spacing.four,
  },
});
