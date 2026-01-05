export interface AppLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export const appLanguages: AppLanguage[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
  },
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
];

export const getAppLanguage = (code: string): AppLanguage | undefined => {
  return appLanguages.find((lang) => lang.code === code);
};
