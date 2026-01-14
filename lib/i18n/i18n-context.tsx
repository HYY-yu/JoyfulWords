"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zh } from './locales/zh';
import { en } from './locales/en';

type Locale = 'zh' | 'en';
type Dictionary = typeof zh;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => any;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries = { zh, en };

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initialize locale from localStorage immediately
  const getInitialLocale = (): Locale => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale === 'zh' || savedLocale === 'en') {
        return savedLocale;
      }
    }
    return 'zh';
  };

  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = (key: string): any => {
    const keys = key.split('.');
    let value: any = dictionaries[locale];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to zh if key missing in current locale
        let fallback: any = dictionaries['zh'];
        for (const fk of keys) {
            if (fallback && fallback[fk] !== undefined) {
                fallback = fallback[fk];
            } else {
                return key;
            }
        }
        return fallback;
      }
    }
    
    return value !== undefined ? value : key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
