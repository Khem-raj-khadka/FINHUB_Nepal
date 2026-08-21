import React, { useEffect } from 'react';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, LogBox, TouchableOpacity, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Colors } from '../constants/theme';

// Ignore experimental/third-party warnings in the logs during the hackathon
LogBox.ignoreAllLogs();

// Prevent splash screen from hiding immediately
SplashScreen.preventAutoHideAsync().catch(() => {});

function HeaderBackButton({ tintColor, fallbackRoute }: { tintColor?: string; fallbackRoute?: string }) {
  const router = useRouter();
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (fallbackRoute) {
      router.replace(fallbackRoute as any);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Go back"
      aria-label="Go back"
      activeOpacity={0.7}
      onPress={handlePress}
      style={{
        paddingVertical: 8,
        paddingRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <ChevronLeft color={tintColor || '#000000'} size={24} />
    </TouchableOpacity>
  );
}

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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/accounts" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/accounts" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/investments" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/goals" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/home" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/settings/profile" />,
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
            headerLeft: () => <HeaderBackButton tintColor={colors.text} fallbackRoute="/(tabs)/home" />,
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}
