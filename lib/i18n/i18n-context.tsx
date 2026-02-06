"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { zh } from './locales/zh';
import { en } from './locales/en';

type Locale = 'zh' | 'en';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => any;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const dictionaries = { zh, en };

/**
 * 检测浏览器语言
 * - zh-CN, zh-TW, zh-HK 等 → zh
 * - en-US, en-GB, en-CA 等 → en
 * - 其他语言 → zh (默认)
 */
function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return 'zh';

  const browserLang = navigator.language || navigator.languages?.[0];
  if (!browserLang) return 'zh';

  // 提取语言代码的前两位 (如 zh-CN → zh)
  const langCode = browserLang.toLowerCase().split('-')[0];

  if (langCode === 'zh') return 'zh';
  if (langCode === 'en') return 'en';

  // 其他语言回退到默认中文
  return 'zh';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Always start with default locale to avoid hydration mismatch
  const [locale, setLocaleState] = useState<Locale>('zh');

  // 初始化语言：localStorage 优先 > 浏览器语言 > 默认 zh
  useEffect(() => {
    // 1. 优先使用 localStorage 保存的用户选择
    const savedLocale = localStorage.getItem('locale') as Locale;
    if (savedLocale === 'zh' || savedLocale === 'en') {
      setLocaleState(savedLocale);
      return;
    }

    // 2. 检测浏览器语言（不持久化）
    const detectedLocale = detectBrowserLocale();
    setLocaleState(detectedLocale);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
  };

  const t = (key: string, params?: Record<string, any>): any => {
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

    // 如果有参数，替换字符串中的 {key} 占位符
    if (params && typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : match;
      });
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
