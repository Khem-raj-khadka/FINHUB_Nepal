import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Trash2, Search, ArrowUpRight, ArrowDownRight, AlertTriangle, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export default function AccountDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  // Zustand
  const { accounts, transactions, removeAccount, deleteTransaction, isBalanceHidden, currency } = useFinanceStore();

  // Find Account
  const account = accounts.find((a) => a.id === id);

  // Filters & Search & Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals State
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const [deleteTxModalVisible, setDeleteTxModalVisible] = useState(false);
  const [txToDelete, setTxToDelete] = useState<{ id: string; title: string; amount: number } | null>(null);

  if (!account) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <AlertTriangle color={colors.danger} size={40} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Account Not Found</Text>
          <Text style={[styles.errorDesc, { color: colors.textSecondary }]}>
            The account you are trying to view does not exist or has been disconnected.
          </Text>
          <Button
            label="Back to Accounts"
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/accounts');
              }
            }}
          />
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

  // Categories list
  const categories = ['All', ...Array.from(new Set(accountTx.map((t) => t.category)))];

  // Filter and Sort Pipeline
  const filteredAndSortedTx = useMemo(() => {
    let result = accountTx.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeType === 'all' ? true : t.transactionType === activeType;
      const matchesCategory = selectedCategory === 'All' ? true : t.category === selectedCategory;

      return matchesSearch && matchesType && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortOption === 'date_desc') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      if (sortOption === 'date_asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortOption === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortOption === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [accountTx, searchQuery, activeType, selectedCategory, sortOption]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedTx.length / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const paginatedTx = filteredAndSortedTx.slice((validPage - 1) * pageSize, validPage * pageSize);

  const fmt = (val: number) => {
    if (isBalanceHidden) return '••••••';
    return `${currency} ${val.toLocaleString('en-IN')}`;
  };

  const confirmDisconnect = () => {
    setDisconnectModalVisible(false);
    removeAccount(account.id);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/accounts');
    }
  };

  const handleDeleteTxPress = (tx: { id: string; title: string; amount: number }) => {
    setTxToDelete(tx);
    setDeleteTxModalVisible(true);
  };

  const confirmDeleteTx = () => {
    if (txToDelete) {
      deleteTransaction(txToDelete.id);
      setDeleteTxModalVisible(false);
      setTxToDelete(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* 1. Disconnect Account Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={disconnectModalVisible}
        onRequestClose={() => setDisconnectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Disconnect Account?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to unlink {account.providerName}? This will remove its balance and transactions from your Net Worth calculations.
            </Text>
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setDisconnectModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                label="Unlink Account"
                onPress={confirmDisconnect}
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* 2. Delete Transaction Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteTxModalVisible}
        onRequestClose={() => setDeleteTxModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Delete Transaction?</Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Are you sure you want to delete "{txToDelete?.title}" ({fmt(txToDelete?.amount || 0)})? The account balance will be automatically adjusted.
            </Text>
            <View style={styles.modalActions}>
              <Button
                label="Cancel"
                variant="secondary"
                onPress={() => setDeleteTxModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                label="Delete"
                onPress={confirmDeleteTx}
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
              />
            </View>
          </Card>
        </View>
      </Modal>
      
      {/* Account Info Header */}
      <View style={[styles.accountHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.accountLabel, { color: colors.textSecondary }]}>
          {account.accountType} • {account.maskedAccountNumber}
        </Text>
        <Text style={[styles.accountBalance, { color: colors.text }]}>{fmt(account.balance)}</Text>
        
        {/* Account Details Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <View style={styles.flexRow}>
              <ArrowUpRight color={colors.success} size={14} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Account Inflow</Text>
            </View>
            <Text style={[styles.statVal, { color: colors.text }]}>{fmt(totalIncome)}</Text>
          </View>
          <View style={[styles.dividerVertical, { backgroundColor: colors.border }]} />
          <View style={styles.statCell}>
            <View style={styles.flexRow}>
              <ArrowDownRight color={colors.danger} size={14} />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Account Outflow</Text>
            </View>
            <Text style={[styles.statVal, { color: colors.text }]}>{fmt(totalExpense)}</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Title */}
        <View style={styles.titleRow}>
          <Text style={[styles.historyTitle, { color: colors.text }]}>
            Transactions ({filteredAndSortedTx.length})
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Search color={colors.textSecondary} size={16} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search transactions by title or category..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setCurrentPage(1);
            }}
          />
        </View>

        {/* Transaction Type Filters */}
        <View style={styles.typeFilters}>
          {(['all', 'income', 'expense'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => {
                setActiveType(type);
                setCurrentPage(1);
              }}
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
              onPress={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
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

        {/* Sort Controls Bar */}
        <View style={styles.sortBar}>
          <View style={styles.sortLabelGroup}>
            <ArrowUpDown color={colors.textSecondary} size={14} />
            <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>Sort:</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptionsScroll}>
            {[
              { key: 'date_desc', label: 'Newest' },
              { key: 'date_asc', label: 'Oldest' },
              { key: 'amount_desc', label: 'Highest Amount' },
              { key: 'amount_asc', label: 'Lowest Amount' },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.key}
                onPress={() => setSortOption(opt.key as SortOption)}
                style={[
                  styles.sortChip,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  sortOption === opt.key && { backgroundColor: colors.text, borderColor: colors.text },
                ]}>
                <Text
                  style={[
                    styles.sortChipText,
                    { color: colors.textSecondary },
                    sortOption === opt.key && { color: colors.background, fontWeight: '700' },
                  ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View style={styles.txList}>
          {paginatedTx.map((tx) => {
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

                <View style={styles.txRightGroup}>
                  <Text
                    style={[
                      styles.txAmountText,
                      { color: isInc ? colors.success : colors.text },
                    ]}>
                    {isInc ? '+' : '-'} {currency} {tx.amount.toLocaleString('en-IN')}
                  </Text>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Delete Transaction"
                    onPress={() => handleDeleteTxPress(tx)}
                    style={styles.deleteTxBtn}>
                    <Trash2 color={colors.danger} size={14} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {filteredAndSortedTx.length === 0 && (
            <View style={styles.emptySearchContainer}>
              <Search color={colors.textSecondary} size={28} />
              <Text style={[styles.emptySearchText, { color: colors.textSecondary }]}>
                No matching transactions.
              </Text>
            </View>
          )}
        </View>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity
              disabled={validPage <= 1}
              onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={[
                styles.pageBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
                validPage <= 1 && { opacity: 0.4 },
              ]}>
              <ChevronLeft color={colors.text} size={16} />
              <Text style={[styles.pageBtnText, { color: colors.text }]}>Prev</Text>
            </TouchableOpacity>

            <Text style={[styles.pageInfoText, { color: colors.textSecondary }]}>
              Page {validPage} of {totalPages}
            </Text>

            <TouchableOpacity
              disabled={validPage >= totalPages}
              onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={[
                styles.pageBtn,
                { borderColor: colors.border, backgroundColor: colors.card },
                validPage >= totalPages && { opacity: 0.4 },
              ]}>
              <Text style={[styles.pageBtnText, { color: colors.text }]}>Next</Text>
              <ChevronRight color={colors.text} size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Disconnect Action */}
        <Button
          label="Disconnect Account"
          variant="danger"
          onPress={() => setDisconnectModalVisible(true)}
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
    fontSize: 28,
    fontWeight: '800',
    marginVertical: Spacing.two,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: Spacing.two,
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
    fontSize: 11.5,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  dividerVertical: {
    width: 1,
    height: 28,
  },
  scrollContent: {
    padding: Spacing.four,
    maxWidth: 680,
    width: '100%',
    alignSelf: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  historyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
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
    fontSize: 13.5,
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
    marginBottom: Spacing.three,
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
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  sortLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  sortOptionsScroll: {
    flexDirection: 'row',
    gap: Spacing.one * 1.5,
  },
  sortChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sortChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  txList: {
    marginBottom: Spacing.three,
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
    marginRight: Spacing.two,
  },
  txIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.two,
  },
  txInfo: {
    flex: 1,
  },
  txTitleText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  txMetaText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  txRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  txAmountText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  deleteTxBtn: {
    padding: 6,
    borderRadius: 6,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.three,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one * 1.5,
    gap: 4,
  },
  pageBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  pageInfoText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptySearchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    opacity: 0.7,
  },
  emptySearchText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  disconnectBtn: {
    marginTop: Spacing.four,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  modalSubtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    marginBottom: Spacing.four,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalBtn: {
    flex: 1,
  },
});
