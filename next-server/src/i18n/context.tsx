'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { LanguageCode, DEFAULT_LANGUAGE, STORAGE_KEY, getDirection } from './config';
import { getTranslation } from './index';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * Get initial language for SSR
 * Always returns default language to ensure SSR and initial CSR match
 * localStorage is read in useEffect after mount
 */
function getInitialLanguage(): LanguageCode {
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(getInitialLanguage);
  const [isInitialized, setIsInitialized] = useState(false);

  // Read from localStorage after mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (saved && ['id', 'en', 'ar'].includes(saved)) {
        setLanguageState(saved);
      }
    } catch {
      // localStorage might not be available
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Update document direction and lang when language changes
  useEffect(() => {
    if (!isInitialized) return; // Skip until localStorage is read
    const dir = getDirection(language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    document.body.style.direction = dir;
  }, [language, isInitialized]);

  // Save to localStorage and update state when language changes
  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage might not be available
    }
  }, []);

  // Translation function with optional interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let value = getTranslation(language, key);
    
    // Simple interpolation for {{key}} placeholders
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      t,
      direction: getDirection(language)
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
