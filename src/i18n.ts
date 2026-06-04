import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translation files over HTTP from public/locales/{{lng}}/{{ns}}.json
  .use(HttpBackend)
  // Detect user language via cookie, localStorage, browser flags
  .use(LanguageDetector)
  // Bind package and React hooks
  .use(initReactI18next)
  // Configure i18next initialization options
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'rw'],
    debug: false,
    
    // Default namespace to load if none specified
    defaultNS: 'common',
    ns: ['common', 'auth', 'rides'],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },

    // Handle asynchronous suspension of component tree
    react: {
      useSuspense: true,
    },

    interpolation: {
      escapeValue: false, // React automatically escapes outputs
    },
  });

export default i18n;
