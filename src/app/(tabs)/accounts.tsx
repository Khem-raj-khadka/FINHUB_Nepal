import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, RefreshCw, ChevronRight, AlertCircle, Search } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function Accounts() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 768;

  // Zustand state
  const { accounts, isBalanceHidden, currency, loadSavedData } = useFinanceStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Banks' | 'Wallets'>('All');

  const onRefresh = () => {
    setRefreshing(true);
    loadSavedData().finally(() => {
      setRefreshing(false);
    });
  };

  // Filter accounts by search query and tab type
  const filteredAccounts = accounts.filter((a) => {
    const matchesSearch = a.providerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = 
      activeTab === 'All' || 
      (activeTab === 'Banks' && a.providerType === 'bank') ||
      (activeTab === 'Wallets' && a.providerType === 'wallet');
    return matchesSearch && matchesTab;
  });

  const bankCount = accounts.filter((a) => a.providerType === 'bank').length;
  const walletCount = accounts.filter((a) => a.providerType === 'wallet').length;

  // Total balance sum
  const totalCash = accounts
    .filter((a) => a.isConnected)
    .reduce((sum, a) => sum + a.balance, 0);

  // NPR formatter
  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerInner}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('accounts.title')}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/account/connect')}
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
          {/* Cash Summary Banner */}
          <Card style={[styles.summaryCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('accounts.totalCash')}</Text>
            <Text style={[styles.summaryAmount, { color: colors.text }]}>{fmt(totalCash)}</Text>
            <View style={styles.syncRow}>
              <RefreshCw color={colors.success} size={11} />
              <Text style={[styles.syncText, { color: colors.textSecondary }]}>
                {t('accounts.syncStatus')}
              </Text>
            </View>
          </Card>

          {/* Search Bar */}
          <View style={[styles.searchBox, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground }]}>
            <Search color={colors.inputPlaceholder} size={18} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.inputText }]}
              placeholder={t('accounts.searchPlaceholder')}
              placeholderTextColor={colors.inputPlaceholder}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* Filter Tabs */}
          <View style={styles.tabContainer}>
            {(['All', 'Banks', 'Wallets'] as const).map((tab) => {
              const count = tab === 'All' ? accounts.length : tab === 'Banks' ? bankCount : walletCount;
              const labelKey = tab === 'All' ? 'accounts.filterAll' : tab === 'Banks' ? 'accounts.filterBanks' : 'accounts.filterWallets';
              
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    activeTab === tab && { backgroundColor: colors.text, borderColor: colors.text }
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[
                    styles.tabButtonText,
                    { color: colors.text },
                    activeTab === tab && { color: colors.background }
                  ]}>
                    {t(labelKey)} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Accounts Grid (Responsive) */}
          <View style={[styles.accountsGrid, isWideScreen && styles.accountsGridWide]}>
            {filteredAccounts.map((acc) => (
              <Card
                key={acc.id}
                onPress={() => router.push(`/account/${acc.id}`)}
                style={[
                  styles.accountCard,
                  isWideScreen && styles.accountCardWide,
                  { borderColor: colors.border, backgroundColor: colors.card }
                ]}>
                <View style={styles.cardLayout}>
                  <View style={[styles.emojiContainer, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={styles.providerEmoji}>
                      {acc.providerType === 'bank' ? '🏦' : '📱'}
                    </Text>
                  </View>
                  <View style={styles.infoContainer}>
                    <Text numberOfLines={1} style={[styles.providerName, { color: colors.text }]}>{acc.providerName}</Text>
                    <Text style={[styles.accountType, { color: colors.textSecondary }]}>
                      {acc.accountType} • {acc.maskedAccountNumber}
                    </Text>
                    <Text style={[styles.syncTime, { color: colors.textSecondary }]}>
                      Synced 2 mins ago
                    </Text>
                  </View>
                  <View style={styles.amountContainer}>
                    <Text numberOfLines={1} style={[styles.balanceAmount, { color: colors.text }]}>{fmt(acc.balance)}</Text>
                    <ChevronRight color={colors.textSecondary} size={18} style={styles.chevron} />
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {/* Empty State */}
          {filteredAccounts.length === 0 && (
            <View style={[styles.emptyCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <AlertCircle color={colors.textSecondary} size={28} />
              <Text style={[styles.emptyTitleText, { color: colors.text }]}>
                {accounts.length === 0 ? t('accounts.emptyState') : 'No results matching search filters.'}
              </Text>
              {accounts.length === 0 && (
                <Button
                  label={t('accounts.connectBtn')}
                  variant="primary"
                  size="small"
                  onPress={() => router.push('/account/connect')}
                  style={styles.emptyBtn}
                />
              )}
            </View>
          )}

          {/* Add Account Trigger */}
          {accounts.length > 0 && (
            <Button
              label={t('accounts.linkNew')}
              variant="outline"
              onPress={() => router.push('/account/connect')}
              style={styles.linkButton}
            />
          )}

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
  summaryCard: {
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: Spacing.three,
  },
  summaryLabel: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryAmount: {
    ...Typography.financialNumberLarge,
    marginVertical: Spacing.one,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one * 1.5,
  },
  syncText: {
    ...Typography.caption,
    fontSize: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    height: 46,
    marginVertical: Spacing.two,
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
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  tabButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one * 1.2,
  },
  tabButtonText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  accountsGrid: {
    flexDirection: 'column',
    gap: Spacing.two,
  },
  accountsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  accountCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    width: '100%',
  },
  accountCardWide: {
    width: '48.5%',
    flexGrow: 1,
  },
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  providerEmoji: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: Spacing.two,
  },
  providerName: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '700',
  },
  accountType: {
    ...Typography.bodySmall,
    fontSize: 12,
    marginTop: 2,
  },
  syncTime: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 4,
    opacity: 0.8,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    ...Typography.bodyLarge,
    fontSize: 15.5,
    fontWeight: '800',
  },
  chevron: {
    marginLeft: Spacing.two,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginVertical: Spacing.two,
  },
  emptyTitleText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  emptyBtn: {
    marginTop: Spacing.four,
    width: 180,
  },
  linkButton: {
    marginTop: Spacing.four,
  },
  bottomSpacer: {
    height: 90,
  },
});
