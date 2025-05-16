export const resources = {
  en: {
    translation: {
      appName: "RadarAlarm",
      recentReports: "Recent Reports",
      reportSuccess: "Thanks! Radar reported successfully",
      activeSingular: "{{count}} active",
      activePlural: "{{count}} active",
      subscription: "Subscription",
      trialInfo: "Enjoy 30 days of free access",
      about: "About RadarAlarm",
      aboutText: "RadarAlarm helps you drive safely by showing real-time radar reports from other drivers. Remember to always follow traffic rules and drive responsibly.",
      terms: "Terms",
      privacy: "Privacy",
      support: "Support",
      daysLeft: "{{count}} days left",
      dayLeft: "{{count}} day left",
      minutes: "min",
      ago: "ago",
      kmAway: "km away",
      upgrade: "Upgrade",
      freeTrial: "Free Trial",
      settings: "Settings",
      language: "Language",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      recenter: "Recenter Map",
      findMyLocation: "Find My Location",
      locating: "Locating...",
      findingYourLocation: "Finding your location",
      locationError: "Location Error",
      enableLocationServices: "Please enable location services in your browser",
      locationFound: "Location Found",
      mapCentered: "Map centered on your position",
      verifiedRadar: "Verified Radar Control",
      unverifiedRadar: "Unverified Radar Control",
      reportCount: "Reported {{count}} times",
      verifiedStatus: "Verified",
      unverifiedStatus: "Unverified"
    }
  },
  no: {
    translation: {
      appName: "RadarAlarm",
      recentReports: "Nye rapporter",
      reportSuccess: "Takk! Radarkontroll rapportert",
      activeSingular: "{{count}} aktiv",
      activePlural: "{{count}} aktive",
      subscription: "Abonnement",
      trialInfo: "Nyt 30 dager gratis tilgang",
      about: "Om RadarAlarm",
      aboutText: "RadarAlarm hjelper deg å kjøre trygt ved å vise sanntids radarrapporter fra andre sjåfører. Husk å alltid følge trafikkreglene og kjøre ansvarlig.",
      terms: "Vilkår",
      privacy: "Personvern",
      support: "Kundestøtte",
      daysLeft: "{{count}} dager igjen",
      dayLeft: "{{count}} dag igjen",
      minutes: "min",
      ago: "siden",
      kmAway: "km unna",
      upgrade: "Oppgrader",
      freeTrial: "Gratis prøveperiode",
      settings: "Innstillinger",
      language: "Språk",
      zoomIn: "Zoom inn",
      zoomOut: "Zoom ut",
      recenter: "Sentrer kartet",
      findMyLocation: "Finn min posisjon",
      locating: "Lokaliserer...",
      findingYourLocation: "Finner din posisjon",
      locationError: "Posisjonsfeil",
      enableLocationServices: "Vennligst aktiver posisjonstjenester i nettleseren din",
      locationFound: "Posisjon funnet",
      mapCentered: "Kartet er sentrert på din posisjon",
      verifiedRadar: "Bekreftet Radarkontroll",
      unverifiedRadar: "Ikke bekreftet Radarkontroll",
      reportCount: "Rapportert {{count}} ganger",
      verifiedStatus: "Bekreftet",
      unverifiedStatus: "Ikke bekreftet"
    }
  }
};

export function getDefaultLanguage(): string {
  try {
    const browserLang = navigator.language.slice(0, 2).toLowerCase();
    return browserLang === 'no' || browserLang === 'nb' || browserLang === 'nn' ? 'no' : 'en';
  } catch (e) {
    return 'en';
  }
}

export function formatDistanceToNow(date: Date, locale: string): string {
  const minutesAgo = Math.round((new Date().getTime() - date.getTime()) / 60000);
  return `${minutesAgo} ${locale === 'no' ? 'min siden' : 'min ago'}`;
}

export function formatDistance(distanceInKm: number, locale: string): string {
  return `${distanceInKm.toFixed(1)} ${locale === 'no' ? 'km unna' : 'km away'}`;
}
