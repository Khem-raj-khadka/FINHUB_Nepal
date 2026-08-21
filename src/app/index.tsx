import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useFinanceStore } from '../store/useFinanceStore';
import { useAppTheme } from '../hooks/useAppTheme';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useFinanceStore((state) => state.isAuthenticated);
  const { colors } = useAppTheme();

  useEffect(() => {
    // Perform simple routing redirection after a tiny delay
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/onboarding');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.logoText, { color: colors.text }]}>FINHUB</Text>
        <Text style={[styles.logoTextHighlight, { color: colors.accent }]}>NEPAL</Text>
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  logoTextHighlight: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -4,
  },
  loader: {
    marginTop: 24,
  },
});
