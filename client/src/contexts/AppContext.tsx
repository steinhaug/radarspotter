import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getDefaultLanguage } from '@/lib/i18n';
import mapboxgl from 'mapbox-gl';

interface AppContextProps {
  language: string;
  setLanguage: (lang: string) => void;
  toggleLanguage: () => void;
  settingsOpen: boolean;
  toggleSettings: () => void;
  mapInstance: mapboxgl.Map | null;
  setMapInstance: (map: mapboxgl.Map | null) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<string>(getDefaultLanguage());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'no' : 'en');
  };

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  return (
    <AppContext.Provider value={{
      language,
      setLanguage,
      toggleLanguage,
      settingsOpen,
      toggleSettings,
      mapInstance,
      setMapInstance
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
