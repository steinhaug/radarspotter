import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/use-i18n';
import { useQuery } from '@tanstack/react-query';
import { RadarReport } from '@shared/schema';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useTrial } from '@/hooks/use-trial';

// Calculate distance between two coordinates in kilometers
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function BottomSheet() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const { position } = useGeolocation();
  const { daysLeft } = useTrial();
  
  // Flag to track if this is the first time reports have been fetched
  const firstLoad = useRef(true);

  // Drag state
  const dragStartY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  // Query for radar reports
  const { data: radarReports, isSuccess: reportsLoaded } = useQuery<RadarReport[]>({
    queryKey: ['/api/radar-reports'],
  });

  // The auto-open effect moved after nearbyReports is defined
  
  // Set up event listeners for dragging
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      dragStartY.current = e.clientY;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const handleTouchStart = (e: TouchEvent) => {
      isDragging.current = true;
      dragStartY.current = e.touches[0].clientY;
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      currentY.current = e.clientY;
      handleDrag();
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      currentY.current = e.touches[0].clientY;
      handleDrag();
    };

    const handleMouseUp = () => {
      finishDrag();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleTouchEnd = () => {
      finishDrag();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    const handleDrag = () => {
      const deltaY = currentY.current - dragStartY.current;
      if (deltaY < -50 && !isOpen) {
        setIsOpen(true);
      } else if (deltaY > 50 && isOpen) {
        setIsOpen(false);
      }
    };

    const finishDrag = () => {
      isDragging.current = false;
    };

    const handle = handleRef.current;
    if (handle) {
      handle.addEventListener('mousedown', handleMouseDown);
      handle.addEventListener('touchstart', handleTouchStart, { passive: true });
    }

    return () => {
      if (handle) {
        handle.removeEventListener('mousedown', handleMouseDown);
        handle.removeEventListener('touchstart', handleTouchStart);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen]);

  const toggleSheet = () => {
    setIsOpen(!isOpen);
  };

  // Sort reports by distance if position is available
  const sortedReports = radarReports
    ? [...radarReports].sort((a, b) => {
        if (!position) return 0;
        
        const { latitude, longitude } = position.coords;
        const distA = getDistanceFromLatLonInKm(latitude, longitude, a.latitude, a.longitude);
        const distB = getDistanceFromLatLonInKm(latitude, longitude, b.latitude, b.longitude);
        
        return distA - distB;
      })
    : [];
    
  // Get nearby reports (within 20km)
  const nearbyReports = sortedReports.filter(report => {
    if (!position) return false;
    
    const { latitude, longitude } = position.coords;
    const distance = getDistanceFromLatLonInKm(
      latitude, 
      longitude, 
      report.latitude, 
      report.longitude
    );
    
    return distance <= 20; // 20km radius
  });

  // Format timestamp to "X min ago"
  const getTimeAgo = (timestamp: Date) => {
    const minutes = Math.round((new Date().getTime() - new Date(timestamp).getTime()) / 60000);
    return `${minutes} ${t('minutes')} ${t('ago')}`;
  };

  // Calculate distance
  const getDistance = (lat: number, lng: number) => {
    if (!position) return '';
    
    const distance = getDistanceFromLatLonInKm(
      position.coords.latitude,
      position.coords.longitude,
      lat,
      lng
    );
    
    return `${distance.toFixed(1)} ${t('kmAway')}`;
  };

  return (
    <div 
      ref={sheetRef}
      id="bottomSheet" 
      className={`bottom-sheet ${!isOpen ? 'bottom-sheet--collapsed' : ''} absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg z-80 max-h-[70%] overflow-hidden`}
    >
      <div className="p-4">
        <div 
          ref={handleRef}
          className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 cursor-pointer" 
          onClick={toggleSheet}
        />
        
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t('recentReports')}</h2>
          <span className="text-sm text-gray-500">
            {sortedReports.length === 1 
              ? t('activeSingular', { count: sortedReports.length }) 
              : t('activePlural', { count: sortedReports.length })}
          </span>
        </div>
        
        <div className="mt-4 space-y-3 max-h-[30vh] overflow-y-auto">
          {sortedReports.length > 0 ? (
            sortedReports.map((report) => (
              <div key={report.id} className="p-3 bg-light rounded-lg flex items-center space-x-3 hover:bg-light hover:shadow-md transition-all">
                <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center relative">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-white"></span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{report.location || `Radar Control`}</h3>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">
                      {getTimeAgo(report.reportedAt)} • {getDistance(report.latitude, report.longitude)}
                    </p>
                    <p className="text-xs text-secondary font-medium">Active</p>
                  </div>
                </div>
                <button className="text-secondary p-1 hover:bg-secondary hover:bg-opacity-10 rounded-full" aria-label="Navigate">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="p-3 bg-light rounded-lg text-center text-gray-500">
              No active radar reports
            </div>
          )}
        </div>
        
        <hr className="my-4 border-gray-200" />
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">{t('subscription')}</h3>
            <div className="p-4 border border-accent border-opacity-50 rounded-lg bg-accent bg-opacity-5">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-accent">{t('freeTrial')}</h4>
                  <p className="text-sm text-gray-600">{t('trialInfo')}</p>
                </div>
                <button className="px-3 py-1 bg-accent text-white text-sm rounded-full">
                  {t('upgrade')}
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">{t('about')}</h3>
            <p className="text-sm text-gray-600">
              {t('aboutText')}
            </p>
          </div>
          
          <div className="flex mt-4 space-x-2">
            <button className="flex-1 py-2 text-sm border border-gray-300 rounded-lg">
              {t('terms')}
            </button>
            <button className="flex-1 py-2 text-sm border border-gray-300 rounded-lg">
              {t('privacy')}
            </button>
            <button className="flex-1 py-2 text-sm border border-gray-300 rounded-lg">
              {t('support')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
