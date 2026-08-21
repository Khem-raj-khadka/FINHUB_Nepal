import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useColorScheme, Platform, StyleSheet, Text, View } from 'react-native';
import { Home, Wallet, TrendingUp, Target, Sparkles } from 'lucide-react-native';
import { Colors, Spacing } from '../../constants/theme';
import { useFinanceStore } from '../../store/useFinanceStore';
import { useTranslation } from '../../i18n';

export default function TabsLayout() {
  const scheme = useColorScheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  const isDark = themeMode === 'system' ? scheme === 'dark' : themeMode === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];
  const isAuthenticated = useFinanceStore((state) => state.isAuthenticated);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 26 : 8,
          paddingTop: 6,
          paddingHorizontal: 2,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
          paddingVertical: 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarLabelStyle: {
          fontSize: 10.5,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 2,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ color }) => <Home color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: t('tab.accounts'),
          tabBarIcon: ({ color }) => <Wallet color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: t('tab.invest'),
          tabBarIcon: ({ color }) => <TrendingUp color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: t('tab.goals'),
          tabBarIcon: ({ color }) => <Target color={color} size={20} />,
        }}
      />
      <Tabs.Screen
        name="ai-coach"
        options={{
          title: t('tab.aiCoach'),
          tabBarIcon: ({ color }) => <Sparkles color={color} size={20} />,
        }}
      />
    </Tabs>
  );
}
