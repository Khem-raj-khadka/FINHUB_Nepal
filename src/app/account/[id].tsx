import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Search, ArrowUpRight, ArrowDownRight, Filter, AlertTriangle } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function AccountDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Zustand
  const { accounts, transactions, removeAccount, isBalanceHidden, currency } = useFinanceStore();

  // Find Account
  const account = accounts.find((a) => a.id === id);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  if (!account) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AlertTriangle color={colors.danger} size={40} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Account Not Found</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            The account you are trying to view does not exist or has been disconnected.
          </Text>
          <Button label="Back to Accounts" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  // Filter transactions for this account
  const accountTx = transactions.filter((t) => t.accountId === account.id);

  // Calculations for stats
  const totalIncome = accountTx
    .filter((t) => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = accountTx
    .filter((t) => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Unique categories for filter (excluding Salary/Income if filtering expenses, but let's list all)
  const categories = ['All', ...new Set(accountTx.map((t) => t.category))];

  // Filter transactions based on UI selections
  const filteredTx = accountTx.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      activeType === 'all' ? true : t.transactionType === activeType;
    const matchesCategory =
      selectedCategory === 'All' ? true : t.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Bank Account',
      `Are you sure you want to unlink ${account.providerName}? This will remove it from your Net Worth calculations.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink',
          style: 'destructive',
          onPress: () => {
            removeAccount(account.id);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Account Info Header */}
      <View style={[styles.accountHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
          {account.accountType} • {account.maskedAccountNumber}
        </Text>
        <Text style={[styles.accountBalance, { color: colors.text }]}>{fmt(account.balance)}</Text>
        
        {/* Simple details grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <View style={styles.flexRow}>
              <ArrowUpRight color={colors.success} size={14} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Income</Text>
            </View>
            <Text style={[styles.statVal, { color: colors.text }]}>{fmt(totalIncome)}</Text>
          </View>
          <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <View style={styles.flexRow}>
              <ArrowDownRight color={colors.danger} size={14} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Expenses</Text>
            </View>
            <Text style={[styles.statVal, { color: colors.text }]}>{fmt(totalExpense)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Filters and Search Bar */}
        <Text style={[styles.historyTitle, { color: colors.text }]}>Transaction History</Text>

        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Search color={colors.textSecondary} size={16} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Transaction Type Filters */}
        <View style={styles.typeFilters}>
          {(['all', 'income', 'expense'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setActiveType(type)}
              style={[
                styles.typeTab,
                { borderColor: colors.border },
                activeType === type && {
                  backgroundColor: colors.text,
                  borderColor: colors.text,
                },
              ]}>
              <Text
                style={[
                  styles.typeTabText,
                  { color: activeType === type ? colors.background : colors.textSecondary },
                ]}>
                {type === 'all' ? 'All' : type === 'income' ? 'Income' : 'Expenses'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filters Horizontal List */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                { borderColor: colors.border, backgroundColor: colors.card },
                selectedCategory === cat && { borderColor: colors.accent, backgroundColor: `${colors.accent}15` },
              ]}>
              <Text
                style={[
                  styles.categoryChipText,
                  { color: selectedCategory === cat ? colors.accent : colors.textSecondary },
                ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.txList}>
          {filteredTx.map((tx) => {
            const isInc = tx.transactionType === 'income';
            const dateStr = new Date(tx.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });

            return (
              <View key={tx.id} style={[styles.txItem, { borderBottomColor: colors.border }]}>
                <View style={styles.txLeft}>
                  <View
                    style={[
                      styles.txIconContainer,
                      { backgroundColor: isInc ? `${colors.success}15` : `${colors.danger}15` },
                    ]}>
                    {isInc ? (
                      <ArrowUpRight color={colors.success} size={16} />
                    ) : (
                      <ArrowDownRight color={colors.danger} size={16} />
                    )}
                  </View>
                  <View style={styles.txInfo}>
                    <Text numberOfLines={1} style={[styles.txTitleText, { color: colors.text }]}>
                      {tx.title}
                    </Text>
                    <Text style={[styles.txMetaText, { color: colors.textSecondary }]}>
                      {tx.category} • {dateStr}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.txAmountText,
                    { color: isInc ? colors.success : colors.text },
                  ]}>
                  {isInc ? '+' : '-'} {currency} {tx.amount.toLocaleString('en-IN')}
                </Text>
              </View>
            );
          })}

          {filteredTx.length === 0 && (
            <View style={styles.emptySearchContainer}>
              <Search color={colors.textSecondary} size={28} />
              <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                No matching transactions.
              </Text>
            </View>
          )}
        </View>

        {/* Disconnect Action */}
        <Button
          label="Disconnect Account"
          variant="danger"
          onPress={handleDisconnect}
          style={styles.disconnectBtn}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accountHeader: {
    padding: Spacing.four,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  accountLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountBalance: {
    fontSize: 30,
    fontWeight: '800',
    marginVertical: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.three,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  dividerVertical: {
    width: 1,
    height: 30,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    marginBottom: Spacing.three,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: Spacing.two,
    padding: 0,
  },
  typeFilters: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  typeTab: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: Spacing.one * 1.5,
    alignItems: 'center',
  },
  typeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  categoriesRow: {
    flexDirection: 'row',
    marginBottom: Spacing.four,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    marginRight: Spacing.two,
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  txList: {
    marginBottom: Spacing.four,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.three,
  },
  txIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  txInfo: {
    flex: 1,
  },
  txTitleText: {
    fontSize: 14,
    fontWeight: '700',
  },
  txMetaText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  txAmountText: {
    fontSize: 14,
    fontWeight: '800',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    opacity: 0.6,
  },
  emptySearchText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  disconnectBtn: {
    marginTop: Spacing.five,
  },
  bottomSpacer: {
    height: Spacing.five,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four * 1.5,
    gap: Spacing.three,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  errorDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
});
