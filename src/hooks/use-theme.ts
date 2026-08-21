/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useFinanceStore } from "@/store/useFinanceStore";

export function useTheme() {
  const themeMode = useFinanceStore((state) => state.themeMode);
  const systemScheme = useColorScheme();
  const theme = themeMode === "system" ? systemScheme : themeMode;

  return Colors[theme === "dark" ? "dark" : "light"];
}
