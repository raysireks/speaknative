import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { getText, type SupportedLocale } from '../data/locales';

interface LocaleContextType {
    locale: SupportedLocale;
    setLocale: (locale: SupportedLocale) => void;
    t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
    children: ReactNode;
    defaultLocale?: SupportedLocale;
}

export function LocaleProvider({ children, defaultLocale = 'en' }: LocaleProviderProps) {
    const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

    const t = useCallback(
        (key: string): string => getText(key, locale),
        [locale]
    );

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextType {
    const context = useContext(LocaleContext);
    if (!context) {
        throw new Error('useLocale must be used within a LocaleProvider');
    }
    return context;
}
