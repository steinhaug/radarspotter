import { useAppContext } from '@/contexts/AppContext';
import { useTranslation } from '@/hooks/use-i18n';
import { useGeolocation } from '@/hooks/use-geolocation';
import { zoomIn, zoomOut, recenterMap } from '@/lib/mapbox';

export default function MapControls() {
  const { t } = useTranslation();
  const { mapInstance } = useAppContext();
  const { position } = useGeolocation();

  const handleZoomIn = () => {
    if (mapInstance) {
      zoomIn(mapInstance);
    }
  };

  const handleZoomOut = () => {
    if (mapInstance) {
      zoomOut(mapInstance);
    }
  };

  const handleRecenterMap = () => {
    if (mapInstance && position) {
      recenterMap(
        mapInstance, 
        [position.coords.longitude, position.coords.latitude],
        14
      );
    }
  };

  return (
    <div className="absolute bottom-32 left-4 flex flex-col space-y-2 z-60">
      <button 
        className="bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 hover:shadow-lg transition-all"
        onClick={handleZoomIn}
        aria-label={t('zoomIn')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
      
      <button 
        className="bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 hover:shadow-lg transition-all"
        onClick={handleZoomOut}
        aria-label={t('zoomOut')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
        </svg>
      </button>
      
      <button 
        className="bg-white bg-opacity-90 p-2 rounded-full shadow-md hover:bg-opacity-100 hover:shadow-lg transition-all"
        onClick={handleRecenterMap}
        aria-label={t('recenter')}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
