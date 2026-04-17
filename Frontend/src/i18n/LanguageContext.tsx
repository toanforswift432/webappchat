import React, {
  useCallback,
  useEffect,
  useState,
  createContext,
  useContext } from
'react';
import { translations, Language, TranslationKey } from './translations';
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}
const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);
interface LanguageProviderProps {
  children: React.ReactNode;
}
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'vi' ? 'vi' : 'en') as Language;
  });
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);
  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || translations['en'][key] || key;
    },
    [language]
  );
  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t
      }}>
      
      {children}
    </LanguageContext.Provider>);

}
export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}