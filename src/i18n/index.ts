import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import uk from './locales/uk';
import fr from './locales/fr';

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
