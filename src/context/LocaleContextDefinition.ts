import { createContext } from 'react';
import type { SupportedLocale } from '../data/locales';

export interface LocaleContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string) => string;
}

export const LocaleContext = createContext<LocaleContextType | undefined>(undefined);
