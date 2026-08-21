import React, { useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, LogBox } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Colors } from '../constants/theme';

// Ignore experimental/third-party warnings in the logs during the hackathon
LogBox.ignoreAllLogs();

// Prevent splash screen from hiding immediately
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const themeMode = useFinanceStore((state) => state.themeMode);
  
  // Determine if we should use dark mode
  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  const loadSavedData = useFinanceStore((state) => state.loadSavedData);

  useEffect(() => {
    // Load persisted state first
    loadSavedData().then(() => {
      // Hide the splash screen once UI mounts
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  // Configure react-navigation themes
  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    dark: isDark,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/forgot" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen 
          name="account/[id]" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Account Details',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="account/connect" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Connect Account',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="investment/add" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Add Investment',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="goals/add" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Add Savings Goal',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="settings/notifications" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Notifications',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="settings/privacy" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Security & Privacy',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
        <Stack.Screen 
          name="settings/profile" 
          options={{ 
            headerShown: true, 
            headerTitle: 'Profile Preferences',
            headerTintColor: colors.text,
            headerStyle: { backgroundColor: colors.card },
            headerShadowVisible: false,
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
