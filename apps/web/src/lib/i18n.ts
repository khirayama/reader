import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
import en from '../locales/en.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';
import es from '../locales/es.json';

const resources = {
  en: {
    translation: en,
  },
  ja: {
    translation: ja,
  },
  zh: {
    translation: zh,
  },
  es: {
    translation: es,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false, // サーバーサイドでのログを抑制
    
    interpolation: {
      escapeValue: false,
    },
    
    // SSR対応のため条件付きでLanguageDetectorを設定
    detection: typeof window !== 'undefined' ? {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'rss-reader-language',
    } : {
      order: ['htmlTag'],
      caches: [],
    },
    
    // SSR対応
    react: {
      useSuspense: false,
    },
  });

export default i18n;
