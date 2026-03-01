/**
 * Translation files import and type-safe access
 */

import idTranslations from './translations/id.json';
import enTranslations from './translations/en.json';
import arTranslations from './translations/ar.json';

import { LanguageCode } from './config';

/**
 * All translations mapped by language code
 */
export const translations: Record<LanguageCode, typeof idTranslations> = {
  id: idTranslations,
  en: enTranslations,
  ar: arTranslations,
};

/**
 * Get a translation value by dot-notation key
 * @param language - The language code
 * @param key - The dot-notation key (e.g., 'chat.input_placeholder')
 * @returns The translation string or the key if not found
 */
export function getTranslation(
  language: LanguageCode,
  key: string
): string {
  const keys = key.split('.');
  let value: unknown = translations[language];

  for (const k of keys) {
    if (typeof value === 'object' && value !== null && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      // Fallback to English if translation not found
      let fallbackValue: unknown = translations.en;
      for (const keyPart of keys) {
        if (typeof fallbackValue === 'object' && fallbackValue !== null && keyPart in fallbackValue) {
          fallbackValue = (fallbackValue as Record<string, unknown>)[keyPart];
        } else {
          return key; // Return key if not found in fallback either
        }
      }
      return typeof fallbackValue === 'string' ? fallbackValue : key;
    }
  }

  return typeof value === 'string' ? value : key;
}

export default translations;
