import { useState, useEffect } from 'react';

interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface GeolocationState {
  position: GeolocationPosition | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      });
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000,
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setState({
          position: {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          },
          error: null,
          loading: false,
        });
      },
      (error) => {
        setState({
          position: null,
          error: error.message,
          loading: false,
        });
      },
      { ...defaultOptions, ...options }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]);

  return state;
}
