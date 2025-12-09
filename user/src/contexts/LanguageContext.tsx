import { createContext, useContext, useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import viTranslations from '../locales/vi.json';
import enTranslations from '../locales/en.json';

type Language = 'vi' | 'en';
type Translations = typeof viTranslations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
  vi: viTranslations,
  en: enTranslations,
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Lấy ngôn ngữ từ localStorage hoặc mặc định là 'vi'
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage && (savedLanguage === 'vi' || savedLanguage === 'en') 
      ? savedLanguage 
      : 'vi';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Hàm dịch với hỗ trợ nested keys (ví dụ: "common.search")
  // Sử dụng useMemo để đảm bảo hàm t được tạo lại khi language thay đổi
  const t = useMemo(() => {
    return (key: string): string => {
      const keys = key.split('.');
      let value: any = translations[language];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          // Nếu không tìm thấy, thử fallback sang tiếng Việt
          let fallbackValue: any = translations['vi'];
          for (const fk of keys) {
            if (fallbackValue && typeof fallbackValue === 'object' && fk in fallbackValue) {
              fallbackValue = fallbackValue[fk];
            } else {
              return key; // Trả về key nếu không tìm thấy
            }
          }
          return typeof fallbackValue === 'string' ? fallbackValue : key;
        }
      }
      
      return typeof value === 'string' ? value : key;
    };
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

