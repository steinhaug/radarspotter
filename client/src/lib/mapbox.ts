import mapboxgl from 'mapbox-gl';

export let mapInstance: mapboxgl.Map | null = null;

export function initializeMapbox(accessToken: string) {
  if (accessToken) {
    mapboxgl.accessToken = accessToken;
  }
}

export function createMap(
  container: string,
  options: {
    center?: [number, number];
    zoom?: number;
    style?: string;
  } = {}
): mapboxgl.Map {
  const map = new mapboxgl.Map({
    container,
    style: options.style || 'mapbox://styles/mapbox/streets-v11',
    center: options.center || [10.7522, 59.9139], // Default to Oslo, Norway
    zoom: options.zoom || 12,
    attributionControl: false,
  });

  mapInstance = map;
  return map;
}

export function addMarker(
  map: mapboxgl.Map,
  lngLat: [number, number],
  element?: HTMLElement
): mapboxgl.Marker {
  const marker = new mapboxgl.Marker(element)
    .setLngLat(lngLat)
    .addTo(map);
  
  return marker;
}

export function flyTo(
  map: mapboxgl.Map,
  lngLat: [number, number],
  zoom?: number,
  options?: Partial<mapboxgl.FlyToOptions>
) {
  map.flyTo({
    center: lngLat,
    zoom: zoom || map.getZoom(),
    essential: true,
    ...options,
  });
}

export function zoomIn(map: mapboxgl.Map) {
  map.zoomIn();
}

export function zoomOut(map: mapboxgl.Map) {
  map.zoomOut();
}

export function recenterMap(map: mapboxgl.Map, lngLat: [number, number], zoom?: number) {
  flyTo(map, lngLat, zoom);
}
