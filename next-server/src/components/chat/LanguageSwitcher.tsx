'use client';

import React from 'react';
import { useLanguage } from '@/i18n/context';
import { SUPPORTED_LANGUAGES, LanguageCode } from '@/i18n/config';
import { Globe } from 'lucide-react';

/**
 * Language Switcher Component
 * Allows users to select their preferred language for the UI
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as LanguageCode)}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        aria-label="Select language"
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
