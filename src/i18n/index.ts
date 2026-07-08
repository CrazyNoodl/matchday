import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import uk from './locales/uk';
import fr from './locales/fr';

// i18next's plugin API is i18n.use(plugin) — not the named `use` export.
// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    uk: { translation: uk },
    fr: { translation: fr },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export type Language = 'en' | 'uk' | 'fr';

export const LANGUAGES: { code: Language; flag: string; nativeName: string }[] = [
  { code: 'en', flag: '🇬🇧', nativeName: 'English' },
  { code: 'uk', flag: '🇺🇦', nativeName: 'Українська' },
  { code: 'fr', flag: '🇫🇷', nativeName: 'Français' },
];
