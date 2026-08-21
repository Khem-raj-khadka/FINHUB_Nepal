import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Info } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Colors, Spacing } from '../../constants/theme';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { SUPPORTED_PROVIDERS } from '../../services/mockData';
import { AccountType, ProviderType } from '../../types';

export default function ConnectAccount() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  // Zustand
  const { addAccount } = useFinanceStore();

  // Local state for step workflow
  const [selectedProvider, setSelectedProvider] = useState<typeof SUPPORTED_PROVIDERS[0] | null>(null);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('Savings');
  const [loading, setLoading] = useState(false);

  const handleSelectProvider = (prov: typeof SUPPORTED_PROVIDERS[0]) => {
    setSelectedProvider(prov);
    // Auto-select digital wallet type if provider is wallet
    if (prov.type === 'wallet') {
      setSelectedAccountType('Digital Wallet');
    } else {
      setSelectedAccountType('Savings');
    }
  };

  const handleConnect = () => {
    if (!selectedProvider) return;

    setLoading(true);
    // Simulate API connection latency
    setTimeout(() => {
      setLoading(false);
      
      // Generate a realistic starting balance for the connected bank/wallet (Rs. 15,000 - 150,000)
      const randomBalance = Math.floor(15 + Math.random() * 135) * 1000;
      
      addAccount(
        selectedProvider.name,
        selectedProvider.type as ProviderType,
        selectedAccountType,
        randomBalance
      );

      Alert.alert(
        'Connection Successful',
        `Successfully linked ${selectedProvider.name} (${selectedAccountType})!`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/accounts');
            },
          },
        ]
      );
    }, 1200);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {!selectedProvider ? (
          // STEP 1: Select Financial Provider
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Select Financial Institution</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Choose a bank or wallet to connect with FinHub.
            </Text>

            <View style={styles.grid}>
              {SUPPORTED_PROVIDERS.map((prov) => (
                <Card
                  key={prov.id}
                  onPress={() => handleSelectProvider(prov)}
                  style={[styles.providerCard, { borderColor: colors.border }]}>
                  <Text style={styles.providerEmoji}>{prov.icon}</Text>
                  <Text numberOfLines={1} style={[styles.providerName, { color: colors.text }]}>
                    {prov.name}
                  </Text>
                  <Text style={[styles.providerType, { color: colors.textSecondary }]}>
                    {prov.type === 'bank' ? 'Commercial Bank' : 'Digital Wallet'}
                  </Text>
                </Card>
              ))}
            </View>

            <Card style={[styles.disclaimerCard, { backgroundColor: `${colors.info}10` }]}>
              <View style={styles.disclaimerTitleRow}>
                <ShieldCheck color={colors.accent} size={20} />
                <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
                  Authorized Security Policy
                </Text>
              </View>
              <Text style={[styles.disclaimerDesc, { color: colors.textSecondary }]}>
                FinHub connects to financial providers using authorized secure sandbox token APIs. We never ask for, collect, or store your passwords, PINs, or OTP security keys.
              </Text>
            </Card>
          </View>
        ) : (
          // STEP 2: Configure & Confirm Link
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Connect {selectedProvider.name}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Configure your integration parameters.
            </Text>

            {/* Account Type Selector (for Banks only) */}
            {selectedProvider.type === 'bank' ? (
              <View style={styles.typeSelectorContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Account Type</Text>
                {(['Savings', 'Current', 'Fixed Deposit'] as AccountType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedAccountType(type)}
                    style={[
                      styles.typeItem,
                      { borderColor: colors.border, backgroundColor: colors.card },
                      selectedAccountType === type && {
                        borderColor: colors.accent,
                        backgroundColor: `${colors.accent}10`,
                      },
                    ]}>
                    <View
                      style={[
                        styles.radioOuter,
                        { borderColor: colors.border },
                        selectedAccountType === type && { borderColor: colors.accent },
                      ]}>
                      {selectedAccountType === type && (
                        <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.typeText,
                        { color: selectedAccountType === type ? colors.accent : colors.text },
                      ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.walletInfo}>
                <Info color={colors.textSecondary} size={18} />
                <Text style={[styles.walletInfoText, { color: colors.textSecondary }]}>
                  This wallet will link using your registered mobile number as a primary identifier.
                </Text>
              </View>
            )}

            {/* Security Guarantee Box */}
            <Card style={[styles.securityGuarantee, { borderColor: colors.border }]}>
              <Text style={[styles.secTitle, { color: colors.text }]}>🛡️ Safe & Encrypted</Text>
              <Text style={[styles.secDesc, { color: colors.textSecondary }]}>
                By clicking below, you consent to link this provider using simulated read-only credentials. No real financial credentials will be altered.
              </Text>
            </Card>

            {/* Submit */}
            <Button
              label={`Connect Demo Account`}
              onPress={handleConnect}
              loading={loading}
              style={styles.connectBtn}
            />

            <TouchableOpacity
              onPress={() => setSelectedProvider(null)}
              style={styles.backBtn}
              disabled={loading}>
              <Text style={[styles.backText, { color: colors.textSecondary }]}>
                Go Back
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.four,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  providerCard: {
    width: '47%',
    borderWidth: 1,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerEmoji: {
    fontSize: 32,
    marginBottom: Spacing.two,
  },
  providerName: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  providerType: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  disclaimerCard: {
    borderWidth: 0,
    padding: Spacing.four,
    marginTop: Spacing.two,
  },
  disclaimerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  typeSelectorContainer: {
    marginVertical: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.three,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#94a3b815',
    padding: Spacing.three,
    borderRadius: 12,
    marginVertical: Spacing.three,
  },
  walletInfoText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  securityGuarantee: {
    borderWidth: 1,
    padding: Spacing.three,
    marginVertical: Spacing.three,
  },
  secTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  secDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  connectBtn: {
    marginTop: Spacing.three,
  },
  backBtn: {
    alignItems: 'center',
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: Spacing.five,
  },
});
