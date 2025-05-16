import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getDefaultLanguage } from '@/lib/i18n';
import mapboxgl from 'mapbox-gl';
import { initializeMapbox } from '@/lib/mapbox';

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

  // Initialize language detection and storage
  useEffect(() => {
    try {
      // Check if language is stored in local storage
      const storedLang = localStorage.getItem('preferredLanguage');
      if (storedLang && (storedLang === 'en' || storedLang === 'no')) {
        setLanguage(storedLang);
      } else {
        // Use browser language as fallback
        const detectedLang = getDefaultLanguage();
        setLanguage(detectedLang);
        localStorage.setItem('preferredLanguage', detectedLang);
      }
    } catch (error) {
      // Fallback to default language if localStorage is not available
      console.error("Error accessing localStorage:", error);
      setLanguage('en');
    }
  }, []);
  
  // Initialize Mapbox when the component mounts
  useEffect(() => {
    // Get the Mapbox API key from environment variables
    const mapboxKey = import.meta.env.MAPBOX_API_KEY;
    
    if (mapboxKey) {
      initializeMapbox(mapboxKey);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'no' : 'en';
    setLanguage(newLang);
    try {
      localStorage.setItem('preferredLanguage', newLang);
    } catch (error) {
      console.error("Error saving language preference:", error);
    }
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
