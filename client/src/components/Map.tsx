import { useEffect, useRef, useState } from 'react';
import { createMap } from '@/lib/mapbox';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAppContext } from '@/contexts/AppContext';
import RadarMarker from './RadarMarker';
import { useQuery } from '@tanstack/react-query';
import { RadarReport } from '@shared/schema';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { position } = useGeolocation();
  const { setMapInstance } = useAppContext();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Query for radar reports
  const { data: radarReports } = useQuery<RadarReport[]>({
    queryKey: ['/api/radar-reports'],
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const map = createMap('map', {
      style: 'mapbox://styles/mapbox/streets-v11',
      zoom: 14,
    });

    map.on('load', () => {
      setMapLoaded(true);
      mapRef.current = map;
      setMapInstance(map);
    });

    return () => {
      map.remove();
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [setMapInstance]);

  // Update user's location marker
  useEffect(() => {
    if (!mapRef.current || !position) return;
    
    const { longitude, latitude } = position.coords;

    // Create user marker if it doesn't exist
    if (!userMarkerRef.current) {
      // Create the marker element
      const el = document.createElement('div');
      el.className = 'w-6 h-6 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center';
      
      // Create the inner dot
      const dot = document.createElement('div');
      dot.className = 'w-2 h-2 bg-white rounded-full';
      el.appendChild(dot);
      
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([longitude, latitude]);
    }

    // Center the map on user's location if it's the first position update
    if (mapLoaded && mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        essential: true,
      });
    }
  }, [position, mapLoaded]);

  return (
    <div id="map" ref={mapContainerRef} className="map-container">
      {mapLoaded && radarReports && radarReports.map(report => (
        <RadarMarker 
          key={report.id}
          report={report} 
          map={mapRef.current!}
        />
      ))}
    </div>
  );
}
