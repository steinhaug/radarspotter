import { useEffect, useMemo, useState } from 'react';
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
  const [key, setKey] = useState<string>('');

  useEffect(() => {
    // Fetch the Mapbox API key from server
    fetch('/api/mapbox-key')
      .then(res => res.json())
      .then(data => {
        if (data.key) {
          setKey(data.key);
        }
      })
      .catch(err => {
        console.error('Failed to fetch Mapbox API key:', err);
      });
  }, []);

  return key;
}
