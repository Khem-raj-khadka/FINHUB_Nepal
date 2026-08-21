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
} from 'react-native';
import { Send, Trash2, Sparkles, BrainCircuit } from 'lucide-react-native';
import { useFinanceStore } from '../../store/useFinanceStore';
import { Spacing } from '../../constants/theme';
import Typography from '../../constants/Typography';
import Card from '../../components/ui/Card';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useTranslation } from '../../i18n';

export default function AICoach() {
  const { colors } = useAppTheme();
  const { t, language } = useTranslation();

  // Zustand
  const { chatMessages, sendChatMessage, clearChat, isChatLoading } = useFinanceStore();

  const [inputVal, setInputVal] = useState('');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleRow}>
          <BrainCircuit color={colors.accent} size={22} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('ai.title')}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={clearChat}
          style={[styles.clearBtn, { backgroundColor: colors.backgroundElement }]}>
          <Trash2 color={colors.danger} size={15} />
        </TouchableOpacity>
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
          
          {/* Welcome Panel */}
          {chatMessages.length <= 1 && (
            <Card style={[styles.welcomeCard, { backgroundColor: colors.backgroundElement }]}>
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
                  
                  {isAI && <Text style={styles.aiAvatarEmoji}>🤖</Text>}

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
                </View>
              );
            })}

            {/* Simulated AI Typing indicator */}
            {isChatLoading && (
              <View style={[styles.messageRow, styles.rowLeft]}>
                <Text style={styles.aiAvatarEmoji}>🤖</Text>
                <View style={[styles.messageBubble, styles.bubbleLeft, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <ActivityIndicator size="small" color={colors.accent} />
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Text Input footer row */}
        <View style={[styles.inputRow, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={colors.textSecondary}
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
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    borderBottomWidth: 1,
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
    fontWeight: '800',
  },
  clearBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.four,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeCard: {
    padding: Spacing.four,
    alignItems: 'center',
    borderWidth: 0,
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
    fontSize: 12,
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
  aiAvatarEmoji: {
    fontSize: 20,
    marginRight: Spacing.two,
    marginBottom: 2,
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: Spacing.two * 1.2,
    paddingHorizontal: Spacing.three,
    flexShrink: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    ...Typography.body,
    fontSize: 14,
    marginRight: Spacing.two,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disclaimerBox: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    alignItems: 'center',
  },
  disclaimerText: {
    ...Typography.caption,
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});
