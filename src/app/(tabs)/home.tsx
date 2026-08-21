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
  useWindowDimensions,
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
import { calculateNetWorth, calculateSavingsRate, calculateInvestmentReturns, calculateCategoryExpenses } from '../../services/calculations';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function Home() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 880;

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
  const { returnPercentage, totalReturn } = calculateInvestmentReturns(investments);
  const categoryExpenses = calculateCategoryExpenses(transactions);

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
    const targetAccount = txAccountId || (accounts[0]?.id || null);

    addTransaction(txTitle, amt, txType, txCategory, targetAccount);

    // Reset Form
    setTxTitle('');
    setTxAmount('');
    setTxModalVisible(false);
    
    Alert.alert(t('general.success'), 'Transaction added successfully.');
  };

  // Dynamic Sparkline Trend Data
  const getSparklineData = () => {
    if (netWorth <= 0 && transactions.length === 0 && accounts.length === 0) {
      return {
        data: [0, 0, 0, 0, 0],
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Now'],
        hasData: false,
      };
    }
    
    const points = [
      Math.max(0, Math.round(netWorth * 0.92)),
      Math.max(0, Math.round(netWorth * 0.94)),
      Math.max(0, Math.round(netWorth * 0.97)),
      Math.max(0, Math.round(netWorth * 0.99)),
      netWorth,
    ];
    return {
      data: points,
      labels: ['Apr', 'May', 'Jun', 'Jul', 'Now'],
      hasData: true,
    };
  };

  const sparkline = getSparklineData();

  // Dynamic Smart Insights Generator
  const getSmartInsights = () => {
    if (accounts.length === 0 && transactions.length === 0 && investments.length === 0 && goals.length === 0) {
      return [
        { emoji: '🏦', text: 'Connect your first bank account or wallet to start aggregating your net worth.' },
        { emoji: '🎯', text: 'Create an Emergency Fund goal to build financial security for unexpected events.' },
        { emoji: '📈', text: 'Start a recurring Systematic Investment Plan (SIP) to grow wealth through rupee-cost averaging.' },
      ];
    }

    const insights = [];

    if (categoryExpenses.length > 0) {
      const top = categoryExpenses[0];
      insights.push({
        emoji: '💡',
        text: `Your highest expense this month is ${top.category} at ${fmt(top.amount)} (${top.percentage.toFixed(0)}% of total spending).`,
      });
    }

    if (rate >= 20) {
      insights.push({
        emoji: '🎉',
        text: `Great savings discipline! You are saving ${rate.toFixed(0)}% of your monthly income.`,
      });
    } else if (income > 0 && rate < 20) {
      insights.push({
        emoji: '⚠️',
        text: `Your current savings rate is ${rate.toFixed(0)}%. Aim for at least 20-30% by setting aside savings on salary day.`,
      });
    }

    if (investments.length > 0 && returnPercentage !== 0) {
      insights.push({
        emoji: '📈',
        text: `Your investment portfolio has a net return of ${totalReturn >= 0 ? '+' : ''}${fmt(totalReturn)} (${returnPercentage.toFixed(1)}%).`,
      });
    }

    if (goals.length > 0) {
      const activeGoal = goals[0];
      const goalPct = ((activeGoal.currentAmount / (activeGoal.targetAmount || 1)) * 100).toFixed(0);
      insights.push({
        emoji: '🎯',
        text: `You have completed ${goalPct}% of your "${activeGoal.name}" goal. Keep it up!`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        emoji: '💡',
        text: 'Record daily income and expenses to unlock personalized financial insights and recommendations.',
      });
    }

    return insights.slice(0, 3);
  };

  const dynamicInsights = getSmartInsights();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerInner}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{getLocalizedGreeting()},</Text>
            <Text style={[styles.userNameText, { color: colors.text }]}>{user?.name || 'User'} 👋</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              activeOpacity={0.7}
              onPress={() => router.push('/settings/notifications')}
              style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Bell color={colors.text} size={20} />
              {unreadNotifs > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.danger }]}>
                  <Text style={styles.badgeText}>{unreadNotifs}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Profile Preferences"
              activeOpacity={0.7}
              onPress={() => router.push('/settings/profile')}
              style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <User color={colors.text} size={20} />
            </TouchableOpacity>
          </View>
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
        <View style={[styles.responsiveContainer, isWideScreen && styles.responsiveContainerWide]}>
          
          {/* Main Dashboard Grid */}
          <View style={[styles.dashboardGrid, isWideScreen && styles.dashboardGridWide]}>
            
            {/* LEFT COLUMN (or Top on mobile) */}
            <View style={[styles.column, isWideScreen && styles.leftColumnWide]}>
              
              {/* Net Worth Card */}
              <Card style={styles.netWorthCard}>
                <View style={styles.netWorthHeader}>
                  <Text style={[styles.netWorthLabel, { color: '#E2E8F0' }]}>{t('dashboard.netWorth')}</Text>
                  <TouchableOpacity onPress={toggleBalanceHidden} style={styles.eyeButton} accessibilityLabel="Toggle balance visibility">
                    {isBalanceHidden ? <EyeOff color="#FFFFFF" size={18} /> : <Eye color="#FFFFFF" size={18} />}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.netWorthAmount, { color: '#FFFFFF' }]}>{fmt(netWorth)}</Text>
                
                <View style={styles.netWorthTrendRow}>
                  {netWorth > 0 ? (
                    <>
                      <ArrowUpRight color={colors.success} size={16} />
                      <Text style={[styles.netWorthTrendText, { color: '#A0AEC0' }]}>
                        {totalAssets > 0 ? `${fmt(totalAssets)} assets vs ${fmt(totalLiabilities)} liabilities` : 'Active Portfolio'}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.netWorthTrendText, { color: '#94A3B8' }]}>
                      {accounts.length === 0 ? 'Link accounts to start calculating net worth' : 'Balanced Portfolio'}
                    </Text>
                  )}
                </View>

                {/* Sparkline chart */}
                <View style={styles.sparklineBox}>
                  <LineChart data={sparkline.data} labels={sparkline.labels} height={140} onDarkCard={true} />
                </View>
              </Card>

              {/* Monthly Financial Summary Card */}
              <View style={styles.monthlySummarySection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.monthlySummary')}</Text>
                <Card style={[styles.summaryCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <View style={styles.summaryItemRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Income</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>{fmt(income)}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Expenses</Text>
                    <Text style={[styles.summaryValue, { color: colors.danger }]}>{fmt(expenses)}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Savings</Text>
                    <Text style={[styles.summaryValue, { color: colors.accent }]}>{fmt(savings)}</Text>
                  </View>
                  <View style={styles.summaryItemRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('dashboard.savingsRate')}</Text>
                    <Text style={[styles.summaryValue, { color: colors.text }]}>{rate.toFixed(0)}%</Text>
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
                  <Card variant="flat" style={[styles.gridItem, { backgroundColor: colors.backgroundElement }]}>
                    <Award color={colors.success} size={18} />
                    <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.assets')}</Text>
                    <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(totalAssets)}</Text>
                  </Card>
                  <Card variant="flat" style={[styles.gridItem, { backgroundColor: colors.backgroundElement }]}>
                    <Wallet color={colors.accent} size={18} />
                    <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.monthlySavings')}</Text>
                    <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(savings)}</Text>
                  </Card>
                </View>
                <View style={styles.gridColumn}>
                  <Card variant="flat" style={[styles.gridItem, { backgroundColor: colors.backgroundElement }]}>
                    <ShieldAlert color={colors.danger} size={18} />
                    <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.liabilities')}</Text>
                    <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>{fmt(totalLiabilities)}</Text>
                  </Card>
                  <Card variant="flat" style={[styles.gridItem, { backgroundColor: colors.backgroundElement }]}>
                    <TrendingUp color={colors.warning} size={18} />
                    <Text style={[styles.gridItemLabel, { color: colors.textSecondary }]}>{t('dashboard.portfolioReturn')}</Text>
                    <Text numberOfLines={1} style={[styles.gridItemValue, { color: colors.text }]}>
                      {totalReturn >= 0 ? '+' : ''}{returnPercentage.toFixed(1)}%
                    </Text>
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
                    style={[styles.accountSliderCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
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
            </View>

            {/* RIGHT COLUMN (or Bottom on mobile) */}
            <View style={[styles.column, isWideScreen && styles.rightColumnWide]}>
              
              {/* Quick Actions Panel */}
              <View style={styles.actionsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('dashboard.quickActions')}</Text>
                <View style={styles.quickActionsContainer}>
                  <TouchableOpacity 
                    style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={() => router.push('/account/connect')}
                  >
                    <Text style={styles.quickActionIcon}>🏦</Text>
                    <Text numberOfLines={1} style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addAccount')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={() => router.push('/investment/add')}
                  >
                    <Text style={styles.quickActionIcon}>📈</Text>
                    <Text numberOfLines={1} style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addSip')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={() => router.push('/goals/add')}
                  >
                    <Text style={styles.quickActionIcon}>🎯</Text>
                    <Text numberOfLines={1} style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addGoal')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.quickActionItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
                    onPress={() => setTxModalVisible(true)}
                  >
                    <Text style={styles.quickActionIcon}>💸</Text>
                    <Text numberOfLines={1} style={[styles.quickActionText, { color: colors.text }]}>{t('dashboard.addTx')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Financial Health Score circular gauge */}
              <View style={styles.healthSection}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.financialHealth')}</Text>
                <Card style={[styles.healthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <FinancialScore score={financialScore.totalScore} />
                  <TouchableOpacity
                    onPress={() => router.push('/settings/profile')}
                    style={[styles.breakdownButton, { borderColor: colors.border, backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.breakdownText, { color: colors.text }]}>{t('dashboard.viewBreakdown')}</Text>
                  </TouchableOpacity>
                </Card>
              </View>

              {/* Upcoming SIP Card */}
              {nextSip && (
                <View style={styles.sipSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.upcomingSip')}</Text>
                  <Card style={[styles.sipCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
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

              {/* Smart Insights */}
              <View style={styles.insightsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: Spacing.two }]}>{t('dashboard.smartInsights')}</Text>
                <Card style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {dynamicInsights.map((insight, idx) => (
                    <View key={idx} style={styles.insightRow}>
                      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                      <Text style={[styles.insightText, { color: colors.text }]}>
                        {insight.text}
                      </Text>
                    </View>
                  ))}
                </Card>
              </View>

            </View>

          </View>
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
                style={[
                  styles.modalInput,
                  {
                    color: colors.inputText,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                placeholder="e.g. Salary, Groceries"
                placeholderTextColor={colors.inputPlaceholder}
                value={txTitle}
                onChangeText={setTxTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (Rs.)</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    color: colors.inputText,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                placeholder="e.g. 5000"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="numeric"
                value={txAmount}
                onChangeText={setTxAmount}
              />

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Type</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.typeBtn,
                    { borderColor: colors.border, backgroundColor: colors.backgroundElement },
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
                    { borderColor: colors.border, backgroundColor: colors.backgroundElement },
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

              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Deduct/Add Account (Optional)</Text>
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
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Total Income</Text>
                    <Text style={[styles.reportCellValue, { color: colors.success }]}>+{fmt(income)}</Text>
                  </View>
                </View>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.expenseChange')}</Text>
                <View style={styles.reportGridRow}>
                  <View>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Total Expenses</Text>
                    <Text style={[styles.reportCellValue, { color: colors.danger }]}>-{fmt(expenses)}</Text>
                  </View>
                </View>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.savingsChange')}</Text>
                <View style={styles.reportGridRow}>
                  <View>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>Net Monthly Savings</Text>
                    <Text style={[styles.reportCellValue, { color: colors.accent }]}>{fmt(savings)}</Text>
                  </View>
                  <View style={styles.alignRight}>
                    <Text style={[styles.reportCellLabel, { color: colors.textSecondary }]}>{t('dashboard.savingsRate')}</Text>
                    <Text style={[styles.reportCellValue, { color: colors.text }]}>{rate.toFixed(1)}%</Text>
                  </View>
                </View>
              </Card>

              <Card variant="outline" style={styles.reportSectionCard}>
                <View style={styles.summaryItemRow}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.biggestSpending')}</Text>
                  <Text style={[styles.reportCellValue, { color: colors.danger, fontSize: 13 }]}>
                    {categoryExpenses[0] ? `${categoryExpenses[0].category} (${fmt(categoryExpenses[0].amount)})` : 'None'}
                  </Text>
                </View>
                <View style={styles.summaryItemRow}>
                  <Text style={[styles.reportSectionTitle, { color: colors.text }]}>{t('dashboard.investmentContribution')}</Text>
                  <Text style={[styles.reportCellValue, { color: colors.success, fontSize: 13 }]}>
                    {fmt(investments.reduce((sum, i) => sum + i.purchaseValue, 0))}
                  </Text>
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
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
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
    gap: Spacing.two,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1280,
  },
  responsiveContainerWide: {
    paddingHorizontal: Spacing.two,
  },
  dashboardGrid: {
    width: '100%',
    flexDirection: 'column',
    gap: Spacing.two,
  },
  dashboardGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    width: '100%',
  },
  leftColumnWide: {
    flex: 1.25,
  },
  rightColumnWide: {
    flex: 1,
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
    fontSize: 30,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  netWorthTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  netWorthTrendText: {
    ...Typography.bodySmall,
    fontSize: 12,
  },
  sparklineBox: {
    minHeight: 140,
    marginTop: Spacing.one,
    overflow: 'visible',
  },
  actionsSection: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    width: '100%',
  },
  quickActionItem: {
    flexBasis: '22%',
    flexGrow: 1,
    minWidth: 75,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: Spacing.two * 1.2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  monthlySummarySection: {
    marginTop: Spacing.three,
  },
  summaryCard: {
    borderWidth: 1,
    padding: Spacing.four,
    borderRadius: 16,
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
    fontSize: 15.5,
  },
  summaryReportBtn: {
    marginTop: Spacing.three,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  gridColumn: {
    flex: 1,
    gap: Spacing.two,
  },
  gridItem: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 0,
  },
  gridItemLabel: {
    ...Typography.caption,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  gridItemValue: {
    ...Typography.bodyLarge,
    fontSize: 14.5,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  viewAllText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalAccounts: {
    paddingVertical: Spacing.one,
    gap: Spacing.two,
  },
  accountSliderCard: {
    width: 165,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.one,
  },
  sliderProviderEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  sliderProviderName: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  sliderBalance: {
    fontSize: 14.5,
    fontWeight: '800',
    marginVertical: 4,
  },
  sliderType: {
    fontSize: 11,
    fontWeight: '500',
  },
  accountSliderEmpty: {
    width: 140,
    height: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  emptyAddIcon: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptyAddText: {
    fontSize: 11,
    fontWeight: '700',
  },
  sipSection: {
    marginTop: Spacing.three,
  },
  sipCard: {
    borderWidth: 1,
    padding: Spacing.four,
    borderRadius: 16,
  },
  sipBadgeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
  },
  sipBadge: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    textTransform: 'uppercase',
  },
  sipFundName: {
    fontSize: 15,
    fontWeight: '800',
    marginVertical: 4,
  },
  sipDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sipLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sipValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  sipViewDetails: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  sipDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  healthSection: {
    marginTop: Spacing.two,
  },
  healthCard: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
  },
  breakdownButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginTop: Spacing.three,
  },
  breakdownText: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightsSection: {
    marginTop: Spacing.three,
  },
  insightCard: {
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.three,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  insightEmoji: {
    fontSize: 16,
    marginTop: 2,
  },
  insightText: {
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 90,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 18,
    borderWidth: 1,
    padding: Spacing.four,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalScroll: {
    gap: Spacing.two,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  modalInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: 4,
  },
  typeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    marginTop: Spacing.three,
  },
  reportScroll: {
    gap: Spacing.three,
  },
  reportSectionCard: {
    padding: Spacing.three,
    borderRadius: 12,
  },
  reportSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  reportGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  reportCellLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  reportCellValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  modalCloseBtn: {
    marginTop: Spacing.two,
  },
});
