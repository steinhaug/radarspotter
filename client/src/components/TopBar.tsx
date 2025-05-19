import { useAppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/hooks/use-i18n';
import { useAuth } from '@/hooks/useAuth';

export default function TopBar() {
  const { t, toggleLanguage, currentLanguage } = useTranslation();
  const { toggleSettings, settingsOpen } = useAppContext();
  const { user, logout } = useAuth();

  return (
    <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-white bg-opacity-80 backdrop-filter backdrop-blur-sm shadow-sm z-10 flex justify-between items-center">
      <div className="flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <h1 className="text-lg font-semibold">{t('appName')}</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          className="bg-white bg-opacity-90 p-2 rounded-full shadow-sm"
          onClick={toggleLanguage}
          aria-label={t('language')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
        
        {user && (
          <button 
            className="bg-white bg-opacity-90 p-2 rounded-full shadow-sm"
            onClick={() => logout()}
            aria-label={t('logout')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        )}
        
        <button 
          className="bg-white bg-opacity-90 p-2 rounded-full shadow-sm"
          onClick={toggleSettings}
          aria-label={t('settings')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {user && (
          <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full shadow-sm text-sm">
            {user.username}
          </div>
        )}
      </div>
    </div>
  );
}
