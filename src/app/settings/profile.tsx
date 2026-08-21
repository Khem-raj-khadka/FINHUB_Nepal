import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Moon, Globe, ChevronDown, ChevronUp, Award, Info, AlertTriangle } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function ProfileSettings() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();

  // Zustand state
  const {
    user,
    themeMode,
    setThemeMode,
    setLanguage,
    financialScore,
    logout,
  } = useFinanceStore();

  const [expandedTip, setExpandedTip] = useState<string | null>(null);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  const handleLogout = () => {
    setShowSignOutModal(true);
  };

  const confirmSignOut = () => {
    setShowSignOutModal(false);
    logout();
    router.replace('/auth/login');
  };

  const getScoreColor = (pts: number) => {
    if (pts >= 16) return colors.success;
    if (pts >= 10) return colors.warning;
    return colors.danger;
  };

  // Explanations & recommendations database
  const getCategoryDetails = (cat: string, pts: number) => {
    const isLow = pts < 16;
    if (language === 'ne') {
      switch (cat) {
        case 'emergency':
          return {
            title: 'आकस्मिक कोष (Emergency Fund)',
            reason: isLow ? 'तपाईंको आपतकालीन बचत सिफारिस गरिएको लक्ष्य भन्दा कम छ।' : 'तपाईंसँग बलियो आपतकालीन बचत कोष छ।',
            tip: '३ देखि ६ महिनाको खर्च बराबरको आकस्मिक कोष बनाउनुहोस्। तलब आउने दिन केही रकम छुट्टै खातामा जम्मा गर्नुहोस्।',
          };
        case 'savings':
          return {
            title: 'बचत बानी (Savings Habit)',
            reason: isLow ? 'तपाईंको मासिक बचत दर लक्ष्य गरिएको ३०% भन्दा कम छ।' : 'तपाईंको बचत गर्ने दर उत्कृष्ट छ।',
            tip: 'आफ्नो आम्दानीको कम्तीमा २०-३०% बचत गर्ने लक्ष्य राख्नुहोस्। खर्च गर्नुअघि नै बचत गर्ने बानी बसाल्नुहोस्।',
          };
        case 'investment':
          return {
            title: 'लगानी निरन्तरता (Investment Consistency)',
            reason: isLow ? 'तपाईंको नियमित लगानी वा सक्रिय SIP को दर कम छ।' : 'तपाईं लगातार नियमित लगानी गर्दै हुनुहुन्छ।',
            tip: 'म्युचुअल फण्डहरूमा मासिक SIP सुरु गर्नुहोस्। नियमित साना लगानीले बजारको जोखिमलाई कम गर्छ।',
          };
        case 'debt':
          return {
            title: 'ऋण व्यवस्थापन (Debt Management)',
            reason: isLow ? 'तपाईंको सम्पत्तिको तुलनामा ऋणको मात्रा बढी छ।' : 'तपाईंको ऋण नियन्त्रणमा छ।',
            tip: 'सबैभन्दा पहिले धेरै ब्याज लाग्ने ऋण तिर्नुहोस्। आफ्नो कुल ऋणलाई सम्पत्तिको २५% भन्दा कम राख्ने प्रयास गर्नुहोस्।',
          };
        case 'spending':
        default:
          return {
            title: 'खर्च नियन्त्रण (Spending Control)',
            reason: isLow ? 'तपाईंको आम्दानीको ७०% भन्दा बढी खर्च भइरहेको छ।' : 'तपाईंले आफ्नो खर्च राम्ररी नियन्त्रण गर्नुभएको छ।',
            tip: 'अनावश्यक वा आवेगमा आउने खर्चहरू कम गर्नुहोस्। रेस्टुरेन्ट खाने वा विलासिताको सपिङ खर्चलाई १५% ले घटाउनुहोस्।',
          };
      }
    } else {
      switch (cat) {
        case 'emergency':
          return {
            title: 'Emergency Fund',
            reason: isLow ? 'Your emergency savings cover less than your recommended target.' : 'You have a healthy emergency fund reserve.',
            tip: 'Aim to build 3 to 6 months of living expenses. Set up automatic transfers to a separate emergency account on salary day.',
          };
        case 'savings':
          return {
            title: 'Savings Habit',
            reason: isLow ? 'Your monthly savings rate is below the target 30% rule.' : 'You are maintaining a strong monthly savings habit.',
            tip: 'Try saving at least 20-30% of your income. Transfer savings out of your spending account before making non-essential purchases.',
          };
        case 'investment':
          return {
            title: 'Investment Consistency',
            reason: isLow ? 'Your recurring investments or active SIP frequency is low.' : 'You are consistently investing and building wealth.',
            tip: 'Set up automated monthly SIPs. Recurring investments help dollar-cost average the market and build long-term wealth.',
          };
        case 'debt':
          return {
            title: 'Debt Management',
            reason: isLow ? 'Your debt-to-asset ratio is higher than the recommended limit.' : 'Your outstanding liabilities are well-managed.',
            tip: 'Pay down high-interest liabilities first. Try to keep your total liabilities below 25% of your total assets.',
          };
        case 'spending':
        default:
          return {
            title: 'Spending Control',
            reason: isLow ? 'Your expense-to-income ratio exceeds 70% of earnings.' : 'Your discretionary spending is well-controlled.',
            tip: 'Avoid impulse purchases. Try cutting down discretionary spending like dining out or luxury shopping by 15% this month.',
          };
      }
    }
  };

  const categories = [
    { key: 'emergency', label: 'Emergency Fund', score: financialScore.emergencyScore },
    { key: 'savings', label: 'Savings Habit', score: financialScore.savingsScore },
    { key: 'investment', label: 'Investment Consistency', score: financialScore.investmentScore },
    { key: 'debt', label: 'Debt Management', score: financialScore.debtScore },
    { key: 'spending', label: 'Spending Control', score: financialScore.spendingScore },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* User Card */}
        <Card style={[styles.userCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.card }]}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Khem Raj'}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email || 'demo@finhub.com'}
          </Text>
        </Card>

        {/* Financial Health Score Breakdown */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.healthBreakdown')}</Text>
        <Card style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.totalScoreRow}>
            <Award color={colors.accent} size={24} />
            <Text style={[styles.totalScoreText, { color: colors.text }]}>
              {t('settings.overallScore')}: {financialScore.totalScore} / 100
            </Text>
          </View>

          <View style={styles.grid}>
            {categories.map((c) => {
              const details = getCategoryDetails(c.key, c.score);
              const isLow = c.score < 16;
              const isExpanded = expandedTip === c.key;

              return (
                <View key={c.key} style={[styles.gridItemContainer, { borderBottomColor: colors.border }]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedTip(isExpanded ? null : c.key)}
                    style={styles.gridItemHeader}
                  >
                    <View style={styles.gridLabelGroup}>
                      <Text style={[styles.gridLabel, { color: colors.text }]}>{details.title}</Text>
                      {isLow && <AlertTriangle color={colors.warning} size={14} style={styles.warningIcon} />}
                    </View>
                    <View style={styles.gridScoreGroup}>
                      <Text style={[styles.gridPoints, { color: getScoreColor(c.score) }]}>
                        {c.score} / 20
                      </Text>
                      {isExpanded ? <ChevronUp color={colors.textSecondary} size={16} /> : <ChevronDown color={colors.textSecondary} size={16} />}
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={[styles.explanationContainer, { backgroundColor: colors.backgroundElement }]}>
                      <View style={styles.reasonRow}>
                        <Info color={colors.textSecondary} size={14} />
                        <Text style={[styles.reasonText, { color: colors.text }]}>
                          {details.reason}
                        </Text>
                      </View>
                      <View style={styles.tipRow}>
                        <Text style={[styles.tipTitle, { color: colors.accent }]}>
                          {t('settings.improveTips')}:
                        </Text>
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                          {details.tip}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Card>

        {/* Preferences Section */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.four }]}>Preferences</Text>
        
        {/* Dark Mode toggle */}
        <Card style={[styles.settingItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <Moon color={colors.textSecondary} size={20} />
            <Text style={[styles.settingLabelText, { color: colors.text }]}>{t('settings.darkMode')}</Text>
          </View>
          <Switch
            value={themeMode === 'dark'}
            onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </Card>

        {/* Language selector toggle */}
        <Card style={[styles.settingItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <Globe color={colors.textSecondary} size={20} />
            <Text style={[styles.settingLabelText, { color: colors.text }]}>{t('settings.language')}</Text>
          </View>
          <Switch
            value={language === 'ne'}
            onValueChange={(val) => setLanguage(val ? 'ne' : 'en')}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </Card>

        {/* Quick Links */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.four }]}>Support & Legal</Text>

        <Card
          onPress={() => router.push('/settings/privacy')}
          style={[styles.linkItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.settingLeft}>
            <ShieldCheck color={colors.textSecondary} size={20} />
            <Text style={[styles.settingLabelText, { color: colors.text }]}>{t('settings.privacy')}</Text>
          </View>
        </Card>

        {/* Sign Out Button */}
        <Button
          label={t('settings.signOut')}
          variant="outline"
          onPress={handleLogout}
          style={styles.signOutBtn}
          labelStyle={{ color: colors.danger, fontWeight: '700' }}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSignOutModal}
        onRequestClose={() => setShowSignOutModal(false)}>
        <View style={styles.modalOverlay}>
          <Card style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('settings.signOutTitle')}
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              {t('settings.signOutConfirm')}
            </Text>
            <View style={styles.modalActions}>
              <Button
                label={t('settings.cancel')}
                variant="secondary"
                onPress={() => setShowSignOutModal(false)}
                style={styles.modalBtn}
              />
              <Button
                label={t('settings.signOut')}
                onPress={confirmSignOut}
                style={[styles.modalBtn, { backgroundColor: colors.danger }]}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  userCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: Spacing.four,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  userName: {
    ...Typography.bodyLarge,
    fontSize: 18,
    fontWeight: '800',
  },
  userEmail: {
    ...Typography.bodySmall,
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  breakdownCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  totalScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  totalScoreText: {
    ...Typography.bodyLarge,
    fontSize: 15,
    fontWeight: '800',
  },
  grid: {
    gap: Spacing.one,
  },
  gridItemContainer: {
    borderBottomWidth: 1,
    paddingVertical: Spacing.two,
  },
  gridItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  gridLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  gridLabel: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '600',
  },
  warningIcon: {
    marginLeft: 6,
  },
  gridScoreGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridPoints: {
    ...Typography.bodySmall,
    fontSize: 13,
    fontWeight: '800',
  },
  explanationContainer: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 10,
    gap: Spacing.two,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  reasonText: {
    ...Typography.bodySmall,
    fontSize: 12.5,
    flex: 1,
  },
  tipRow: {
    marginTop: 4,
  },
  tipTitle: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipText: {
    ...Typography.bodySmall,
    fontSize: 12,
    lineHeight: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.one,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  settingLabelText: {
    ...Typography.bodySmall,
    fontSize: 14,
    fontWeight: '700',
  },
  linkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginVertical: Spacing.one,
  },
  signOutBtn: {
    marginTop: Spacing.five,
    borderWidth: 1.5,
    borderColor: '#EF444450',
  },
  bottomSpacer: {
    height: 90,
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
    maxWidth: 420,
    padding: Spacing.four,
    borderWidth: 1,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: Spacing.two,
  },
  modalSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.four,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalBtn: {
    flex: 1,
  },
});
