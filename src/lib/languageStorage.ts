import { type Locale, locales, defaultLocale } from '@/i18n/request';

const LANGUAGE_STORAGE_KEY = 'user-preferred-language';

export function getUserPreferredLanguage(): Locale | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && locales.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch (error) {
    console.warn('Failed to read language preference from localStorage:', error);
  }
  
  return null;
}

export function setUserPreferredLanguage(locale: Locale): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to save language preference to localStorage:', error);
  }
}

export function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  // First check if user has a stored preference
  const storedPreference = getUserPreferredLanguage();
  if (storedPreference) {
    return storedPreference;
  }
  
  // Get browser language preferences
  const browserLanguages = navigator.languages || [navigator.language];
  
  // Find the best matching locale
  for (const browserLang of browserLanguages) {
    // Extract language code (e.g., 'ru' from 'ru-RU')
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    // Check if we support this language
    if (locales.includes(langCode as Locale)) {
      return langCode as Locale;
    }
  }
  
  return defaultLocale;
} 