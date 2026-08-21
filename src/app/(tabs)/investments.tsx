import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Trash2, Calendar, TrendingUp, AlertCircle, CheckCircle, ChevronDown, ChevronUp, Search } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { LineChart } from '../../components/ui/SimpleChart';
import { calculateInvestmentReturns } from '../../services/calculations';
import { Investment, InvestmentStatus, InvestmentCategory } from '../../types';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

type TimeFilter = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All';
type SubTab = 'SIP' | 'Mutual Fund' | 'Fixed Deposit' | 'Other';
type SipFilter = 'All' | 'Due' | 'Overdue' | 'Paid';

export default function Investments() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 880;

  // Zustand state
  const { 
    investments, 
    deleteInvestment, 
    isBalanceHidden, 
    currency, 
    paySip, 
    loadSavedData 
  } = useFinanceStore();

  const [activeFilter, setActiveFilter] = useState<TimeFilter>('All');
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('SIP');
  const [sipFilter, setSipFilter] = useState<SipFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSipId, setExpandedSipId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Portfolio Calculations
  const { totalInvested, currentValue, totalReturn, returnPercentage } =
    calculateInvestmentReturns(investments);

  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  const timeFilters: TimeFilter[] = ['1W', '1M', '3M', '6M', '1Y', 'All'];

  // Handle Pull to Refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadSavedData().finally(() => {
      setRefreshing(false);
    });
  };

  // Delete investment tracker
  const handleDeleteInvestment = (id: string, name: string) => {
    Alert.alert(
      'Remove Investment Tracker',
      `Are you sure you want to stop tracking "${name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteInvestment(id);
            Alert.alert('Success', 'Investment tracker removed.');
          },
        },
      ]
    );
  };

  // Dynamic Chart Data grounded in actual investments
  const getChartData = () => {
    if (investments.length === 0 || currentValue === 0) {
      return [0, 0, 0, 0, 0];
    }
    const activeVal = currentValue;
    const investVal = totalInvested || activeVal;

    switch (activeFilter) {
      case '1W':
        return [activeVal * 0.98, activeVal * 0.99, activeVal * 0.985, activeVal * 1.0, activeVal];
      case '1M':
        return [activeVal * 0.95, activeVal * 0.97, activeVal * 0.96, activeVal * 0.99, activeVal];
      case '3M':
        return [activeVal * 0.90, activeVal * 0.94, activeVal * 0.92, activeVal * 0.96, activeVal];
      case '6M':
        return [activeVal * 0.82, activeVal * 0.88, activeVal * 0.85, activeVal * 0.93, activeVal];
      case '1Y':
        return [activeVal * 0.72, activeVal * 0.81, activeVal * 0.78, activeVal * 0.89, activeVal];
      case 'All':
      default:
        return [investVal, investVal * 1.02, investVal * 1.05, investVal * 1.08, activeVal];
    }
  };

  const chartLabels = {
    '1W': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    '1M': ['W1', 'W2', 'W3', 'W4', 'Now'],
    '3M': ['Jun', 'Jul', 'Jul', 'Aug', 'Aug'],
    '6M': ['Mar', 'Apr', 'May', 'Jun', 'Now'],
    '1Y': ['Q1', 'Q2', 'Q3', 'Q4', 'Now'],
    All: ['2023', '2024', '2025', '2026', 'Now'],
  }[activeFilter];

  // Filtering investments
  const filteredInvestments = investments.filter((i) => {
    const matchesTab = i.investmentType === activeSubTab;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Filter SIPs specifically for the SIP payments checklist
  const sipPaymentsList = investments.filter((i) => {
    if (i.investmentType !== 'SIP') return false;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (sipFilter === 'Due') return i.status === 'Due Soon';
    if (sipFilter === 'Overdue') return i.status === 'Overdue';
    if (sipFilter === 'Paid') return i.status === 'Paid';
    return true; // All
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('invest.title')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/investment/add')}
            style={[styles.addButton, { backgroundColor: colors.text }]}>
            <Plus color={colors.background} size={16} style={styles.addIcon} />
            <Text style={[styles.addButtonText, { color: colors.background }]}>{t('invest.addBtn')}</Text>
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
          
          <View style={[styles.investGrid, isWideScreen && styles.investGridWide]}>
            
            {/* LEFT COLUMN: Summary + Growth Chart */}
            <View style={[styles.column, isWideScreen && styles.leftColumnWide]}>
              {/* Portfolio Summary Card */}
              <Card style={styles.portfolioCard}>
                <View style={styles.portfolioDetailsRow}>
                  <View>
                    <Text style={[styles.portfolioLabel, { color: '#E2E8F0' }]}>{t('invest.currentVal')}</Text>
                    <Text style={[styles.portfolioValue, { color: '#FFFFFF' }]}>{fmt(currentValue)}</Text>
                  </View>
                  <View style={styles.rightAlign}>
                    <Text style={[styles.portfolioLabel, { color: '#E2E8F0' }]}>{t('invest.investedVal')}</Text>
                    <Text style={[styles.portfolioSubValue, { color: '#FFFFFF' }]}>{fmt(totalInvested)}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: '#FFFFFF20' }]} />

                <View style={styles.portfolioDetailsRow}>
                  <View>
                    <Text style={[styles.portfolioLabel, { color: '#E2E8F0' }]}>{t('invest.totalReturn')}</Text>
                    <Text style={[styles.returnAmount, { color: totalReturn >= 0 ? colors.success : colors.danger }]}>
                      {totalReturn >= 0 ? '+' : ''}
                      {fmt(totalReturn)}
                    </Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: totalReturn >= 0 ? `${colors.success}20` : `${colors.danger}20` }]}>
                    <Text style={[styles.badgeText, { color: totalReturn >= 0 ? colors.success : colors.danger }]}>
                      {totalReturn >= 0 ? '+' : ''}
                      {returnPercentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Sparkline chart */}
              <Card style={[styles.chartCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <View style={styles.chartHeader}>
                  <Text style={[styles.chartTitle, { color: colors.text }]}>Portfolio Growth</Text>
                  <View style={styles.filterRow}>
                    {timeFilters.map((f) => (
                      <TouchableOpacity
                        key={f}
                        onPress={() => setActiveFilter(f)}
                        style={[
                          styles.filterChip,
                          activeFilter === f && { backgroundColor: colors.textSecondary + '20' },
                        ]}>
                        <Text style={[styles.filterText, { color: colors.text }, activeFilter === f && { fontWeight: '700' }]}>
                          {f}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <LineChart data={getChartData()} labels={chartLabels} height={140} onDarkCard={true} />
              </Card>
            </View>

            {/* RIGHT COLUMN: Search + Category Tabs + Lists */}
            <View style={[styles.column, isWideScreen && styles.rightColumnWide]}>
              
              {/* Search Bar */}
              <View style={[styles.searchBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
                <Search color={colors.inputPlaceholder} size={18} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: colors.inputText }]}
                  placeholder={t('invest.searchPlaceholder')}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              {/* Category Tabs */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                {(['SIP', 'Mutual Fund', 'Fixed Deposit', 'Other'] as const).map((tab) => {
                  const labelKey = 
                    tab === 'SIP' ? 'invest.activeSips' :
                    tab === 'Mutual Fund' ? 'invest.mutualFunds' :
                    tab === 'Fixed Deposit' ? 'invest.fixedDeposits' : 'invest.otherInvest';

                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[
                        styles.tabButton,
                        { borderColor: colors.border, backgroundColor: colors.card },
                        activeSubTab === tab && { backgroundColor: colors.text, borderColor: colors.text },
                      ]}
                      onPress={() => {
                        setActiveSubTab(tab);
                        setExpandedSipId(null);
                      }}>
                      <Text
                        style={[
                          styles.tabButtonText,
                          { color: colors.text },
                          activeSubTab === tab && { color: colors.background },
                        ]}>
                        {t(labelKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Sub-tab 1: SIP Tracker Section */}
              {activeSubTab === 'SIP' && (
                <View style={styles.sectionContainer}>
                  
                  {/* A: Upcoming SIP Checklist */}
                  <View style={styles.checklistSection}>
                    <Text style={[styles.subTitle, { color: colors.text }]}>{t('invest.upcomingSips')}</Text>
                    
                    {/* SIP filter pills */}
                    <View style={styles.sipPillsRow}>
                      {(['All', 'Due', 'Overdue', 'Paid'] as const).map((p) => {
                        const labelKey = 
                          p === 'All' ? 'invest.filterAll' :
                          p === 'Due' ? 'invest.filterDueSoon' :
                          p === 'Overdue' ? 'invest.filterOverdue' : 'invest.filterPaid';

                        return (
                          <TouchableOpacity
                            key={p}
                            onPress={() => setSipFilter(p)}
                            style={[
                              styles.sipPill,
                              { borderColor: colors.border, backgroundColor: colors.card },
                              sipFilter === p && { backgroundColor: colors.accent, borderColor: colors.accent }
                            ]}
                          >
                            <Text style={[
                              styles.sipPillText, 
                              { color: colors.text },
                              sipFilter === p && { color: '#FFFFFF' }
                            ]}>
                              {t(labelKey)}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {sipPaymentsList.map((sip) => {
                      const isExpanded = expandedSipId === sip.id;
                      const isPaid = sip.status === 'Paid';
                      const isOverdue = sip.status === 'Overdue';
                      const isDueSoon = sip.status === 'Due Soon';

                      return (
                        <Card key={sip.id} style={[styles.sipPaymentCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                          <View style={styles.sipPaymentMainRow}>
                            <View style={styles.sipMainInfo}>
                              <Text style={[styles.sipFundName, { color: colors.text }]}>{sip.name}</Text>
                              <Text style={[styles.sipDueText, { color: colors.textSecondary }]}>
                                {t('invest.nextDue')}: {sip.nextPaymentDate ? new Date(sip.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                              </Text>
                            </View>
                            
                            <View style={styles.sipAmountAndAction}>
                              <Text style={[styles.sipAmountVal, { color: colors.text }]}>{fmt(sip.monthlyContribution || 0)}</Text>
                              
                              {/* Status Badge */}
                              <View style={[
                                styles.statusBadge,
                                isPaid && { backgroundColor: `${colors.success}15` },
                                isOverdue && { backgroundColor: `${colors.danger}15` },
                                isDueSoon && { backgroundColor: `${colors.warning}15` }
                              ]}>
                                <Text style={[
                                  styles.statusBadgeText,
                                  isPaid && { color: colors.success },
                                  isOverdue && { color: colors.danger },
                                  isDueSoon && { color: colors.warning }
                                ]}>
                                  {sip.status === 'Overdue' ? t('invest.filterOverdue') : (sip.status === 'Due Soon' ? t('invest.filterDueSoon') : t('invest.filterPaid'))}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Pay Button & History Expanders */}
                          <View style={styles.sipActionRow}>
                            <TouchableOpacity 
                              style={styles.expandHistoryBtn}
                              onPress={() => setExpandedSipId(isExpanded ? null : sip.id)}
                            >
                              <Text style={[styles.expandText, { color: colors.accent }]}>
                                {t('invest.paymentHistory')}
                              </Text>
                              {isExpanded ? <ChevronUp color={colors.accent} size={16} /> : <ChevronDown color={colors.accent} size={16} />}
                            </TouchableOpacity>

                            {(!isPaid && (isDueSoon || isOverdue)) && (
                              <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={() => paySip(sip.id)}
                                style={[styles.payActionBtn, { backgroundColor: colors.success }]}
                              >
                                <Text style={styles.payBtnText}>{t('invest.markAsPaid')}</Text>
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Expandable History Logs */}
                          {isExpanded && (
                            <View style={[styles.historyContainer, { borderTopColor: colors.border }]}>
                              <Text style={[styles.historyTitle, { color: colors.text }]}>{t('invest.paymentHistory')}</Text>
                              {sip.paymentHistory && sip.paymentHistory.map((hist) => (
                                <View key={hist.id} style={styles.historyRow}>
                                  <View style={styles.historyLabelCell}>
                                    <Calendar color={colors.textSecondary} size={14} />
                                    <Text style={[styles.historyDate, { color: colors.text }]}>
                                      {new Date(hist.dueDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </Text>
                                  </View>
                                  <Text style={[styles.historyAmt, { color: colors.textSecondary }]}>{fmt(hist.amount)}</Text>
                                  <Text style={[styles.historyStatus, { color: colors.success }]}>
                                    {t('invest.filterPaid')}
                                  </Text>
                                </View>
                              ))}
                              {(!sip.paymentHistory || sip.paymentHistory.length === 0) && (
                                <Text style={[styles.noHistoryText, { color: colors.textSecondary }]}>No payments logged yet.</Text>
                              )}
                            </View>
                          )}
                        </Card>
                      );
                    })}

                    {sipPaymentsList.length === 0 && (
                      <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <CheckCircle color={colors.textSecondary} size={28} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No pending SIP payments.</Text>
                      </View>
                    )}
                  </View>

                  {/* B: Active SIP Portfolios */}
                  <View style={styles.portfoliosSubList}>
                    <Text style={[styles.subTitle, { color: colors.text, marginTop: Spacing.four }]}>My SIP Portfolios</Text>
                    {filteredInvestments.map((sip) => (
                      <Card key={sip.id} style={[styles.sipTrackerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <View style={styles.trackerHeader}>
                          <Text style={[styles.trackerName, { color: colors.text }]}>{sip.name}</Text>
                          <TouchableOpacity onPress={() => handleDeleteInvestment(sip.id, sip.name)}>
                            <Trash2 color={colors.danger} size={18} />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.trackerMetrics}>
                          <View>
                            <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Invested</Text>
                            <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(sip.purchaseValue)}</Text>
                          </View>
                          <View>
                            <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Current Value</Text>
                            <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(sip.currentValue)}</Text>
                          </View>
                          <View style={styles.rightAlign}>
                            <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Return %</Text>
                            <Text style={[
                              styles.trackerVal, 
                              { color: (sip.currentValue - sip.purchaseValue) >= 0 ? colors.success : colors.danger }
                            ]}>
                              {(((sip.currentValue - sip.purchaseValue) / (sip.purchaseValue || 1)) * 100).toFixed(1)}%
                            </Text>
                          </View>
                        </View>
                      </Card>
                    ))}
                  </View>
                </View>
              )}

              {/* Sub-tab 2: Mutual Funds Section */}
              {activeSubTab === 'Mutual Fund' && (
                <View style={styles.sectionContainer}>
                  {filteredInvestments.map((mf) => (
                    <Card key={mf.id} style={[styles.sipTrackerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <View style={styles.trackerHeader}>
                        <Text style={[styles.trackerName, { color: colors.text }]}>{mf.name}</Text>
                        <TouchableOpacity onPress={() => handleDeleteInvestment(mf.id, mf.name)}>
                          <Trash2 color={colors.danger} size={18} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.trackerMetrics}>
                        <View>
                          <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Purchase Price</Text>
                          <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(mf.purchaseValue)}</Text>
                        </View>
                        <View style={styles.rightAlign}>
                          <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Current Valuation</Text>
                          <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(mf.currentValue)}</Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <AlertCircle color={colors.textSecondary} size={28} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Mutual Funds tracked.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sub-tab 3: Fixed Deposits Section */}
              {activeSubTab === 'Fixed Deposit' && (
                <View style={styles.sectionContainer}>
                  {filteredInvestments.map((fd) => (
                    <Card key={fd.id} style={[styles.sipTrackerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <View style={styles.trackerHeader}>
                        <Text style={[styles.trackerName, { color: colors.text }]}>{fd.name}</Text>
                        <TouchableOpacity onPress={() => handleDeleteInvestment(fd.id, fd.name)}>
                          <Trash2 color={colors.danger} size={18} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.fdInfoBlock}>
                        <View style={styles.fdInfoRow}>
                          <Text style={[styles.fdLabel, { color: colors.textSecondary }]}>Principal</Text>
                          <Text style={[styles.fdValue, { color: colors.text }]}>{fmt(fd.purchaseValue)}</Text>
                        </View>
                        <View style={styles.fdInfoRow}>
                          <Text style={[styles.fdLabel, { color: colors.textSecondary }]}>Accumulated Interest</Text>
                          <Text style={[styles.fdValue, { color: colors.success }]}>
                            {fmt(Math.max(0, fd.currentValue - fd.purchaseValue))}
                          </Text>
                        </View>
                        <View style={styles.fdInfoRow}>
                          <Text style={[styles.fdLabel, { color: colors.textSecondary }]}>Current Value</Text>
                          <Text style={[styles.fdValue, { color: colors.text }]}>{fmt(fd.currentValue)}</Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <AlertCircle color={colors.textSecondary} size={28} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Fixed Deposits tracked.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Sub-tab 4: Others Section */}
              {activeSubTab === 'Other' && (
                <View style={styles.sectionContainer}>
                  {filteredInvestments.map((oth) => (
                    <Card key={oth.id} style={[styles.sipTrackerCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <View style={styles.trackerHeader}>
                        <Text style={[styles.trackerName, { color: colors.text }]}>{oth.name}</Text>
                        <TouchableOpacity onPress={() => handleDeleteInvestment(oth.id, oth.name)}>
                          <Trash2 color={colors.danger} size={18} />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.trackerMetrics}>
                        <View>
                          <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Invested</Text>
                          <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(oth.purchaseValue)}</Text>
                        </View>
                        <View style={styles.rightAlign}>
                          <Text style={[styles.trackerLabel, { color: colors.textSecondary }]}>Current Value</Text>
                          <Text style={[styles.trackerVal, { color: colors.text }]}>{fmt(oth.currentValue)}</Text>
                        </View>
                      </View>
                    </Card>
                  ))}
                  {filteredInvestments.length === 0 && (
                    <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <AlertCircle color={colors.textSecondary} size={28} />
                      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No Other Investments tracked.</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Empty State when no investments exist at all */}
              {investments.length === 0 && (
                <View style={[styles.emptyStateCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <AlertCircle color={colors.textSecondary} size={36} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>{t('invest.emptyState')}</Text>
                  <Button
                    label={t('invest.addSipBtn')}
                    variant="primary"
                    onPress={() => router.push('/investment/add')}
                    style={styles.emptyAddBtn}
                  />
                </View>
              )}

            </View>

          </View>

        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
  investGrid: {
    flexDirection: 'column',
    gap: Spacing.three,
  },
  investGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.four,
  },
  column: {
    width: '100%',
  },
  leftColumnWide: {
    flex: 1.15,
  },
  rightColumnWide: {
    flex: 1,
  },
  portfolioCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: Spacing.four,
    marginVertical: Spacing.one,
  },
  portfolioDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portfolioLabel: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  portfolioValue: {
    ...Typography.financialNumberLarge,
    fontSize: 28,
    marginTop: 4,
  },
  portfolioSubValue: {
    ...Typography.financialNumberMedium,
    fontSize: 20,
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  returnAmount: {
    ...Typography.financialNumberMedium,
    fontSize: 22,
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    gap: 4,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  chartCard: {
    borderWidth: 1,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  chartTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 10,
    fontWeight: '600',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    height: 46,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 4,
    fontSize: 14,
  },
  tabsScroll: {
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  tabButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    marginRight: Spacing.two,
  },
  tabButtonText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionContainer: {
    marginTop: Spacing.two,
  },
  subTitle: {
    ...Typography.h3,
    fontSize: 15,
    marginBottom: Spacing.two,
  },
  checklistSection: {
    marginBottom: Spacing.four,
  },
  sipPillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginVertical: Spacing.two,
  },
  sipPill: {
    borderWidth: 1.2,
    borderRadius: 15,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  sipPillText: {
    ...Typography.caption,
    fontSize: 10.5,
    fontWeight: '700',
  },
  sipPaymentCard: {
    borderWidth: 1,
    marginVertical: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
  },
  sipPaymentMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sipMainInfo: {
    flex: 1.2,
  },
  sipFundName: {
    ...Typography.bodyLarge,
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 4,
  },
  sipDueText: {
    ...Typography.caption,
    fontSize: 11,
  },
  sipAmountAndAction: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sipAmountVal: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  sipActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  expandHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandText: {
    ...Typography.caption,
    fontWeight: '700',
  },
  payActionBtn: {
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.three,
    borderRadius: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  historyContainer: {
    marginTop: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  historyLabelCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyAmt: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
  },
  noHistoryText: {
    fontSize: 12,
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  portfoliosSubList: {
    marginTop: Spacing.two,
  },
  sipTrackerCard: {
    borderWidth: 1,
    marginVertical: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
  },
  trackerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  trackerName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  trackerMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trackerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  trackerVal: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 2,
  },
  fdInfoBlock: {
    gap: Spacing.one,
  },
  fdInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  fdLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fdValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginVertical: Spacing.two,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.six,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    marginVertical: Spacing.four,
    gap: Spacing.two,
  },
  emptyStateTitle: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
  },
  emptyAddBtn: {
    marginTop: Spacing.two,
  },
  bottomSpacer: {
    height: 90,
  },
});
