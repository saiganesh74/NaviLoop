'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getRoute } from '@/ai/flows/routing-flow';

interface RoutingMachineProps {
  map: L.Map;
  start: [number, number];
  end: [number, number];
  apiKey: string;
  onRouteFound: (coordinates: L.LatLng[]) => void;
}

const RoutingMachine = ({ map, start, end, apiKey, onRouteFound }: RoutingMachineProps) => {
  const routingLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!map || !start || !end) return;

    const fetchRoute = async () => {
      try {
        const data = await getRoute({
            start: { lat: start[0], lng: start[1] },
            end: { lat: end[0], lng: end[1] }
        });
        
        if (data && data.features && data.features.length > 0) {
          const route = data.features[0];
          const coordinates = route.geometry.coordinates.map((coord: any) => L.latLng(coord[1], coord[0]));
          
          if (routingLayerRef.current) {
            map.removeLayer(routingLayerRef.current);
          }

          const polyline = L.polyline(coordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
          routingLayerRef.current = polyline;
          
          if (map.getZoom() < 13) {
            map.fitBounds(L.latLngBounds(start, end), { padding: [50, 50] });
          }

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
  }, [map, start, end, onRouteFound]);

  return null;
};

export default RoutingMachine;
