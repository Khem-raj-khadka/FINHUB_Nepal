import { useFinanceStore } from '../store/useFinanceStore';
import { en } from './en';
import { ne } from './ne';

export type TranslationKey = keyof typeof en;

// Static translation helper (for stores, calculations, services)
export function t(key: TranslationKey | string, variables?: Record<string, string>): string {
  const language = useFinanceStore.getState().language || 'en';
  const dict = language === 'ne' ? ne : en;
  let text = dict[key as keyof typeof en] || en[key as keyof typeof en] || key;

  if (variables) {
    Object.keys(variables).forEach((v) => {
      text = text.replace(`{${v}}`, variables[v]);
    });
  }

  return text;
}

// Reactive hook (for React components)
export function useTranslation() {
  const language = useFinanceStore((state) => state.language);
  const dict = language === 'ne' ? ne : en;

  const translate = (key: TranslationKey | string, variables?: Record<string, string>): string => {
    let text = dict[key as keyof typeof en] || en[key as keyof typeof en] || key;
    if (variables) {
      Object.keys(variables).forEach((v) => {
        text = text.replace(`{${v}}`, variables[v]);
      });
    }
    return text;
  };

  return { t: translate, language };
}
export default useTranslation;
