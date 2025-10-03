import * as React from 'react';

export type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, interpolations?: Record<string, string | number>) => string;
  getArray: (key: string) => any[];
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = React.useState<Language>('en');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('leap-language');
      if (stored && (stored === 'en' || stored === 'es')) {
        setLanguageState(stored as Language);
      }
    } catch (error) {
      console.warn('Failed to access localStorage, defaulting to English');
    }
  }, []);

  const setLanguage = React.useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('leap-language', newLanguage);
  }, []);

  const t = React.useCallback((key: string, interpolations?: Record<string, string | number>): string => {
    return getTranslation(key, language, interpolations);
  }, [language]);

  const getArray = React.useCallback((key: string): any[] => {
    return getArrayTranslation(key, language);
  }, [language]);

  React.useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = React.useMemo(
    () => ({ language, setLanguage, t, getArray }),
    [language, setLanguage, t, getArray]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = React.useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Translation function
const getTranslation = (key: string, language: Language, interpolations?: Record<string, string | number>): string => {
  const translations = language === 'es' ? spanishTranslations : englishTranslations;
  
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      if (language === 'es') {
        return getTranslation(key, 'en', interpolations);
      }
      return key;
    }
  }
  
  if (Array.isArray(value)) {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    value = value[dayOfYear % value.length];
  }
  
  let result = typeof value === 'string' ? value : key;
  
  if (interpolations && typeof result === 'string') {
    Object.entries(interpolations).forEach(([placeholder, replacement]) => {
      const pattern = new RegExp(`{{${placeholder}}}`, 'g');
      result = result.replace(pattern, String(replacement));
    });
  }
  
  return result;
};

const getArrayTranslation = (key: string, language: Language): any[] => {
  const translations = language === 'es' ? spanishTranslations : englishTranslations;
  
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      if (language === 'es') {
        return getArrayTranslation(key, 'en');
      }
      return [];
    }
  }
  
  return Array.isArray(value) ? value : [];
};

// Import translations from original file - keeping only essential ones for now
const englishTranslations = { auth: { welcome: { title: 'Get Started', subtitle: 'Enter your first name to begin' } } };
const spanishTranslations = { auth: { welcome: { title: 'Comenzar', subtitle: 'Ingresa tu primer nombre para comenzar' } } };
