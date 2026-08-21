import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { ShieldAlert, ShieldCheck, Lock, KeyRound, UserCheck } from 'lucide-react-native';
import { Colors, Spacing } from '../../constants/theme';
import Card from '../../components/ui/Card';

export default function PrivacyPolicy() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' || !scheme ? 'light' : scheme];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.topHeader}>
          <ShieldCheck color={colors.success} size={48} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Security Guarantee</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            How we protect your financial data and privacy.
          </Text>
        </View>

        {/* Core Security Pillars */}
        <Card style={[styles.policyCard, { borderColor: colors.border }]}>
          <View style={styles.pillarRow}>
            <Lock color={colors.accent} size={24} style={styles.pillarIcon} />
            <View style={styles.pillarContent}>
              <Text style={[styles.pillarTitle, { color: colors.text }]}>No Banking Passwords Collected</Text>
              <Text style={[styles.pillarDesc, { color: colors.textSecondary }]}>
                FinHub Nepal does not store your banking password, ATM PIN code, or mobile wallet transactional passcode. Connections are handled externally via secure bank portals.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.pillarRow}>
            <KeyRound color={colors.accent} size={24} style={styles.pillarIcon} />
            <View style={styles.pillarContent}>
              <Text style={[styles.pillarTitle, { color: colors.text }]}>Authorized API Integrations</Text>
              <Text style={[styles.pillarDesc, { color: colors.textSecondary }]}>
                For future real accounts, connections will utilize OAuth 2.0 and token-based integrations. This ensures read-only balance access which can be revoked at any time.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.pillarRow}>
            <UserCheck color={colors.accent} size={24} style={styles.pillarIcon} />
            <View style={styles.pillarContent}>
              <Text style={[styles.pillarTitle, { color: colors.text }]}>Local Data Confidentiality</Text>
              <Text style={[styles.pillarDesc, { color: colors.textSecondary }]}>
                Your financial dashboard is secured behind biometric logins. Raw transaction details are encrypted using state-of-the-art database Row Level Security policies.
              </Text>
            </View>
          </View>
        </Card>

        {/* Hackathon Disclaimer */}
        <Card style={[styles.disclaimerCard, { backgroundColor: `${colors.warning}10`, borderColor: colors.warning }]}>
          <View style={styles.disclaimerTitleRow}>
            <ShieldAlert color={colors.warning} size={20} />
            <Text style={[styles.disclaimerTitle, { color: colors.text }]}>Hackathon Demo Mode Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerDesc, { color: colors.textSecondary }]}>
            This application currently executes in Mock Mode. All bank linkages and transaction downloads are simulated for display purposes only. No real bank accounts are accessed during the hackathon demonstration.
          </Text>
        </Card>

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
  topHeader: {
    alignItems: 'center',
    marginVertical: Spacing.four,
    gap: Spacing.one * 1.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    fontWeight: '500',
  },
  policyCard: {
    borderWidth: 1,
    padding: Spacing.four,
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  pillarIcon: {
    marginTop: 2,
  },
  pillarContent: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: Spacing.one,
  },
  pillarDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  disclaimerCard: {
    borderWidth: 1,
    padding: Spacing.four,
    marginTop: Spacing.four,
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
  bottomSpacer: {
    height: Spacing.five,
  },
});
