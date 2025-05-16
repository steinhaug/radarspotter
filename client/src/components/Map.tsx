import { useEffect, useRef, useState, useMemo } from 'react';
import { createMap } from '@/lib/mapbox';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useAppContext } from '@/contexts/AppContext';
import RadarMarker from './RadarMarker';
import { useQuery } from '@tanstack/react-query';
import { RadarReport } from '@shared/schema';
import mapboxgl from 'mapbox-gl';
import { useMapboxKey } from '@/hooks/use-i18n';
import 'mapbox-gl/dist/mapbox-gl.css';

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const { position } = useGeolocation();
  const { setMapInstance } = useAppContext();
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapboxKey = useMapboxKey();

  // Query for radar reports
  const { data: radarReports } = useQuery<RadarReport[]>({
    queryKey: ['/api/radar-reports'],
  });

  // Initialize map when component mounts
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxKey) return;
    
    // Initialize Mapbox with API key before creating the map
    mapboxgl.accessToken = mapboxKey;
    
    try {
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
    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }, [setMapInstance, mapboxKey]);

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

  // Create a filtered list of unique reports by location
  const uniqueReports = useMemo(() => {
    if (!radarReports || radarReports.length === 0) return [];
    
    // Unique coordinates we've already processed (using a string key of lat,lng)
    const processedCoords = new Set<string>();
    const result: RadarReport[] = [];
    
    // Sort reports by most recent first
    const sortedReports = [...radarReports].sort(
      (a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime()
    );
    
    // For each report, check if we've already seen a report at this location
    for (const report of sortedReports) {
      // Create a key for this location (rounded to 4 decimal places to group very close reports)
      const locationKey = `${report.latitude.toFixed(4)},${report.longitude.toFixed(4)}`;
      
      // If we haven't processed this location yet, add it to our results
      if (!processedCoords.has(locationKey)) {
        processedCoords.add(locationKey);
        result.push(report);
      }
    }
    
    return result;
  }, [radarReports]);

  return (
    <div id="map" ref={mapContainerRef} className="map-container">
      {mapLoaded && mapRef.current && uniqueReports.map(report => (
        <RadarMarker 
          key={report.id}
          report={report} 
          map={mapRef.current!}
        />
      ))}
    </div>
  );
}
