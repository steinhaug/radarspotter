import { useEffect, useRef } from 'react';
import { RadarReport } from '@shared/schema';
import mapboxgl from 'mapbox-gl';

interface RadarMarkerProps {
  report: RadarReport;
  map: mapboxgl.Map;
}

export default function RadarMarker({ report, map }: RadarMarkerProps) {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create custom HTML element for the marker
    const el = document.createElement('div');
    el.className = 'w-6 h-6 bg-primary rounded-full flex items-center justify-center pin-drop';
    
    // Create the pulse animation element
    const pulse = document.createElement('div');
    pulse.className = 'w-8 h-8 bg-primary rounded-full absolute opacity-30 radar-pulse';
    el.appendChild(pulse);
    
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
    
    // Create and add the marker to the map
    markerRef.current = new mapboxgl.Marker(el)
      .setLngLat([report.longitude, report.latitude])
      .addTo(map);
    
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, report]);

  return null;
}
