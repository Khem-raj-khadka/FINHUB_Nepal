import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Send, Trash2, Sparkles, BrainCircuit, Bot, User } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import FeedbackModal from '../../components/ui/FeedbackModal';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function AICoach() {
  const { colors, isDark } = useAppTheme();
  const { t, language } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isWideScreen = windowWidth >= 768;

  // Zustand
  const { chatMessages, sendChatMessage, clearChat, isChatLoading } = useFinanceStore();

  const [inputVal, setInputVal] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const suggestedPrompts = language === 'ne'
    ? [
        'मैले कहाँ धेरै खर्च गरेँ?',
        'मैले कति बचत गरेँ?',
        'मेरो सक्रिय SIP भुक्तानीहरू देखाउनुहोस्।',
        'मैले आफ्नो वित्तीय स्कोर कसरी सुधार गर्न सक्छु?',
        'मेरो कुल बैंक मौज्दात कति हो?',
      ]
    : [
        'Where did I spend the most this month?',
        'How much did I save?',
        'Show my active SIP payments.',
        'How can I improve my financial score?',
        'What is my total bank balance?',
      ];

  // Auto scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [chatMessages, isChatLoading]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendChatMessage(inputVal);
    setInputVal('');
  };

  const handleSuggestionPress = (prompt: string) => {
    sendChatMessage(prompt);
  };

  const handleConfirmClear = () => {
    clearChat();
    setShowClearConfirm(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Clear Chat Confirmation Modal */}
      <FeedbackModal
        visible={showClearConfirm}
        type="confirm"
        title="Clear Conversation?"
        message="Are you sure you want to reset this chat session with AI Coach?"
        confirmLabel="Clear"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerInner}>
          <View style={styles.headerTitleRow}>
            <BrainCircuit color={colors.accent} size={22} style={styles.headerIcon} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('ai.title')}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear Chat"
            activeOpacity={0.7}
            onPress={() => setShowClearConfirm(true)}
            style={[styles.clearBtn, { backgroundColor: colors.backgroundElement }]}>
            <Trash2 color={colors.danger} size={15} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}>
        
        {/* Chat Message Box */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}>
          
          <View style={[styles.responsiveContainer, isWideScreen && styles.responsiveContainerWide]}>
            {/* Welcome Panel */}
            {chatMessages.length <= 1 && (
              <Card style={[styles.welcomeCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <View style={[styles.sparkleCircle, { backgroundColor: `${colors.accent}15` }]}>
                  <Sparkles color={colors.accent} size={26} />
                </View>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>{t('ai.welcomeTitle')}</Text>
                <Text style={[styles.welcomeDesc, { color: colors.textSecondary }]}>
                  {t('ai.welcomeDesc')}
                </Text>
              </Card>
            )}

            {/* Quick Actions Suggestions */}
            {chatMessages.length <= 1 && (
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionLabel, { color: colors.textSecondary }]}>
                  {t('ai.tapToAsk')}
                </Text>
                <View style={styles.suggestionsGrid}>
                  {suggestedPrompts.map((p, index) => (
                    <TouchableOpacity
                      key={index}
                      activeOpacity={0.7}
                      onPress={() => handleSuggestionPress(p)}
                      style={[styles.suggestionChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
                      <Text numberOfLines={1} style={[styles.suggestionText, { color: colors.text }]}>
                        {p}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Messages History */}
            <View style={styles.messagesList}>
              {chatMessages.map((msg) => {
                const isAI = msg.sender === 'ai';
                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isAI ? styles.rowLeft : styles.rowRight,
                    ]}>
                    
                    {isAI ? (
                      <View style={[styles.avatarWrap, { backgroundColor: `${colors.accent}18` }]}>
                        <Bot size={16} color={colors.accent} />
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.messageBubble,
                        isAI
                          ? [styles.bubbleLeft, { backgroundColor: colors.card, borderColor: colors.border }]
                          : [styles.bubbleRight, { backgroundColor: colors.text }],
                      ]}>
                      <Text
                        style={[
                          styles.messageTextContent,
                          { color: isAI ? colors.text : colors.background },
                        ]}>
                        {msg.text}
                      </Text>
                    </View>

                    {!isAI ? (
                      <View style={[styles.avatarWrap, { backgroundColor: colors.text }]}>
                        <User size={14} color={colors.background} />
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {/* Simulated AI Typing indicator */}
              {isChatLoading && (
                <View style={[styles.messageRow, styles.rowLeft]}>
                  <View style={[styles.avatarWrap, { backgroundColor: `${colors.accent}18` }]}>
                    <Bot size={16} color={colors.accent} />
                  </View>
                  <View style={[styles.messageBubble, styles.bubbleLeft, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <ActivityIndicator size="small" color={colors.accent} />
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Text Input footer row */}
        <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.inputRowInner}>
            <TextInput
              style={[
                styles.input,
                {
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                },
              ]}
              placeholder={t('ai.placeholder')}
              placeholderTextColor={isDark ? '#94A3B8' : '#64748B'}
              value={inputVal}
              onChangeText={setInputVal}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSend}
              style={[styles.sendBtn, { backgroundColor: colors.text }]}>
              <Send color={colors.background} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer banner */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.background }]}>
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            {t('ai.disclaimer')}
          </Text>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIcon: {
    marginTop: -2,
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: '800',
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  responsiveContainer: {
    width: '100%',
    maxWidth: 1000,
  },
  responsiveContainerWide: {
    paddingHorizontal: Spacing.two,
  },
  welcomeCard: {
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: Spacing.four,
  },
  sparkleCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  welcomeTitle: {
    ...Typography.bodyLarge,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  welcomeDesc: {
    ...Typography.bodySmall,
    fontSize: 12.5,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.two,
  },
  suggestionsContainer: {
    marginBottom: Spacing.four,
  },
  suggestionLabel: {
    ...Typography.caption,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: Spacing.one * 1.5,
    paddingHorizontal: Spacing.three,
    maxWidth: '100%',
  },
  suggestionText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
  },
  messagesList: {
    gap: Spacing.three,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    gap: 8,
  },
  rowLeft: {
    justifyContent: 'flex-start',
    paddingRight: Spacing.six,
  },
  rowRight: {
    justifyContent: 'flex-end',
    paddingLeft: Spacing.six,
    marginLeft: 'auto',
  },
  avatarWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: Spacing.two * 1.2,
    paddingHorizontal: Spacing.three,
    flexShrink: 1,
    maxWidth: 600,
  },
  bubbleLeft: {
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    borderBottomRightRadius: 4,
  },
  messageTextContent: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    borderTopWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  inputRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 1000,
    width: '100%',
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    ...Typography.body,
    fontSize: 14,
    marginRight: Spacing.two,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerBox: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
    alignItems: 'center',
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});
