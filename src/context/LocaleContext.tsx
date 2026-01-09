import { useState, useCallback, type ReactNode } from 'react';
import { getText, type SupportedLocale } from '../data/locales';
import { LocaleContext } from './LocaleContextDefinition';

interface LocaleProviderProps {
  children: ReactNode;
  defaultLocale?: SupportedLocale;
}

export function LocaleProvider({ children, defaultLocale = 'en' }: LocaleProviderProps) {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  const t = useCallback((key: string): string => getText(key, locale), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}
