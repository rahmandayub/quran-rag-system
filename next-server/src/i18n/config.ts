/**
 * Multi-language configuration for Quran Chat Application
 * Supports Indonesian, English, and Arabic with RTL support
 */

export type LanguageCode = 'id' | 'en' | 'ar';

export interface LanguageConfig {
  code: LanguageCode;
  name: string;           // Native name (e.g., "Bahasa Indonesia")
  displayName: string;    // Display name in current language
  direction: 'ltr' | 'rtl';
  flag: string;           // Emoji flag
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    displayName: 'Indonesia',
    direction: 'ltr',
    flag: '🇮🇩',
  },
  {
    code: 'en',
    name: 'English',
    displayName: 'English',
    direction: 'ltr',
    flag: '🇬🇧',
  },
  {
    code: 'ar',
    name: 'العربية',
    displayName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
  },
];

export const DEFAULT_LANGUAGE: LanguageCode = 'id';
export const STORAGE_KEY = 'ayat-alitlab-language';

/**
 * Get language config by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get direction for a language code
 */
export function getDirection(code: LanguageCode): 'ltr' | 'rtl' {
  const config = getLanguageConfig(code);
  return config?.direction || 'ltr';
}
