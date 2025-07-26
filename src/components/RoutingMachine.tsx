'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface RoutingMachineProps {
  map: L.Map;
  start: [number, number];
  end: [number, number];
  apiKey: string;
  onRouteFound: (coordinates: L.LatLng[]) => void;
}

const RoutingMachine = ({ map, start, end, onRouteFound, apiKey }: RoutingMachineProps) => {
  const routingLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!map || !start || !end || !apiKey) return;

    const fetchRoute = async () => {
      // Correctly format coordinates for the API: longitude,latitude
      const startCoords = `${start[1]},${start[0]}`;
      const endCoords = `${end[1]},${end[0]}`;
      
      const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          const errorBody = await response.json();
          console.error('OpenRouteService API Error:', errorBody);
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.features && data.features.length > 0) {
          const route = data.features[0];
          // Note: The API returns [lng, lat], so we need to reverse for Leaflet which expects [lat, lng]
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => L.latLng(coord[1], coord[0]));
          
          if (routingLayerRef.current) {
            map.removeLayer(routingLayerRef.current);
          }

          const polyline = L.polyline(coordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
          routingLayerRef.current = polyline;
          
          map.fitBounds(L.latLngBounds(start, end), { padding: [50, 50] });

          onRouteFound(coordinates);
        }
      } catch (error) {
        console.error('Routing error:', error);
      }
    };

    fetchRoute();

    return () => {
      if (routingLayerRef.current && map) {
        map.removeLayer(routingLayerRef.current);
      }
    };
  }, [map, start, end, onRouteFound, apiKey]);

  return null;
};

export default RoutingMachine;
