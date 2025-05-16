import { useEffect, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { resources } from '@/lib/i18n';

type TranslationFunction = (key: string, options?: Record<string, any>) => string;

export function useTranslation() {
  const { language, toggleLanguage } = useAppContext();

  const t: TranslationFunction = useMemo(() => {
    return (key: string, options?: Record<string, any>) => {
      const translationObj = resources[language as keyof typeof resources]?.translation || {};
      let translation = translationObj[key as keyof typeof translationObj] || key;

      if (options) {
        Object.entries(options).forEach(([paramKey, value]) => {
          translation = translation.replace(`{{${paramKey}}}`, String(value));
        });
      }

      return translation;
    };
  }, [language]);

  return { t, currentLanguage: language, toggleLanguage };
}

export function useMapboxKey() {
  // This would normally come from environment variables in a real app
  // Using Mapbox public token
  return 'pk.eyJ1IjoiYWdyZWdvcnlsaXUiLCJhIjoiY2tta3dnbzZlMG10czJvcDltZ3VtMGl2ciJ9.BGbJxFtTcO2eLnM33aX1zw';
}
