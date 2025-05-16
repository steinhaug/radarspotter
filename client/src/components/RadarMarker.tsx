import { useEffect, useRef } from 'react';
import { RadarReport } from '@shared/schema';
import mapboxgl from 'mapbox-gl';
import { useTranslation } from '@/hooks/use-i18n';

interface RadarMarkerProps {
  report: RadarReport;
  map: mapboxgl.Map;
}

export default function RadarMarker({ report, map }: RadarMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!map) return;

    // Create custom HTML element for the marker
    const el = document.createElement('div');
    
    // Different styling based on verification status
    if (report.verified) {
      // Verified report - red with solid appearance
      el.className = 'w-6 h-6 bg-destructive rounded-full flex items-center justify-center pin-drop';
      
      // Create the pulse animation element with stronger visibility
      const pulse = document.createElement('div');
      pulse.className = 'w-8 h-8 bg-destructive rounded-full absolute opacity-40 radar-pulse';
      el.appendChild(pulse);
    } else {
      // Unverified report - gray with dashed border
      el.className = 'w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center pin-drop border-2 border-dashed border-white';
      
      // Create the pulse animation element with weaker visibility
      const pulse = document.createElement('div');
      pulse.className = 'w-8 h-8 bg-gray-400 rounded-full absolute opacity-20 radar-pulse';
      el.appendChild(pulse);
    }
    
    // Create the icon
    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    icon.setAttribute('class', 'h-4 w-4 text-white');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('stroke', 'currentColor');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('d', 'M13 10V3L4 14h7v7l9-11h-7z');
    
    icon.appendChild(path);
    el.appendChild(icon);
    
    // Create popup with verification information
    const popupContent = document.createElement('div');
    popupContent.className = 'p-2';
    
    const title = document.createElement('div');
    title.className = 'font-medium';
    title.textContent = report.verified ? t('verifiedRadar') : t('unverifiedRadar');
    
    const count = document.createElement('div');
    count.className = 'text-sm text-gray-600';
    count.textContent = t('reportCount', { count: report.verifiedCount });
    
    popupContent.appendChild(title);
    popupContent.appendChild(count);
    
    // Create the popup
    popupRef.current = new mapboxgl.Popup({ offset: 25 })
      .setLngLat([report.longitude, report.latitude])
      .setDOMContent(popupContent);
    
    // Create and add the marker to the map
    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([report.longitude, report.latitude])
      .setPopup(popupRef.current)
      .addTo(map);
    
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      if (popupRef.current) {
        popupRef.current.remove();
      }
    };
  }, [map, report, t]);

  return null;
}
