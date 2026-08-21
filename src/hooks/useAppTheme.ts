import { useColorScheme } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { Colors } from '../constants/theme';

export function useAppTheme() {
  const themeMode = useFinanceStore((state) => state.themeMode);
  const systemScheme = useColorScheme();

  const isDark = themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  return {
    colors,
    isDark,
    themeMode,
  };
}

export default useAppTheme;
