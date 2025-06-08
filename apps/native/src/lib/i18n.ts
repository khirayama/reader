import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Translation resources
import en from '../locales/en.json'
import ja from '../locales/ja.json'
import zh from '../locales/zh.json'
import es from '../locales/es.json'

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
}

// AsyncStorage language detector
const languageDetector = {
  type: 'languageDetector' as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      // まずAsyncStorageから保存済み言語設定を確認
      const savedLanguage = await AsyncStorage.getItem('rss-reader-language')
      if (savedLanguage) {
        callback(savedLanguage)
        return
      }
      
      // 保存されていない場合は端末の言語設定を使用
      const deviceLanguage = Localization.locale.split('-')[0] // 'ja-JP' -> 'ja'
      const supportedLanguages = ['ja', 'en', 'zh', 'es']
      const language = supportedLanguages.includes(deviceLanguage) ? deviceLanguage : 'en'
      
      callback(language)
    } catch (error) {
      console.log('Language detection error:', error)
      callback('en') // デフォルトは英語
    }
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await AsyncStorage.setItem('rss-reader-language', language)
    } catch (error) {
      console.log('Language cache error:', error)
    }
  },
}

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: __DEV__,
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
  })

export default i18n

// 言語変更ヘルパー関数
export const changeLanguage = async (language: string) => {
  try {
    await i18n.changeLanguage(language)
    await AsyncStorage.setItem('rss-reader-language', language)
  } catch (error) {
    console.log('Language change error:', error)
  }
}
